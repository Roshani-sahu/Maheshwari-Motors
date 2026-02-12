# Icon Import Fixes

## Issue
White screen caused by incorrect react-icons/fa imports. The icons used were from Font Awesome 6 but the package has Font Awesome 5.

## Fixed Icons

### Sidebar.jsx
- `FaHouse` → `FaHome`
- `FaUsersGear` → `FaUserCog`
- `FaListCheck` → `FaListUl`
- `FaCircleQuestion` → `FaQuestionCircle`

### Login.jsx
- `FaCircleExclamation` → `FaExclamationCircle`

### CompanySelection.jsx
- `FaBuildingUser` → `FaBuilding`
- `FaMagnifyingGlass` → `FaSearch`

### BackupRestore.jsx
- `FaClockRotateLeft` → `FaHistory`

### FinancialYearClose.jsx
- `FaCalendarXmark` → `FaCalendarTimes`
- `FaCircleInfo` → `FaInfoCircle`
- `FaCircleCheck` → `FaCheckCircle`

## How to Run

```bash
cd frontend
npm run dev
```

Your app should now load without white screen!
