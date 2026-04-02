import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Calendar, 
  Route, 
  Bell, 
  MapPin, 
  BarChart3, 
  LayoutDashboard,
  Truck,
  ArrowRight,
  ChevronDown,
  Heart,
  Leaf,
  Users,
  Building2,
  Handshake
} from 'lucide-react';

// SDG Data
const sdgData = [
  { number: 3, name: 'Good Health', description: 'Cleaner air quality in urban logistics corridors', icon: Heart, color: '#4C9F38' },
  { number: 9, name: 'Innovation', description: 'Affordable web-based logistics coordination platform', icon: Building2, color: '#F36D25' },
  { number: 11, name: 'Sustainable Cities', description: 'Reduced clustering and optimized delivery schedules', icon: Users, color: '#F99D26' },
  { number: 12, name: 'Responsible Consumption', description: 'Fuel efficiency through smart route planning', icon: Leaf, color: '#BF8B2E' },
  { number: 13, name: 'Climate Action', description: 'Lower CO₂ and NOx emissions from optimized logistics', icon: Leaf, color: '#48773E' },
  { number: 17, name: 'Partnerships', description: 'Multi-stakeholder collaboration platform', icon: Handshake, color: '#183668' },
];

// Feature cards data
const features = [
  {
    icon: Calendar,
    title: 'Real-Time Slot Booking',
    description: 'Book delivery time windows dynamically based on congestion forecasts and vehicle availability.'
  },
  {
    icon: Route,
    title: 'Dynamic Route Optimization',
    description: 'AI-powered route suggestions that avoid high-congestion zones and minimize fuel consumption.'
  },
  {
    icon: Bell,
    title: 'Congestion Alert Notifications',
    description: 'Real-time alerts when vehicle density exceeds thresholds in commercial zones.'
  },
  {
    icon: MapPin,
    title: 'Live Fleet Tracking',
    description: 'GPS-based real-time tracking of all fleet vehicles with interactive map visualization.'
  },
  {
    icon: BarChart3,
    title: 'Sustainability Analytics',
    description: 'Track carbon savings, fuel efficiency, and compliance metrics with detailed dashboards.'
  },
  {
    icon: LayoutDashboard,
    title: 'Centralized Admin Dashboard',
    description: 'Unified management interface for operators, fleet managers, and municipal authorities.'
  }
];

// Stats data
const stats = [
  { value: '30%', label: 'Congestion Reduction', subtext: 'Average peak-hour improvement' },
  { value: '2.4', label: 'Tons CO₂ Saved', subtext: 'Monthly emissions reduction' },
  { value: '500+', label: 'Slots Managed', subtext: 'Daily delivery windows' },
  { value: '98%', label: 'Compliance Rate', subtext: 'On-time delivery adherence' }
];

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-[#002FA7]" />
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
                UrbanLogix
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('sdg')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                SDGs
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Login
              </button>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-[#002FA7] hover:bg-[#002FA7]/90 text-white text-sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-6 bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800">
            Smart Urban Logistics Platform
          </Badge>
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: 'IBM Plex Sans' }}
          >
            Smart Urban Logistics Coordination<br />
            <span className="text-[#002FA7]">& Traffic-Sensitive Scheduling</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-8">
            Reduce congestion. Cut emissions. Optimize delivery schedules — all through a unified web platform aligned with UN Sustainable Development Goals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-[#002FA7] hover:bg-[#002FA7]/90 text-white px-8"
            >
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              View Dashboard Demo
            </Button>
          </div>
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => scrollToSection('stats')}
              className="text-slate-500 hover:text-slate-300 transition-colors animate-bounce"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-[#002FA7]" style={{ fontFamily: 'IBM Plex Sans' }}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-slate-300 mt-1">{stat.label}</p>
                <p className="text-xs text-slate-500">{stat.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-800 text-slate-300 border-slate-700">Platform Capabilities</Badge>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
              Comprehensive Logistics Management
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to coordinate urban deliveries, track fleets, and reduce environmental impact.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-[#002FA7]/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#002FA7]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#002FA7]" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-800 text-slate-300 border-slate-700">Simple Process</Badge>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>
              How It Works
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {[
              { step: '01', title: 'Register & Setup Fleet', desc: 'Create your account and add vehicles with registration details' },
              { step: '02', title: 'Book Delivery Windows', desc: 'Reserve optimal time slots based on congestion forecasts' },
              { step: '03', title: 'Get Optimized Routes', desc: 'Receive AI-powered routes with real-time alerts and tracking' }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div className="w-16 h-16 bg-[#002FA7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDG Section */}
      <section id="sdg" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-900/30 text-emerald-400 border-emerald-800">Global Impact</Badge>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
              Aligned with UN Sustainable Development Goals
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our platform contributes directly to 6 UN SDGs through reduced emissions, better health outcomes, and sustainable urban development.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sdgData.map((sdg) => (
              <div 
                key={sdg.number}
                className="flex items-start gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${sdg.color}20` }}
                >
                  <span className="text-lg font-bold" style={{ color: sdg.color }}>
                    {sdg.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{sdg.name}</h3>
                  <p className="text-xs text-slate-400">{sdg.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 sm:p-12 bg-gradient-to-br from-[#002FA7]/20 to-slate-900 border border-[#002FA7]/30 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
              Ready to Optimize Your Logistics?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join operators across Mumbai reducing congestion and emissions through smart scheduling.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-[#002FA7] hover:bg-[#002FA7]/90 text-white px-8"
              >
                Create Free Account
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Login to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#002FA7]" />
              <span className="font-semibold">UrbanLogix</span>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Smart Urban Logistics Platform | Built for SOP — SLRTCE | Veer Choudhary | SE IT
            </p>
            <p className="text-sm text-slate-600">
              © 2025 UrbanLogix
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
