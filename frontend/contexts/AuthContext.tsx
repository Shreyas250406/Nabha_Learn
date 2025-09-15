import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  name: string;
  email?: string;
  phone_number: string;
  standard?: string;
  division?: string;
  parent_name?: string;
  created_at: Date;
  updated_at: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load
    const storedUser = localStorage.getItem('nabha_learn_user');
    const storedToken = localStorage.getItem('nabha_learn_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('nabha_learn_user');
        localStorage.removeItem('nabha_learn_token');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('nabha_learn_user', JSON.stringify(userData));
    localStorage.setItem('nabha_learn_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nabha_learn_user');
    localStorage.removeItem('nabha_learn_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
