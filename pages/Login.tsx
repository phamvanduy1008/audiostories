import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { loginUser } from '@/services/login.service'; // hàm login email/password cũ

const Login: React.FC = () => {
  const { signIn, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Kiểm tra Clerk đã load xong chưa
  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400 text-lg animate-pulse">
          Đang tải hệ thống đăng nhập...
        </div>
      </div>
    );
  }

  // Xử lý đăng nhập bằng email + password (giữ nguyên logic cũ)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      // loginUser đã lưu token & user vào localStorage
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng nhập social (Google hoặc Facebook)
  const handleSocialLogin = async (strategy: "oauth_google" | "oauth_facebook") => {
    setError("");
    setLoading(true);

    const providerName = strategy === "oauth_google" ? "Google" : "Facebook";

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",          // trang Clerk xử lý callback tạm thời
        redirectUrlComplete: "/social-callback", // trang xử lý cuối cùng (lấy user & gọi backend)
      });
    } catch (err: any) {
      setError(err.message || `Đăng nhập bằng ${providerName} thất bại. Vui lòng thử lại.`);
      console.error("Social login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-background-dark/50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 p-8 md:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-6">
              <span className="material-symbols-outlined text-4xl">headphones</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Chào mừng trở lại!</h2>
            <p className="text-slate-500 dark:text-slate-400">Đăng nhập để tiếp tục hành trình âm thanh của bạn</p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Nút Google */}
            <button
              onClick={() => handleSocialLogin("oauth_google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
              Google
            </button>

            {/* Nút Facebook */}
            <button
  onClick={() => handleSocialLogin("oauth_facebook")}
  disabled={loading}
  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {/* Icon Facebook SVG thay thế */}
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className="w-5 h-5" 
    fill="currentColor"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
  Facebook
</button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-800 px-4 text-slate-400 font-bold tracking-widest">Hoặc sử dụng Email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {error && (
              <div className="text-red-500 text-center text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                <a href="#" className="text-xs font-bold text-primary hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all transform active:scale-[0.98] mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;