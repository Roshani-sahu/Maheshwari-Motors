import React from "react";
import { FaPlus } from "react-icons/fa6";

const SettingsAccessControl = () => {
  return (
    <div className="w-full bg-neutral-50 min-h-screen ">
      {/* Content */}
      <main className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl text-neutral-900">
            Settings & Access Control
          </h1>
          <p className="text-sm text-neutral-500">
            Manage application settings, user roles, print formats, and quick
            edits.
          </p>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sub Navigation */}
          <aside className="w-full lg:w-1/5">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
              <div className="px-3 py-2 text-sm bg-[#F1F5F9] rounded-md whitespace-nowrap">
                User Rights & Roles
              </div>

              {[
                "Fast Edit Items",
                "Print Setup",
                "Invoice Preview",
                "Application Settings",
              ].map((item) => (
                <div
                  key={item}
                  className="px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md cursor-pointer whitespace-nowrap"
                >
                  {item}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Panel */}
          <div className="w-full lg:w-4/5">
            <div className="bg-white border border-neutral-200 rounded-lg">
              {/* Panel Header */}
              <div className="p-4 border-b border-neutral-200">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base md:text-lg text-neutral-900">
                      User Rights & Role Management
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Assign permissions to different user roles.
                    </p>
                  </div>

                  <button className="px-3 py-1.5 text-sm bg-neutral-900 text-white rounded-md flex items-center gap-2 self-start sm:self-auto">
                    <FaPlus className="text-xs" />
                    Add New Role
                  </button>
                </div>

                {/* Role Select */}
                <div className="mt-4">
                  <label className="text-xs text-neutral-600">
                    Select Role to Edit
                  </label>
                  <select
                    defaultValue="Accountant"
                    className="w-full sm:w-64 mt-1 text-sm border rounded-md px-3 py-1.5"
                  >
                    <option>Administrator</option>
                    <option>Accountant</option>
                    <option>Data Entry Operator</option>
                    <option>Sales Manager</option>
                  </select>
                </div>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left w-1/3">
                        Module / Feature
                      </th>
                      {["View", "Create", "Edit", "Delete"].map((h) => (
                        <th key={h} className="px-4 py-2 text-center">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      ["Account Master", true, true, false, false],
                      ["Item Master", true, true, true, false],
                      ["Sale Entry", true, true, true, false],
                      ["Purchase Entry", true, true, false, false],
                      ["Payment/Receipt", true, true, false, false],
                      ["Reports", true, false, false, false, true],
                      ["Settings Access", false, false, true, false, true],
                    ].map((row, i) => (
                      <tr
                        key={row[0]}
                        className={`border-b ${
                          i % 2 === 1 ? "bg-neutral-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-neutral-900">
                          {row[0]}
                        </td>

                        {row.slice(1, 5).map((val, idx) => (
                          <td key={idx} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              defaultChecked={val === true}
                              disabled={row[5] === true && idx > 0}
                              className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="p-4 bg-neutral-50/70 flex justify-end">
                <button className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-md">
                  Save Changes for &apos;Accountant&apos;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsAccessControl;
