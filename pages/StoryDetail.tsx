import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoryById, addSaveStory, checkSaveStory } from "../services/story.service";
import { Story, Chapter } from "../types";
import { getStoryInsight } from "../services/geminiService";

const ITEMS_PER_PAGE = 10;

const getAudioDuration = (url: string): Promise<string> => {
  if (url.includes("archive.org") || url.includes(".ca.archive.org")) {
    return Promise.reject("Skipped: Archive.org restricted metadata");
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = url;
    audio.preload = "metadata";

    const timeoutId = setTimeout(() => {
      audio.src = "";
      reject(new Error("Timeout loading audio metadata"));
    }, 8000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      if (isNaN(audio.duration) || audio.duration === Infinity) {
        reject(new Error("Invalid duration"));
        return;
      }

      const totalSeconds = Math.floor(audio.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      resolve(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    audio.onerror = (e) => {
      clearTimeout(timeoutId);
      console.warn("Audio metadata error:", e);
      reject(new Error("Cannot load audio metadata"));
    };
  });
};

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);              // loading chính (story info)
  const [chaptersLoading, setChaptersLoading] = useState(true); // loading riêng cho chapters
  const [error, setError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

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

  // Toast tự ẩn
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Check đã lưu
  useEffect(() => {
    if (!userId || !story?.id) return;
    checkSaveStory(userId, story.id)
      .then((res) => setIsSaved(!!res?.saved))
      .catch((err) => console.warn("Check save error:", err));
  }, [userId, story?.id]);

  // Fetch story
  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID truyện");
      setLoading(false);
      return;
    }

    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      setChaptersLoading(true);

      try {
        const data = await getStoryById(id);

        setStory(data);

        // Xử lý chapters
        const processedChapters = (data.chapters || []).map((chapter: Chapter) => {
          if (chapter.duration && chapter.duration !== "--:--") {
            return chapter;
          }

          // 2. Fallback cache localStorage
          const cacheKey = `audio-duration:${chapter.audioUrl}`;
          const cached = localStorage.getItem(cacheKey);

          if (cached && cached !== "--:--") {
            console.log(`[CACHE] Duration chapter ${chapter.id}: ${cached}`);
            return { ...chapter, duration: cached };
          }
          return { ...chapter, duration: null };
        });

        setChapters(processedChapters);

        const missingDurations = processedChapters.filter(
          (ch) => !ch.duration && ch.audioUrl
        );

        if (missingDurations.length > 0) {
          console.log(`Tính duration async cho ${missingDurations.length} chapter...`);

          missingDurations.forEach(async (chapter) => {
            const cacheKey = `audio-duration:${chapter.audioUrl}`;

            try {
              const duration = await getAudioDuration(chapter.audioUrl);
              localStorage.setItem(cacheKey, duration);

              setChapters((prev) =>
                prev.map((c) =>
                  c.id === chapter.id ? { ...c, duration } : c
                )
              );
            } catch (err) {
              console.warn(`Không lấy được duration chapter ${chapter.id}:`, err);
              localStorage.setItem(cacheKey, "--:--");
              setChapters((prev) =>
                prev.map((c) =>
                  c.id === chapter.id ? { ...c, duration: "--:--" } : c
                )
              );
            }
          });
        }
      } catch (err: any) {
        console.error("Lỗi fetch story:", err);
        setError("Không thể tải truyện. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        setChaptersLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  // Gemini insight
  useEffect(() => {
    if (!story?.id) return;

    const cacheKey = `gemini-insight:${story.id}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setAiInsight(cached);
      return;
    }

    getStoryInsight(story)
      .then((insight) => {
        setAiInsight(insight);
        localStorage.setItem(cacheKey, insight);
      })
      .catch((err) => console.warn("Gemini insight error:", err));
  }, [story?.id]);

  const handleSaveStory = async () => {
    if (isSaved) return;

    if (!userId) {
      setToastMessage({ text: "Vui lòng đăng nhập để lưu truyện", type: "error" });
      navigate("/login");
      return;
    }

    if (!story?.id) return;

    setSaveLoading(true);
    try {
      await addSaveStory(userId, story.id);
      setIsSaved(true);
      setToastMessage({ text: "Đã lưu truyện thành công!", type: "success" });
    } catch (err) {
      console.error("Save story error:", err);
      setToastMessage({ text: "Lưu truyện thất bại. Thử lại sau.", type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(chapters.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedChapters = chapters.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-lg animate-pulse">
        Đang tải thông tin truyện...
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="p-20 text-center text-red-600">
        {error || "Không tìm thấy truyện"}
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-background-dark relative min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white font-medium animate-in fade-in slide-in-from-top-5 duration-300 ${
            toastMessage.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      <div className="max-w-[1080px] mx-auto px-4 md:px-10 py-8 lg:py-16">
        {/* Hero section - hiển thị ngay */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="w-full lg:w-[400px]">
            <div className="aspect-square rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url("${story.imageUrl}")` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 flex-1">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                {story.title}
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">
                Bởi {story.author}
              </p>
            </div>

            {/* Tags + Save */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {story.tags?.map((tag) => (
                  <div
                    key={tag}
                    className="px-4 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center"
                  >
                    {tag}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveStory}
                disabled={saveLoading || isSaved}
                className={`h-10 px-6 rounded-full text-sm font-semibold flex items-center gap-2 transition-all
                  ${
                    isSaved
                      ? "bg-green-100 text-green-700 cursor-default border border-green-200"
                      : saveLoading
                      ? "bg-gray-300 text-gray-600 cursor-wait"
                      : "bg-slate-100 hover:bg-primary/10 text-slate-700 hover:shadow-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-primary/20"
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {saveLoading ? "refresh" : isSaved ? "bookmark_added" : "bookmark"}
                </span>
                {saveLoading ? "Đang lưu..." : isSaved ? "Đã lưu" : "Lưu truyện"}
              </button>
            </div>

            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              {story.description}
            </p>

            {aiInsight && (
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
                  Gợi ý từ Gemini
                </h4>
                <p className="italic text-sm text-slate-600 dark:text-slate-400">
                  "{aiInsight}"
                </p>
              </div>
            )}

            <button
              onClick={() => {
                if (chapters.length > 0) {
                  const firstChapter = chapters[0];
                  navigate(`/player/${story.id}`, {
                    state: { story, chapter: firstChapter },
                  });
                } else {
                  navigate(`/player/${story.id}`, { state: { story } });
                }
              }}
              disabled={chapters.length === 0}
              className={`h-14 px-10 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-4 ${
                chapters.length === 0
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-primary text-white hover:bg-primary-dark"
              }`}
            >
              ▶ {chapters.length > 0 ? "Nghe ngay" : "Chưa có chương"}
            </button>
          </div>
        </div>

        {/* Danh sách chương */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white">
            Danh sách chương {chapters.length > 0 ? `(${chapters.length})` : "(Sắp có)"}
          </h2>

          {chaptersLoading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 animate-pulse">
              Đang tải danh sách chương...
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              Chưa có chương nào được cập nhật cho truyện này.
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {paginatedChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    onClick={() =>
                      navigate(`/player/${story.id}`, {
                        state: { chapter, story },
                      })
                    }
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                  >
                    <div className="w-8 text-slate-400 dark:text-slate-500 font-medium text-center">
                      {chapter.number}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {chapter.title}
                      </p>
                      {chapter.subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {chapter.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block min-w-[60px] text-right">
                      {chapter.duration || "--:--"}
                    </div>
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      ▶
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-slate-700"
                        : "bg-primary/10 hover:bg-primary/20 text-primary dark:bg-slate-700 dark:hover:bg-slate-600"
                    }`}
                  >
                    Trước
                  </button>

                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Trang {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-slate-700"
                        : "bg-primary/10 hover:bg-primary/20 text-primary dark:bg-slate-700 dark:hover:bg-slate-600"
                    }`}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;