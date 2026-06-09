import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('sociosync_token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('sociosync_token');
          localStorage.removeItem('sociosync_user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success) {
      localStorage.setItem('sociosync_token', data.token);
      localStorage.setItem('sociosync_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      navigate('/dashboard');
    }
    return data;
  };

  const register = async (firstName, lastName, email, password, confirmPassword) => {
    const data = await authService.register(firstName, lastName, email, password, confirmPassword);
    if (data.success) {
      localStorage.setItem('sociosync_token', data.token);
      localStorage.setItem('sociosync_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      navigate('/dashboard');
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout API failed, continuing client logout');
    } finally {
      localStorage.removeItem('sociosync_token');
      localStorage.removeItem('sociosync_user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  useEffect(() => {
    // Sync user state changes to localStorage
    if (user && isAuthenticated) {
      localStorage.setItem('sociosync_user', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
