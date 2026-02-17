import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  // FaRegCalendarAlt,
  FaBars,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import useStore from "../../store";
import CompanySelector from "../CompanySelector";

const Header = ({ onMenuClick }) => {
  const { user } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Determine email based on user type
  const getUserEmail = () => {
    if (!user) return 'user@example.com';
    return user.firm_data?.email || user.email || 'user@example.com';
  };
  
  const getFirmName = () => {
    if (!user) return 'Select Company';
    return user.firm_data?.name || 'Company';
  };
  // const [showDatePicker, setShowDatePicker] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const datePickerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // const handlePurchaseClick = () => {
  //   navigate('/transactions');
  // };

  // const handleSaleClick = () => {
  //   navigate('/sale-entry');
  // };

  const handleLogout = async () => {
    try {
      // Call the API to invalidate the session on the server
      await import('../../services/api').then(m => m.authAPI.logout());
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem('token');
      navigate('/login');
    }
  };
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 px-4 sm:px-6 py-2 sm:py-0 bg-white border-b border-neutral-200">
      {/* Top row on mobile, left section on desktop */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-neutral-100"
        >
          <FaBars className="text-neutral-700" />
        </button>

        {/* Company Name Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-200">
          <span className="text-sm font-medium text-blue-900">{getFirmName()}</span>
        </div>

        {/* User avatar - moved to top right on mobile */}
        <div className="sm:hidden relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100"
          >
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=251"
              className="w-8 h-8 rounded-full border"
              alt="User"
            />
          </button>
          
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-neutral-300 rounded-md shadow-lg z-50">
              {/* <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50">
                <FaCog className="text-neutral-500" />
                Settings
              </Link> */}
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50 text-left">
                <FaSignOutAlt className="text-neutral-500" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* <div className="hidden lg:flex items-center gap-2 text-xs sm:text-sm relative" ref={datePickerRef}>
          <FaRegCalendarAlt className="text-neutral-500" />
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-neutral-800 truncate hover:text-neutral-600"
          >
            01 Apr 2025 - 31 Mar 2026
          </button>
          
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-neutral-300 rounded-md shadow-lg z-50 p-3">
              <p className="text-xs text-neutral-600 mb-2">Financial Year</p>
              <select className="w-full text-xs border border-neutral-300 rounded-md px-2 py-1">
                <option>2024-25 (01 Apr 2024 - 31 Mar 2025)</option>
                <option>2025-26 (01 Apr 2025 - 31 Mar 2026)</option>
              </select>
            </div>
          )}
        </div> */}
      </div>

      {/* Bottom row on mobile, right section on desktop */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0">
        {/* <div className="lg:hidden flex items-center gap-2 text-xs sm:text-sm relative">
          <FaRegCalendarAlt className="text-neutral-500" />
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-neutral-800 truncate hover:text-neutral-600"
          >
            01 Apr 2025 - 31 Mar 2026
          </button>
          
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-neutral-300 rounded-md shadow-lg z-50 p-3">
              <p className="text-xs text-neutral-600 mb-2">Financial Year</p>
              <select className="w-full text-xs border border-neutral-300 rounded-md px-2 py-1">
                <option>2024-25 (01 Apr 2024 - 31 Mar 2025)</option>
                <option>2025-26 (01 Apr 2025 - 31 Mar 2026)</option>
              </select>
            </div>
          )}
        </div> */}

        <div className="flex items-center gap-2 sm:gap-4">
          {/* <div className="flex gap-1 sm:gap-2">
            <button 
              onClick={handlePurchaseClick}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-md hover:bg-neutral-50"
            >
              Purchase
            </button>
            <button 
              onClick={handleSaleClick}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800"
            >
              Sale
            </button>
          </div> */}

          <div className="w-px h-6 bg-[#F1F5F9] hidden sm:block" />

          {/* User avatar - hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex items-center relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100"
            >
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=251"
                className="w-8 h-8 rounded-full border"
                alt="User"
              />
              <FaChevronDown className="text-xs text-neutral-500" />
            </button>
            
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-neutral-300 rounded-md shadow-lg z-50">
                <div className="px-3 py-2 border-b border-neutral-200">
                  <p className="text-xs font-medium text-neutral-800">{user?.name || 'User'}</p>
                  <p className="text-xs text-neutral-500">{getUserEmail()}</p>
                </div>
                {/* <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50">
                  <FaCog className="text-neutral-500" />
                  Settings
                </Link> */}
                <Link to="/user-profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50">
                  <FaUser className="text-neutral-500" />
                  User Profile
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50 text-left border-t border-neutral-200">
                  <FaSignOutAlt className="text-neutral-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
