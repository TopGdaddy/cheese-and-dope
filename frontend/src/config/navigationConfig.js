import {
  LayoutDashboard,
  Map,
  Bell,
  BarChart3,
  Route,
  Calendar,
  Users,
  Truck,
  FileText,
  Shield,
  Building2,
  Navigation,
  MapPin,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

// Define which pages each role can see in the sidebar
// Each section has: { section, roles[], items[] }
// Items: { name, path, icon }

export const navigationItems = [
  // ===== ADMIN ONLY =====
  {
    section: 'Administration',
    roles: ['admin'],
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Live Map', path: '/map', icon: Map },
      { name: 'Delivery Slots', path: '/slots', icon: Calendar },
      { name: 'Reports', path: '/reports', icon: AlertTriangle },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Route Optimizer', path: '/route-optimizer', icon: Route },
    ]
  },

  // ===== DRIVER ONLY =====
  {
    section: 'Driver',
    roles: ['driver'],
    items: [
      { name: 'Trip Control', path: '/driver', icon: Navigation },
      { name: 'Live Map', path: '/map', icon: Map },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Route Optimizer', path: '/route-optimizer', icon: Route },
    ]
  },

  // ===== ORGANIZATION ONLY =====
  {
    section: 'Organization',
    roles: ['organization'],
    items: [
      { name: 'Fleet', path: '/organization', icon: Truck },
      { name: 'My Drivers', path: '/org/drivers', icon: UserCheck },
      { name: 'Live Map', path: '/map', icon: Map },
      { name: 'Delivery Slots', path: '/slots', icon: Calendar },
      { name: 'Reports', path: '/reports', icon: AlertTriangle },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Route Optimizer', path: '/route-optimizer', icon: Route },
    ]
  },

  // ===== REGULAR USER ONLY =====
  {
    section: 'Dashboard',
    roles: ['regular'],
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Live Map', path: '/map', icon: Map },
      { name: 'Reports', path: '/reports', icon: AlertTriangle },
    ]
  },
];

// Helper function: get navigation items for a specific role
export const getNavigationForRole = (role) => {
  const defaultRole = 'regular';
  const userRole = role || defaultRole;
  
  return navigationItems
    .filter(section => section.roles.includes(userRole))
    .map(section => ({
      section: section.section,
      items: section.items
    }));
};

// Helper function: get all allowed paths for a role
export const getAllowedPaths = (role) => {
  const basePaths = ['/map', '/reports', '/profile']; // base paths for everyone
  
  const roleSpecificPaths = {
    admin: ['/admin', '/slots', '/notifications', '/analytics', '/route-optimizer'],
    driver: ['/driver', '/driver/trips', '/notifications', '/route-optimizer'],
    organization: ['/organization', '/org', '/org/fleet', '/org/drivers', '/slots', '/notifications', '/analytics', '/route-optimizer'],
    regular: ['/dashboard'],
  };
  
  return [...basePaths, ...(roleSpecificPaths[role] || [])];
};

// Helper function: get the default redirect path after login for each role
export const getDefaultPath = (role) => {
  switch (role) {
    case 'admin': return '/admin';
    case 'driver': return '/driver';
    case 'organization': return '/organization';
    case 'regular': return '/dashboard';
    default: return '/dashboard';
  }
};
