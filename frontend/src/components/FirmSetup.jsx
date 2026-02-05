import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaBuilding, FaArrowLeft } from 'react-icons/fa6';
import useStore from '../store';
import { firmAPI } from '../services/api';
import { FormField, Input, Select, Textarea, Button, Card } from '../components/ui/FormComponents';

const FirmSetup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast, setLoading } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    type: 'GST',
    address: '',
    city: '',
    pincode: '',
    state: '',
    phone: '',
    mobile: '',
    email: '',
    fax: '',
    signature: '',
    gstin: '',
    cin: '',
    registrationNo: '',
    tinCst: '',
    ecc: '',
    range: '',
    division: '',
    pan: '',
    rule: '',
    godownAddress: '',
    bankName: '',
    bankAccount: '',
    ifscCode: ''
  });
  const [errors, setErrors] = useState({});
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadFirm();
    }
  }, [id]);

  const loadFirm = async () => {
    setLoading(true);
    try {
      const response = await firmAPI.getById(id);
      setFormData(response.data);
    } catch (error) {
      showToast('Failed to load firm details', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Firm name is required';
    if (!formData.shortName.trim()) newErrors.shortName = 'Short name is required';
    if (formData.type === 'GST' && !formData.gstin.trim()) {
      newErrors.gstin = 'GSTIN is required for GST registered firms';
    }
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await firmAPI.update(id, formData);
        showToast('Firm updated successfully', 'success');
      } else {
        await firmAPI.create(formData);
        showToast('Firm created successfully', 'success');
      }
      navigate('/dashboard');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save firm', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <FaArrowLeft />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">
            {isEdit ? 'Edit Firm' : 'Add Firm'}
          </h1>
          <p className="text-xs md:text-sm text-neutral-500">
            {isEdit ? 'Update firm information' : 'Create a new firm entity (Maa Auto, Motors, or Surat)'}
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Firm Name" error={errors.name} required>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Maa Auto, Motors, Surat"
                error={errors.name}
              />
            </FormField>

            <FormField label="Short Name" error={errors.shortName} required>
              <Input
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                placeholder="Short name"
                error={errors.shortName}
              />
            </FormField>

            <FormField label="Company Type" error={errors.type} required>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                error={errors.type}
              >
                <option value="0">GST Registered</option>
                <option value="1">Non-GST</option>
              </Select>
            </FormField>

            <FormField label="Address" className="md:col-span-3">
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete address"
                rows={3}
              />
            </FormField>

            <FormField label="City">
              <Select name="city" value={formData.city} onChange={handleChange}>
                <option value="">Select City</option>
                <option value="Surat">Surat</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </Select>
            </FormField>

            <FormField label="Pincode">
              <Input
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6 digit pincode"
                maxLength={6}
              />
            </FormField>

            <FormField label="State">
              <Select name="state" value={formData.state} onChange={handleChange}>
                <option value="">Select State</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
              </Select>
            </FormField>

            <FormField label="Phone No">
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </FormField>

            <FormField label="Mobile No">
              <Input
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Mobile number"
              />
            </FormField>

            <FormField label="Email" error={errors.email}>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                error={errors.email}
              />
            </FormField>

            <FormField label="Fax No">
              <Input
                name="fax"
                value={formData.fax}
                onChange={handleChange}
                placeholder="Fax number"
              />
            </FormField>

            <FormField label="Signature" className="md:col-span-2">
              <Input
                name="signature"
                value={formData.signature}
                onChange={handleChange}
                placeholder="Authorized signature"
              />
            </FormField>
          </div>

          {/* Other Details Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Other Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="GSTIN" error={errors.gstin}>
                <Input
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="15 digit GSTIN"
                  maxLength={15}
                  error={errors.gstin}
                />
              </FormField>

              <FormField label="CIN No">
                <Input
                  name="cin"
                  value={formData.cin}
                  onChange={handleChange}
                  placeholder="Corporate Identity Number"
                />
              </FormField>

              <FormField label="Regi. No">
                <Input
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  placeholder="Registration number"
                />
              </FormField>

              <FormField label="Tin Cst No">
                <Input
                  name="tinCst"
                  value={formData.tinCst}
                  onChange={handleChange}
                  placeholder="TIN CST number"
                />
              </FormField>

              <FormField label="Ecc No">
                <Input
                  name="ecc"
                  value={formData.ecc}
                  onChange={handleChange}
                  placeholder="ECC number"
                />
              </FormField>

              <FormField label="Range No">
                <Input
                  name="range"
                  value={formData.range}
                  onChange={handleChange}
                  placeholder="Range number"
                />
              </FormField>

              <FormField label="Division No">
                <Input
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  placeholder="Division number"
                />
              </FormField>

              <FormField label="Pan No" error={errors.pan}>
                <Input
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="10 digit PAN"
                  maxLength={10}
                  error={errors.pan}
                />
              </FormField>

              <FormField label="Rule">
                <Input
                  name="rule"
                  value={formData.rule}
                  onChange={handleChange}
                  placeholder="Rule"
                />
              </FormField>

              <FormField label="Godown Add." className="md:col-span-3">
                <Textarea
                  name="godownAddress"
                  value={formData.godownAddress}
                  onChange={handleChange}
                  placeholder="Godown address"
                  rows={2}
                />
              </FormField>

              <FormField label="Bank Name">
                <Input
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Bank name"
                />
              </FormField>

              <FormField label="Bank Ac No.">
                <Input
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  placeholder="Bank account number"
                />
              </FormField>

              <FormField label="IFSCode">
                <Input
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="IFSC code"
                />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="submit" className="flex items-center gap-2">
              {/* <FaSave /> */}
              {isEdit ? 'Update Firm' : 'Save Firm'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FirmSetup;