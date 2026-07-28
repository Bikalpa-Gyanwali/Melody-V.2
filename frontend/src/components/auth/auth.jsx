import React, { useState } from 'react';

const AuthForms = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateUsername = (username) =>
    username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);

  const validatePassword = (password) => password.length >= 6;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Use 3-20 letters, numbers, or underscores';
    }

    if (!isLogin) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }

    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const endpoint = isLogin ? '/login' : '/register';
    const body = JSON.stringify({
      username: formData.username.trim(),
      password: formData.password,
      ...(isLogin ? {} : { email: formData.email.trim() })
    });

    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Something went wrong');
        return;
      }

      if (isLogin && data.token) {
        const userData = {
          username: data.user_name || formData.username.trim(),
          loginTime: new Date().toISOString()
        };

        const storageData = {
          token: data.token,
          user: userData,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };

        localStorage.setItem('melody-auth', JSON.stringify(storageData));
        sessionStorage.setItem('melody-user', JSON.stringify(userData));
        setMessage('Welcome back.');

        if (onLogin) {
          onLogin(userData);
        }
      } else {
        setMessage('Account created successfully. Please log in.');
        setIsLogin(true);
        setFormData({ username: '', password: '', email: '' });
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage('Network error. Please check if the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((current) => !current);
    setFormData({ username: '', password: '', email: '' });
    setErrors({});
    setMessage('');
  };

  return (
    <div className="landing-shell grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_460px] lg:items-center">
      <section className="landing-copy">
        <p className="capsule-chip mb-6">Melody Music</p>
        <h1 className="font-display text-5xl leading-[0.95] text-white md:text-7xl">
          Music that moves with your mood.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
          A cleaner music room for mood-based discovery, better playback, and playlists that stay with you.
        </p>
      </section>

      <section className="landing-panel">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
            {isLogin ? 'Welcome back' : 'Create account'}
          </p>
          <h2 className="mt-3 font-display text-4xl text-white">
            {isLogin ? 'Get in the Music.' : 'Start your listening room.'}
          </h2>
          <p className="mt-3 text-slate-400">
            {isLogin
              ? 'Sign in to open your saved playlists, likes, and music picks.'
              : 'Register once and keep your music space ready across sessions.'}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-2">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isLogin ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:bg-white/6'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              !isLogin ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:bg-white/6'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Username</span>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`auth-input ${errors.username ? 'border-red-400/70' : ''}`}
              placeholder="Enter your username"
            />
            {errors.username && <span className="mt-2 block text-sm text-red-300">{errors.username}</span>}
          </label>

          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email address</span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`auth-input ${errors.email ? 'border-red-400/70' : ''}`}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="mt-2 block text-sm text-red-300">{errors.email}</span>}
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`auth-input ${errors.password ? 'border-red-400/70' : ''}`}
              placeholder="Enter your password"
            />
            {errors.password && <span className="mt-2 block text-sm text-red-300">{errors.password}</span>}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#f7d06b_0%,#7ce3d7_100%)] px-6 py-4 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (isLogin ? 'Logging in...' : 'Creating account...') : isLogin ? 'Get in the Music' : 'Create Account'}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        )}

        <div className="mt-8 text-sm text-slate-400">
          {isLogin ? "Need an account?" : 'Already registered?'}{' '}
          <button type="button" onClick={toggleMode} className="font-medium text-cyan-300 transition hover:text-cyan-200">
            {isLogin ? 'Sign up here' : 'Log in here'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default AuthForms;
