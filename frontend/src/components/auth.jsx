import React, { useState } from 'react';

const AuthForms
 = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
    }

    // Email validation (only for signup)
    if (!isLogin) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Clear general message when user starts typing
    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const endpoint = isLogin ? '/login' : '/register';
    const body = JSON.stringify({
      username: formData.username,
      password: formData.password,
      ...(isLogin ? {} : { email: formData.email })
    });
    
    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Success!');
        if (isLogin && data.token) {
          setToken(data.token);
          // Session and storage management
          const userData = {
            username: data.user_name || formData.username,
            loginTime: new Date().toISOString()
          };
          
          // Store in both localStorage and sessionStorage for different purposes
          // localStorage for persistent login state
          const storageData = {
            token: data.token,
            user: userData,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          };
          
          localStorage.setItem('melody-auth', JSON.stringify(storageData));
          sessionStorage.setItem('melody-user', JSON.stringify(userData));
          
          // Auto-reload after successful login
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else if (!isLogin) {
          // After successful signup, switch to login mode
          setTimeout(() => {
            setIsLogin(true);
            setFormData({ username: '', password: '', email: '' });
            setMessage('Account created successfully! Please log in.');
          }, 1500);
        }
      } else {
        setMessage(data.message || 'Error occurred');
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage('Network error. Please check if the server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // const testProtectedRoute = async () => {
  //   const authData = localStorage.getItem('melody-auth');
  //   let tokenToUse = token;
    
  //   if (authData) {
  //     const parsed = JSON.parse(authData);
  //     // Check if token is expired
  //     if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
  //       localStorage.removeItem('melody-auth');
  //       sessionStorage.removeItem('melody-user');
  //       setMessage('Session expired. Please log in again.');
  //       return;
  //     }
  //     tokenToUse = parsed.token;
  //   }
    
  //   if (!tokenToUse) {
  //     setMessage('No authentication token found. Please log in first.');
  //     return;
  //   }

  //   try {
  //     const response = await fetch('http://127.0.0.1:5000/protected', {
  //       headers: {
  //         'Authorization': `Bearer ${tokenToUse}`,
  //       },
  //     });
      
  //     const data = await response.json();
  //     if (response.ok) {
  //       setMessage(data.message || 'Protected route accessed successfully!');
  //     } else {
  //       setMessage(data.message || 'Failed to access protected route');
  //     }
  //   } catch (error) {
  //     console.error('Error accessing protected route:', error);
  //     setMessage('Failed to access protected route');
  //   }
  // };

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('melody-auth');
    sessionStorage.removeItem('melody-user');
    setToken('');
    setMessage('Logged out successfully');
    setFormData({ username: '', password: '', email: '' });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', password: '', email: '' });
    setErrors({});
    setMessage('');
  };

  // Check if user is logged in
  const isLoggedIn = () => {
    const authData = localStorage.getItem('melody-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.expiresAt && Date.now() < parsed.expiresAt;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <style jsx>{`
        @keyframes slideInLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 1s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 1s ease-out 0.3s forwards;
          opacity: 0;
        }
      `}</style>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 overflow-hidden">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text animate-glow mb-2 animate-slide-in-left">
            Melody Music
          </h1>
          <p className="text-slate-400 text-lg animate-slide-in-right">
            Your Personal Music Recommendation System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Tab Navigation */}
          <div className="flex mb-8 bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                isLogin 
                  ? 'bg-cyan-500 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                !isLogin 
                  ? 'bg-cyan-500 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-slate-300 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-600 focus:ring-cyan-500'
                }`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field (only for signup) */}
            {!isLogin && (
              <div>
                <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-600 focus:ring-cyan-500'
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-600 focus:ring-cyan-500'
                }`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transform transition-all duration-200 shadow-lg ${
                isSubmitting
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 hover:scale-105 hover:shadow-cyan-500/25'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Logging in...' : 'Signing up...'}
                </div>
              ) : (
                isLogin ? 'Login' : 'Sign Up'
              )}
            </button>
          </div>

          {/* Additional Action Buttons */}
          <div className="mt-4 space-y-2">
            {/* <button
              onClick={testProtectedRoute}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm"
            >
              Test Protected Route
            </button> */}
            
            {isLoggedIn() && (
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm"
              >
                Logout
              </button>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg border ${
              message.includes('Success') || message.includes('successful') 
                ? 'bg-green-900/50 border-green-500 text-green-300' 
                : message.includes('Error') || message.includes('error') || message.includes('Failed')
                ? 'bg-red-900/50 border-red-500 text-red-300'
                : 'bg-blue-900/50 border-blue-500 text-blue-300'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Toggle Link */}
          <div className="text-center mt-6">
            <p className="text-slate-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="text-cyan-400 hover:text-cyan-300 ml-1 font-medium transition-colors duration-200"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>

        {/* Session Info */}
        {isLoggedIn() && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm text-center">
              ✓ Session active - You are logged in
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForms
;