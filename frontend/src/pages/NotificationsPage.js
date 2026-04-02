import { useState, useEffect } from 'react';
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

// Type to icon and color mapping
const notificationConfig = {
  congestion_alert: { icon: AlertTriangle, color: 'red-500', bgColor: 'red-500/10', borderColor: 'red-500' },
  route_deviation: { icon: Navigation, color: 'orange-500', bgColor: 'orange-500/10', borderColor: 'orange-500' },
  slot_reminder: { icon: Clock, color: 'blue-500', bgColor: 'blue-500/10', borderColor: 'blue-500' },
  threshold_violation: { icon: ShieldAlert, color: 'red-600', bgColor: 'red-600/10', borderColor: 'red-600' },
  system: { icon: CheckCircle, color: 'green-500', bgColor: 'green-500/10', borderColor: 'green-500' }
};

// MOCK DATA — Replace with API call to GET /api/notifications when backend supports it
const generateMockNotifications = () => [
  {
    id: 1,
    type: 'congestion_alert',
    title: 'High Congestion — Crawford Market Zone',
    message: 'Vehicle density has reached 23 units in Crawford Market commercial zone. Peak threshold exceeded. Consider rescheduling deliveries to 6:00-8:00 AM window.',
    timestamp: new Date(Date.now() - 3 * 60000),
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    type: 'route_deviation',
    title: 'Route Deviation Detected — MH-04-AB-7291',
    message: 'Vehicle MH-04-AB-7291 has deviated from assigned route on Western Express Highway. Current location: Goregaon. Expected: Andheri East corridor.',
    timestamp: new Date(Date.now() - 12 * 60000),
    read: false,
    priority: 'medium'
  },
  {
    id: 3,
    type: 'slot_reminder',
    title: 'Upcoming Delivery Slot — Andheri East',
    message: 'Your booked delivery slot at Andheri East Commercial Zone starts in 30 minutes (2:00 PM - 3:30 PM). Please ensure vehicle MH-04-CD-5518 is en route.',
    timestamp: new Date(Date.now() - 28 * 60000),
    read: false,
    priority: 'medium'
  },
  {
    id: 4,
    type: 'threshold_violation',
    title: 'Congestion Threshold Breach — Dadar TT',
    message: 'The Dadar TT zone has exceeded the maximum allowed vehicle density of 15 units. Current count: 19. Automated rerouting advisory issued to 4 operators.',
    timestamp: new Date(Date.now() - 45 * 60000),
    read: true,
    priority: 'critical'
  },
  {
    id: 5,
    type: 'system',
    title: 'New Time Window Available — Borivali Sector',
    message: 'A new off-peak delivery window (5:30 AM - 7:00 AM) has been opened for Borivali East commercial corridor. Book now for priority access.',
    timestamp: new Date(Date.now() - 2 * 3600000),
    read: true,
    priority: 'low'
  },
  {
    id: 6,
    type: 'congestion_alert',
    title: 'High Congestion — Bandra Kurla Complex',
    message: 'BKC commercial zone showing elevated vehicle density of 21 units. Multiple delivery slots overlapping. Suggest staggering arrivals by 30-minute intervals.',
    timestamp: new Date(Date.now() - 5 * 60000),
    read: false,
    priority: 'high'
  },
  {
    id: 7,
    type: 'route_deviation',
    title: 'Route Deviation — MH-02-XY-4451',
    message: 'Vehicle MH-02-XY-4451 has left the designated route on Eastern Express Highway. Current position near Powai. Please verify driver status.',
    timestamp: new Date(Date.now() - 18 * 60000),
    read: false,
    priority: 'medium'
  },
  {
    id: 8,
    type: 'slot_reminder',
    title: 'Delivery Slot Starting — Vashi APMC',
    message: 'Your Vashi APMC delivery slot (10:00 AM - 11:30 AM) is starting in 15 minutes. Vehicle MH-43-LK-8823 should approach from the Sion-Panvel Highway.',
    timestamp: new Date(Date.now() - 15 * 60000),
    read: false,
    priority: 'medium'
  },
  {
    id: 9,
    type: 'threshold_violation',
    title: 'Zone Capacity Alert — Thane Wagle Estate',
    message: 'Thane Wagle Estate industrial zone approaching maximum capacity. Current: 14/15 vehicles. New slot bookings temporarily restricted.',
    timestamp: new Date(Date.now() - 1 * 3600000),
    read: true,
    priority: 'critical'
  },
  {
    id: 10,
    type: 'congestion_alert',
    title: 'Moderate Congestion — Powai Lake Area',
    message: 'Powai commercial corridor experiencing moderate congestion with 9 active vehicles. Expected to clear within 45 minutes. Monitor situation.',
    timestamp: new Date(Date.now() - 8 * 60000),
    read: false,
    priority: 'medium'
  },
  {
    id: 11,
    type: 'system',
    title: 'Platform Update — New Analytics Dashboard',
    message: 'The new Sustainability Analytics dashboard is now available. Track your fleet\'s carbon footprint and congestion reduction metrics in real-time.',
    timestamp: new Date(Date.now() - 4 * 3600000),
    read: true,
    priority: 'low'
  },
  {
    id: 12,
    type: 'route_deviation',
    title: 'Route Deviation — MH-04-GH-2234',
    message: 'Vehicle MH-04-GH-2234 has taken an alternate route via SV Road due to construction on Andheri-Kurla Road. Delay estimate: 12 minutes.',
    timestamp: new Date(Date.now() - 25 * 60000),
    read: true,
    priority: 'low'
  },
  {
    id: 13,
    type: 'congestion_alert',
    title: 'High Congestion — Churchgate Station Area',
    message: 'Churchgate commercial zone reporting 17 vehicles in 0.5km radius. Peak office hours congestion. Recommend afternoon delivery slots.',
    timestamp: new Date(Date.now() - 35 * 60000),
    read: false,
    priority: 'high'
  },
  {
    id: 14,
    type: 'slot_reminder',
    title: 'Slot Expiring — Nariman Point',
    message: 'Your Nariman Point delivery window (3:00 PM - 4:30 PM) ends in 20 minutes. Please complete all deliveries and vacate the zone.',
    timestamp: new Date(Date.now() - 10 * 60000),
    read: false,
    priority: 'high'
  },
  {
    id: 15,
    type: 'system',
    title: 'Weekly Report Available',
    message: 'Your fleet performance report for this week is ready. View analytics on delivery compliance, fuel efficiency, and congestion impact.',
    timestamp: new Date(Date.now() - 6 * 3600000),
    read: true,
    priority: 'low'
  },
  {
    id: 16,
    type: 'threshold_violation',
    title: 'Critical Threshold — Lower Parel',
    message: 'Lower Parel mill district has exceeded critical congestion threshold. 22 vehicles detected in high-density zone. Emergency rerouting active.',
    timestamp: new Date(Date.now() - 20 * 60000),
    read: false,
    priority: 'critical'
  },
  {
    id: 17,
    type: 'congestion_alert',
    title: 'Moderate Congestion — Navi Mumbai APMC',
    message: 'APMC market area showing moderate vehicle density of 11 units. Market hours congestion expected to peak at 11:00 AM.',
    timestamp: new Date(Date.now() - 40 * 60000),
    read: true,
    priority: 'medium'
  },
  {
    id: 18,
    type: 'route_deviation',
    title: 'Route Deviation — MH-43-PP-1192',
    message: 'Vehicle MH-43-PP-1192 has taken Mumbai-Pune Expressway instead of designated Sion-Panvel route. Driver reports heavy local traffic.',
    timestamp: new Date(Date.now() - 55 * 60000),
    read: true,
    priority: 'low'
  },
  {
    id: 19,
    type: 'slot_reminder',
    title: 'Tomorrow Booking Confirmation — Mulund',
    message: 'Your delivery slot at Mulund Check Naka for tomorrow (9:00 AM - 10:30 AM) is confirmed. Vehicle assignment: MH-04-JK-7765.',
    timestamp: new Date(Date.now() - 8 * 3600000),
    read: true,
    priority: 'low'
  },
  {
    id: 20,
    type: 'system',
    title: 'New Feature — Route Optimization',
    message: 'Try the new Route Optimizer tool to get AI-powered delivery route suggestions that minimize congestion and fuel consumption.',
    timestamp: new Date(Date.now() - 12 * 3600000),
    read: true,
    priority: 'low'
  }
];

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

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'congestion_alert', label: 'Congestion' },
  { key: 'route_deviation', label: 'Route' },
  { key: 'slot_reminder', label: 'Slots' },
  { key: 'system', label: 'System' },
  { key: 'threshold_violation', label: 'Violations' }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  // Load notifications from localStorage or use mock data
  useEffect(() => {
    const savedState = localStorage.getItem('notifications_read_state');
    const mockData = generateMockNotifications();
    
    if (savedState) {
      const readState = JSON.parse(savedState);
      const merged = mockData.map(n => ({
        ...n,
        read: readState[n.id] !== undefined ? readState[n.id] : n.read
      }));
      setNotifications(merged);
    } else {
      setNotifications(mockData);
    }
  }, []);

  // Save read state to localStorage
  const saveReadState = (updatedNotifications) => {
    const readState = {};
    updatedNotifications.forEach(n => {
      readState[n.id] = n.read;
    });
    localStorage.setItem('notifications_read_state', JSON.stringify(readState));
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

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="notifications-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-[#002FA7]" />
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs"
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
                ? 'bg-[#002FA7] text-white'
                : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
            }`}
          >
            {tab.label} ({getCountForFilter(tab.key)})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-w-4xl">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#E5E7EB] rounded-lg">
            <Bell className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
            <p className="text-[#6B7280]">No notifications found</p>
          </div>
        ) : (
          filteredNotifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(notification => {
              const config = notificationConfig[notification.type];
              const Icon = config.icon;
              
              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-4 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-white border-[#E5E7EB]'
                      : `bg-slate-50 border-l-4 border-l-${config.borderColor} border-t-[#E5E7EB] border-r-[#E5E7EB] border-b-[#E5E7EB]`
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 text-${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${notification.read ? 'text-[#374151]' : 'text-[#111827]'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-[#9CA3AF] shrink-0">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {/* Priority badge for unread */}
                    {!notification.read && notification.priority !== 'low' && (
                      <Badge 
                        className={`mt-2 text-[10px] ${
                          notification.priority === 'critical' 
                            ? 'bg-red-100 text-red-700' 
                            : notification.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
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
                      className="shrink-0 text-xs text-[#6B7280] hover:text-[#002FA7]"
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
