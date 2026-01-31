
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import provider from '../core/provider';
import { SyncStatus } from '../core/dataProvider';
import { UserRole } from '../core/types';
import { 
  LogIn, UserPlus, BookOpen, Facebook, Youtube, Phone, 
  ShieldCheck, User, Lock, Smile, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react';

const { useNavigate } = ReactRouterDOM;

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('STUDENT');

  // Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Initialize to trigger auto-sync
    provider.init();

    // 2. Subscribe to sync updates
    const state = provider.getSyncState();
    setSyncStatus(state.status);
    setLastSync(state.lastSync);

    const unsubscribe = provider.subscribe((status, date) => {
      setSyncStatus(status);
      setLastSync(date);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const user = await provider.login(username, password);
      if (user) {
        if (user.role === 'TEACHER' || user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError('Lỗi kết nối: ' + (err.message || 'Không xác định'));
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password || !regFullName) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setIsLoading(true);

    try {
      const newUser = await provider.register({
        username,
        password,
        fullName: regFullName,
        role: regRole
      });
      if (newUser.role === 'TEACHER' || newUser.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
      setIsLoading(false);
    }
  };

  const getSyncStatusUI = () => {
    if (syncStatus === 'SYNCING') {
       return (
         <div className="flex items-center gap-2 text-yellow-100 animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-sm font-medium">Đang đồng bộ dữ liệu...</span>
         </div>
       );
    } else if (syncStatus === 'ERROR') {
       return (
         <div className="flex items-center gap-2 text-red-200">
            <AlertTriangle size={14} />
            <span className="text-sm font-medium">Lỗi kết nối</span>
         </div>
       );
    } else if (syncStatus === 'NOT_CONFIGURED') {
       return (
         <div className="flex items-center gap-2 text-orange-200">
            <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="text-sm font-medium">Chưa kết nối API</span>
         </div>
       );
    } else {
       return (
         <div className="flex items-center gap-2 text-green-200">
            <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Hệ thống sẵn sàng</span>
         </div>
       );
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center font-sans p-4">
      
      {/* Main Card Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - Info (Blue Background) */}
        <div className="md:w-1/2 bg-[#0086d1] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BookOpen size={32} />
              </div>
              <span className="text-2xl font-bold tracking-wide">LMS EDU</span>
            </div>
            
            <h1 className="text-4xl font-extrabold mb-6 leading-tight">
              Hệ thống quản lý <br/>
              <span className="text-yellow-300">Học tập & Nề nếp</span>
            </h1>
            
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Kết nối tri thức với cuộc sống. Nền tảng quản lý lớp học trực tuyến toàn diện dành cho giáo viên chủ nhiệm, phụ huynh và học sinh.
            </p>
          </div>

          {/* Connection Status Box */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 transition-all duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80 flex justify-between">
              TRẠNG THÁI DỮ LIỆU
              {lastSync && <span className="normal-case opacity-70 font-normal">{lastSync.toLocaleTimeString()}</span>}
            </h3>
            {getSyncStatusUI()}
            {syncStatus === 'NOT_CONFIGURED' && (
                <p className="text-xs mt-2 text-orange-200 border-t border-white/10 pt-2">
                    Hệ thống chưa được cấu hình kết nối. Vui lòng liên hệ quản trị viên.
                </p>
            )}
          </div>
        </div>

        {/* Right Side - Login Form (White Background) */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
           <div className="max-w-md mx-auto w-full">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-bold text-gray-800 mb-2">
                 {isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập'}
               </h2>
               <p className="text-gray-500">
                 {isRegistering ? 'Nhập thông tin để tạo tài khoản mới' : 'Nhập thông tin tài khoản của bạn để truy cập'}
               </p>
             </div>

             {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm flex items-center">
                  <ShieldCheck size={18} className="mr-2" />
                  {error}
                </div>
              )}

             {!isRegistering ? (
               <form onSubmit={handleLogin} className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập (Username)</label>
                   <div className="relative">
                     <User className="absolute left-3 top-3 text-gray-400" size={20} />
                     <input 
                       type="text" 
                       value={username}
                       onChange={e => setUsername(e.target.value)}
                       disabled={isLoading}
                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                       placeholder="VD: an.nv"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu (Password)</label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                     <input 
                       type="password" 
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       disabled={isLoading}
                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                       placeholder="••••••••"
                     />
                   </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isLoading}
                   className={`w-full bg-[#0086d1] hover:bg-[#007cc3] text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                 >
                   {isLoading ? (
                      <>
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                   ) : (
                      <>
                        <LogIn size={20} className="mr-2" /> Đăng nhập
                      </>
                   )}
                 </button>

                 <div className="flex justify-between items-center text-sm mt-4">
                    <span className="text-gray-500">Chưa có tài khoản?</span>
                    <button 
                      type="button" 
                      onClick={() => { setIsRegistering(true); setError(''); }}
                      disabled={isLoading}
                      className="text-[#0086d1] font-bold hover:underline flex items-center disabled:text-gray-400"
                    >
                      + Đăng ký ngay
                    </button>
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <div className="flex flex-col items-center justify-center text-[#0086d1] animate-bounce-slow">
                       <Smile size={48} className="mb-2" strokeWidth={1.5} />
                       <p className="text-lg font-bold uppercase tracking-tight">TÀI KHOẢN DO GIÁO VIÊN CHỦ NHIỆM CẤP</p>
                    </div>
                 </div>
               </form>
             ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input 
                      type="text" 
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                      required
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                      required
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                     <div className="grid grid-cols-3 gap-2">
                       {['TEACHER', 'PARENT', 'STUDENT'].map((role) => (
                         <button 
                           key={role}
                           type="button"
                           disabled={isLoading}
                           className={`py-2 px-1 text-xs font-bold rounded border transition-all ${regRole === role ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                           onClick={() => setRegRole(role as UserRole)}
                         >
                           {role === 'TEACHER' ? 'GIÁO VIÊN' : (role === 'PARENT' ? 'PHỤ HUYNH' : 'HỌC SINH')}
                         </button>
                       ))}
                     </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all mt-2 flex justify-center items-center ${isLoading ? 'opacity-70' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} className="mr-2" /> Đăng Ký
                      </>
                    )}
                  </button>
                  <div className="text-center mt-4">
                    <button 
                      type="button" 
                      onClick={() => { setIsRegistering(false); setError(''); }}
                      disabled={isLoading}
                      className="text-gray-500 hover:text-gray-800 text-sm font-medium disabled:text-gray-400"
                    >
                      ← Quay lại đăng nhập
                    </button>
                  </div>
                </form>
             )}
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center bg-white py-4 px-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-4xl">
         <p className="text-gray-500 text-sm mb-3">
            Thiết kế & Phát triển bởi: <span className="font-bold text-[#0086d1] text-base">Hoàng Hưởng - Soạn Giảng TV</span>
         </p>
         <div className="flex flex-wrap gap-4 md:gap-8 justify-center items-center">
            <a 
              href="tel:0355936256" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <div className="bg-blue-600 text-white p-1 rounded-full"><Phone size={12} /></div>
              Zalo/ĐT: 0355936256
            </a>
            
            <a 
              href="https://www.facebook.com/vanhuong1982" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium group"
            >
              <Facebook size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
              Facebook
            </a>
            
            <a 
              href="https://www.youtube.com/@soangiangofficial" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors text-sm font-medium group"
            >
              <Youtube size={18} className="text-red-600 group-hover:scale-110 transition-transform" />
              Soạn Giảng TV
            </a>
         </div>
      </div>
    </div>
  );
};

export default Landing;
