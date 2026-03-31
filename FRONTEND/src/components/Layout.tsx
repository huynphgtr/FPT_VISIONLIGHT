import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Camera, Clock, LogOut, Building2,
  BarChart3, Menu, ChevronLeft, Settings
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // sidebarOpen: Điều khiển việc hiển thị sidebar trên Mobile (Drawer)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // sidebarCollapsed: Điều khiển việc thu hẹp sidebar trên Desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!sidebarCollapsed));
  };

  const menuItems = [
    { path: '/dashboard', name: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { path: '/schedules', name: 'Lịch Trình', icon: Clock },
    { path: '/analytics', name: 'Phân Tích & Cấu Hình', icon: BarChart3 },
    { path: '/cameras', name: 'Hệ Thống Camera', icon: Camera },
    { path: '/setting', name: 'Cài Đặt', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[48px] h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Building2 size={24} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg leading-tight tracking-tight">
                  Campus<span className="text-blue-400">Light</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Smart System</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'hover:bg-slate-800 hover:text-white'}
                `}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon size={22} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-slate-800/50 space-y-1">
          {/* Collapse Toggle (Desktop only) */}
          <button
            onClick={handleToggleCollapse}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <ChevronLeft size={20} className={`transition-transform duration-500 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Thu gọn</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 leading-none">
                {menuItems.find((m) => m.path === location.pathname)?.name || 'Hệ Thống'}
              </h1>
              <span className="text-xs text-slate-500 mt-1 hidden sm:block">Chào mừng trở lại, Quản trị viên</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Admin Campus</p>
                <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded uppercase">Master</p>
              </div>
              <div className="w-10 h-10 ring-2 ring-slate-100 bg-gradient-to-tr from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-bold shadow-inner">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;