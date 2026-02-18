# Maheshwari Motors - ERP System
## Complete Project Documentation

**Version:** 1.0.0  
**Date:** January 2025  
**Developed By:** Royal IT Company  
**Client:** Maheshwari Motors

---

## 📋 Executive Summary

Maheshwari Motors ERP is a comprehensive, multi-user inventory management and billing software designed specifically for automotive businesses. The system supports dual-firm operations (GST and Non-GST) with advanced stock management, transaction processing, and reporting capabilities.

---

## 🎯 Key Highlights

- **Multi-Firm Support**: Manage both GST and Non-GST firms simultaneously
- **Real-Time Stock Management**: Unified stock tracking across all firms
- **Advanced Billing System**: Challan-to-Bill conversion workflow
- **Comprehensive Reports**: GST reports, sales/purchase analytics, and ledgers
- **User Role Management**: Admin and firm-level access controls

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend
- **Framework**: React 19.2.0
- **Styling**: Tailwind CSS 3.4.19
- **State Management**: Zustand 4.5.7
- **Routing**: React Router DOM 7.13.0
- **Form Handling**: React Hook Form 7.71.1
- **Charts**: Recharts 3.7.0
- **HTTP Client**: Axios 1.13.4
- **PDF Generation**: jsPDF 4.1.0
- **Build Tool**: Vite 7.2.4

#### Backend
- **Runtime**: Node.js with Express 5.2.1
- **Database**: MongoDB with Mongoose 9.1.6
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.3
- **File Upload**: Multer 2.0.2
- **Cloud Storage**: AWS S3 SDK 3.985.0

---

## ✨ Features Developed

### 1. Authentication & Authorization Module

#### 1.1 User Authentication
- **Multi-Level Login System**
  - Admin login for main users
  - Separate GST firm login
  - Separate Non-GST firm login
  - JWT token-based authentication
  - Secure password hashing with bcrypt

#### 1.2 User Management
- **User Types**
  - Main users (with admin access)
  - Secondary users (firm-level access only)
- **User Profile Management**
  - View and edit user details
  - Change password functionality
  - Profile picture upload (AWS S3)

#### 1.3 Session Management
- Automatic token refresh
- Session tracking
- Secure logout functionality

---

### 2. Master Data Management

#### 2.1 Firm Master
- **Dual Firm Setup**
  - GST Firm configuration
  - Non-GST Firm configuration
- **Firm Details**
  - Business name and contact information
  - Address and godown address
  - GSTIN, CIN, Registration number
  - Bank details (name, branch, IFSC, account number)
  - Separate credentials for each firm

#### 2.2 Party/Account Master
- **Party Management**
  - Add, edit, delete parties
  - Auto-incrementing party ID
  - Contact details (phone, email)
  - Address information (city, state)
  - GSTIN for GST parties
  - Balance tracking
  - Search and filter functionality

#### 2.3 Item Master
- **Excel-Like Grid Interface**
  - Inline editing capabilities
  - Keyboard navigation (Tab, Enter)
  - Auto-save on blur
- **Item Details**
  - Auto-incrementing item ID
  - Item name
  - Sale rate, purchase rate, MRP
  - GST percentage
  - Discount configuration
  - Stock quantity tracking
  - Threshold/reorder level
  - GST/Non-GST classification
  - Image upload (AWS S3)
- **Item Associations**
  - Category linking
  - Brand linking
  - Supplier linking
- **Bulk Operations**
  - Import/export functionality
  - Mass updates

#### 2.4 Category Master
- **Category Management**
  - Create and manage product categories
  - Auto-incrementing category ID
  - Category name and description
  - Hierarchical category structure support
  - Search and filter

#### 2.5 Brand Master
- **Brand Management**
  - Add, edit, delete brands
  - Auto-incrementing brand ID
  - Brand name and description
  - Logo upload
  - Search functionality

#### 2.6 Supplier Master
- **Supplier Management**
  - Supplier details (name, contact)
  - Address information
  - GSTIN for GST suppliers
  - Email and phone
  - Balance tracking
  - Search and filter

#### 2.7 Discount Master
- **Discount Configuration**
  - Create discount schemes
  - Percentage-based discounts
  - Fixed amount discounts
  - Date range validity
  - Item-specific or category-specific
  - Auto-apply rules

#### 2.8 User Master
- **User Administration**
  - Create secondary users
  - Assign firm access
  - Set user permissions
  - Activate/deactivate users
  - User role management

---

### 3. Transaction Management

#### 3.1 Challan Entry System
- **Challan Creation**
  - Auto-generated challan numbers
  - Date selection
  - Party selection
  - GST/Non-GST type selection
  - Multiple item addition
- **Item Details in Challan**
  - Item search and selection
  - Quantity (PCS) input
  - Rate configuration
  - Discount percentage
  - Special discount
  - Discount amount calculation
  - GST percentage (for GST challans)
  - GST amount calculation
  - Line-wise amount calculation
- **Challan Calculations**
  - Gross total
  - Subtotal after discounts
  - Total discount amount
  - GST calculations (CGST/SGST/IGST)
  - Final amount
- **Stock Validation**
  - Real-time stock checking
  - Prevent overselling
  - Stock reservation on challan creation
- **Challan Management**
  - Save as draft
  - Edit existing challans
  - Delete challans
  - View challan list
  - Search and filter challans

#### 3.2 Bill Generation
- **Bill Creation from Challans**
  - Select multiple challans
  - Merge challans into single bill
  - Auto-generated bill numbers
  - Date selection
  - Party auto-populated from challan
- **Bill Details**
  - Challan references
  - Total amount calculation
  - Payment status tracking
  - Due amount calculation
- **Bill Management**
  - View bill list
  - Edit bills
  - Delete bills
  - Print bills (PDF)
  - Email bills to parties

#### 3.3 Purchase Entry
- **Purchase Recording**
  - Supplier selection
  - Purchase date
  - Invoice number
  - Item-wise purchase details
  - Rate and quantity
  - GST calculations
  - Total amount
- **Stock Updates**
  - Automatic stock increment
  - Purchase rate updates
  - Supplier linking

#### 3.4 Transaction History
- **Comprehensive Transaction Log**
  - All transactions in one view
  - Filter by type (challan, bill, purchase)
  - Date range filtering
  - Party-wise filtering
  - Amount range filtering
  - Export to Excel/PDF

---

### 4. Inventory Management

#### 4.1 Stock Management
- **Unified Stock System**
  - Single physical stock across firms
  - Real-time stock updates
  - Stock reservation for challans
  - Stock release on bill cancellation
- **Stock Tracking**
  - Current stock levels
  - Reserved stock
  - Available stock
  - Stock movements history

#### 4.2 Stock Alerts
- **Low Stock Alerts**
  - Threshold-based alerts
  - Reorder level notifications
  - Alert dashboard
  - Email notifications
- **Stock Alert Configuration**
  - Set item-wise thresholds
  - Configure alert recipients
  - Alert frequency settings

#### 4.3 Item View
- **Detailed Item Information**
  - Complete item details
  - Stock history
  - Transaction history
  - Price history
  - Supplier information
  - Category and brand details

---

### 5. Reporting Module

#### 5.1 GST Reports
- **GSTR-1 Report**
  - B2B invoices
  - B2C invoices
  - HSN-wise summary
  - Document summary
- **GSTR-3B Report**
  - Outward supplies
  - Inward supplies
  - Tax liability
  - ITC available
- **GST Summary**
  - Period-wise GST collection
  - CGST, SGST, IGST breakdown
  - Tax payable summary

#### 5.2 Sales Reports
- **Sales Summary**
  - Date range selection
  - Party-wise sales
  - Item-wise sales
  - Category-wise sales
  - Brand-wise sales
- **Sales Analytics**
  - Daily/monthly/yearly trends
  - Top-selling items
  - Top customers
  - Sales growth charts
- **Challan Reports**
  - Pending challans
  - Converted challans
  - Challan-wise details

#### 5.3 Purchase Reports
- **Purchase Summary**
  - Supplier-wise purchases
  - Item-wise purchases
  - Date range filtering
  - Amount analysis
- **Purchase Analytics**
  - Purchase trends
  - Top suppliers
  - Cost analysis

#### 5.4 Sales Return Reports
- **Return Tracking**
  - Return date and details
  - Item-wise returns
  - Party-wise returns
  - Return amount summary
  - Credit note generation

#### 5.5 Purchase Return Reports
- **Purchase Return Tracking**
  - Supplier-wise returns
  - Item-wise returns
  - Debit note generation
  - Return amount summary

#### 5.6 Universal Report
- **Customizable Reports**
  - Select data fields
  - Custom date ranges
  - Multiple filter options
  - Export to Excel/PDF
  - Save report templates

---

### 6. Dashboard & Analytics

#### 6.1 Main Dashboard
- **Key Metrics**
  - Today's sales
  - Monthly sales
  - Yearly sales
  - Total outstanding
  - Low stock items count
  - Pending challans
- **Visual Analytics**
  - Sales trend charts (Recharts)
  - Category-wise distribution
  - Top items chart
  - Payment status pie chart
- **Quick Actions**
  - Create challan
  - Create bill
  - Add party
  - Add item
- **Recent Activities**
  - Latest transactions
  - Recent bills
  - Recent challans

---

### 7. Settings & Configuration

#### 7.1 User Settings
- **Profile Management**
  - Update personal information
  - Change password
  - Profile picture upload
  - Email preferences

#### 7.2 System Settings
- **General Settings**
  - Company logo upload
  - Invoice prefix configuration
  - Date format settings
  - Currency settings
- **Print Settings**
  - Invoice template selection
  - Print layout configuration
  - Header/footer customization

#### 7.3 Backup & Restore
- **Data Backup**
  - Manual backup creation
  - Scheduled backups
  - Backup to cloud (AWS S3)
  - Download backup files
- **Data Restore**
  - Upload backup file
  - Restore from cloud
  - Selective restore options

#### 7.4 Financial Year Close
- **Year-End Processing**
  - Close financial year
  - Opening balance transfer
  - Archive old data
  - Generate year-end reports

---

### 8. Help & Support

#### 8.1 Help Documentation
- **User Guides**
  - Getting started guide
  - Feature-wise tutorials
  - Video tutorials
  - FAQ section

#### 8.2 Support System
- **Support Tickets**
  - Create support tickets
  - Track ticket status
  - Chat support integration
  - Email support

---

## 🔐 Security Features

### Authentication Security
- JWT token-based authentication
- Secure password hashing (bcrypt)
- Token expiration and refresh
- Session management

### Data Security
- Role-based access control
- Firm-level data isolation
- Encrypted password storage
- Secure API endpoints

### File Security
- AWS S3 secure file storage
- Pre-signed URLs for file access
- File type validation
- Size limit enforcement

---

## 📊 Business Logic Implementation

### GST Compliance Rules
1. **Non-GST Purchase Restriction**
   - Items purchased without GST cannot be sold through GST firm
   - Validation at challan creation level

2. **GST Purchase Flexibility**
   - Items purchased with GST can be sold through both GST and Non-GST firms
   - Automatic GST calculation adjustment

3. **GSTIN Validation**
   - Format validation for GSTIN
   - State code verification

### Stock Management Rules
1. **Unified Stock Ledger**
   - Single physical stock across all firms
   - Real-time stock synchronization

2. **Stock Reservation**
   - Stock reserved on challan creation
   - Released on challan deletion
   - Deducted on bill generation

3. **Negative Stock Prevention**
   - Real-time validation
   - Alert on insufficient stock

### Billing Workflow
1. **Challan-First Approach**
   - Mandatory challan creation before billing
   - Multiple challans can be merged into one bill

2. **Credit Management**
   - Return value becomes customer credit
   - Auto-application to next bill
   - Credit balance tracking

---

## 🎨 User Interface Features

### Responsive Design
- Desktop-optimized layout
- Tablet-friendly interface
- Touch-friendly controls

### User Experience
- Intuitive navigation
- Quick search functionality
- Keyboard shortcuts
- Auto-save functionality
- Toast notifications
- Confirmation dialogs
- Loading states
- Error handling

### Data Grid Features
- Excel-like editing
- Inline validation
- Keyboard navigation
- Sorting and filtering
- Pagination
- Export functionality

---

## 📱 Supported Browsers

- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+

---

## 🚀 Deployment Information

### Frontend Deployment
- Platform: Vercel
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: Configured in Vercel dashboard

### Backend Deployment
- Platform: Vercel Serverless Functions
- Entry Point: `api/index.js`
- Database: MongoDB Atlas
- File Storage: AWS S3

---

## 📈 Performance Metrics

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **File Upload**: Supports up to 5MB
- **Concurrent Users**: Supports 100+ users

---

## 🔄 Future Enhancements (Roadmap)

### Phase 2 Features
- Mobile application (iOS/Android)
- WhatsApp integration for bills
- SMS notifications
- Barcode scanning
- QR code payments
- Multi-language support

### Phase 3 Features
- AI-powered demand forecasting
- Automated reordering
- Customer portal
- Vendor portal
- Advanced analytics with ML

---

## 📞 Support & Maintenance

### Support Channels
- **Email**: support@royalitcompany.com
- **Phone**: [Contact Number]
- **Support Hours**: Monday-Saturday, 9 AM - 6 PM

### Maintenance Schedule
- **Regular Updates**: Monthly
- **Security Patches**: As needed
- **Backup Frequency**: Daily automated backups
- **Data Retention**: 7 years

---

## 📝 Training & Documentation

### Training Provided
- Initial system training (2 days)
- User manual (PDF)
- Video tutorials
- On-site support (first week)

### Documentation Delivered
- User manual
- Admin guide
- API documentation
- Database schema
- Deployment guide

---

## ⚖️ Terms & Conditions

### License
- Single-client license
- Unlimited users within organization
- Source code ownership: Royal IT Company
- Usage rights: Maheshwari Motors

### Warranty
- 90 days bug-fix warranty
- 1 year technical support
- Free updates for 1 year

---

## 📋 Appendix

### A. Database Schema
- Users Collection
- Items Collection
- Parties Collection
- Challans Collection
- Bills Collection
- Categories Collection
- Brands Collection
- Suppliers Collection
- Transactions Collection
- Stock Alerts Collection

### B. API Endpoints
- Authentication APIs
- Master Data APIs
- Transaction APIs
- Report APIs
- Dashboard APIs
- Settings APIs

### C. Environment Variables
- Frontend: `VITE_API_URL`
- Backend: `MONGODB_URI`, `JWT_SECRET`, `AWS_*`

---

## ✅ Project Completion Checklist

- [x] Authentication & Authorization
- [x] User Management
- [x] Firm Master
- [x] Party Master
- [x] Item Master
- [x] Category Master
- [x] Brand Master
- [x] Supplier Master
- [x] Discount Master
- [x] Challan Entry
- [x] Bill Generation
- [x] Purchase Entry
- [x] Transaction History
- [x] Stock Management
- [x] Stock Alerts
- [x] GST Reports
- [x] Sales Reports
- [x] Purchase Reports
- [x] Dashboard & Analytics
- [x] Settings & Configuration
- [x] Backup & Restore
- [x] Help & Support
- [x] Responsive Design
- [x] AWS S3 Integration
- [x] PDF Generation
- [x] Excel Export

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Prepared By**: Royal IT Company  
**Approved By**: [Client Name]

---

*This document is confidential and proprietary to Maheshwari Motors and Royal IT Company.*
