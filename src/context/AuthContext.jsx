import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store the authenticated user
  const [loading, setLoading] = useState(true); // Loading state for authentication processes

  // Check authentication on initial render
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false); // If no token, stop loading
    }
  }, []);

  // Function to verify the user's token and fetch user details
  const verifyToken = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data); // Set the user data from the response
    } catch (error) {
      console.error('Token verification failed:', error);
      logout(); // Clear any invalid token
    } finally {
      setLoading(false); // Authentication check complete
    }
  };

  // Function to log in the user
  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token); // Save token to localStorage
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set default auth header
      setUser(user); // Set user data
      return user;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error; // Allow UI to handle login errors
    }
  };

  // Function to register a new user
  const register = async (userData) => {
    try {
      console.log("userData",userData)
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      console.log(response.data)
      localStorage.setItem('token', token); // Save token to localStorage
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set default auth header
      setUser(user); // Set user data
      return user;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error; // Allow UI to handle registration errors
    }
  };

  // Function to log out the user
  const logout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    delete axios.defaults.headers.common['Authorization']; // Clear auth header
    setUser(null); // Clear user data
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
