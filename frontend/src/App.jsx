import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
// import Masters from "./pages/Masters";
// import Transactions from "./pages/Transactions";
// import Reports from "./pages/Reports";
// import InventoryReports from "./pages/InventoryReports";
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
          {/* <Route path="/masters" element={<Masters />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/inventory-reports" element={<InventoryReports />} />
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
