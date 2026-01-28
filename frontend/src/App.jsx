import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import Master from "./pages/Master";
import Transactions from "./pages/Transactions";
import InventoryReports from "./pages/InventoryReports";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CompanySelection from "./pages/CompanySelection";
import AddCompany from "./pages/AddCompany";
import GenerateChallan from "./pages/GenerateChallan";
import ChallanList from "./pages/ChallanList";
import ItemMaster from "./pages/ItemMaster";
import AddItem from "./pages/AddItem";
import UserRights from "./pages/UserRights";
import AuditLogs from "./pages/AuditLogs";
import AccountMasterList from "./pages/AccountMasterList";
import GenerateBill from "./pages/GenerateBill";
import PaymentStatus from "./pages/PaymentStatus";

// Master Components
import AddAccount from "./components/masterComp/AddAccount.jsx";

// Transaction Components
import SaleEntry from "./components/transtation/Sale Entry.jsx";
import ChallanBillPosting from "./components/transtation/Challan & Bill Posting.jsx";
import ReceiptPaymentEntry from "./components/transtation/Receipt_Payment Entry.jsx";
import Payment from "./components/transtation/Payment.jsx";
import UniversalReport from "./pages/UniversalReport.jsx";

 import Settings from "./pages/SettingsPage.jsx";
 import Help from "./pages/HelpSupportPage.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ERP Layout */}
          <Route element={<Layout />}>
       
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-company" element={<AddCompany />} />
          <Route path="/generate-challan" element={<GenerateChallan />} />
          <Route path="/challan-list" element={<ChallanList />} />
          <Route path="/generate-bill" element={<GenerateBill />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/masters" element={<Master />} />
          <Route path="/account-master" element={<AccountMasterList />} />
          <Route path="/item-master" element={<ItemMaster />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/universal-reports" element={<UniversalReport />} />
          <Route path="/inventory-reports" element={<InventoryReports />} />
          <Route path="/user-rights" element={<UserRights />} />
          <Route path="/audit-logs" element={<AuditLogs />} />

           {/* Master Routes */}
           <Route path="/masters/add-account" element={<AddAccount />} />
           <Route path="/add-item" element={<AddItem />} />
          
          {/* Transaction Routes */}
          <Route path="/sale-entry" element={<SaleEntry />} />
          <Route path="/challan-posting" element={<ChallanBillPosting />} />
          <Route path="/receipt-payment" element={<ReceiptPaymentEntry />} />
          <Route path="/payment" element={<Payment />} />
          
          
          <Route path="/settings" element={<Settings />} />
          <Route path="/help-support" element={<Help />} />
        </Route>

        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/company-selection" element={<CompanySelection />} />
        {/* Fallback */}
        <Route path="*" element={<div className="p-10">404 – Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
