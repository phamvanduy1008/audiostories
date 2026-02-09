import React from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { getStoryById } from '../services/story.service';

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const fallbackImage = 'https://picsum.photos/400/600?random=1'; 
  const displayTitle = story.title || 'Truyện chưa tải';
  const displayAuthor = story.author || 'Tác giả không xác định';
  const displayCategory = story.category || 'Chưa phân loại';

  return (
    <Link
      to={`/stories/id/${story.id || 'admin'}`}
      state={{ story }}
      onClick={() => {
        console.log('Navigating to StoryDetail with state.story:', story);

        if (story.id) {
          getStoryById(story.id)
            .then((data) => {
              console.log('Prefetched story by id:', data);
              console.log('Chapters:', data.chapters || []);
            })
            .catch((err) => {
              console.error(`Prefetch error for story id ${story.id}:`, err);
            });
        } else {
          console.warn('Story không có id, không prefetch được');
        }
      }}
      className="block h-full"
    >
      <article className="group relative flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden">
        <div className="p-3 pb-0">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url('${story.imageUrl || story.coverImage || fallbackImage}')`,
              }}
            />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-primary backdrop-blur-sm shadow-sm uppercase tracking-wider">
                {displayCategory}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-4 pt-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {displayTitle}
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
            bởi {displayAuthor}
          </p>

          <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-700/50">
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-[20px] fill-1">play_arrow</span>
              Nghe Ngay
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default StoryCard;