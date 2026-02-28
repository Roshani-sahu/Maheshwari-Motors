import React, { useMemo, useState } from "react";
import { Button, Input, Select } from "../../components/ui";

const SAMPLE_BANKS = [
  "INDIAN OVERSEAS BANK",
  "PRIME CO OPERATIVE BANK",
  "STATE BANK OF INDIA",
  "HDFC BANK",
  "ICICI BANK",
];

const DEFAULT_FIELDS = [
  { key: "ac_pay", label: "Ac-Pay", top: 15, left: 110, enabled: true },
  { key: "date", label: "Date", top: 20, left: 685, enabled: true },
  { key: "ac_name", label: "A/c Name", top: 55, left: 150, enabled: true },
  { key: "amount", label: "Amount", top: 125, left: 710, enabled: true },
  { key: "amount_word", label: "Amount Word", top: 90, left: 195, enabled: true },
  { key: "firm_name", label: "Firm Name", top: 165, left: 715, enabled: true },
  { key: "signature", label: "Signature", top: 225, left: 715, enabled: true },
  { key: "narration", label: "Narration", top: 180, left: 330, enabled: true },
];

const ChequePrintSetup = () => {
  const [banks] = useState(SAMPLE_BANKS);
  const [selectedBank, setSelectedBank] = useState(SAMPLE_BANKS[0]);
  const [dispCaption, setDispCaption] = useState("prime");
  const [fields, setFields] = useState(DEFAULT_FIELDS);

  const activeBankList = useMemo(
    () => banks.map((bank, index) => ({ id: `${bank}-${index}`, name: bank })),
    [banks],
  );

  const updateField = (key, updates) => {
    setFields((prev) =>
      prev.map((field) => (field.key === key ? { ...field, ...updates } : field)),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cheque Print Setup</h1>
            <p className="text-gray-600 text-sm">Configure cheque layouts for each bank.</p>
          </div>
          <Button variant="outline" size="sm">Save</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border shadow-sm lg:col-span-1">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold text-gray-900">Banks</p>
            </div>
            <div className="p-3">
              <Input placeholder="Search bank" className="text-sm" />
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {activeBankList.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBank(bank.name)}
                  className={`w-full text-left px-4 py-2 text-sm border-t first:border-t-0 ${
                    selectedBank === bank.name
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  {bank.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm lg:col-span-2 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                <Select value={selectedBank} onChange={setSelectedBank} className="text-sm">
                  {banks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Disp. Caption</label>
                <Input value={dispCaption} onChange={setDispCaption} className="text-sm" />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 gap-2 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                <span>Field</span>
                <span>Print</span>
                <span>Top</span>
                <span>Left</span>
              </div>
              <div className="divide-y">
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-4 gap-2 items-center px-3 py-2 text-sm">
                    <span className="font-medium text-gray-900">{field.label}</span>
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={(e) => updateField(field.key, { enabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Input
                      type="number"
                      value={field.top}
                      onChange={(value) => updateField(field.key, { top: Number(value) || 0 })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      value={field.left}
                      onChange={(value) => updateField(field.key, { left: Number(value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">Preview</Button>
              <span className="text-xs text-gray-600">
                Note: Other A/c found then other A/c print in cheque otherwise party print.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChequePrintSetup;
