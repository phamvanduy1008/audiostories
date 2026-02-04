
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter  as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import StoryDetail from './pages/StoryDetail';
import Player from './pages/Player';
import Library from './pages/Library';
import History from './pages/History';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import AddStory from './pages/admin/AddStory';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load user từ localStorage khi mount
  useEffect(() => {
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  } catch {
    setUser(null);
    localStorage.removeItem("user");
  }
}, [location.pathname]);


  // Xử lý scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setShowUserMenu(false);
  }, [location]);

  // Ẩn header trên trang player
const hideLayoutPaths = ['/player', '/login', '/register'];

if (hideLayoutPaths.some(path => location.pathname.startsWith(path))) {
  return null;
}

  // Hàm logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-16' : 'bg-white dark:bg-background-dark h-20'
    }`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[24px]">headphones</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">Audio Stories</h1>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input 
              className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400" 
              placeholder="Tìm kiếm truyện, tác giả..." 
              type="text"
            />
          </div>
        </div>

        {/* Navigation & User */}
        <div className="flex items-center gap-6 shrink-0 h-full">
          <nav className="hidden lg:flex items-center gap-6 h-full">
            <Link to="/" className={`text-sm font-semibold transition-all h-full flex items-center border-b-2 ${location.pathname === '/' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-primary'}`}>Trang chủ</Link>
            <Link to="/history" className={`text-sm font-semibold transition-all h-full flex items-center border-b-2 ${location.pathname === '/history' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-primary'}`}>Lịch sử</Link>
            <Link to="/library" className={`text-sm font-semibold transition-all h-full flex items-center border-b-2 ${location.pathname === '/library' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-primary'}`}>Thư viện</Link>
          </nav>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
          
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-300 to-rose-400 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-white cursor-pointer hover:shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>

            {/* User Popup Menu */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.username || "Người dùng khách"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.email || "guest@audiostories.com"}
                  </p>
                </div>

                {user ? (
                  <>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-xl">account_circle</span>
                      Hồ sơ cá nhân
                    </Link>
                    <Link to="/library" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-xl">bookmark</span>
                      Truyện đã lưu
                    </Link>
                    <div className="border-t border-slate-50 dark:border-slate-700 my-2"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">logout</span>
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">login</span>
                    Đăng nhập / Đăng ký
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Footer giữ nguyên như cũ
const Footer: React.FC = () => {
  const location = useLocation();
const hideLayoutPaths = ['/player', '/login', '/register'];

if (hideLayoutPaths.some(path => location.pathname.startsWith(path))) {
  return null;
}

  return (
    <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">headphones</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Truyện Audio</span>
        </div>
        <div className="flex gap-8">
          <Link to="/" className="text-sm text-slate-500 hover:text-primary transition-colors">Về chúng tôi</Link>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Tác giả</a>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Quyền riêng tư</a>
        </div>
        <p className="text-sm text-slate-400">© 2024 Audio Stories Inc.</p>
      </div>
    </footer>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-white">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/stories/id/:id" element={<StoryDetail />} />
            <Route path="/player/:id" element={<Player />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/add-story" element={<AddStory />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;