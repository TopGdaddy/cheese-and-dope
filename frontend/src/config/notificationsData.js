// MOCK DATA — Replace with API call to GET /api/notifications when backend supports it
// Each notification: { id, type, title, message, timestamp, read, priority, roles[] }
// roles[] defines which user roles should see this notification

export const generateNotifications = () => {
  const now = Date.now();
  
  return [
    // ===== ADMIN NOTIFICATIONS =====
    {
      id: 1,
      type: 'threshold_violation',
      title: 'Congestion Threshold Breach — Crawford Market',
      message: 'Crawford Market zone has exceeded maximum vehicle density. Current count: 23 vehicles. Threshold: 15. Automated rerouting advisory issued to 6 operators.',
      timestamp: new Date(now - 4 * 60000),
      read: false,
      priority: 'critical',
      roles: ['admin'],
    },
    {
      id: 2,
      type: 'system',
      title: 'New Organization Registered',
      message: 'Western Express Logistics has registered as a new organization with 8 drivers. Pending verification review.',
      timestamp: new Date(now - 18 * 60000),
      read: false,
      priority: 'medium',
      roles: ['admin'],
    },
    {
      id: 3,
      type: 'system',
      title: 'Platform Health — Database Load High',
      message: 'MongoDB query latency increased to 450ms (normal: <200ms). Live position updates may experience slight delays. Auto-scaling triggered.',
      timestamp: new Date(now - 35 * 60000),
      read: false,
      priority: 'high',
      roles: ['admin'],
    },
    {
      id: 4,
      type: 'congestion_alert',
      title: 'Peak Hour Alert — Western Express Highway',
      message: 'Vehicle density on Western Express Highway approaching critical threshold. 14/15 slots booked for 4:00-6:00 PM window. Consider opening additional time windows.',
      timestamp: new Date(now - 52 * 60000),
      read: true,
      priority: 'high',
      roles: ['admin'],
    },
    {
      id: 5,
      type: 'system',
      title: 'Daily Report Generated',
      message: 'Platform daily report for Mumbai region: 156 deliveries completed, 94.2% compliance rate, 28.5% congestion reduction vs baseline. Full report available in Analytics.',
      timestamp: new Date(now - 3 * 3600000),
      read: true,
      priority: 'low',
      roles: ['admin'],
    },
    {
      id: 6,
      type: 'threshold_violation',
      title: 'Report Flagged — Suspicious Activity',
      message: 'Ground report #GR-2847 from user "Rajesh K" flagged for review. Report claims road closure at Marine Drive but no official confirmation. 3 downvotes received.',
      timestamp: new Date(now - 5 * 3600000),
      read: true,
      priority: 'medium',
      roles: ['admin'],
    },
    {
      id: 7,
      type: 'system',
      title: 'Slot Utilization Low — Eastern Freeway',
      message: 'Eastern Freeway time windows for tomorrow have only 12% utilization. Consider sending promotional notifications to registered operators.',
      timestamp: new Date(now - 8 * 3600000),
      read: true,
      priority: 'low',
      roles: ['admin'],
    },

    // ===== DRIVER NOTIFICATIONS =====
    {
      id: 101,
      type: 'route_deviation',
      title: 'Route Deviation Detected',
      message: 'You have deviated from the assigned route on Western Express Highway. Current location: Goregaon East. Expected corridor: Andheri-Jogeshwari Link Road. Please return to assigned route or contact dispatch.',
      timestamp: new Date(now - 3 * 60000),
      read: false,
      priority: 'high',
      roles: ['driver'],
    },
    {
      id: 102,
      type: 'slot_reminder',
      title: 'Upcoming Delivery — Andheri East',
      message: 'Your assigned delivery slot at Andheri East Commercial Zone starts in 30 minutes (2:00 PM - 3:30 PM). Route has moderate traffic. Estimated travel time: 22 minutes from current location.',
      timestamp: new Date(now - 8 * 60000),
      read: false,
      priority: 'medium',
      roles: ['driver'],
    },
    {
      id: 103,
      type: 'congestion_alert',
      title: 'Heavy Traffic Ahead — Dadar TT',
      message: 'High congestion detected on your current route near Dadar TT Circle. Estimated delay: 15-20 minutes. Alternative route via Prabhadevi saves 12 minutes. Tap to view alternative.',
      timestamp: new Date(now - 15 * 60000),
      read: false,
      priority: 'high',
      roles: ['driver'],
    },
    {
      id: 104,
      type: 'system',
      title: 'Weather Alert — Heavy Rain Expected',
      message: 'IMD has issued heavy rain warning for Mumbai from 4:00 PM onwards. Roads may be waterlogged in low-lying areas (Sion, Hindmata, Andheri subway). Drive carefully and reduce speed.',
      timestamp: new Date(now - 45 * 60000),
      read: false,
      priority: 'high',
      roles: ['driver', 'organization'],
    },
    {
      id: 105,
      type: 'system',
      title: 'Trip Completed — Performance Update',
      message: 'Your trip from BKC to Crawford Market has been logged. Distance: 14.2 km. Time: 38 min. Fuel efficiency: 6.8 km/L (above average). Rating: ⭐ 4.8. Earnings: ₹340.',
      timestamp: new Date(now - 2 * 3600000),
      read: true,
      priority: 'low',
      roles: ['driver'],
    },
    {
      id: 106,
      type: 'slot_reminder',
      title: 'Tomorrow\'s Schedule Available',
      message: 'You have 3 delivery slots assigned for tomorrow: 8:00-9:30 AM (Powai), 11:00 AM-12:30 PM (BKC), 3:00-4:30 PM (Vashi). Tap to view details and routes.',
      timestamp: new Date(now - 4 * 3600000),
      read: true,
      priority: 'medium',
      roles: ['driver'],
    },
    {
      id: 107,
      type: 'system',
      title: 'Fuel Efficiency Tip',
      message: 'Your fuel efficiency dropped 8% this week compared to last week. Common causes: excessive idling, aggressive acceleration. Maintaining 30-40 km/h in city saves up to 20% fuel.',
      timestamp: new Date(now - 6 * 3600000),
      read: true,
      priority: 'low',
      roles: ['driver'],
    },
    {
      id: 108,
      type: 'congestion_alert',
      title: 'Road Closure — Marine Drive',
      message: 'Marine Drive southbound is closed due to a civic event from 5:00 PM to 10:00 PM today. Use Pedder Road or Dr. Annie Besant Road as alternatives.',
      timestamp: new Date(now - 7 * 3600000),
      read: true,
      priority: 'medium',
      roles: ['driver', 'organization'],
    },

    // ===== ORGANIZATION NOTIFICATIONS =====
    {
      id: 201,
      type: 'system',
      title: 'Booking Confirmed — MG Road Zone',
      message: 'Slot booking confirmed for MG Road Commercial Zone: Tomorrow 9:00-10:30 AM. Assigned vehicle: MH-04-CD-5518. Driver: Amit Patel. 2 credits deducted. Remaining credits: 34.',
      timestamp: new Date(now - 5 * 60000),
      read: false,
      priority: 'medium',
      roles: ['organization'],
    },
    {
      id: 202,
      type: 'congestion_alert',
      title: 'Slot Availability Alert — BKC',
      message: 'High-demand alert: BKC Business District 10:00-11:30 AM slot for tomorrow has only 3 remaining slots (12/15 booked). Book now to secure your delivery window.',
      timestamp: new Date(now - 22 * 60000),
      read: false,
      priority: 'high',
      roles: ['organization'],
    },
    {
      id: 203,
      type: 'system',
      title: 'Driver Status Update — Rahul Sharma',
      message: 'Driver Rahul Sharma (MH-04-AB-7291) has completed trip and is now available for next assignment. Today\'s stats: 4 deliveries, 98% on-time, ₹1,420 earned.',
      timestamp: new Date(now - 40 * 60000),
      read: false,
      priority: 'low',
      roles: ['organization'],
    },
    {
      id: 204,
      type: 'threshold_violation',
      title: 'Credit Balance Warning',
      message: 'Your organization\'s booking credits are running low. Remaining: 8 credits. Each booking costs 1-3 credits based on demand. Top up your credits to continue booking delivery slots.',
      timestamp: new Date(now - 1.5 * 3600000),
      read: false,
      priority: 'critical',
      roles: ['organization'],
    },
    {
      id: 205,
      type: 'system',
      title: 'Weekly Fleet Performance Summary',
      message: 'This week: 28 deliveries completed, 93.5% compliance rate, ₹12,400 cost saved vs unscheduled delivery. Fuel saved: 45.2L. Top driver: Suresh Kumar (98% compliance).',
      timestamp: new Date(now - 3 * 3600000),
      read: true,
      priority: 'low',
      roles: ['organization'],
    },
    {
      id: 206,
      type: 'system',
      title: 'New Off-Peak Window — Borivali',
      message: 'A new discounted off-peak delivery window (5:30-7:00 AM) has been opened for Borivali East corridor. Costs only 1 credit instead of usual 2. Book now for priority access.',
      timestamp: new Date(now - 5 * 3600000),
      read: true,
      priority: 'medium',
      roles: ['organization'],
    },

    // ===== REGULAR USER NOTIFICATIONS =====
    {
      id: 301,
      type: 'congestion_alert',
      title: 'Traffic Advisory — Your Area',
      message: 'Moderate to heavy traffic expected in Andheri-Goregaon belt from 5:00-8:00 PM due to commercial vehicle delivery window. Consider alternate routes for personal travel.',
      timestamp: new Date(now - 10 * 60000),
      read: false,
      priority: 'medium',
      roles: ['regular'],
    },
    {
      id: 302,
      type: 'system',
      title: 'Your Report Updated — Pothole on SV Road',
      message: 'Your ground report #GR-1923 (Pothole on SV Road near Andheri station) has been reviewed and marked as "Under Review" by municipal authorities. 12 upvotes received.',
      timestamp: new Date(now - 30 * 60000),
      read: false,
      priority: 'low',
      roles: ['regular'],
    },
    {
      id: 303,
      type: 'system',
      title: 'Weather Alert — Heavy Rain',
      message: 'IMD has issued heavy rain warning for Mumbai from 4:00 PM onwards. Low-lying areas may experience waterlogging. Avoid Sion, Hindmata, and Andheri subway areas.',
      timestamp: new Date(now - 1 * 3600000),
      read: false,
      priority: 'high',
      roles: ['regular', 'driver'],
    },
    {
      id: 304,
      type: 'system',
      title: 'Community Milestone',
      message: 'Mumbai\'s UrbanLogix community has saved 2.4 tons of CO₂ emissions this month through coordinated delivery scheduling. Thank you for contributing by reporting road conditions!',
      timestamp: new Date(now - 4 * 3600000),
      read: true,
      priority: 'low',
      roles: ['regular'],
    },
    {
      id: 305,
      type: 'congestion_alert',
      title: 'Reduced Congestion in Your Area',
      message: 'Good news! Peak-hour congestion in the Powai-Vikhroli corridor has reduced by 18% this week thanks to staggered delivery scheduling. Air quality index improved by 7 points.',
      timestamp: new Date(now - 6 * 3600000),
      read: true,
      priority: 'low',
      roles: ['regular'],
    },

    // ===== SHARED NOTIFICATIONS (all roles see these) =====
    {
      id: 401,
      type: 'system',
      title: 'Platform Update — v2.1 Released',
      message: 'New features: improved route optimization algorithm, real-time congestion heatmap overlay, organization credit system, and enhanced driver analytics dashboard.',
      timestamp: new Date(now - 24 * 3600000),
      read: true,
      priority: 'low',
      roles: ['admin', 'driver', 'organization', 'regular'],
    },
    {
      id: 402,
      type: 'system',
      title: 'Scheduled Maintenance — April 5',
      message: 'UrbanLogix will undergo scheduled maintenance on April 5, 2:00-4:00 AM IST. Live tracking and slot booking will be temporarily unavailable. All scheduled deliveries will not be affected.',
      timestamp: new Date(now - 48 * 3600000),
      read: true,
      priority: 'medium',
      roles: ['admin', 'driver', 'organization', 'regular'],
    },
  ];
};

// Helper: filter notifications for a specific role
export const getNotificationsForRole = (role) => {
  return generateNotifications()
    .filter(n => n.roles.includes(role))
    .sort((a, b) => b.timestamp - a.timestamp);
};

// Helper: get notification type config
export const NOTIFICATION_TYPE_CONFIG = {
  congestion_alert: {
    label: 'Congestion',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconName: 'AlertTriangle',
  },
  route_deviation: {
    label: 'Route',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    iconName: 'Navigation',
  },
  slot_reminder: {
    label: 'Slots',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconName: 'Clock',
  },
  threshold_violation: {
    label: 'Violation',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconName: 'ShieldAlert',
  },
  system: {
    label: 'System',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    iconName: 'CheckCircle',
  },
};

// Helper: get filter tabs for a specific role
export const getFilterTabsForRole = (role) => {
  const allNotifications = getNotificationsForRole(role);
  const types = [...new Set(allNotifications.map(n => n.type))];
  
  const tabs = [{ key: 'all', label: 'All', count: allNotifications.length }];
  
  types.forEach(type => {
    const config = NOTIFICATION_TYPE_CONFIG[type];
    if (config) {
      const count = allNotifications.filter(n => n.type === type).length;
      tabs.push({ key: type, label: config.label, count });
    }
  });
  
  return tabs;
};
