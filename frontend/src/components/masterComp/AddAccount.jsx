import React from "react";

const AccountMasterForm = () => {
  return (
    <main className=" bg-neutral-50  relative">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 mb-2">
          <span>Masters</span>
          <span>/</span>
          <span>Account Master</span>
          <span>/</span>
          <span className="text-neutral-800">Add New Account</span>
        </div>

        <h1 className="text-xl md:text-2xl text-neutral-900">
          Add New Account Master
        </h1>
        <p className="text-sm text-neutral-500">
          Create a new account for transactions, ledgers, and reporting.
        </p>
      </div>

      {/* Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-32">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="bg-white p-4 md:p-6 border rounded-lg">
            <h3 className="text-base text-neutral-900 border-b pb-3 mb-4">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">
                  Account Name <span className="text-neutral-500">*</span>
                </label>
                <input
                  defaultValue="Auto Parts Inc."
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-neutral-800"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Group <span className="text-neutral-500">*</span>
                </label>
                <select className="w-full px-3 py-1.5 text-sm border rounded-md bg-white">
                  <option>Sundry Creditors</option>
                  <option>Sundry Debtors</option>
                  <option>Bank Accounts</option>
                  <option>Indirect Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Sub Group</label>
                <select className="w-full px-3 py-1.5 text-sm border rounded-md bg-white">
                  <option>Select Sub Group</option>
                  <option>North Zone</option>
                  <option>South Zone</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Opening Balance</label>
                <div className="flex">
                  <input
                    defaultValue="25,000.00"
                    className="w-full px-3 py-1.5 text-sm border rounded-l-md"
                  />
                  <select className="px-3 py-1.5 text-sm border rounded-r-md bg-neutral-50">
                    <option>Dr</option>
                    <option>Cr</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* GST Section */}
          <section className="bg-white p-4 md:p-6 border rounded-lg">
            <h3 className="text-base text-neutral-900 border-b pb-3 mb-4">
              GST & Statutory
            </h3>

            <div className="flex flex-wrap gap-4">
              {["GST Regular", "Unregistered", "Composition"].map(
                (label, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="gst" defaultChecked={i === 0} />
                    {label}
                  </label>
                )
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm mb-1">GSTIN / UIN</label>
                <input className="w-full px-3 py-1.5 text-sm border rounded-md" />
                <p className="text-xs text-neutral-500 mt-1">
                  Invalid GSTIN format.
                </p>
              </div>

              <div>
                <label className="block text-sm mb-1">PAN / IT No.</label>
                <input className="w-full px-3 py-1.5 text-sm border rounded-md" />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white p-4 md:p-6 border rounded-lg">
            <h3 className="text-base text-neutral-900 border-b pb-3 mb-4">
              Contact & Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                rows={3}
                placeholder="Enter full address"
                className="md:col-span-2 w-full px-3 py-1.5 text-sm border rounded-md"
              />

              {["City", "Pin Code", "Mobile No.", "Email Address"].map(
                (label, i) => (
                  <div key={i}>
                    <label className="block text-sm mb-1">{label}</label>
                    <input className="w-full px-3 py-1.5 text-sm border rounded-md" />
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          <section className="bg-white p-4 md:p-6 border rounded-lg">
            <h3 className="text-base text-neutral-900 border-b pb-3 mb-4">
              Discount Preferences
            </h3>

            {["5.00", "0.00", "0.00"].map((val, i) => (
              <input
                key={i}
                defaultValue={val}
                className="w-full px-3 py-1.5 mb-3 text-sm border rounded-md"
              />
            ))}
          </section>

          <section className="bg-white p-4 md:p-6 border rounded-lg">
            <h3 className="text-base text-neutral-900 border-b pb-3 mb-4">
              Print Preferences
            </h3>

            <input
              placeholder="Leave blank to use Account Name"
              className="w-full px-3 py-1.5 mb-3 text-sm border rounded-md"
            />

            <select className="w-full px-3 py-1.5 mb-3 text-sm border rounded-md bg-white">
              <option>Default GST Template</option>
              <option>Simplified Template</option>
              <option>Export Template</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> CC invoice email
            </label>
          </section>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="  bottom-0  right-0  backdrop-blur border-t p-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-xs text-neutral-500">
            Ctrl+S Save • Ctrl+Shift+S Save & New
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-sm border rounded-md">
              Cancel
            </button>
            <button className="px-4 py-1.5 text-sm border rounded-md">
              Save & New
            </button>
            <button className="px-4 py-1.5 text-sm bg-neutral-900 text-white rounded-md">
              Save Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AccountMasterForm;
