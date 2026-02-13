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
// import CompanySelection from "./pages/CompanySelection";
import Reports from "./pages/Reports";
import AddItem from "./pages/AddItem";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

// Master Pages
import FirmMaster from "./pages/masters/FirmMaster";
import StockAlertMaster from "./pages/masters/StockAlertMaster";
import ItemMaster from "./pages/masters/ItemMaster";
import ItemView from "./pages/masters/ItemView";
import CategoryMaster from "./pages/masters/CategoryMaster";
import ViewCategory from "./pages/masters/ViewCategory";
import AddSupplier from "./pages/masters/AddSupplier";
import ViewAllSupplier from "./pages/masters/ViewAllSupplier";
import UserMaster from "./pages/masters/UserMaster";
import AccountMaster from "./pages/masters/AccountMaster";
import PartyMaster from "./pages/PartyMaster";
import BrandMaster from "./pages/masters/BrandMaster";

// Transaction Pages
import ChallanList from "./pages/transactions/ChallanList";
import BillList from "./pages/transactions/BillList";
import TransactionHistory from "./pages/transactions/TransactionHistory";

//Reports
import GSTReport from "./pages/reports/GSTReport";
import PurchaseReport from "./pages/reports/PurchaseReport";
import SalesReport from "./pages/reports/SalesReport";
import SalesReturnReport from "./pages/reports/SalesReturnReport";
import PurchaseReturnReport from "./pages/reports/PurchaseReturnReport";

// Setup Pages
import BackupRestore from "./pages/setup/BackupRestore";
import FinancialYearClose from "./pages/setup/FinancialYearClose";

import HelpSupportPage from "./pages/HelpSupportPage";  

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
        {/* <Route path="/company-selection" element={<CompanySelection />} /> */}

        {/* Master Routes (No Layout) */}
        <Route path="/masters/user-master" element={<UserMaster />} />

        {/* ERP Layout */}
        <Route element={<Layout />}>
          {/* 1. Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 2. Masters */}
          <Route path="/masters/firm-master" element={<FirmMaster />} />
          <Route path="/masters/firm-master/add" element={<FirmSetup />} />
          <Route path="/masters/firm-master/edit/:id" element={<FirmSetup />} />
          <Route path="/inventory/stock-alert-master" element={<StockAlertMaster />} />
          <Route path="/inventory/item-master" element={<ItemMaster />} />
          <Route path="/inventory/item-view" element={<ItemView />} />
          <Route path="/inventory/category-master" element={<CategoryMaster />} />
          <Route path="/inventory/view-category" element={<ViewCategory />} />
          <Route path="/inventory/add-supplier" element={<AddSupplier />} />
          <Route path="/inventory/view-all-supplier" element={<ViewAllSupplier />} />
          <Route path="/masters/item-master/add" element={<AddItem />} />
          <Route path="/masters/account-master" element={<AccountMaster />} />
          <Route path="/masters/party-master" element={<PartyMaster />} />
          <Route path="/masters/brand-master" element={<BrandMaster />} />
          
          {/* 3. Transactions */}
          <Route path="/transactions/challan-list" element={<ChallanList />} />
          <Route path="/transactions/bill-list" element={<BillList />} />
          <Route path="/transactions/transaction-history" element={<TransactionHistory />} />
          
          {/* 4. Reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/purchase-report" element={<PurchaseReport />} />
          <Route path="/reports/gst-report" element={<GSTReport />} />
          <Route path="/reports/sales-report" element={<SalesReport />} />
          <Route path="/reports/sales-return-report" element={<SalesReturnReport />} />
          <Route path="/reports/purchase-return-report" element={<PurchaseReturnReport />} />
          
          {/* 5. Setup & Tools */}
          <Route path="/setup/backup-restore" element={<BackupRestore />} />
          <Route path="/setup/financial-year-close" element={<FinancialYearClose />} />
          
          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/user-profile" element={<UserProfile />} />
          
          {/* Legacy routes - redirect to new structure */}
          <Route path="/firm-setup" element={<Navigate to="/masters/firm-master" replace />} />
          <Route path="/item-master" element={<Navigate to="/inventory/item-master" replace />} />
          <Route path="/challan-list" element={<Navigate to="/transactions/challan-list" replace />} />
          <Route path="/add-item" element={<Navigate to="/masters/item-master/add" replace />} />



          {/* Help & Support */}
          <Route path="/help-support" element={<HelpSupportPage />} />
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
