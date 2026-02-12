import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaBuilding, FaArrowLeft } from 'react-icons/fa';
import useStore from '../store';
import { firmAPI } from '../services/api';
import { FormField, Input, Select, Textarea, Button, Card } from '../components/ui/FormComponents';

const FirmSetup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast, setLoading, firms, addFirm, updateFirm } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    type: 'GST',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    godown_address: '',
    GSTIN: '',
    CIN: '',
    reg_number: '',
    bank_name: '',
    bank_branch: '',
    ifsc_code: '',
    account_number: ''
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
      const firm = response.data?.data;
      if (firm) {
        setFormData(firm);
      } else {
        showToast('Firm not found', 'error');
        navigate('/masters/firm-master');
      }
    } catch (error) {
      showToast('Failed to load firm details', 'error');
      navigate('/masters/firm-master');
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
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (formData.type === 'GST' && !formData.GSTIN.trim()) {
      newErrors.GSTIN = 'GSTIN is required for GST registered firms';
    }
    if (formData.GSTIN && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.GSTIN)) {
      newErrors.GSTIN = 'Invalid GSTIN format';
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
        updateFirm(id, formData);
        showToast('Firm updated successfully', 'success');
      } else {
        const response = await firmAPI.create(formData);
        const newFirm = response.data?.data;
        addFirm(newFirm);
        showToast('Firm created successfully', 'success');
      }
      navigate('/masters/firm-master');
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
          onClick={() => navigate('/masters/firm-master')}
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

            {/* <FormField label="Short Name" error={errors.shortName} required>
              <Input
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                placeholder="Short name"
                error={errors.shortName}
              />
            </FormField> */}

            <FormField label="Email" error={errors.email} required>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                error={errors.email}
              />
            </FormField>

            <FormField label="Phone No" error={errors.phone} required>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                error={errors.phone}
              />
            </FormField>

            <FormField label="Company Type" error={errors.type} required>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                error={errors.type}
              >
                <option value="GST">GST Registered</option>
                <option value="NON_GST">Non-GST</option>
              </Select>
            </FormField>

            <FormField label="Address" className="md:col-span-3" error={errors.address} required>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete address"
                rows={3}
                error={errors.address}
              />
            </FormField>

            <FormField label="City" error={errors.city} required>
              <Select name="city" value={formData.city} onChange={handleChange} error={errors.city}>
                <option value="">Select City</option>
                <option value="Surat">Surat</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </Select>
            </FormField>

            <FormField label="State" error={errors.state} required>
              <Select name="state" value={formData.state} onChange={handleChange} error={errors.state}>
                <option value="">Select State</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
              </Select>
            </FormField>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Other Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="GSTIN" error={errors.GSTIN}>
                <Input
                  name="GSTIN"
                  value={formData.GSTIN}
                  onChange={handleChange}
                  placeholder="15 digit GSTIN"
                  maxLength={15}
                  error={errors.GSTIN}
                />
              </FormField>

              <FormField label="CIN No">
                <Input
                  name="CIN"
                  value={formData.CIN}
                  onChange={handleChange}
                  placeholder="Corporate Identity Number"
                />
              </FormField>

              <FormField label="Registration No">
                <Input
                  name="reg_number"
                  value={formData.reg_number}
                  onChange={handleChange}
                  placeholder="Registration number"
                />
              </FormField>

              <FormField label="Godown Address" className="md:col-span-3">
                <Textarea
                  name="godown_address"
                  value={formData.godown_address}
                  onChange={handleChange}
                  placeholder="Godown address"
                  rows={2}
                />
              </FormField>

              <FormField label="Bank Name">
                <Input
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="Bank name"
                />
              </FormField>

              <FormField label="Bank Branch">
                <Input
                  name="bank_branch"
                  value={formData.bank_branch}
                  onChange={handleChange}
                  placeholder="Bank branch"
                />
              </FormField>

              <FormField label="Account Number">
                <Input
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="Bank account number"
                />
              </FormField>

              <FormField label="IFSC Code">
                <Input
                  name="ifsc_code"
                  value={formData.ifsc_code}
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
              onClick={() => navigate('/masters/firm-master')}
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