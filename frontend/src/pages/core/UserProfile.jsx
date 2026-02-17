import React, { useState, useEffect } from 'react';
import { FaUser, FaEdit, FaSave, FaTimes, FaHistory, FaCalendar, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import { authAPI } from '../../services/api';

const UserProfile = () => {
  const { user, setUser, showToast } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    role: '',
    firm_data: null,
    is_active: false,
    createdAt: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        const userData = res.data.data;
        console.log('Profile Data:', userData);
        
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          type: userData.type || '',
          role: userData.role || '',
          firm_data: userData.firm_data || null,
          is_active: userData.is_active || false,
          createdAt: userData.createdAt || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
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


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Firm Details</h1>
        <p className="text-gray-600">Manage your personal information and view activity</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
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
                  <h2 className="text-xl font-semibold text-gray-900">{profileData.name}</h2>
                  <p className="text-gray-600">{profileData.role} - {profileData.firm_data?.firm_type || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{profileData.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
             
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaUser className="inline mr-2" />
                      Name
                    </label>
                    <p className="text-gray-900 py-2">{profileData.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaEnvelope className="inline mr-2" />
                      Email
                    </label>
                    <p className="text-gray-900 py-2">{profileData.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaPhone className="inline mr-2" />
                      Phone
                    </label>
                    <p className="text-gray-900 py-2">{profileData.phone}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaCalendar className="inline mr-2" />
                      Member Since
                    </label>
                    <p className="text-gray-900 py-2">{new Date(profileData.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Firm Details */}
              {profileData.firm_data && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{profileData.firm_data.firm_type} Firm Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Type</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.firm_type}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Email</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Phone</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.city || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.state || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                        <p className="text-gray-900 py-2">{profileData.firm_data.address || 'N/A'}</p>
                      </div>
                      {profileData.firm_data.godown_address && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Godown/Warehouse Address</label>
                          <p className="text-gray-900 py-2">{profileData.firm_data.godown_address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GST-Specific Details */}
                  {profileData.firm_data.firm_type === 'GST' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">GST & Registration Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileData.firm_data.GSTIN && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                            <p className="text-gray-900 py-2 font-mono">{profileData.firm_data.GSTIN}</p>
                          </div>
                        )}
                        {profileData.firm_data.CIN && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CIN</label>
                            <p className="text-gray-900 py-2 font-mono">{profileData.firm_data.CIN}</p>
                          </div>
                        )}
                        {profileData.firm_data.reg_number && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                            <p className="text-gray-900 py-2 font-mono">{profileData.firm_data.reg_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  {profileData.firm_data.firm_type === 'GST' && profileData.firm_data.bank_name && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                          <p className="text-gray-900 py-2">{profileData.firm_data.bank_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                          <p className="text-gray-900 py-2">{profileData.firm_data.bank_branch || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                          <p className="text-gray-900 py-2 font-mono">{profileData.firm_data.account_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                          <p className="text-gray-900 py-2 font-mono">{profileData.firm_data.ifsc_code || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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

         
        </div>
      </div>
      )}
    </div>
  );
};

export default UserProfile;