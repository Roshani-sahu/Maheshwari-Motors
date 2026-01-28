import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFloppyDisk, FaPlus, FaTrashCan, FaMagnifyingGlass } from "react-icons/fa6";

const GenerateChallan = () => {
  const [selectedCompany, setSelectedCompany] = useState('Maa Auto (Non-GST)');
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState('24 Jan 2025');
  const [challanNo, setChallanNo] = useState('C-0062');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([
    { id: 1, name: '', qty: '', rate: '', amount: '0.00' }
  ]);
  const navigate = useNavigate();

  const addItem = () => {
    const newItem = {
      id: items.length + 1,
      name: '',
      qty: '',
      rate: '',
      amount: '0.00'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const qty = parseFloat(updatedItem.qty) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          updatedItem.amount = (qty * rate).toFixed(2);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + parseFloat(item.amount || 0), 0).toFixed(2);
  };

  const handleSave = () => {
    console.log('Saving challan:', {
      company: selectedCompany,
      customer,
      date,
      challanNo,
      items,
      remarks,
      total: getTotalAmount()
    });
    navigate('/challan-list');
  };
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Generate Challan</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Create delivery challan (stock will be updated immediately)
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg">
        {/* Header */}
        <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 border-b">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Company</label>
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            >
              <option>Maa Auto (Non-GST)</option>
              <option>Motors (GST)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Customer</label>
            <input
              type="text"
              placeholder="Select customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Date</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Challan No.</label>
            <input
              type="text"
              value={challanNo}
              onChange={(e) => setChallanNo(e.target.value)}
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 bg-neutral-100"
              readOnly
            />
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[800px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left w-8">#</th>
                <th className="p-2 md:p-4 text-left w-2/5">Item</th>
                <th className="p-2 md:p-4 text-right">Qty</th>
                <th className="p-2 md:p-4 text-right">Rate</th>
                <th className="p-2 md:p-4 text-right">Amount</th>
                <th className="p-1 md:p-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2 md:p-4 text-neutral-500">{index + 1}</td>
                  <td className="p-2 md:p-4">
                    <div className="relative">
                      <FaMagnifyingGlass className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Search item or scan barcode..."
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-neutral-100 rounded pl-6 pr-1 py-1 text-xs md:text-sm"
                      />
                    </div>
                  </td>
                  <td className="p-2 md:p-4">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                      className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                    />
                  </td>
                  <td className="p-2 md:p-4">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                      className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                    />
                  </td>
                  <td className="p-2 md:p-4 text-right text-neutral-900">{item.amount}</td>
                  <td className="p-1 md:p-2 text-center">
                    <button 
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className={`text-xs ${items.length === 1 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                      <FaTrashCan />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-2 md:p-3 border-b">
          <button 
            onClick={addItem}
            className="px-3 py-1 text-xs md:text-sm border border-dashed border-neutral-400 text-neutral-600 rounded-md hover:bg-neutral-100 flex items-center gap-2"
          >
            <FaPlus className="text-xs" />
            Add Item
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 flex justify-between items-center">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Remarks</label>
            <input
              type="text"
              placeholder="Delivery notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-64 text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div className="text-right">
            <p className="text-sm md:text-base text-neutral-900">Total: ₹{getTotalAmount()}</p>
            <p className="text-xs text-neutral-500">{items.length} item(s)</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4 md:mt-6">
        <button 
          onClick={handleSave}
          disabled={!customer || items.every(item => !item.name)}
          className={`px-4 py-2 text-xs md:text-sm rounded-md flex items-center gap-2 ${
            customer && items.some(item => item.name)
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-neutral-400 text-white cursor-not-allowed'
          }`}
        >
          <FaFloppyDisk />
          Save Challan
        </button>
        <Link to="/transactions" className="px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default GenerateChallan;