import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Calendar, AlertTriangle, LayoutDashboard, Truck, Navigation, LogOut, PanelLeftClose, PanelLeft, Bell, BarChart3, Route } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getNavigationForRole, getDefaultPath } from '../config/navigationConfig';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get unread notification count from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('notifications_read_state');
    if (savedState) {
      const readState = JSON.parse(savedState);
      // Count total notifications minus read ones
      const totalNotifications = 20; // Total mock notifications
      const readCount = Object.values(readState).filter(Boolean).length;
      setUnreadCount(totalNotifications - readCount);
    } else {
      // If no saved state, all 20 mock notifications are unread
      setUnreadCount(20);
    }

    // Listen for storage changes (when notifications are marked as read)
    const handleStorageChange = () => {
      const updatedState = localStorage.getItem('notifications_read_state');
      if (updatedState) {
        const readState = JSON.parse(updatedState);
        const readCount = Object.values(readState).filter(Boolean).length;
        setUnreadCount(20 - readCount);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname]); // Refresh when navigating

  const role = user?.role || 'regular';
  const navSections = getNavigationForRole(role);
  // Flatten sections for simple rendering (keeping existing structure)
  const items = navSections.flatMap(section => section.items);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      data-testid="sidebar"
      className={`bg-[#0A0A0A] text-white flex flex-col h-screen sticky top-0 transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      <div className="p-3 border-b border-white/10 flex items-center justify-between min-h-[52px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#002FA7]" />
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
              UrbanLogix
            </span>
          </div>
        )}
        <button
          data-testid="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/50 hover:text-white p-1"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 py-2">
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/30">Navigation</span>
        </div>
      )}

      <nav className="flex-1 py-1" data-testid="sidebar-nav">
        {items.map(item => {
          const active = location.pathname === item.path;
          const isNotifications = item.path === '/notifications';
          return (
            <button
              key={item.path}
              data-testid={`nav-${item.path.replace('/', '')}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-[#002FA7] text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              {!collapsed && isNotifications && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        {!collapsed && (
          <div className="mb-2 px-1">
            <p className="text-xs text-white/70 truncate">{user?.name}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{user?.role}</p>
          </div>
        )}
        <button
          data-testid="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
