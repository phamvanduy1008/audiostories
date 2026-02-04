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
  const bufferingTimer = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    const navState = location.state as any;

    setLoading(true);

    if (navState?.story && navState?.chapter?.audioUrl) {
      setStory(navState.story);
      setSelectedChapter(navState.chapter);
      setLoading(false);
      return;
    }

    if (navState?.story && navState?.chapterId) {
      getStoryById(navState.story._id)
        .then((data) => {
          setStory(data);
          const matched = data.chapters?.find((ch: Chapter) => ch.id === navState.chapterId);
          if (matched) {
            setSelectedChapter(matched);
          } else {
            setSelectedChapter(data.chapters?.[0] || null);
          }
        })
        .catch((err) => {
          console.error('Fetch story failed:', err);
          setAudioError('Không tải được truyện.');
        })
        .finally(() => setLoading(false));
      return;
    }

    if (id) {
      getStoryById(id)
        .then((data) => {
          setStory(data);
          if (data.chapters?.length) {
            setSelectedChapter(data.chapters[0]);
          }
        })
        .catch((err) => {
          console.error('Fetch story failed:', err);
          setAudioError('Không tải được truyện.');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, location.state]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedChapter?.audioUrl) return;

    const lastPos = location.state?.lastPosition ?? 0;
    if (lastPos > 0) {
      audio.currentTime = lastPos;
      setCurrentTime(lastPos);
    }
  }, [selectedChapter?.audioUrl, location.state?.lastPosition]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedChapter?.audioUrl) {
      resetAudioState();
      return;
    }

    if (audio.src === selectedChapter.audioUrl) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    setIsBuffering(false);

    audio.src = selectedChapter.audioUrl;
    audio.preload = 'metadata';
    audio.load();

    const handleLoadedMetadata = () => {
      const dur = isNaN(audio.duration) ? 0 : audio.duration;
      setDuration(dur);
      setAudioError(null);
    };

    const handleError = () => {
      setAudioError('Không tải được audio.');
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      bufferingTimer.current = setTimeout(() => setIsBuffering(true), 1500);
    };

    const handlePlaying = () => {
      if (bufferingTimer.current) clearTimeout(bufferingTimer.current);
      setIsBuffering(false);
    };

    const handleCanPlay = () => setIsBuffering(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('canplay', handleCanPlay);
      if (bufferingTimer.current) clearTimeout(bufferingTimer.current);
    };
  }, [selectedChapter?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio && !audio.paused && !audio.ended) {
        setCurrentTime(audio.currentTime);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      const dur = isNaN(audio.duration) ? 0 : audio.duration;
      setDuration(dur);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = volume / 100;
    }
  }, [playbackSpeed, volume]);

const saveHistory = async (reason: 'ENDED' | 'PAGE_HIDE' | 'BEFORE_UNLOAD' | 'MANUAL_BACK') => {
  if (!userId || !story?.id || !selectedChapter?.id) {
    console.warn('[saveHistory] Thiếu dữ liệu:', { userId, storyId: story?.id, chapterId: selectedChapter?.id });
    return;
  }

  const audio = audioRef.current;
  const pos = audio?.currentTime ?? currentTime;
  const dur = audio?.duration ?? duration;
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

  console.log(`[saveHistory] (${reason}) Gửi payload:`, payload);

  try {
    // Luôn dùng axios cho MANUAL_BACK (vì đang ở trang, không cần sendBeacon)
    const res = await axios.post(`${API_URL}/history`, payload);
    console.log(`[saveHistory] (${reason}) Response:`, res.data);
  } catch (err: any) {
    console.error(`[saveHistory] (${reason}) Lỗi:`, {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
  }
};

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      saveHistory('ENDED');
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [selectedChapter?.id, userId, story?.id]);

  useEffect(() => {
    const handlePageHide = () => {
      console.log('[PLAYER] pagehide → lưu history');
      saveHistory('PAGE_HIDE');
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [userId, story?.id, selectedChapter?.id, currentTime, duration]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[PLAYER] beforeunload → lưu history');
      saveHistory('BEFORE_UNLOAD');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, story?.id, selectedChapter?.id, currentTime, duration]);

  const resetAudioState = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    setIsBuffering(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasUserInteracted(true);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleSkipPrevious = () => {
    setHasUserInteracted(true);
    if (!story?.chapters || currentChapterIndex <= 0) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      return;
    }
    setSelectedChapter(story.chapters[currentChapterIndex - 1]);
  };

  const handleSkipNext = () => {
    setHasUserInteracted(true);
    if (!story?.chapters || currentChapterIndex >= story.chapters.length - 1) {
      if (audioRef.current && duration > 0) {
        audioRef.current.currentTime = duration;
        setCurrentTime(duration);
      }
      return;
    }
    setSelectedChapter(story.chapters[currentChapterIndex + 1]);
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, time));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setHasUserInteracted(true);
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    seek(newTime);
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
      <header className="flex items-center justify-between w-full px-4 py-3 z-20">
        <button
        onClick={() => {
          console.log('[PLAYER] Nút "Quay lại" clicked → lưu history trước khi back');
          saveHistory('MANUAL_BACK'); // Gọi lưu history
          navigate(-1);
        }}
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

      <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 max-w-5xl mx-auto relative">
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 text-white">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-5xl">hourglass_empty</span>
              <span className="text-base font-medium">Đang tải...</span>
            </div>
          </div>
        )}

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

        <div className="relative group w-56 sm:w-64 md:w-72 aspect-square rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url('${story.imageUrl || story.coverImage || 'https://picsum.photos/400/600?random=1'}')` }}
          />
        </div>

        <div className="w-full max-w-md flex flex-col gap-3 pb-6">
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

          <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
            <button
              onClick={() => {
                setHasUserInteracted(true);
                seek(currentTime - 10);
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
                seek(currentTime + 30);
              }}
              className="text-slate-500 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 touch-manipulation"
            >
              <span className="material-symbols-outlined text-3xl">forward_30</span>
            </button>
          </div>

          <div className="flex items-center justify-between w-full px-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-slate-500">speed</span>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-slate-500 hover:text-primary font-medium text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition touch-manipulation"
              >
                {playbackSpeed}x
              </button>
            </div>

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

          {showSpeedMenu && (
            <div className="mt-1 w-28 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-30 mx-auto">
              {[0.5, 1, 1.25, 1.5, 2].map((s) => (
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