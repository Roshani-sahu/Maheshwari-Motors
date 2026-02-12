import React, { useState } from "react";
import { FaFilter, FaFileExport, FaUser, FaFileInvoiceDollar, FaCheck, FaTrashCan, FaEye } from "react-icons/fa";

const AuditLogs = () => {
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [dateRange, setDateRange] = useState('');

  const logs = [
    { 
      datetime: "24 Jan 2025 14:30", 
      user: "Admin User 1", 
      action: "Create", 
      module: "Challan", 
      record: "C-0061", 
      company: "Motors", 
      details: "New challan for City Car Service",
      icon: FaFileInvoiceDollar,
      color: "text-blue-500"
    },
    { 
      datetime: "24 Jan 2025 14:25", 
      user: "Admin User 1", 
      action: "Approve", 
      module: "Challan", 
      record: "C-0060", 
      company: "Maa Auto", 
      details: "Challan approved for billing",
      icon: FaCheck,
      color: "text-green-500"
    },
    { 
      datetime: "24 Jan 2025 13:45", 
      user: "Admin User 2", 
      action: "Post", 
      module: "Bill", 
      record: "B-0089", 
      company: "Motors", 
      details: "Bill posted from challans C-0058, C-0059",
      icon: FaFileInvoiceDollar,
      color: "text-purple-500"
    },
    { 
      datetime: "24 Jan 2025 12:20", 
      user: "Super Admin", 
      action: "Create", 
      module: "User", 
      record: "Operator", 
      company: "All", 
      details: "New admin user created",
      icon: FaUser,
      color: "text-orange-500"
    },
    { 
      datetime: "23 Jan 2025 16:10", 
      user: "Admin User 1", 
      action: "Delete", 
      module: "Challan", 
      record: "C-0057", 
      company: "Motors", 
      details: "Challan cancelled due to error",
      icon: FaTrashCan,
      color: "text-red-500"
    },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesUser = selectedUser === 'All Users' || log.user === selectedUser;
    const matchesAction = selectedAction === 'All Actions' || log.action === selectedAction;
    return matchesUser && matchesAction;
  });

  const handleView = (record) => {
    alert(`Viewing details for: ${record}`);
  };

  const handleExport = () => {
    alert('Exporting audit logs...');
  };
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Audit Logs</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Monitor user activities and system changes (Super Admin Only)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select 
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md"
          >
            <option>All Users</option>
            <option>Admin User 1</option>
            <option>Admin User 2</option>
            <option>Super Admin</option>
            <option>Operator</option>
          </select>
          <select 
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md"
          >
            <option>All Actions</option>
            <option>Create</option>
            <option>Edit</option>
            <option>Delete</option>
            <option>Post</option>
            <option>Approve</option>
          </select>
          <input
            type="text"
            placeholder="Date range..."
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <button className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
            <FaFilter />
            Filter
          </button>
          <button 
            onClick={handleExport}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2"
          >
            <FaFileExport />
            Export
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[800px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">Date/Time</th>
                <th className="p-2 md:p-4 text-left">User</th>
                <th className="p-2 md:p-4 text-left">Action</th>
                <th className="p-2 md:p-4 text-left">Module</th>
                <th className="p-2 md:p-4 text-left">Record</th>
                <th className="p-2 md:p-4 text-left">Company</th>
                <th className="p-2 md:p-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => (
                  <tr key={i} className="border-b hover:bg-neutral-50">
                    <td className="p-2 md:p-4 text-neutral-600">{log.datetime}</td>
                    <td className="p-2 md:p-4 text-neutral-800">{log.user}</td>
                    <td className="p-2 md:p-4">
                      <div className="flex items-center gap-2">
                        <log.icon className={`text-xs ${log.color}`} />
                        <span className="text-neutral-800">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-neutral-600">{log.module}</td>
                    <td className="p-2 md:p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-800">{log.record}</span>
                        <button
                          onClick={() => handleView(log.record)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <FaEye className="text-xs" />
                        </button>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-neutral-600">{log.company}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-neutral-500">
                    No audit logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-neutral-200 flex justify-between items-center text-xs md:text-sm text-neutral-600">
          <span>Showing {filteredLogs.length} of {logs.length} log entries</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Previous</button>
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;