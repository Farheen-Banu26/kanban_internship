import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import api from '../services/api';
import { auth, googleProvider, githubProvider } from '../firebase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const persistSession = (token, userData, firebaseData = null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (firebaseData) {
      localStorage.setItem('firebaseUser', JSON.stringify(firebaseData));
    } else {
      localStorage.removeItem('firebaseUser');
    }
    setUser(userData);
    return userData;
  };

  const login = async (email, password) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('firebaseUser');
    setUser(null);

    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;
    return persistSession(token, userData);
  };

  const register = async (name, email, password) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('firebaseUser');
    setUser(null);

    const response = await api.post('/auth/register', { name, email, password });
    const { token, user: userData } = response.data.data;
    return persistSession(token, userData);
  };

  const loginWithProvider = async (providerName, provider) => {
    if (!auth || !provider) {
      throw new Error('Firebase authentication is not configured. Please set the Firebase environment variables.');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('firebaseUser');
    setUser(null);

    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const firebaseToken = await firebaseUser.getIdToken();
    const email = firebaseUser.email?.trim().toLowerCase();
    const displayName = firebaseUser.displayName?.trim() || email?.split('@')[0] || 'User';
    const backendPassword = `firebase-${firebaseUser.uid}`;
    const socialProfile = {
      uid: firebaseUser.uid,
      name: displayName,
      email,
      photoURL: firebaseUser.photoURL,
      provider: providerName,
    };

    try {
      const response = await api.post('/auth/login', { email, password: backendPassword });
      const { token, user: userData } = response.data.data;
      localStorage.setItem('firebaseToken', firebaseToken);
      return persistSession(token, userData, { ...socialProfile, firebaseToken });
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        const response = await api.post('/auth/register', {
          name: displayName,
          email,
          password: backendPassword,
        });
        const { token, user: userData } = response.data.data;
        localStorage.setItem('firebaseToken', firebaseToken);
        return persistSession(token, userData, { ...socialProfile, firebaseToken });
      }
      throw error;
    }
  };

  const loginWithGoogle = () => loginWithProvider('google', googleProvider);
  const loginWithGithub = () => loginWithProvider('github', githubProvider);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('firebaseUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithGithub,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
