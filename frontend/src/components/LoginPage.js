import React, { useState } from 'react';
import { Shield, Eye, EyeOff, User, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple validation
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Simulate login delay
    setTimeout(() => {
      // Determine user role based on email
      const isAdmin = formData.email.includes('admin');
      const userData = {
        name: isAdmin ? 'Admin User' : 'Demo User',
        email: formData.email,
        role: isAdmin ? 'admin' : 'user',
        isLoggedIn: true
      };
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Navigate to dashboard
      navigate('/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  const quickLogin = (email, password, role) => {
    setFormData({ email, password });
    setIsLoading(true);
    
    setTimeout(() => {
      const userData = {
        name: role === 'admin' ? 'Admin User' : 'Demo User',
        email: email,
        role: role,
        isLoggedIn: true
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-12 w-12 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">GuardianByte</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your insurance dashboard
          </p>
        </div>

        {/* Quick Demo Access */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-2">Quick Demo Access:</p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('user@example.com', 'password123', 'user')}
              className="w-full text-left px-3 py-2 bg-white rounded-md text-sm hover:bg-blue-100 transition-colors border border-blue-300"
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <div className="font-medium">User Login</div>
                  <div className="text-gray-500">Access user dashboard</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => quickLogin('admin@guardianbyte.com', 'admin123', 'admin')}
              className="w-full text-left px-3 py-2 bg-white rounded-md text-sm hover:bg-blue-100 transition-colors border border-blue-300"
            >
              <div className="flex items-center">
                <Crown className="h-4 w-4 mr-2 text-purple-600" />
                <div>
                  <div className="font-medium">Admin Login</div>
                  <div className="text-gray-500">Access admin dashboard</div>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
