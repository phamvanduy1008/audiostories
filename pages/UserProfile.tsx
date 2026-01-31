
import React from 'react';
import { MOCK_HISTORY, MOCK_STORIES } from '../constants';

const UserProfile: React.FC = () => {
  const user = {
    name: "Người Dùng Khách",
    email: "guest@audiostories.com",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocL_U9fXpG-F5U2n9U7k1L8V6b9X5=s96-c",
    joinDate: "Tháng 10, 2023"
  };

  const stats = [
    { label: "Số truyện đã nghe", value: MOCK_HISTORY.length, icon: "auto_stories" },
    { label: "Tổng thời gian nghe", value: "24.5 Giờ", icon: "schedule" },
    { label: "Truyện yêu thích", value: MOCK_STORIES.length, icon: "favorite" }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-700">
      {/* Profile Header */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 mb-10">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-orange-300 to-rose-400 border-4 border-white dark:border-slate-700 shadow-xl flex items-center justify-center text-white overflow-hidden">
            <span className="material-symbols-outlined text-6xl">person</span>
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">{user.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Thành viên Pro</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Tham gia: {user.joinDate}</span>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined">settings</span>
          Cài đặt tài khoản
        </h3>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700">
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Thông báo</p>
                <p className="text-xs text-slate-500">Quản lý các thông báo đẩy và email</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined">security</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Bảo mật</p>
                <p className="text-xs text-slate-500">Đổi mật khẩu và xác thực 2 lớp</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
                <span className="material-symbols-outlined">payment</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Gói dịch vụ</p>
                <p className="text-xs text-slate-500">Nâng cấp lên Premium để nghe không quảng cáo</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </div>
        </div>

        <button className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors border border-red-100 flex items-center justify-center gap-2 mt-4">
          <span className="material-symbols-outlined">delete_forever</span>
          Xóa tài khoản vĩnh viễn
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
