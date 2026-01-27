import React from "react";
import { FaLayerGroup, FaCircleExclamation } from "react-icons/fa6";
import { Link } from "react-router-dom";

const Login = () => {
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
            <form className="space-y-5">
              
              {/* Company ID */}
              <div>
                <label className="block text-sm text-neutral-700">
                  Company ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., MOTORS-GST"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm text-neutral-700">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="john.doe"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-neutral-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              {/* Validation Message (hidden by default) */}
              <div className="hidden">
                <div className="bg-neutral-100 border border-neutral-300 text-neutral-800 text-sm rounded-md p-3 flex items-start gap-3">
                  <FaCircleExclamation className="text-neutral-600 mt-0.5" />
                  <div>
                    <p>Invalid Credentials</p>
                    <p className="text-neutral-600">
                      Please check your username and password and try again.
                    </p>
                  </div>
                </div>
              </div>

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
                <Link to="/company-selection">Log In</Link>
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
