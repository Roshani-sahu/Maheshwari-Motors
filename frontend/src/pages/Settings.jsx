import React, { useState } from 'react';
import { FaUser, FaCog, FaSignOutAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import useStore from '../store';

const Settings = () => {
  const navigate = useNavigate();
  const { user, setUser, showToast } = useStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || 'admin',
    email: user?.email || 'admin@maheshwarimotors.com'
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const handleSaveProfile = () => {
    setUser({ ...user, ...profileData });
    setIsEditingProfile(false);
    showToast('Profile updated successfully', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* User Profile Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
          </div>
          {!isEditingProfile ? (
            <Button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-2 text-sm"
            >
              <FaEdit />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 text-sm"
              >
                <FaSave />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileData({
                    username: user?.username || 'admin',
                    email: user?.email || 'admin@maheshwarimotors.com'
                  });
                }}
                className="flex items-center gap-2 text-sm"
              >
                <FaTimes />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            {isEditingProfile ? (
              <Input
                value={profileData.username}
                onChange={(value) => setProfileData(prev => ({ ...prev, username: value }))}
                placeholder="Enter username"
              />
            ) : (
              <p className="text-gray-900 py-2">{profileData.username}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditingProfile ? (
              <Input
                type="email"
                value={profileData.email}
                onChange={(value) => setProfileData(prev => ({ ...prev, email: value }))}
                placeholder="Enter email"
              />
            ) : (
              <p className="text-gray-900 py-2">{profileData.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* System Settings Section */}
      {/* <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <FaCog className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-medium text-gray-900">Theme</h3>
              <p className="text-sm text-gray-600">Choose your preferred theme</p>
            </div>
            <select className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-medium text-gray-900">Language</h3>
              <p className="text-sm text-gray-600">Select your language</p>
            </div>
            <select className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="gu">Gujarati</option>
            </select>
          </div>
        </div>
      </div> */}

      {/* Logout Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account</h2>
            <p className="text-sm text-gray-600">Sign out of your account</p>
          </div>
          <Button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <FaSignOutAlt />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;