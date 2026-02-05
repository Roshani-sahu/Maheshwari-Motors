import React, { useState } from "react";
import {
  FaDownload,
  FaUpload,
  FaPlay,
  FaClockRotateLeft,
} from "react-icons/fa6";
import { Button } from "../../components/ui";
import { DataTable, ConfirmationDialog } from "../../components/common";

const BackupRestore = () => {
  const [backupLogs, setBackupLogs] = useState([
    {
      id: 1,
      date: "2024-01-15 10:30:00",
      type: "Auto Backup",
      size: "2.5 MB",
      status: "Success",
      location: "C:\\ERP\\Backups\\backup_20240115_1030.sql",
    },
    {
      id: 2,
      date: "2024-01-14 10:30:00",
      type: "Auto Backup",
      size: "2.4 MB",
      status: "Success",
      location: "C:\\ERP\\Backups\\backup_20240114_1030.sql",
    },
    {
      id: 3,
      date: "2024-01-13 15:45:00",
      type: "Manual Backup",
      size: "2.3 MB",
      status: "Success",
      location: "C:\\ERP\\Backups\\backup_20240113_1545.sql",
    },
    {
      id: 4,
      date: "2024-01-12 10:30:00",
      type: "Auto Backup",
      size: "2.2 MB",
      status: "Failed",
      location: "N/A",
    },
  ]);

  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const columns = [
    { key: "date", label: "Date & Time" },
    { key: "type", label: "Type" },
    { key: "size", label: "Size" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            value === "Success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value) => (
        <span className="text-xs text-gray-600 font-mono">
          {value.length > 40 ? `...${value.slice(-40)}` : value}
        </span>
      ),
    },
  ];

  const handleTriggerBackup = () => {
    const newBackup = {
      id: backupLogs.length + 1,
      date: new Date().toLocaleString(),
      type: "Manual Backup",
      size: "2.6 MB",
      status: "Success",
      location: `C:\\ERP\\Backups\\backup_${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}_${new Date()
        .toTimeString()
        .slice(0, 5)
        .replace(":", "")}.sql`,
    };

    setBackupLogs((prev) => [newBackup, ...prev]);
    setIsBackupDialogOpen(false);
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleRestore = () => {
    if (selectedFile) {
      console.log("Restoring from:", selectedFile.name);
      setIsRestoreDialogOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backup / Restore</h1>
        <p className="text-gray-600">
          Manage database backups and restore operations
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FaDownload className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create Backup</h3>
              <p className="text-sm text-gray-600">
                Generate a backup of your database
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p>• Last backup: {backupLogs[0]?.date}</p>
            <p>• Auto backup: Daily at 10:30 AM</p>
            <p>• Backup location: C:\ERP\Backups\</p>

            <Button
              onClick={() => setIsBackupDialogOpen(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <FaPlay />
              Trigger Manual Backup
            </Button>
          </div>
        </div>

        {/* Restore */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <FaUpload className="text-orange-600 text-xl" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Restore Database</h3>
              <p className="text-sm text-gray-600">
                Restore from a backup file
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p>⚠️ This will overwrite current data</p>
            <p>• Supported formats: .sql, .bak</p>
            <p>• System will restart after restore</p>

            <input
              type="file"
              accept=".sql,.bak"
              onChange={handleFileSelect}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            <Button
              onClick={() => setIsRestoreDialogOpen(true)}
              disabled={!selectedFile}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <FaUpload />
              Restore Database
            </Button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center gap-2">
          <FaClockRotateLeft className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Backup History</h3>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            data={backupLogs}
            sortable
            pagination
            pageSize={5}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={isBackupDialogOpen}
        onClose={() => setIsBackupDialogOpen(false)}
        onConfirm={handleTriggerBackup}
        title="Create Backup"
        message="Are you sure you want to create a manual backup?"
        confirmText="Create Backup"
        type="info"
      />

      <ConfirmationDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleRestore}
        title="Restore Database"
        message={`Are you sure you want to restore from "${selectedFile?.name}"? This will overwrite all current data.`}
        confirmText="Restore"
        type="danger"
      />
    </div>
  );
};

export default BackupRestore;
