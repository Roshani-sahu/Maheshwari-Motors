import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create(devtools((set, get) => ({
  // Auth State
  user: null,
  isAuthenticated: false,
  
  // Firm Context
  selectedFirm: null,
  firms: [],
  
  // Financial Year
  financialYear: { start: "2025-04-01", end: "2026-03-31", label: "2025-26" },
  
  // UI State
  loading: false,
  toast: null,
  confirmDialog: null,
  
  // Masters Data
  accounts: [],
  items: [],
  firms: [],
  users: [],
  groups: [],
  units: [],
  hsn: [],
  agents: [],
  transporters: [],
  books: [],
  
  // Transaction Data
  challans: [],
  bills: [],
  transactions: [],
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, selectedFirm: null }),
  
  setFirm: (firm) => set({ selectedFirm: firm }),
  setFirms: (firms) => set({ firms }),
  addFirm: (firm) => set((state) => ({ firms: [...state.firms, firm] })),
  updateFirm: (id, updatedFirm) => set((state) => ({
    firms: state.firms.map(firm => (firm._id || firm.id) === id ? updatedFirm : firm)
  })),
  deleteFirm: (id) => set((state) => ({
    firms: state.firms.filter(firm => (firm._id || firm.id) !== id)
  })),
  
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, updatedUser) => set((state) => ({
    users: state.users.map(user => (user._id || user.id) === id ? updatedUser : user)
  })),
  deleteUser: (id) => set((state) => ({
    users: state.users.filter(user => (user._id || user.id) !== id)
  })),
  
  setLoading: (loading) => set({ loading }),
  
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
  
  showConfirm: (message, onConfirm, onCancel) => set({ 
    confirmDialog: { message, onConfirm, onCancel } 
  }),
  hideConfirm: () => set({ confirmDialog: null }),
  
  // Data setters
  setAccounts: (accounts) => set({ accounts }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ 
    items: [...state.items, { ...item, id: state.items.length + 1 }] 
  })),
  updateItem: (id, updatedItem) => set((state) => ({
    items: state.items.map(item => (item._id || item.id) === id ? updatedItem : item)
  })),
  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => (item._id || item.id) !== id)
  })),
  setGroups: (groups) => set({ groups }),
  setUnits: (units) => set({ units }),
  setHsn: (hsn) => set({ hsn }),
  setAgents: (agents) => set({ agents }),
  setTransporters: (transporters) => set({ transporters }),
  setBooks: (books) => set({ books }),
  setChallans: (challans) => set({ challans }),
  addChallan: (challan) => set((state) => ({ challans: [challan, ...state.challans] })),
  updateChallan: (id, updated) => set((state) => ({
    challans: state.challans.map(c => c.id === id ? { ...c, ...updated } : c)
  })),
  setBills: (bills) => set({ bills }),
  setTransactions: (transactions) => set({ transactions }),
  
  addBill: (bill) => {
    console.log('Adding bill to store:', bill);
    set((state) => ({ bills: [...state.bills, bill] }));
  },
  removeBill: (billId) => set((state) => ({
    bills: state.bills.filter(b => b.id !== billId)
  })),
  addTransaction: (transaction) => {
    console.log('Adding transaction to store:', transaction);
    set((state) => ({ transactions: [...state.transactions, transaction] }));
  },
  removeChallans: (challanIds) => set((state) => ({
    challans: state.challans.filter(c => !challanIds.includes(c.id))
  })),
})));

export default useStore;