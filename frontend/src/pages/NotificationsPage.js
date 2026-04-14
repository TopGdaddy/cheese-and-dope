import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  AlertTriangle, 
  Navigation, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  CheckCheck,
  Bell,
  Info,
  Truck,
  MapPin
} from 'lucide-react';

// Icon mapping based on notification title/content
const getIconForNotification = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('slot') || lower.includes('delivery')) return Truck;
  if (lower.includes('route') || lower.includes('congestion')) return Navigation;
  if (lower.includes('alert') || lower.includes('warning')) return AlertTriangle;
  if (lower.includes('report') || lower.includes('maintenance')) return Clock;
  if (lower.includes('system') || lower.includes('update')) return ShieldAlert;
  if (lower.includes('location') || lower.includes('zone')) return MapPin;
  return Info;
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
  const userId = user?.id;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notifId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/notifications/read/${notifId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setNotifications(prev => prev.map(n => 
        n._id === notifId ? { ...n, read_by: [...(n.read_by || []), userId] } : n
      ));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter(n => !(n.read_by || []).includes(userId));
    await Promise.all(unreadNotifications.map(n => handleMarkRead(n._id)));
  };

  // Check if notification is read by current user
  const isNotificationRead = (notification) => {
    return (notification.read_by || []).includes(userId);
  };

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.target_role === activeFilter || (activeFilter === 'all' && true));

  const unreadCount = notifications.filter(n => !isNotificationRead(n)).length;

  const getCountForFilter = (filterKey) => {
    if (filterKey === 'all') return notifications.length;
    return notifications.filter(n => n.target_role === filterKey).length;
  };

  const heading = roleHeadings[role] || roleHeadings.regular;

  // Simple filter tabs based on target_role
  const filterTabs = [
    { key: 'all', label: 'All', count: getCountForFilter('all') },
    { key: 'driver', label: 'Driver', count: getCountForFilter('driver') },
    { key: 'organization', label: 'Organization', count: getCountForFilter('organization') },
    { key: 'admin', label: 'Admin', count: getCountForFilter('admin') },
  ];

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-slate-950" data-testid="notifications-page">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">{heading.title}</h1>
        </div>
        <p className="text-slate-400">Loading notifications...</p>
      </div>
    );
  }

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
          onClick={handleMarkAllRead}
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
            <p className="text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          filteredNotifications
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(notification => {
              const isRead = isNotificationRead(notification);
              const Icon = getIconForNotification(notification.title);
              
              return (
                <div
                  key={notification._id}
                  className={`flex gap-4 p-4 rounded-lg border transition-all ${
                    isRead
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-slate-900/80 border-l-4 border-emerald-500/30 border-t-slate-800 border-r-slate-800 border-b-slate-800'
                  }`}
                  data-testid={`notification-${notification._id}`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${isRead ? 'text-slate-400' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-500 shrink-0">
                        {formatRelativeTime(new Date(notification.created_at))}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Target role badge */}
                    <Badge 
                      className="mt-2 text-[10px] bg-slate-700/50 text-slate-400 border-slate-600"
                    >
                      {notification.target_role?.toUpperCase() || 'ALL'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  {!isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification._id)}
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
