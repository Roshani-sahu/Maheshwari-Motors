import React from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaUserShield, FaUser, FaPencil } from "react-icons/fa6";

const UserRights = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">User Rights & Permissions</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Manage Admin and Super Admin access controls
          </p>
        </div>
        <Link to="/add-user" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaPlus />
          Add User
        </Link>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FaUser className="text-blue-500" />
            <h3 className="text-sm md:text-base text-neutral-900">Admin Users</h3>
          </div>
          <p className="text-xs text-neutral-500 mb-2">Daily operations for assigned companies</p>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li>• Create challans and bills</li>
            <li>• Manage Maa Auto & Motors only</li>
            <li>• View company-specific reports</li>
          </ul>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FaUserShield className="text-green-500" />
            <h3 className="text-sm md:text-base text-neutral-900">Super Admin</h3>
          </div>
          <p className="text-xs text-neutral-500 mb-2">Full system access and monitoring</p>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li>• Access all companies including Surat</li>
            <li>• Manage users and system settings</li>
            <li>• View audit logs and all reports</li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="p-3 md:p-4 border-b">
          <h3 className="text-sm md:text-base text-neutral-900">User List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[600px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">User Name</th>
                <th className="p-2 md:p-4 text-left">Role</th>
                <th className="p-2 md:p-4 text-left">Assigned Companies</th>
                <th className="p-2 md:p-4 text-left">Last Login</th>
                <th className="p-2 md:p-4 text-center">Status</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Super Admin", role: "Super Admin", companies: "All (Maa Auto, Motors, Surat)", lastLogin: "24 Jan 2025", status: "Active" },
                { name: "Admin User 1", role: "Admin", companies: "Maa Auto, Motors", lastLogin: "23 Jan 2025", status: "Active" },
                { name: "Admin User 2", role: "Admin", companies: "Motors", lastLogin: "22 Jan 2025", status: "Active" },
                { name: "Operator", role: "Admin", companies: "Maa Auto", lastLogin: "20 Jan 2025", status: "Inactive" },
              ].map((user, i) => (
                <tr key={i} className="border-b hover:bg-neutral-50">
                  <td className="p-2 md:p-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'Super Admin' ? 
                        <FaUserShield className="text-green-500 text-xs" /> : 
                        <FaUser className="text-blue-500 text-xs" />
                      }
                      <span className="text-neutral-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-2 md:p-4 text-neutral-600">{user.role}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{user.companies}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{user.lastLogin}</td>
                  <td className="p-2 md:p-4 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-2 md:p-4 text-center">
                    <button className="p-1 text-neutral-500 hover:text-neutral-900">
                      <FaPencil className="text-xs" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserRights;