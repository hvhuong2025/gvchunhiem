
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Menu, X, Home, Users, Calendar, 
  MessageCircle, BarChart, LogOut, Briefcase, GraduationCap, Star, Megaphone, FileText, CheckSquare, Puzzle, Gamepad2, RefreshCw, WifiOff, Check, UserCog, Settings 
} from 'lucide-react';
import provider from '../core/provider';
import { SyncStatus } from '../core/dataProvider';
import { User } from '../core/types';

const { Link, useLocation } = ReactRouterDOM;

interface LayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'app';
}

const Layout: React.FC<LayoutProps> = ({ children, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // User State for Permissions
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initial state
    const state = provider.getSyncState();
    setSyncStatus(state.status);
    setLastSync(state.lastSync);
    
    // Get User for RBAC
    provider.getCurrentUser().then(setCurrentUser);

    // Subscribe
    const unsubscribe = provider.subscribe((status, date) => {
      setSyncStatus(status);
      setLastSync(date);
    });
    return unsubscribe;
  }, []);

  const handleSync = () => {
    provider.sync();
  };

  const adminLinks = [
    { to: '/admin', label: 'Tổng quan', icon: <Home size={20} /> },
    { to: '/admin/classes', label: 'Lớp học', icon: <Briefcase size={20} /> },
    { to: '/admin/students', label: 'Học sinh', icon: <GraduationCap size={20} /> },
    { to: '/admin/users', label: 'Tài khoản', icon: <UserCog size={20} /> },
    { to: '/admin/announcements', label: 'Thông báo', icon: <Megaphone size={20} /> },
    { to: '/admin/tasks', label: 'Nhắc việc', icon: <CheckSquare size={20} /> },
    { to: '/admin/documents', label: 'Tài liệu', icon: <FileText size={20} /> },
    { to: '/admin/attendance', label: 'Điểm danh', icon: <Calendar size={20} /> },
    { to: '/admin/behavior', label: 'Nề nếp', icon: <Star size={20} /> },
    { to: '/admin/parents', label: 'Phụ huynh', icon: <Users size={20} /> },
    { to: '/admin/questions', label: 'Ngân hàng câu hỏi', icon: <Puzzle size={20} /> }, 
    { to: '/admin/messages', label: 'Tin nhắn', icon: <MessageCircle size={20} /> },
    { to: '/admin/reports', label: 'Báo cáo', icon: <BarChart size={20} /> },
  ];

  const appLinks = [
    { to: '/app', label: 'Tổng quan', icon: <Home size={20} /> },
    { to: '/app/announcements', label: 'Thông báo', icon: <Megaphone size={20} /> },
    { to: '/app/game', label: 'Luyện tập & Game', icon: <Gamepad2 size={20} /> }, 
    { to: '/app/tasks', label: 'Bài tập', icon: <CheckSquare size={20} /> },
    { to: '/app/documents', label: 'Tài liệu', icon: <FileText size={20} /> },
    { to: '/app/attendance', label: 'Chuyên cần', icon: <Calendar size={20} /> },
    { to: '/app/behavior', label: 'Nề nếp', icon: <Star size={20} /> },
    { to: '/app/messages', label: 'Liên hệ GVCN', icon: <MessageCircle size={20} /> },
  ];

  const links = role === 'admin' ? adminLinks : appLinks;

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white">
          <span className="text-xl font-bold">QL Lớp Học</span>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-5 px-4 space-y-1 h-[calc(100vh-140px)] overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                ${location.pathname === link.to 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {/* Settings Link for Admin ONLY */}
          {role === 'admin' && currentUser?.role === 'ADMIN' && (
             <div className="pt-2 mt-2 border-t border-gray-100">
               <Link
                to="/admin/settings"
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                  ${location.pathname === '/admin/settings' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Settings size={20} className="mr-3" />
                Cấu hình API
              </Link>
             </div>
          )}
          
          <div className="pt-2 mt-2 border-t border-gray-200">
            <Link
              to="/"
              className="flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
            >
              <LogOut size={20} className="mr-3" />
              Thoát
            </Link>
          </div>
        </nav>

        {/* Sync Status Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50">
           <div className="flex items-center justify-between mb-1">
             <span className="text-xs font-semibold text-gray-500">Trạng thái dữ liệu</span>
             <button 
               onClick={handleSync}
               disabled={syncStatus === 'SYNCING'}
               className={`p-1 rounded-full hover:bg-gray-200 ${syncStatus === 'SYNCING' ? 'animate-spin text-blue-600' : 'text-gray-600'}`}
               title="Đồng bộ ngay"
             >
               <RefreshCw size={14} />
             </button>
           </div>
           <div className="flex items-center gap-2">
             {syncStatus === 'SYNCING' && <span className="text-xs text-blue-600">Đang đồng bộ...</span>}
             {syncStatus === 'ERROR' && <span className="text-xs text-red-600 flex items-center"><WifiOff size={12} className="mr-1"/> Lỗi kết nối</span>}
             {syncStatus === 'IDLE' && <span className="text-xs text-green-600 flex items-center"><Check size={12} className="mr-1"/> Đã cập nhật</span>}
             {syncStatus === 'NOT_CONFIGURED' && <span className="text-xs text-orange-600 flex items-center"><WifiOff size={12} className="mr-1"/> Chưa cấu hình</span>}
           </div>
           {lastSync && syncStatus !== 'SYNCING' && (
             <p className="text-[10px] text-gray-400 mt-1">
               {lastSync.toLocaleTimeString()} {lastSync.toLocaleDateString()}
             </p>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white shadow-sm lg:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-semibold text-gray-800">
            {role === 'admin' ? 'Giáo Viên' : 'Phụ Huynh'}
          </span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
