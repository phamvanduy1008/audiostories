import { registerUser } from '@/services/login.service';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate cơ bản
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Email không hợp lệ!');
      return;
    }

    setLoading(true);

    try {
      await registerUser(name.trim(), email.trim(), password);

      setSuccess('Đăng ký thành công! Đang chuyển hướng đến trang chính...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Đăng ký lỗi:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-background-dark/50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 p-8 md:p-12">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-6">
              <span className="material-symbols-outlined text-4xl">person_add</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Tạo tài khoản mới</h2>
            <p className="text-slate-500 dark:text-slate-400">Khám phá hàng ngàn câu chuyện âm thanh hấp dẫn</p>
          </div>

          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl text-green-700 dark:text-green-300 text-sm">
              {success}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">shield_lock</span>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-slate-900 dark:text-white disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input 
                type="checkbox" 
                required 
                className="mt-1 rounded border-slate-200 text-primary focus:ring-primary" 
                id="terms" 
                disabled={loading}
              />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
                Tôi đồng ý với các <a href="#" className="text-primary font-bold">Điều khoản dịch vụ</a> và <a href="#" className="text-primary font-bold">Chính sách bảo mật</a>.
              </label>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white rounded-2xl font-black shadow-xl transition-all transform active:scale-[0.98] mt-2
                ${loading 
                  ? 'bg-primary/70 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark shadow-primary/25 hover:shadow-primary/40'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Đang tạo tài khoản...
                </span>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;