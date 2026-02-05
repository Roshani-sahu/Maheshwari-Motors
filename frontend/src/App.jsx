import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useStore from "./store";

import Layout from "./components/Layout";

// Global Components
import { Toast, ConfirmDialog, LoadingOverlay } from "./components/GlobalComponents";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CompanySelection from "./pages/CompanySelection";
import Reports from "./pages/Reports";
import AddItem from "./pages/AddItem";

// Master Pages
import FirmMaster from "./pages/masters/FirmMaster";
import StockAlertMaster from "./pages/masters/StockAlertMaster";
import ItemMaster from "./pages/masters/ItemMaster";
import UserMaster from "./pages/masters/UserMaster";
import AccountMaster from "./pages/masters/AccountMaster";

// Transaction Pages
import ChallanList from "./pages/transactions/ChallanList";
import BillList from "./pages/transactions/BillList";
import TransactionHistory from "./pages/transactions/TransactionHistory";

// Setup Pages
import BackupRestore from "./pages/setup/BackupRestore";
import FinancialYearClose from "./pages/setup/FinancialYearClose";

// Components
import FirmSetup from "./components/FirmSetup";

const App = () => {
  const { toast, confirmDialog, loading } = useStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/company-selection" element={<CompanySelection />} />

        {/* ERP Layout */}
        <Route element={<Layout />}>
          {/* 1. Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 2. Masters */}
          <Route path="/masters/firm-master" element={<FirmMaster />} />
          <Route path="/masters/firm-master/add" element={<FirmSetup />} />
          <Route path="/masters/firm-master/edit/:id" element={<FirmSetup />} />
          <Route path="/masters/stock-alert-master" element={<StockAlertMaster />} />
          <Route path="/masters/item-master" element={<ItemMaster />} />
          <Route path="/masters/item-master/add" element={<AddItem />} />
          <Route path="/masters/user-master" element={<UserMaster />} />
          <Route path="/masters/account-master" element={<AccountMaster />} />
          
          {/* 3. Transactions */}
          <Route path="/transactions/challan-list" element={<ChallanList />} />
          <Route path="/transactions/bill-list" element={<BillList />} />
          <Route path="/transactions/transaction-history" element={<TransactionHistory />} />
          
          {/* 4. Reports */}
          <Route path="/reports" element={<Reports />} />
          
          {/* 5. Setup & Tools */}
          <Route path="/setup/backup-restore" element={<BackupRestore />} />
          <Route path="/setup/financial-year-close" element={<FinancialYearClose />} />
          
          {/* Legacy routes - redirect to new structure */}
          <Route path="/firm-setup" element={<Navigate to="/masters/firm-master" replace />} />
          <Route path="/item-master" element={<Navigate to="/masters/item-master" replace />} />
          <Route path="/challan-list" element={<Navigate to="/transactions/challan-list" replace />} />
          <Route path="/add-item" element={<Navigate to="/masters/item-master/add" replace />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<div className="p-10">404 – Page Not Found</div>} />
      </Routes>
      
      {/* Global Components */}
      {toast && <Toast />}
      {confirmDialog && <ConfirmDialog />}
      {loading && <LoadingOverlay />}
    </BrowserRouter>
  );
};

export default App;
