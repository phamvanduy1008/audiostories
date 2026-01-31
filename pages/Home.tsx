import React, { useEffect, useState } from "react";
import StoryCard from "../components/StoryCard";
import { getStories } from "../services/story.service";
import { getCategories } from "../services/category.service";
import { Story, CategoryType } from "../types";

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    getStories().then(setStories);
    getCategories().then(setCategories);
  }, []);

  const filteredStories =
    selectedCategory === "all"
      ? stories
      : stories.filter(s => s.category === selectedCategory);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center space-y-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Khám Phá Câu Chuyện <span className="text-primary">Mới</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg md:text-xl">
          Đắm chìm trong thế giới truyện âm thanh được tuyển chọn để thư giãn, tập trung và học tập.
        </p>
      </section>

      {/* Categories */}
      <section className="flex justify-center w-full sticky top-[64px] md:top-[80px] z-40 py-2 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar w-full max-w-4xl justify-start md:justify-center px-1">
          
          {/* ALL */}
          <button
            key="all"
            onClick={() => setSelectedCategory("all")}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 ${
              selectedCategory === "all"
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-200 dark:shadow-none'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary dark:hover:text-primary'
            }`}
          >
            Tất cả
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}   
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 ${
                selectedCategory === category.name               
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-200 dark:shadow-none'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary dark:hover:text-primary'
              }`}
            >
              {category.name}   
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8 pb-20">
        {filteredStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </section>
    </div>
  );
};

export default Home;
