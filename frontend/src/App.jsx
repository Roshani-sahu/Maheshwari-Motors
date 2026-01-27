import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import Master from "./pages/Master";
import Transactions from "./pages/Transactions";
import InventoryReports from "./pages/InventoryReports";

// Transaction Components
import SaleEntry from "./components/transtation/Sale Entry.jsx";
import ChallanBillPosting from "./components/transtation/Challan & Bill Posting.jsx";
import ReceiptPaymentEntry from "./components/transtation/Receipt_Payment Entry.jsx";
import Payment from "./components/transtation/Payment.jsx";

// import Reports from "./pages/Reports";
// import Settings from "./pages/Settings";
// import Help from "./pages/Help";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ERP Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/masters" element={<Master />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/inventory-reports" element={<InventoryReports />} />
          
          {/* Transaction Routes */}
          <Route path="/sale-entry" element={<SaleEntry />} />
          <Route path="/challan-posting" element={<ChallanBillPosting />} />
          <Route path="/receipt-payment" element={<ReceiptPaymentEntry />} />
          <Route path="/payment" element={<Payment />} />
          
          {/* <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} /> */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<div className="p-10">404 – Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
