import {
  FaBookOpen,
  FaHome,
  FaDatabase,
  FaExchangeAlt,
  FaChartPie,
  FaCog,
  FaQuestionCircle,
  FaBuilding,
  FaFileInvoiceDollar,
  FaListUl,
  FaUserShield,
  FaHistory,
  FaUsers,
  FaReceipt,
  FaMoneyBillWave,
  FaEye,
  FaTags,
  FaList,
  FaUserPlus,
  FaUserCog,
  FaBell
} from "react-icons/fa";

export const sidebarConfig = {
  admin: [
    {
      title: "Masters",
      icon: FaBuilding, // Placeholder icon
      children: [
        {
          title: "User Master",
          path: "/masters/user-master",
          icon: FaUsers,
        },
        {
          title: "Firm Master", // Added for Admin to manage firms as implied logic
          path: "/masters/firm-master",
          icon: FaBuilding,
        },
      ],
    },
  ],
  gst: [
    {
      title: "Inventory",
      icon: FaBuilding,
      children: [
        {
          title: "Item Management",
          path: "/inventory/item-master",
          icon: FaBuilding,
        },
        {
          title: "Item View",
          path: "/inventory/item-view",
          icon: FaEye,
        },
        {
          title: "Category Master",
          path: "/inventory/category-master",
          icon: FaTags,
        },
        {
          title: "View Category",
          path: "/inventory/view-category",
          icon: FaList,
        },
        {
          title: "Add Supplier",
          path: "/inventory/add-supplier",
          icon: FaUserPlus,
        },
        {
          title: "View All Supplier",
          path: "/inventory/view-all-supplier",
          icon: FaUserCog,
        },
      ],
    },
    {
      title: "Accounts",
      icon: FaDatabase,
      children: [
        {
          title: "GST Account",
          path: "/masters/account-master",
          icon: FaDatabase,
        },
      ],
    },
    {
      title: "Transactions",
      icon: FaListUl,
      children: [
        {
          title: "GST Challan",
          path: "/transactions/challan-list",
          icon: FaListUl,
        },
        {
          title: "GST Bills",
          path: "/transactions/bill-list",
          icon: FaReceipt,
        },
        {
          title: "Transaction History",
          path: "/transactions/transaction-history",
          icon: FaHistory,
        },
      ],
    },
    {
      title: "Reports",
      icon: FaChartPie,
      children: [
        {
          title: "GST Report",
          path: "/reports/gst-report",
          icon: FaFileInvoiceDollar,
        },
        {
          title: "Purchase Report (GST)",
          path: "/reports/purchase-report",
          icon: FaFileInvoiceDollar,
        },
        {
          title: "Sales Report (GST)",
          path: "/reports/sales-report",
          icon: FaFileInvoiceDollar,
        },
        {
          title: "Sales Return Report",
          path: "/reports/sales-return-report",
          icon: FaFileInvoiceDollar,
        },
        {
          title: "Purchase Return Report",
          path: "/reports/purchase-return-report",
          icon: FaFileInvoiceDollar,
        },
      ],
    },
     {
      title: "Setup & Tools",
      icon: FaCog, // Placeholder
      children: [
        {
          title: "Backup / Restore",
          path: "/setup/backup-restore",
          icon: FaReceipt,
        },
        {
          title: "Financial Year Close",
          path: "/setup/financial-year-close",
          icon: FaReceipt,
        },
      ],
    }
  ],
  nongst: [
    {
      title: "Inventory",
      icon: FaBuilding,
      children: [
        {
          title: "Item Management",
          path: "/inventory/item-master",
          icon: FaBuilding,
        },
        {
          title: "Item View",
          path: "/inventory/item-view",
          icon: FaEye,
        },
        {
          title: "Category Master",
          path: "/inventory/category-master",
          icon: FaTags,
        },
        {
          title: "View Category",
          path: "/inventory/view-category",
          icon: FaList,
        },
        {
          title: "Add Supplier",
          path: "/inventory/add-supplier",
          icon: FaUserPlus,
        },
        {
          title: "View All Supplier",
          path: "/inventory/view-all-supplier",
          icon: FaUserCog,
        },
      ],
    },
    {
      title: "Accounts",
      icon: FaDatabase,
      children: [
        {
          title: "Non-GST Account",
          path: "/masters/account-master",
          icon: FaDatabase,
        },
      ],
    },
    {
      title: "Transactions",
      icon: FaListUl,
      children: [
        {
          title: "Non-GST Challan",
          path: "/transactions/challan-list",
          icon: FaListUl,
        },
        {
          title: "Non-GST Bills",
          path: "/transactions/bill-list",
          icon: FaReceipt,
        },
         {
          title: "Transaction History",
          path: "/transactions/transaction-history",
          icon: FaHistory,
        },
      ],
    },
    {
      title: "Reports",
      icon: FaChartPie,
      children: [
         // Non-GST won't have GST Report
        {
          title: "Purchase Report (Non-GST)",
          path: "/reports/purchase-report",
          icon: FaFileInvoiceDollar,
        },
        {
          title: "Sales Report (Non-GST)",
          path: "/reports/sales-report",
          icon: FaFileInvoiceDollar,
        },
         {
          title: "Sales Return Report",
          path: "/reports/sales-return-report",
          icon: FaFileInvoiceDollar,
        },
        {
          title: "Purchase Return Report",
          path: "/reports/purchase-return-report",
          icon: FaFileInvoiceDollar,
        },
      ],
    },
    {
      title: "Setup & Tools",
      icon: FaCog,
      children: [
        {
          title: "Backup / Restore",
          path: "/setup/backup-restore",
          icon: FaReceipt,
        },
        {
          title: "Financial Year Close",
          path: "/setup/financial-year-close",
          icon: FaReceipt,
        },
      ],
    }
  ],
};
