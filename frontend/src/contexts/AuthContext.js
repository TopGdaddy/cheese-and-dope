import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Enable credentials globally for all axios requests
axios.defaults.withCredentials = true;

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API = API_URL ? `${API_URL}/api` : null;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAccessToken = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { 
        method: "POST",
        credentials: "include" // important: sends the refresh_token cookie
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  };

  const checkAuth = useCallback(async () => {
    // If no backend URL configured, treat as unauthenticated
    if (!API) {
      console.warn('REACT_APP_BACKEND_URL not configured');
      setUser(false);
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      // Validate response contains actual user data
      if (data && typeof data === 'object' && data.id) {
        setUser(data);
      } else {
        // Response doesn't contain valid user data
        setUser(false);
      }
    } catch (error) {
      // Handle all error types (network, CORS, 401, 500, etc.)
      console.warn('Auth check failed:', error.message);
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Silent token refresh on 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            // Refresh failed, actually log out
            setUser(null);
            localStorage.removeItem("token");
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    if (!API) throw new Error('Backend URL not configured');
    const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    if (data && typeof data === 'object' && data.id) {
      setUser(data);
    }
    return data;
  };

  const register = async (name, email, password, role, organizationName) => {
    if (!API) throw new Error('Backend URL not configured');
    const { data } = await axios.post(`${API}/auth/register`, {
      name, email, password, role, organization_name: organizationName
    }, { withCredentials: true });
    if (data && typeof data === 'object' && data.id) {
      setUser(data);
    }
    return data;
  };

  const logout = async () => {
    if (API) {
      try {
        await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      } catch (e) {
        // Ignore logout errors
      }
    }
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
