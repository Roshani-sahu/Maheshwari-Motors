import React, { useState, useEffect } from 'react';
import { FaUser, FaEdit, FaSave, FaTimes, FaHistory, FaCalendar, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Button, Input } from '../components/ui';
import useStore from '../store';
import { authAPI } from '../services/api';

const UserProfile = () => {
  const { user, setUser, showToast } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    created_at: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        const userData = res.data.data;
        setProfileData({
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          role: userData.role || '',
          created_at: userData.created_at || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await authAPI.updateProfile(profileData);
      setUser({ ...user, ...profileData });
      setIsEditing(false);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  };

  const recentActivity = [
    { id: 1, action: 'Created Challan CH001', date: '2025-01-15', time: '10:30 AM' },
    { id: 2, action: 'Updated Bill B002', date: '2025-01-15', time: '09:15 AM' },
    { id: 3, action: 'Added new item to inventory', date: '2025-01-14', time: '04:45 PM' },
    { id: 4, action: 'Generated GST Report', date: '2025-01-14', time: '02:20 PM' },
    { id: 5, action: 'Updated user profile', date: '2025-01-13', time: '11:00 AM' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <p className="text-gray-600">Manage your personal information and view activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{profileData.username}</h2>
                  <p className="text-gray-600">{profileData.role}</p>
                </div>
              </div>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <FaEdit />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="flex items-center gap-2"
                  >
                    <FaSave />
                    Save
                  </Button>
                    <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FaTimes />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaUser className="inline mr-2" />
                    Username
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.username}
                      onChange={(value) => setProfileData(prev => ({ ...prev, username: value }))}
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaEnvelope className="inline mr-2" />
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(value) => setProfileData(prev => ({ ...prev, email: value }))}
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaPhone className="inline mr-2" />
                    Phone
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.phone}
                      onChange={(value) => setProfileData(prev => ({ ...prev, phone: value }))}
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaMapMarkerAlt className="inline mr-2" />
                    Address
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.address}
                      onChange={(value) => setProfileData(prev => ({ ...prev, address: value }))}
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <p className="text-gray-900 py-2">{profileData.role}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaCalendar className="inline mr-2" />
                    Join Date
                  </label>
                  <p className="text-gray-900 py-2">{new Date(profileData.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Challans</span>
                <span className="font-semibold">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bills</span>
                <span className="font-semibold">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reports Generated</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items Added</span>
                <span className="font-semibold">45</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
              <FaHistory className="text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.date} at {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;