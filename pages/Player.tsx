import React, { useState, useEffect, useRef } from 'react';
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

  // Log state để debug khi navigate từ History
  useEffect(() => {
    console.log('=== [DEBUG] LOCATION.STATE KHI VÀO PLAYER ===', location.state);
  }, [location.state]);

  const navState = location.state as { chapter?: Chapter & { order?: number }; story?: Story; lastPosition?: number } | undefined;
  const storyFromNav = navState?.story;

  const [story, setStory] = useState<Story | null>(storyFromNav ?? null);
  const [loading, setLoading] = useState(!storyFromNav);
  const [selectedChapter, setSelectedChapter] = useState<(Chapter & { audioUrl?: string }) | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(70);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Lấy userId
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?._id || user?.id;

  const pauseStartTime = useRef<number | null>(null);
  const IDLE_TIMEOUT = 15000;

  // Hàm lưu lịch sử (3 trường hợp duy nhất)
  const saveHistory = async (reason: 'ENDED' | 'PAGE_HIDE' | 'PAUSE_TOO_LONG') => {
    if (!userId || !story?.id || !selectedChapter?.id || !audioRef.current) return;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isCompleted = progress >= 99;

    const payload = {
      userId,
      storyId: story.id,
      chapterId: selectedChapter.id,
      lastPosition: Math.floor(currentTime),
      duration: Math.floor(duration),
      progressPercent: Math.round(progress),
      isCompleted,
    };

    try {
      if (reason === 'PAGE_HIDE') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const success = navigator.sendBeacon(`${API_URL}/history`, blob);
        console.log(`[DEBUG] Gửi beacon lưu history (${reason}): ${success ? 'thành công' : 'thất bại'}`);
      } else {
        await axios.post(`${API_URL}/history`, payload);
        console.log(`[DEBUG] Đã lưu lịch sử (${reason}):`, payload);
      }
    } catch (err) {
      console.error(`[DEBUG] Lỗi lưu lịch sử (${reason}):`, err);
    }
  };

  // 1. Lưu khi kết thúc chương
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setIsPlaying(false);
      saveHistory('ENDED');
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [selectedChapter, userId, story, currentTime, duration]);

  // 2. Lưu khi out tab / đóng trang
  useEffect(() => {
    const handlePageHide = () => {
      if (userId && audioRef.current) saveHistory('PAGE_HIDE');
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      if (userId && audioRef.current) saveHistory('PAGE_HIDE');
    };
  }, [userId, currentTime, selectedChapter, story, duration]);

  // 3. Lưu khi pause quá lâu
  useEffect(() => {
    if (isPlaying) {
      pauseStartTime.current = null;
      return;
    }

    pauseStartTime.current = Date.now();

    const checkIdle = setInterval(() => {
      if (pauseStartTime.current && Date.now() - pauseStartTime.current >= IDLE_TIMEOUT) {
        saveHistory('PAUSE_TOO_LONG');
        pauseStartTime.current = null;
        clearInterval(checkIdle);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [isPlaying, userId, currentTime, selectedChapter, story, duration]);

  // Load story + generate audioUrl nếu từ state (History)
  useEffect(() => {
    if (navState?.story) {
      console.log('[DEBUG] Sử dụng story từ state (từ History):', navState.story.title);

      setStory(navState.story);

      if (navState.chapter) {
        // Lấy order, fallback về 1 nếu undefined
        const chapterOrder = navState.chapter.order ?? 1;
        const generatedUrl = `https://archive.org/download/${navState.story.slug}/${chapterOrder}.m4a`;

        console.log('[DEBUG] Generated audioUrl từ state:', generatedUrl);

        setSelectedChapter({
          ...navState.chapter,
          audioUrl: generatedUrl
        });
      }

      setLoading(false);
      return;
    }

    // Bình thường: fetch API
    if (!id) return;

    console.log('[DEBUG] Fetch story từ API:', id);
    setLoading(true);
    getStoryById(id)
      .then((data) => {
        setStory(data);
        if (data.chapters?.length) {
          setSelectedChapter(data.chapters[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, navState]);

  // Cập nhật currentChapterIndex
  useEffect(() => {
    if (!story?.chapters || !selectedChapter) {
      setCurrentChapterIndex(-1);
      return;
    }
    const index = story.chapters.findIndex((ch) => ch.id === selectedChapter.id);
    setCurrentChapterIndex(index);
  }, [story?.chapters, selectedChapter]);

  // Load audio + resume + auto play khi từ History
  useEffect(() => {
    if (!audioRef.current || !selectedChapter?.audioUrl) {
      console.log('[DEBUG] Không load audio: thiếu audioUrl hoặc ref');
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }

    console.log('[DEBUG] Load audio cho chương:', selectedChapter.title, 'URL:', selectedChapter.audioUrl);

    const audio = audioRef.current;
    audio.src = selectedChapter.audioUrl;

    const handleError = () => {
      console.error('[DEBUG] Lỗi tải audio:', selectedChapter.audioUrl);
      setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
      const dur = isNaN(audio.duration) ? 0 : audio.duration;
      setDuration(dur);

      const lastPosition = location.state?.lastPosition;
      if (lastPosition !== undefined && lastPosition > 0 && lastPosition < dur) {
        audio.currentTime = lastPosition;
        setCurrentTime(lastPosition);
        console.log(`[DEBUG] Resume từ vị trí: ${formatTime(lastPosition)}`);

        // Tự động play khi resume từ History
        audio.play().catch((err) => console.log('[DEBUG] Auto play bị chặn:', err.message));
        setIsPlaying(true);
      } else {
        console.log('[DEBUG] Không resume (lastPosition không hợp lệ hoặc = 0)');
        setCurrentTime(0);
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    audio.load();

    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [selectedChapter, location.state?.lastPosition]);

  // Update thời gian realtime
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipPrevious = () => {
    if (!story?.chapters || currentChapterIndex <= 0) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    setSelectedChapter(story.chapters[currentChapterIndex - 1]);
  };

  const handleSkipNext = () => {
    if (!story?.chapters || currentChapterIndex < 0 || currentChapterIndex >= story.chapters.length - 1) {
      if (audioRef.current && duration > 0) audioRef.current.currentTime = duration;
      return;
    }
    setSelectedChapter(story.chapters[currentChapterIndex + 1]);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || !duration || isNaN(duration)) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
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

  const progressPercent = duration && !isNaN(duration) ? (currentTime / duration) * 100 : 0;
  const speeds = [0.5, 1, 1.25, 1.5, 2];

  if (loading) return <div className="p-20 text-center">Đang tải...</div>;
  if (!story) return <div className="p-20 text-center">Không tìm thấy câu chuyện</div>;

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex flex-col animate-in fade-in duration-700">
      <header className="flex items-center justify-between w-full px-4 py-4 sm:px-6 sm:py-5 md:px-12 md:py-6 z-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-xl sm:text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold tracking-wide hidden sm:inline">Quay lại</span>
        </button>
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl sm:text-2xl">bookmark_border</span>
          </button>
          <button className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl sm:text-2xl">share</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-6 md:px-12 pb-16 sm:pb-20 md:pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-fade-in-up w-full">
          <span className="inline-block px-3 py-1 mb-3 sm:mb-4 text-[10px] sm:text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
            {story.category}
          </span>
          <h1 className="text-slate-900 dark:text-white text-2xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-2 sm:mb-3">
            {story.title}
          </h1>
          {selectedChapter ? (
            <div>
              <h2 className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl font-medium">
                Chương {selectedChapter.number || selectedChapter.order || '?'}: {selectedChapter.title}
              </h2>
              {selectedChapter.subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedChapter.subtitle}</p>
              )}
            </div>
          ) : (
            <h2 className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl font-medium">
              Chọn một chương để bắt đầu
            </h2>
          )}
        </div>

        <div className="w-full flex flex-col items-center gap-10 sm:gap-12 md:gap-16">
          <div className="relative group w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] aspect-square rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-primary/20 dark:shadow-black/60 overflow-hidden transform hover:scale-[1.02] transition-all duration-700 ease-out mb-6 sm:mb-8 md:mb-10">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
              style={{ backgroundImage: `url('${story.imageUrl}')` }}
            ></div>
          </div>

          <div className="w-full max-w-2xl flex flex-col gap-6 sm:gap-8 md:gap-10">
            <div className="flex flex-col gap-3 sm:gap-4 w-full group/progress">
              <div className="flex justify-between text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div
                ref={progressBarRef}
                onClick={handleProgressClick}
                className="relative h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer hover:h-4 transition-all duration-200 overflow-hidden shadow-sm touch-manipulation"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150 ease-linear pointer-events-none"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full relative">
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center justify-center text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white font-bold text-sm w-14 h-9 sm:w-16 sm:h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-20 sm:w-24 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30">
                    <div className="py-1">
                      <p className="px-3 py-2 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-700 mb-1">
                        Tốc độ
                      </p>
                      {speeds.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setPlaybackSpeed(s);
                            setShowSpeedMenu(false);
                          }}
                          className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-primary/10 transition-colors ${
                            playbackSpeed === s ? 'text-primary font-bold bg-primary/5' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-5 sm:gap-6 md:gap-10 flex-1 justify-center">
                <button
                  onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                  className="text-slate-400 hover:text-primary transition-colors p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 touch-manipulation"
                >
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">replay_10</span>
                </button>

                <button
                  onClick={handleSkipPrevious}
                  className="text-slate-800 dark:text-white hover:text-primary transition-colors touch-manipulation"
                  disabled={currentChapterIndex <= 0 && currentTime <= 1}
                >
                  <span className="material-symbols-outlined text-4xl sm:text-5xl fill-1">skip_previous</span>
                </button>

                <button
                  onClick={togglePlay}
                  className="bg-primary hover:bg-primary-dark text-white rounded-full p-6 sm:p-7 md:p-8 shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center touch-manipulation"
                >
                  <span className="material-symbols-outlined text-5xl sm:text-5xl md:text-6xl fill-1">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                <button
                  onClick={handleSkipNext}
                  className="text-slate-800 dark:text-white hover:text-primary transition-colors touch-manipulation"
                  disabled={currentChapterIndex >= (story?.chapters?.length ?? 1) - 1 && currentTime >= duration - 1}
                >
                  <span className="material-symbols-outlined text-4xl sm:text-5xl fill-1">skip_next</span>
                </button>

                <button
                  onClick={() => setCurrentTime(Math.min(duration, currentTime + 30))}
                  className="text-slate-400 hover:text-primary transition-colors p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 touch-manipulation"
                >
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">forward_30</span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-3 group/volume w-32 justify-end">
                <button
                  onClick={() => setVolume(volume === 0 ? 70 : 0)}
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">
                    {volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                  </span>
                </button>
                <div
                  ref={volumeBarRef}
                  onClick={handleVolumeClick}
                  className="relative h-1.5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer group-hover/volume:h-2.5 transition-all overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-slate-400 dark:bg-slate-600 group-hover/volume:bg-primary transition-colors"
                    style={{ width: `${volume}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex md:hidden justify-between items-center w-full px-4 text-slate-400 mt-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">speed</span>
                <span className="font-bold text-sm uppercase tracking-widest">{playbackSpeed}x</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">volume_up</span>
                <div
                  onClick={handleVolumeClick}
                  className="h-2.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer touch-manipulation"
                >
                  <div className="h-full bg-primary rounded-full" style={{ width: `${volume}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div
        className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none blur-3xl"
        style={{
          backgroundImage: `url('${story.imageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      <audio ref={audioRef} />
    </div>
  );
};

export default Player;