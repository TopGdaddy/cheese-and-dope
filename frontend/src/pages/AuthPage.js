import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Truck, AlertCircle } from 'lucide-react';

function formatError(detail) {
  if (!detail) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', role: 'regular', orgName: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/');
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(regForm.name, regForm.email, regForm.password, regForm.role, regForm.orgName);
      navigate('/');
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="auth-page">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1766785368863-f2188a8c8b32?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxsb2dpc3RpY3MlMjB0cmFuc3BvcnQlMjB0cnVjayUyMGhpZ2h3YXl8ZW58MHx8fHwxNzc1MDU5OTIzfDA&ixlib=rb-4.1.0&q=85"
          alt="Logistics"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'IBM Plex Sans' }}>UrbanLogicx</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
            Smart Urban Logistics<br />& Live Tracking
          </h1>
          <p className="text-white/70 text-base max-w-md">
            Real-time fleet monitoring, intelligent delivery slot management,
            and community-driven road safety reporting.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F3F4F6]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Truck className="w-6 h-6 text-[#002FA7]" />
            <span className="text-xl font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>UrbanLogicx</span>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="auth-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="login-email-input"
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="login-submit-btn"
                  className="w-full bg-[#002FA7] hover:bg-[#002FA7]/90"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    data-testid="register-name-input"
                    value={regForm.name}
                    onChange={e => setRegForm({...regForm, name: e.target.value})}
                    placeholder="Veer Choudhary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    data-testid="register-email-input"
                    type="email"
                    value={regForm.email}
                    onChange={e => setRegForm({...regForm, email: e.target.value})}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    data-testid="register-password-input"
                    type="password"
                    value={regForm.password}
                    onChange={e => setRegForm({...regForm, password: e.target.value})}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={regForm.role} onValueChange={v => setRegForm({...regForm, role: v})}>
                    <SelectTrigger data-testid="register-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular User (Public Viewer)</SelectItem>
                      <SelectItem value="driver">Driver (GPS Tracking)</SelectItem>
                      <SelectItem value="organization">Organization (Fleet Manager)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {regForm.role === 'organization' && (
                  <div>
                    <Label htmlFor="reg-org">Organization Name</Label>
                    <Input
                      id="reg-org"
                      data-testid="register-org-input"
                      value={regForm.orgName}
                      onChange={e => setRegForm({...regForm, orgName: e.target.value})}
                      placeholder="Your Logistics Company"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  data-testid="register-submit-btn"
                  className="w-full bg-[#002FA7] hover:bg-[#002FA7]/90"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
