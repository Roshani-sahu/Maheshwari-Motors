import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useStore from "./store";

import Layout from "./components/layout/Layout";

// Global Components
import { Toast, ConfirmDialog, LoadingOverlay } from "./components/GlobalComponents";

// Auth Pages
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Core Pages
import Dashboard from "./pages/core/Dashboard";
import Settings from "./pages/core/Settings";
import UserProfile from "./pages/core/UserProfile";
import HelpSupportPage from "./pages/core/HelpSupportPage";

// Master Pages
import FirmMaster from "./pages/masters/FirmMaster";
import UserMaster from "./pages/masters/UserMaster";
import AccountMaster from "./pages/masters/AccountMaster";
import PartyMaster from "./pages/masters/PartyMaster";
import BrandMaster from "./pages/masters/BrandMaster";
import DiscountMaster from "./pages/masters/DiscountMaster";

// Inventory Pages
import ItemMaster from "./pages/inventory/ItemMaster";
import ItemView from "./pages/inventory/ItemView";
import AddItem from "./pages/inventory/AddItem";
import StockAlertMaster from "./pages/inventory/StockAlertMaster";
import CategoryMaster from "./pages/inventory/CategoryMaster";
import ViewCategory from "./pages/inventory/ViewCategory";
import AddSupplier from "./pages/inventory/AddSupplier";
import ViewAllSupplier from "./pages/inventory/ViewAllSupplier";

// Transaction Pages
import ChallanList from "./pages/transactions/ChallanList";
import BillList from "./pages/transactions/BillList";
import TransactionHistory from "./pages/transactions/TransactionHistory";

// Report Pages
import Reports from "./pages/reports/Reports";
import GSTReport from "./pages/reports/GSTReport";
import PurchaseReport from "./pages/reports/PurchaseReport";
import SalesReport from "./pages/reports/SalesReport";
import SalesReturnReport from "./pages/reports/SalesReturnReport";
import PurchaseReturnReport from "./pages/reports/PurchaseReturnReport";

// Setup Pages
import BackupRestore from "./pages/setup/BackupRestore";
import FinancialYearClose from "./pages/setup/FinancialYearClose";

// Components
import FirmSetup from "./components/FirmSetup";

const App = () => {
  const { toast, confirmDialog, loading, setUser, logout } = useStore();
  
  // Initialize Auth
  React.useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { default: api } = await import('./services/axiosInstance');
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error("Auth initialization failed", error);
          logout();
          localStorage.removeItem('token');
        }
      }
    };
    initAuth();
  }, [setUser, logout]);

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
          <Route path="/masters/discount-master" element={<DiscountMaster />} />
          
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
