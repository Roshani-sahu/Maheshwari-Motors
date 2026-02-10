import React, { useState } from "react";
import { FaLayerGroup, FaCircleExclamation, FaEye, FaEyeSlash } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import useStore from '../store';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, showToast, setLoading } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    companyId: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.companyId) newErrors.companyId = 'Company ID is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      // Backend returns { statusCode, success, message, data: { token, ...user } }
      const { data } = response.data;
      const { token, ...userData } = data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      showToast('Login successful', 'success');
      navigate('/company-selection');
    } catch (error) {
      showToast(error.response?.data?.message || 'Login failed', 'error');
      setErrors({ general: 'Invalid credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="w-full bg-neutral-50 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
          
          {/* Header */}
          <div className="p-6 border-b border-neutral-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                <FaLayerGroup className="text-2xl text-neutral-600" />
              </div>
              <h1 className="text-2xl text-neutral-900">
                ERP System Login
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Enter your credentials to access the system.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Company ID */}
              <div>
                <label className="block text-sm text-neutral-700">
                  Company ID
                </label>
                <input
                  name="companyId"
                  type="text"
                  required
                  placeholder="e.g., MOTORS-GST"
                  value={formData.companyId}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 ${
                    errors.companyId ? 'border-red-300' : 'border-neutral-300'
                  }`}
                />
                {errors.companyId && <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>}
              </div>

              {/* User Email */}
              <div>
                <label className="block text-sm text-neutral-700">
                  User Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 ${
                    errors.email ? 'border-red-300' : 'border-neutral-300'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 pr-10 bg-white border rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 ${
                      errors.password ? 'border-red-300' : 'border-neutral-300'
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <FaEye className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Validation Message */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 flex items-start gap-3">
                  <FaCircleExclamation className="text-red-600 mt-0.5" />
                  <div>
                    <p>Invalid Credentials</p>
                    <p className="text-red-600">
                      {errors.general}
                    </p>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-neutral-800 border-neutral-300 rounded focus:ring-neutral-900"
                  />
                  <label className="ml-2 block text-sm text-neutral-700">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
              >
                Log In
              </button>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
            <p className="text-xs text-center text-neutral-500">
              © 2025 ERP Solutions Inc. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Login;
