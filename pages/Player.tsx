import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Chapter, Story } from "../types";
import { getStoryById } from "../services/story.service";
import axios from "axios";
import { Ipaddress } from "@/constants/ip";

const API_URL = `${Ipaddress}/api`;

const checkSaveStory = async (
  userId: string,
  storyId: string,
): Promise<{ saved: boolean }> => {
  const res = await axios.get(`${API_URL}/savestories/check`, {
    params: { userId, storyId },
  });
  return res.data;
};

const toggleSaveStory = async (
  userId: string,
  storyId: string,
  shouldSave: boolean,
): Promise<void> => {
  if (shouldSave) {
    await axios.post(`${API_URL}/savestories`, { userId, storyId });
  } else {
    await axios.delete(`${API_URL}/savestories`, { data: { userId, storyId } });
  }
};

const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<
    (Chapter & { audioUrl?: string }) | null
  >(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(70);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const speedButtonRef = useRef<HTMLButtonElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const bufferingTimer = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const userId = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  }, []);

  // Load story & chapter
  useEffect(() => {
    setLoading(true);
    const navState = location.state as any;

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
          const matched = data.chapters?.find(
            (ch: Chapter) => ch.id === navState.chapterId,
          );
          setSelectedChapter(matched || data.chapters?.[0] || null);
        })
        .catch(() => setAudioError("Không tải được truyện."))
        .finally(() => setLoading(false));
      return;
    }

    if (id) {
      getStoryById(id)
        .then((data) => {
          setStory(data);
          setSelectedChapter(data.chapters?.[0] || null);
        })
        .catch(() => setAudioError("Không tải được truyện."))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, location.state]);

  // Check saved status
  useEffect(() => {
    const checkSaved = async () => {
      if (!userId || !story?.id) return;
      try {
        const { saved } = await checkSaveStory(userId, story.id);
        setIsSaved(saved);
      } catch {}
    };
    if (story?.id) checkSaved();
  }, [story?.id, userId]);

  // Restore last position
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedChapter?.audioUrl) return;
    const lastPos = location.state?.lastPosition ?? 0;
    if (lastPos > 0) {
      audio.currentTime = lastPos;
      setCurrentTime(lastPos);
    }
  }, [selectedChapter?.audioUrl, location.state?.lastPosition]);

  // Audio source & events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedChapter?.audioUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
      setIsBuffering(false);
      return;
    }

    if (audio.src === selectedChapter.audioUrl) return;

    audio.src = selectedChapter.audioUrl;
    audio.preload = "metadata";
    audio.load();

    const onLoadedMetadata = () =>
      setDuration(isNaN(audio.duration) ? 0 : audio.duration);
    const onError = () => {
      setAudioError("Không tải được audio.");
      setIsPlaying(false);
      setIsBuffering(false);
    };
    const onWaiting = () => {
      bufferingTimer.current = setTimeout(() => setIsBuffering(true), 1500);
    };
    const onPlaying = () => {
      if (bufferingTimer.current) clearTimeout(bufferingTimer.current);
      setIsBuffering(false);
    };
    const onCanPlay = () => setIsBuffering(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("canplay", onCanPlay);
      if (bufferingTimer.current) clearTimeout(bufferingTimer.current);
    };
  }, [selectedChapter?.audioUrl]);

  // Real-time time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      if (!audio.paused && !audio.ended) {
        setCurrentTime(audio.currentTime);
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };

    if (isPlaying) animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime),
    );
    audio.addEventListener("durationchange", () =>
      setDuration(isNaN(audio.duration) ? 0 : audio.duration),
    );

    return () => {
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("durationchange", () => {});
    };
  }, []);

  // Apply speed & volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = volume / 100;
    }
  }, [playbackSpeed, volume]);

  // Save history
  const saveHistory = async () => {
    if (!userId || !story?.id || !selectedChapter?.id) return;

    const audio = audioRef.current;
    const pos = audio?.currentTime ?? currentTime;
    const dur = audio?.duration ?? duration;
    const progress = dur > 0 ? (pos / dur) * 100 : 0;

    try {
      await axios.post(`${API_URL}/history`, {
        userId,
        storyId: story.id,
        chapterId: selectedChapter.id,
        lastPosition: Math.floor(pos),
        duration: Math.floor(dur),
        progressPercent: Math.round(progress),
        isCompleted: progress >= 99,
      });
    } catch {}
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        saveHistory();
      });
    }
    window.addEventListener("pagehide", saveHistory);
    window.addEventListener("beforeunload", saveHistory);

    return () => {
      audio?.removeEventListener("ended", () => {});
      window.removeEventListener("pagehide", saveHistory);
      window.removeEventListener("beforeunload", saveHistory);
    };
  }, [userId, story?.id, selectedChapter?.id, currentTime, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleToggleSave = async () => {
    if (!userId || !story?.id || isSaving) return;
    setIsSaving(true);
    try {
      await toggleSaveStory(userId, story.id, !isSaved);
      setIsSaved(!isSaved);
    } catch {}
    setIsSaving(false);
  };

  const handleShare = async () => {
    if (!story) return;
    const shareUrl = `${window.location.origin}/player/${story.id}`;
    const shareData = {
      title: story.title,
      text: `Nghe truyện "${story.title}"`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Đã sao chép link!");
    } catch {
      alert(`Sao chép thủ công: ${shareUrl}`);
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, Math.min(duration, time));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setVolume(Math.round(percent * 100));
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Click outside để ẩn speed menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSpeedMenu &&
        speedMenuRef.current &&
        speedButtonRef.current &&
        !speedMenuRef.current.contains(event.target as Node) &&
        !speedButtonRef.current.contains(event.target as Node)
      ) {
        setShowSpeedMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSpeedMenu]);

  if (loading) return <div className="p-20 text-center">Đang tải...</div>;
  if (!story) return <div className="p-20 text-center">Không tìm thấy truyện</div>;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-background-dark">
      <header className="flex items-center justify-between w-full px-4 py-3 z-20">
        <button
          onClick={() => {
            saveHistory();
            navigate(-1);
          }}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors group touch-manipulation"
        >
          <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span className="text-sm font-medium hidden sm:inline">Quay lại</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSave}
            disabled={isSaving}
            className={`p-2 rounded-full transition-colors touch-manipulation ${
              isSaved
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {isSaved ? "bookmark" : "bookmark_border"}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors touch-manipulation"
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 max-w-5xl mx-auto relative">
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 text-white">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-5xl">
                hourglass_empty
              </span>
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
              Chương {selectedChapter.number || selectedChapter.order || "?"}: {selectedChapter.title}
            </h2>
          )}
          {audioError && <p className="mt-2 text-red-500 text-sm">{audioError}</p>}
        </div>

        <div className="relative group w-56 sm:w-64 md:w-72 aspect-square rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage: `url('${story.imageUrl || story.coverImage || "https://picsum.photos/400/600?random=1"}')`,
            }}
          />
        </div>

        <div className="w-full max-w-md flex flex-col gap-3 pb-6">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between text-xs font-mono text-slate-500 px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
            </div>
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              className="relative h-2.5 w-full bg-slate-200/70 dark:bg-slate-700/70 rounded-full cursor-pointer group touch-manipulation"
            >
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-100 pointer-events-none"
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
              onClick={() => seek(currentTime - 10)}
              className="text-slate-500 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 touch-manipulation"
            >
              <span className="material-symbols-outlined text-3xl">replay_10</span>
            </button>

            <button
              onClick={() =>
                selectedChapter &&
                setSelectedChapter(
                  story?.chapters?.[
                    Math.max(
                      0,
                      (story.chapters?.findIndex((c) => c.id === selectedChapter.id) || 0) - 1,
                    )
                  ] || null
                )
              }
              className="text-slate-700 dark:text-slate-200 hover:text-primary transition-colors touch-manipulation"
              disabled={
                !story?.chapters ||
                (story.chapters.findIndex((c) => c.id === selectedChapter?.id) ?? 0) <= 0
              }
            >
              <span className="material-symbols-outlined text-4xl fill-1">skip_previous</span>
            </button>

            <button
              onClick={togglePlay}
              className="bg-primary hover:bg-primary-dark text-white rounded-full p-5 shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center touch-manipulation"
            >
              <span className="material-symbols-outlined text-5xl fill-1">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>

            <button
              onClick={() =>
                selectedChapter &&
                setSelectedChapter(
                  story?.chapters?.[
                    Math.min(
                      (story.chapters?.length ?? 1) - 1,
                      (story.chapters?.findIndex((c) => c.id === selectedChapter.id) || 0) + 1,
                    )
                  ] || null
                )
              }
              className="text-slate-700 dark:text-slate-200 hover:text-primary transition-colors touch-manipulation"
              disabled={
                !story?.chapters ||
                (story.chapters.findIndex((c) => c.id === selectedChapter?.id) ?? 0) >=
                  (story.chapters?.length ?? 1) - 1
              }
            >
              <span className="material-symbols-outlined text-4xl fill-1">skip_next</span>
            </button>

            <button
              onClick={() => seek(currentTime + 30)}
              className="text-slate-500 hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 touch-manipulation"
            >
              <span className="material-symbols-outlined text-3xl">forward_30</span>
            </button>
          </div>

          <div className="flex items-center justify-between w-full px-2 mt-2">
            <div className="flex items-center gap-2 relative">
              <span className="material-symbols-outlined text-xl text-slate-500">speed</span>
              <button
                ref={speedButtonRef}
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-slate-500 hover:text-primary font-medium text-sm px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition touch-manipulation"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div
                  ref={speedMenuRef}
                  className="
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-[20px]
                    w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl 
                    border border-slate-200 dark:border-slate-700 p-4 z-50
                  "
                >
                  <div className="mb-4">
                    <input
                      type="range"
                      min="0.25"
                      max="3"
                      step="0.05"
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center text-sm mt-1 text-slate-500">
                      {playbackSpeed.toFixed(2)}x
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`py-2 rounded-lg text-sm font-medium transition ${
                          playbackSpeed === s
                            ? "bg-primary text-white"
                            : "bg-slate-100 dark:bg-slate-700 hover:bg-primary/20"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setVolume(volume === 0 ? 70 : 0)}
                className="text-slate-500 hover:text-primary transition-colors touch-manipulation p-1"
              >
                <span className="material-symbols-outlined text-xl">
                  {volume === 0
                    ? "volume_off"
                    : volume < 30
                    ? "volume_mute"
                    : volume < 70
                    ? "volume_down"
                    : "volume_up"}
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
        </div>
      </main>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

export default Player;