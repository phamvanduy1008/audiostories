import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chapter, Story } from '../types';
import { getStoryById } from '../services/story.service';
import axios from 'axios';
import { Ipaddress } from '@/constants/ip';

const API_URL = `${Ipaddress}/api`;

const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<(Chapter & { audioUrl?: string }) | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(70);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const bufferingTimer = useRef<NodeJS.Timeout | null>(null);

  const userId = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    console.log('=== [DEBUG] LOCATION.STATE ===', location.state);
  }, [location.state]);

  useEffect(() => {
    const handleInteraction = () => setHasUserInteracted(true);
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const navState = location.state as {
      chapter?: Chapter & { order?: number };
      story?: Story;
      lastPosition?: number;
    } | undefined;

    if (navState?.story) {
      setStory(navState.story);
      setLoading(false);

      if (navState.chapter?.audioUrl) {
        setSelectedChapter({
          ...navState.chapter,
          audioUrl: navState.chapter.audioUrl,
        });
      }
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    getStoryById(id)
      .then((data) => {
        setStory(data);
        if (data.chapters?.length) {
          setSelectedChapter(data.chapters[0]);
        }
      })
      .catch((err) => {
        console.error('Fetch story failed:', err);
      })
      .finally(() => setLoading(false));
  }, [id, location.state]);

  useEffect(() => {
    if (!story?.chapters || !selectedChapter?.id) {
      setCurrentChapterIndex(-1);
      return;
    }
    const idx = story.chapters.findIndex((ch) => ch.id === selectedChapter.id);
    setCurrentChapterIndex(idx);
  }, [story?.chapters, selectedChapter?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedChapter?.audioUrl) {
      resetAudioState();
      return;
    }

    if (audio.src === selectedChapter.audioUrl) return;

    audio.src = selectedChapter.audioUrl;
    audio.preload = 'metadata';
    audio.load();

    const handleLoadedMetadata = () => {
      const dur = isNaN(audio.duration) ? 0 : audio.duration;
      durationRef.current = dur;
      setDuration(dur);
      setAudioError(null);

      const lastPos = location.state?.lastPosition ?? 0;
      if (lastPos > 0 && lastPos < dur) {
        audio.currentTime = lastPos;
        currentTimeRef.current = lastPos;
        setCurrentTime(lastPos);

        if (hasUserInteracted && document.visibilityState === 'visible') {
          audio.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        }
      } else {
        currentTimeRef.current = 0;
        setCurrentTime(0);
      }
    };

    const handleError = () => {
      setAudioError('Không tải được audio.');
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      bufferingTimer.current = setTimeout(() => {
        if (!isPlaying) setIsBuffering(true);
      }, 1500);
    };

    const handlePlaying = () => {
      if (bufferingTimer.current) clearTimeout(bufferingTimer.current);
      setIsBuffering(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      if (bufferingTimer.current) clearTimeout(bufferingTimer.current);
    };
  }, [selectedChapter?.audioUrl, location.state?.lastPosition, hasUserInteracted, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', update);
    return () => audio.removeEventListener('timeupdate', update);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = volume / 100;
    }
  }, [playbackSpeed, volume]);

  const saveHistory = async (reason: 'ENDED' | 'PAGE_HIDE') => {
    if (!userId || !story?.id || !selectedChapter?.id || !audioRef.current) return;

    const pos = currentTimeRef.current;
    const dur = durationRef.current;
    const progress = dur > 0 ? (pos / dur) * 100 : 0;

    const payload = {
      userId,
      storyId: story.id,
      chapterId: selectedChapter.id,
      lastPosition: Math.floor(pos),
      duration: Math.floor(dur),
      progressPercent: Math.round(progress),
      isCompleted: progress >= 99,
    };

    try {
      if (reason === 'PAGE_HIDE') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${API_URL}/history`, blob);
      } else {
        await axios.post(`${API_URL}/history`, payload);
      }
    } catch (err) {
      console.error(`[HISTORY] Failed (${reason}):`, err);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setIsPlaying(false);
      saveHistory('ENDED');
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [selectedChapter?.id, userId, story?.id]);

  useEffect(() => {
    const handlePageHide = () => {
      if (audioRef.current) currentTimeRef.current = audioRef.current.currentTime;
      saveHistory('PAGE_HIDE');
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [userId, story?.id, selectedChapter?.id]);

  const resetAudioState = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setDuration(0);
    durationRef.current = 0;
    setAudioError(null);
    setIsBuffering(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    setHasUserInteracted(true);
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipPrevious = () => {
    setHasUserInteracted(true);
    if (!story?.chapters || currentChapterIndex <= 0) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    setSelectedChapter(story.chapters[currentChapterIndex - 1]);
  };

  const handleSkipNext = () => {
    setHasUserInteracted(true);
    if (!story?.chapters || currentChapterIndex >= story.chapters.length - 1) {
      if (audioRef.current && duration > 0) audioRef.current.currentTime = duration;
      return;
    }
    setSelectedChapter(story.chapters[currentChapterIndex + 1]);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setHasUserInteracted(true);
    if (!audioRef.current || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setIsBuffering(true);
    audioRef.current.currentTime = newTime;
    currentTimeRef.current = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setVolume(Math.round(Math.max(0, Math.min(100, percent * 100))));
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  const speeds = [0.5, 1, 1.25, 1.5, 2];

  if (loading) return <div className="p-20 text-center">Đang tải...</div>;
  if (!story) return <div className="p-20 text-center">Không tìm thấy câu chuyện</div>;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between w-full px-4 py-3 z-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors group touch-manipulation"
        >
          <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-medium hidden sm:inline">Quay lại</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors touch-manipulation">
            <span className="material-symbols-outlined text-xl">bookmark_border</span>
          </button>
          <button className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors touch-manipulation">
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 max-w-5xl mx-auto relative">
        {/* Buffering overlay */}
        {isBuffering && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 text-white">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-5xl">hourglass_empty</span>
              <span className="text-base font-medium">Đang tải... (mạng chậm)</span>
            </div>
          </div>
        )}

        {/* Title & Chapter info */}
        <div className="text-center mb-4 w-full">
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
            {story.category}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight mt-2 text-slate-900 dark:text-white">
            {story.title}
          </h1>
          {selectedChapter && (
            <h2 className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Chương {selectedChapter.number || selectedChapter.order || '?'}: {selectedChapter.title}
            </h2>
          )}
          {audioError && <p className="mt-2 text-red-500 text-sm">{audioError}</p>}
        </div>

        {/* Cover image */}
        <div className="relative group w-56 sm:w-64 md:w-72 aspect-square rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url('${story.imageUrl}')` }}
          />
        </div>

        {/* Controls */}
        <div className="w-full max-w-md flex flex-col gap-3 pb-6">
          {/* Progress bar */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between text-xs font-mono text-slate-500 px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              className="relative h-2.5 w-full bg-slate-200/70 dark:bg-slate-700/70 rounded-full cursor-pointer touch-manipulation group"
            >
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-100 ease-linear pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow border-2 border-primary transform transition-all duration-150 group-hover:scale-125 pointer-events-none"
                style={{ left: `calc(${progressPercent}% - 8px)` }}
              />
            </div>
          </div>

          {/* Nút phát + tua 10s/30s */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
            <button
              onClick={() => {
                setHasUserInteracted(true);
                setCurrentTime(Math.max(0, currentTime - 10));
              }}
              className="text-slate-500 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 touch-manipulation"
            >
              <span className="material-symbols-outlined text-3xl">replay_10</span>
            </button>

            <button
              onClick={handleSkipPrevious}
              className="text-slate-700 dark:text-slate-200 hover:text-primary transition-colors touch-manipulation"
              disabled={currentChapterIndex <= 0 && currentTime <= 1}
            >
              <span className="material-symbols-outlined text-4xl fill-1">skip_previous</span>
            </button>

            <button
              onClick={togglePlay}
              className="bg-primary hover:bg-primary-dark text-white rounded-full p-5 shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center touch-manipulation"
            >
              <span className="material-symbols-outlined text-5xl fill-1">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              onClick={handleSkipNext}
              className="text-slate-700 dark:text-slate-200 hover:text-primary transition-colors touch-manipulation"
              disabled={currentChapterIndex >= (story?.chapters?.length ?? 1) - 1 && currentTime >= duration - 1}
            >
              <span className="material-symbols-outlined text-4xl fill-1">skip_next</span>
            </button>

            <button
              onClick={() => {
                setHasUserInteracted(true);
                setCurrentTime(Math.min(duration, currentTime + 30));
              }}
              className="text-slate-500 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 touch-manipulation"
            >
              <span className="material-symbols-outlined text-3xl">forward_30</span>
            </button>
          </div>

          {/* Speed + Volume - chung 1 hàng nhỏ gọn */}
          <div className="flex items-center justify-between w-full px-2 mt-2">
            {/* Speed */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-slate-500">speed</span>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-slate-500 hover:text-primary font-medium text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition touch-manipulation"
              >
                {playbackSpeed}x
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVolume(volume === 0 ? 70 : 0)}
                className="text-slate-500 hover:text-primary transition-colors touch-manipulation p-1"
              >
                <span className="material-symbols-outlined text-xl">
                  {volume === 0 ? 'volume_off' : volume < 30 ? 'volume_mute' : volume < 70 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
              <div
                ref={volumeBarRef}
                onClick={handleVolumeClick}
                className="relative h-2 w-36 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer touch-manipulation"
              >
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${volume}%` }}
                />
              </div>
            </div>
          </div>

          {/* Speed menu */}
          {showSpeedMenu && (
            <div className="mt-1 w-28 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-30 mx-auto">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPlaybackSpeed(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-sm hover:bg-primary/10 transition-colors ${
                    playbackSpeed === s ? 'text-primary font-bold bg-primary/5' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

export default Player;