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
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, selectedFirm: null }),
  
  setFirm: (firm) => set({ selectedFirm: firm }),
  setFirms: (firms) => set({ firms }),
  addFirm: (firm) => set((state) => ({ firms: [...state.firms, firm] })),
  updateFirm: (id, updatedFirm) => set((state) => ({
    firms: state.firms.map(firm => firm.id === id ? updatedFirm : firm)
  })),
  
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, updatedUser) => set((state) => ({
    users: state.users.map(user => user.id === id ? updatedUser : user)
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
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updatedItem) => set((state) => ({
    items: state.items.map(item => item.id === id ? updatedItem : item)
  })),
  setGroups: (groups) => set({ groups }),
  setUnits: (units) => set({ units }),
  setHsn: (hsn) => set({ hsn }),
  setAgents: (agents) => set({ agents }),
  setTransporters: (transporters) => set({ transporters }),
  setBooks: (books) => set({ books }),
  setChallans: (challans) => set({ challans }),
  setBills: (bills) => set({ bills }),
})));

export default useStore;