import api from '../../services/axiosInstance';
import { useState, useEffect } from 'react';
import { FaUser, FaSignOutAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

const Settings = () => {
  const navigate = useNavigate();
  const { user, setUser, showToast } = useStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: ''
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/auth/me', { signal: controller.signal });
        const userData = res?.data?.data || {};
        setProfileData({
          username: userData?.username || userData?.name || '',
          email: userData?.email || ''
        });
      } catch (err) {
        if (err?.name !== 'CanceledError') {
          showToast('Failed to fetch profile', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [showToast]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Ignore API logout failures and clear local session anyway.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      setUser(null);
      showToast('Logged out successfully', 'success');
      navigate('/login');
    }
  };

  const handleSaveProfile = async () => {
    showToast('Profile update endpoint is not available in current API.', 'error');
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
          </div>
          {!isEditingProfile ? (
            <Button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-sm" disabled={loading}>
              <FaEdit />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} className="flex items-center gap-2 text-sm">
                <FaSave />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="flex items-center gap-2 text-sm">
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
              <Input value={profileData.username} onChange={(value) => setProfileData((prev) => ({ ...prev, username: value }))} />
            ) : (
              <p className="text-gray-900 py-2">{profileData.username || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditingProfile ? (
              <Input type="email" value={profileData.email} onChange={(value) => setProfileData((prev) => ({ ...prev, email: value }))} />
            ) : (
              <p className="text-gray-900 py-2">{profileData.email || '-'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account</h2>
            <p className="text-sm text-gray-600">Sign out of your account</p>
          </div>
          <Button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
            <FaSignOutAlt />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
