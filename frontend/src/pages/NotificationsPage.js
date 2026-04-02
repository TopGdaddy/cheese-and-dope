import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationsForRole, getFilterTabsForRole, NOTIFICATION_TYPE_CONFIG } from '../config/notificationsData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  AlertTriangle, 
  Navigation, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  CheckCheck,
  Bell
} from 'lucide-react';

// Icon mapping
const iconMap = {
  AlertTriangle,
  Navigation,
  Clock,
  ShieldAlert,
  CheckCircle,
};

// Role-specific headings
const roleHeadings = {
  admin: { title: 'System Notifications', subtitle: 'Platform alerts, threshold violations, and system health' },
  driver: { title: 'My Notifications', subtitle: 'Route alerts, delivery reminders, and trip updates' },
  organization: { title: 'Organization Alerts', subtitle: 'Booking confirmations, fleet updates, and credit alerts' },
  regular: { title: 'Notifications', subtitle: 'Traffic advisories, report updates, and city alerts' },
};

// Relative time formatter
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const role = user?.role || 'regular';
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  // Get role-specific filter tabs
  const filterTabs = getFilterTabsForRole(role);

  // Load notifications from localStorage or use role-filtered data
  useEffect(() => {
    const savedState = localStorage.getItem(`notifications_read_${role}`);
    const roleNotifications = getNotificationsForRole(role);
    
    if (savedState) {
      const readState = JSON.parse(savedState);
      const merged = roleNotifications.map(n => ({
        ...n,
        read: readState[n.id] !== undefined ? readState[n.id] : n.read
      }));
      setNotifications(merged);
    } else {
      setNotifications(roleNotifications);
    }
  }, [role]);

  // Save read state to localStorage (role-specific)
  const saveReadState = (updatedNotifications) => {
    const readState = {};
    updatedNotifications.forEach(n => {
      readState[n.id] = n.read;
    });
    localStorage.setItem(`notifications_read_${role}`, JSON.stringify(readState));
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveReadState(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveReadState(updated);
  };

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getCountForFilter = (filterKey) => {
    if (filterKey === 'all') return notifications.length;
    return notifications.filter(n => n.type === filterKey).length;
  };

  const heading = roleHeadings[role] || roleHeadings.regular;

  return (
    <div className="flex-1 overflow-auto p-6 bg-slate-950" data-testid="notifications-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">{heading.title}</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>
            )}
          </div>
          <p className="text-slate-400 mt-1">{heading.subtitle}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <CheckCheck className="w-4 h-4 mr-1" />
          Mark All Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeFilter === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-w-4xl">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-lg">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No notifications found</p>
          </div>
        ) : (
          filteredNotifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(notification => {
              const config = NOTIFICATION_TYPE_CONFIG[notification.type];
              const Icon = iconMap[config?.iconName] || CheckCircle;
              
              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-4 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-slate-900 border-slate-800'
                      : `bg-slate-900/80 border-l-4 ${config?.borderColor || 'border-emerald-500/30'} border-t-slate-800 border-r-slate-800 border-b-slate-800`
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config?.bgColor || 'bg-emerald-500/10'}`}>
                    <Icon className={`w-5 h-5 ${config?.color || 'text-emerald-400'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-500 shrink-0">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Priority badge for unread */}
                    {!notification.read && notification.priority !== 'low' && (
                      <Badge 
                        className={`mt-2 text-[10px] ${
                          notification.priority === 'critical' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : notification.priority === 'high'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {notification.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="shrink-0 text-xs text-slate-500 hover:text-emerald-400 hover:bg-slate-800"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
