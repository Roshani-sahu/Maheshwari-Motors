import api from '../../services/axiosInstance';
import  { useState, useEffect } from 'react';
import { FaUser,  FaEnvelope, FaPhone } from 'react-icons/fa';

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todaysChallans: 0,
    todaysBills: 0,
    lowStockAlerts: 0
  });
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    role: '',
    current_firm_type: '',
    is_active: false,
    createdAt: '',
    admin: {},
    gst_firm: {},
    nongst_firm: {}
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfileAndStats = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get('/auth/me', { signal: controller.signal });
        const userData = profileRes?.data?.data || {};

        setProfileData({
          name: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          type: userData?.type || '',
          role: userData?.current_role || userData?.role || '',
          current_firm_type: userData?.current_firm_type || '',
          is_active: Boolean(userData?.is_active),
          createdAt: userData?.createdAt || '',
          admin: userData?.admin || {},
          gst_firm: userData?.gst_firm || {},
          nongst_firm: userData?.nongst_firm || {}
        });

        const isGst = String(userData?.current_firm_type || '').toUpperCase() === 'GST';

        const [dashboardRes, todayFirmRes, challansRes, billsRes, lowStockRes] = await Promise.all([
          api.get('/dashboard', { signal: controller.signal }),
          api.get('/dashboard/firm', { params: { is_gst: isGst ? 1 : 0, period: 'today' }, signal: controller.signal }),
          api.get('/challans', { params: { page: 1, limit: 20 }, signal: controller.signal }),
          api.get('/bills', { params: { page: 1, limit: 20 }, signal: controller.signal }),
          api.get('/items/low-stock', { params: { page: 1, limit: 200 }, signal: controller.signal })
        ]);

        const data = dashboardRes?.data?.data || {};
        const todayData = todayFirmRes?.data?.data || {};
        const totalChallans = challansRes.data?.data?.meta?.total || 0;
        const totalBills = billsRes.data?.data?.meta?.total || 0;

        const lowStockPayload = lowStockRes?.data?.data;
        const lowStockCount = Array.isArray(lowStockPayload)
          ? lowStockPayload.length
          : (Array.isArray(lowStockPayload?.data) ? lowStockPayload.data.length : (lowStockPayload?.meta?.totalDocs || 0));

        setDashboardData({
          todaysChallans: totalChallans,
          todaysBills: totalBills,
          lowStockAlerts: Number(lowStockCount || 0)
        });
      } catch (err) {
        if (err?.name !== 'CanceledError') {
          console.error('Failed to fetch profile/stats', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
    return () => controller.abort();
  }, []);

  const view = (value) => (value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : 'N/A');
  const isGstLogin = String(profileData.current_firm_type || '').toUpperCase() === 'GST';
  const activeFirm = isGstLogin ? profileData.gst_firm : profileData.nongst_firm;

  const renderField = (label, value, mono = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className={`text-gray-900 py-2 ${mono ? 'font-mono' : ''}`}>{view(value)}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Firm Details</h1>
        <p className="text-gray-600">Manage your personal information and view activity</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{view(profileData.name)}</h2>
                    <p className="text-gray-600">{view(profileData.role)} - {view(profileData.current_firm_type)}</p>
                    <p className="text-sm text-gray-500">{profileData.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1"><FaUser className="inline mr-2" />Name</label>
                      <p className="text-gray-900 py-2">{view(profileData.name)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1"><FaEnvelope className="inline mr-2" />Email</label>
                      <p className="text-gray-900 py-2">{view(profileData.email)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1"><FaPhone className="inline mr-2" />Phone</label>
                      <p className="text-gray-900 py-2">{view(profileData.phone)}</p>
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1"><FaCalendar className="inline mr-2" />Member Since</label>
                      <p className="text-gray-900 py-2">{profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div> */}
                                        {renderField('Username', profileData.admin?.username)}

                  </div>
                </div>

                {/* <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Password', profileData.admin?.password || '********', true)}
                  </div>
                </div> */}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {isGstLogin ? 'GST Firm Details' : 'Non-GST Firm Details'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Firm Name', activeFirm?.name)}
                    {renderField('Username', activeFirm?.username)}
                    {renderField('Phone', activeFirm?.phone)}
                    {renderField('Email', activeFirm?.email)}
                    {renderField('Address', activeFirm?.address)}
                    {renderField('City', activeFirm?.city)}
                    {renderField('State', activeFirm?.state)}
                    {isGstLogin && renderField('Godown Address', activeFirm?.godown_address)}
                    {isGstLogin && renderField('GSTIN', activeFirm?.GSTIN, true)}
                    {isGstLogin && renderField('CIN', activeFirm?.CIN, true)}
                    {isGstLogin && renderField('Registration Number', activeFirm?.reg_number, true)}
                  </div>
                </div>

                {isGstLogin && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Bank Details</h3>
                    {Array.isArray(activeFirm?.bank_ids) && activeFirm.bank_ids.length > 0 ? (
                      activeFirm.bank_ids.map((bank, idx) => (
                        <div key={idx} className="mb-4 pb-4 border-b last:border-b-0">
                          <p className="text-sm font-medium text-gray-500 mb-2">Bank {idx + 1}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField('Bank Name', bank?.bank_name)}
                            {renderField('Bank Branch', bank?.bank_branch)}
                            {renderField('IFSC Code', bank?.ifsc_code, true)}
                            {renderField('Account Number', bank?.account_number, true)}
                            {renderField('Account Holder', bank?.account_holder)}
                            {bank?.upi_id && renderField('UPI ID', bank?.upi_id, true)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No bank details available</p>
                    )}
                  </div>
                )}

                {!isGstLogin && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Non-GST Bank Details</h3>
                    {Array.isArray(activeFirm?.bank_ids) && activeFirm.bank_ids.length > 0 ? (
                      activeFirm.bank_ids.map((bank, idx) => (
                        <div key={idx} className="mb-4 pb-4 border-b last:border-b-0">
                          <p className="text-sm font-medium text-gray-500 mb-2">Bank {idx + 1}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField('Bank Name', bank?.bank_name)}
                            {renderField('Bank Branch', bank?.bank_branch)}
                            {renderField('IFSC Code', bank?.ifsc_code, true)}
                            {renderField('Account Number', bank?.account_number, true)}
                            {renderField('Account Holder', bank?.account_holder)}
                            {bank?.upi_id && renderField('UPI ID', bank?.upi_id, true)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No bank details available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Total Challans</span><span className="font-semibold">{dashboardData?.todaysChallans || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Bills</span><span className="font-semibold">{dashboardData?.todaysBills || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Low Stock Alerts</span><span className="font-semibold">{dashboardData?.lowStockAlerts || 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
