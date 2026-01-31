import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryCard from "../components/StoryCard";
import {
  getSaveStory,
  getStories,
  getStoryById,
} from "@/services/story.service";
import { Story, SavedStoryItem } from "@/types";

const Library: React.FC = () => {
  const navigate = useNavigate();

  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [suggestedStories, setSuggestedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId: string | null = user?._id || user?.id || null;

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!userId) {
        setError("Vui lòng đăng nhập để xem thư viện của bạn.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const savedItems: SavedStoryItem[] = await getSaveStory(userId);
        const savedStoryPromises = savedItems.map(async (item) => {
          const storyId =
            typeof item.storyId === "string"
              ? item.storyId
              : item.storyId?._id;

          if (!storyId) return null;

          try {
            return await getStoryById(storyId);
          } catch (err) {
            console.warn("Không fetch được story:", storyId, err);
            return null;
          }
        });

        const fullSavedStories = (
          await Promise.all(savedStoryPromises)
        ).filter((s): s is Story => !!s);

        setSavedStories(fullSavedStories);

     
        const allStories: Story[] = await getStories();

        const savedIds = new Set(
          fullSavedStories.map((s) => s.id || s.id)
        );

        const notSavedStories = allStories.filter(
          (s) => !savedIds.has(s.id || s.id)
        );

        const shuffled = [...notSavedStories].sort(
          () => Math.random() - 0.5
        );

        setSuggestedStories(shuffled.slice(0, 4));
      } catch (err) {
        console.error("Lỗi tải Library:", err);
        setError("Không thể tải thư viện. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [userId]);


  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          Đang tải thư viện...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>

        {!userId && (
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
          >
            Đăng nhập để xem
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Thư viện của bạn
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Nơi lưu giữ những câu chuyện yêu thích của bạn.
        </p>
      </header>

      {/* SAVED STORIES */}
      <section>
        <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">
          Truyện đã lưu
          {savedStories.length > 0 && ` (${savedStories.length})`}
        </h3>

        {savedStories.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-7xl text-slate-400 mb-4 block">
              bookmark_add
            </span>
            <p className="text-xl font-medium text-slate-600 dark:text-slate-300">
              Bạn chưa lưu truyện nào
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Hãy nhấn “Lưu truyện” ở trang chi tiết để thêm vào thư viện.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedStories.map((story) => (
              <StoryCard key={story._id || story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* SUGGESTIONS */}
      <section className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">
          Gợi ý dành cho bạn
        </h3>

        {suggestedStories.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400">
            Hiện chưa có gợi ý nào.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {suggestedStories.map((story) => (
              <StoryCard key={story._id || story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Library;
