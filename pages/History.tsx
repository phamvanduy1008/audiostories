import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserHistory } from '@/services/history.service';
import { HistoryItem } from '@/types';

const History: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?._id || user?.id;

 const fetchHistory = async () => {
  if (!userId) {
    setError('Vui lòng đăng nhập để xem lịch sử nghe.');
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const data = await getUserHistory(userId);
    const sorted = data.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    setHistoryItems(sorted);
  } catch (err: any) {
    console.error('Lỗi tải lịch sử:', err);
    setError('Không thể tải lịch sử nghe. Vui lòng thử lại sau.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchHistory();
  }, [userId, location.key]); 

  const handleClearHistory = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử nghe?')) return;
    alert('Chức năng xóa toàn bộ lịch sử đang được phát triển.');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePlayHistory = (item: HistoryItem) => {
    const story = item.storyId;
    const chapter = item.chapterId;

    // Kiểm tra dữ liệu bắt buộc
    if (!story?._id) {
      alert('Không tìm thấy thông tin truyện. Vui lòng thử lại.');
      return;
    }

    if (!chapter?._id) {
      alert('Không tìm thấy thông tin chương. Vui lòng thử lại.');
      return;
    }

    // Debug log để kiểm tra
    console.log('[HISTORY → PLAYER] Navigating with state:', {
      storyId: story._id,
      chapterId: chapter._id,
      lastPosition: item.lastPosition,
    });

    // Truyền chapterId (_id) thay vì object đầy đủ (vì type không có audioUrl)
    navigate(`/player/${story._id}`, {
      state: {
        story: {
          _id: story._id,
          title: story.title || 'Truyện không xác định',
          author: story.author || 'Không xác định',
          // Dùng đúng field có trong type: coverImage
          coverImage:
            story.coverImage ||
            'https://picsum.photos/400/600?random=1',
          // Type không có chapters → dùng mảng rỗng
          chapters: [],
        },
        // Truyền chapterId (_id) để Player tự fetch chapter đầy đủ nếu cần
        chapterId: chapter._id,
        lastPosition: item.lastPosition || 0,
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải lịch sử nghe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
        {!userId && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
          >
            Đăng nhập ngay
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lịch sử nghe
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Tiếp tục hành trình lắng nghe của bạn
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Xóa toàn bộ lịch sử nghe"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            Xóa lịch sử
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-7xl text-slate-400 mb-4 block">history</span>
          <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mb-2">
            Chưa có lịch sử nghe nào
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Bắt đầu nghe một truyện để lịch sử xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => {
            const story = item.storyId;
            const chapter = item.chapterId;

            const storyTitle = story?.title || 'Truyện không xác định';
            const author = story?.author || 'Không xác định';
            const cover = story?.coverImage || 'https://picsum.photos/400/600?random=1';

            const progress = item.progressPercent || 0;
            const isCompleted = item.isCompleted || progress >= 100;

            return (
              <div
                key={item._id}
                onClick={() => handlePlayHistory(item)}
                className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-soft border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center gap-4 group hover:shadow-hover transition-all duration-300 cursor-pointer ${
                  progress < 20 ? 'opacity-80' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700">
                    <img
                      alt={storyTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={cover}
                      onError={(e) => {
                        e.currentTarget.src = 'https://picsum.photos/400/600?random=1';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {storyTitle}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      bởi {author}
                    </p>

                    {chapter && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Chương {chapter.order || '?'}: {chapter.title || 'Chương không xác định'}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 max-w-[140px] h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isCompleted ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {isCompleted ? 'Hoàn thành' : `${Math.round(progress)}%`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-50 dark:border-slate-700/30 pt-4 md:pt-0">
                  <div className="text-right shrink-0">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Nghe lần cuối
                    </p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.updatedAt)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayHistory(item);
                    }}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all transform active:scale-95 ${
                      isCompleted
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 shadow-none'
                        : 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${!isCompleted ? 'fill-1' : ''}`}>
                      {isCompleted ? 'replay' : 'play_arrow'}
                    </span>
                    {isCompleted ? 'Nghe lại' : 'Tiếp tục'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;