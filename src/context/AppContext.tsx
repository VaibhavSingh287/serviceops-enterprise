import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  JobCard,
  Customer,
  Equipment,
  InventoryItem,
  AuditLogEntry,
  StockMovement,
} from '../types';
import {
  SYSTEM_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_EQUIPMENT,
  INITIAL_INVENTORY,
  INITIAL_JOB_CARDS,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  token: string | null;
  isLoadingAuth: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;

  users: User[];
  customers: Customer[];
  equipment: Equipment[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  refreshStockMovements: () => Promise<void>;
  addInventoryItem: (data: Omit<InventoryItem, 'id'>) => Promise<boolean>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  adjustStock: (id: string, newQty: number, reason: string, adjustmentDelta?: number) => Promise<boolean>;
  jobCards: JobCard[];
  auditLogs: AuditLogEntry[];
  refreshAuditLogs: () => Promise<void>;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  activeJobCardId: string | null;
  setActiveJobCardId: (id: string | null) => void;

  // Job Card Actions
  openJobCard: (id: string) => void;
  createNewJobCard: (customerId?: string, equipmentId?: string) => Promise<JobCard | null>;
  saveJobCardDraft: (jobCard: JobCard) => Promise<void>;
  submitJobCard: (id: string) => Promise<boolean>;
  approveJobCard: (id: string, notes?: string) => Promise<boolean>;
  requestChanges: (id: string, sections: string[], comments: string) => Promise<boolean>;
  rejectJobCard: (id: string, reason: string, comments: string) => Promise<boolean>;
  deleteJobCard: (id: string) => void;

  // Document Generator Modal State
  documentJobCard: JobCard | null;
  setDocumentJobCard: (jc: JobCard | null) => void;

  // Mobile Navigation
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;

  // Notifications
  notifications: Array<{ id: string; title: string; message: string; timestamp: string; read: boolean }>;
  markNotificationRead: (id: string) => void;

  // Toast
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'serviceops_auth_token_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [users, setUsers] = useState<User[]>(SYSTEM_USERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeJobCardId, setActiveJobCardId] = useState<string | null>(null);
  const [documentJobCard, setDocumentJobCard] = useState<JobCard | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const toggleMobileNav = useCallback(() => setIsMobileNavOpen((prev) => !prev), []);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Operations System Online',
      message: 'RBAC Authorization & Team Hierarchy active.',
      timestamp: 'Just now',
      read: false,
    },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch all scoped master data from backend using current auth token
  const refreshData = useCallback(async () => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return;

    try {
      const headers = {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      };

      const [jcRes, usersRes, invRes, custRes, eqRes, audRes, movRes] = await Promise.all([
        fetch('/api/jobcards', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/inventory', { credentials: 'same-origin' }),
        fetch('/api/customers', { credentials: 'same-origin' }),
        fetch('/api/equipment', { credentials: 'same-origin' }),
        fetch('/api/audit-logs', { headers }),
        fetch('/api/inventory/movements', { headers }),
      ]);

      if (jcRes.ok) {
        const jcData = await jcRes.json();
        setJobCards(jcData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData);
      }

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }

      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipment(eqData);
      }

      if (audRes.ok) {
        const audData = await audRes.json();
        setAuditLogs(audData);
      }

      if (movRes.ok) {
        const movData = await movRes.json();
        setStockMovements(movData);
      }
    } catch (err) {
      console.error('Error fetching scoped data:', err);
    }
  }, [token]);

  const refreshAuditLogs = useCallback(async () => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return;
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to refresh audit logs', err);
    }
  }, [token]);

  const refreshStockMovements = useCallback(async () => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return;
    try {
      const res = await fetch('/api/inventory/movements', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStockMovements(data);
      }
    } catch (err) {
      console.error('Failed to refresh stock movements', err);
    }
  }, [token]);

  const addInventoryItem = async (data: Omit<InventoryItem, 'id'>): Promise<boolean> => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return false;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to add inventory item', 'error');
        return false;
      }

      const newItem = await res.json();
      setInventory((prev) => [...prev, newItem]);
      await refreshAuditLogs();
      await refreshStockMovements();
      showToast(`Added SKU ${newItem.partNumber} to inventory`, 'success');
      return true;
    } catch (err) {
      console.error('Failed to add inventory item', err);
      showToast('Network error adding inventory item', 'error');
      return false;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return false;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update inventory item', 'error');
        return false;
      }

      const data = await res.json();
      const updatedItem: InventoryItem = data.item ? data.item : data;
      if (updatedItem && typeof updatedItem === 'object' && updatedItem.id) {
        setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)));
      }
      await refreshStockMovements();
      await refreshAuditLogs();
      showToast(`Updated SKU ${updatedItem?.partNumber || ''}`, 'success');
      return true;
    } catch (err) {
      console.error('Failed to update inventory item', err);
      showToast('Network error updating inventory item', 'error');
      return false;
    }
  };

  const adjustStock = async (
    id: string,
    newQty: number,
    reason: string,
    adjustmentDelta?: number
  ): Promise<boolean> => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return false;
    try {
      const payload: { newQty: number; reason: string; adjustment?: number } = {
        newQty,
        reason,
      };
      if (adjustmentDelta !== undefined && !isNaN(adjustmentDelta)) {
        payload.adjustment = adjustmentDelta;
      }

      const res = await fetch(`/api/inventory/${id}/adjust-stock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to adjust stock', 'error');
        return false;
      }

      const data = await res.json();
      const updatedItem: InventoryItem = data.item ? data.item : data;
      if (updatedItem && typeof updatedItem === 'object' && updatedItem.id) {
        setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)));
      }
      if (data.movement) {
        setStockMovements((prev) => [data.movement, ...prev]);
      }
      await refreshStockMovements();
      await refreshAuditLogs();
      showToast(`Stock updated for ${updatedItem?.partNumber || 'item'} to ${updatedItem?.availableQty ?? newQty}`, 'success');
      return true;
    } catch (err) {
      console.error('Failed to adjust stock', err);
      showToast('Network error adjusting stock', 'error');
      return false;
    }
  };

  // Authenticate Session on mount or token change (supports both HttpOnly cookie & Bearer token)
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const savedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);

      try {
        const headers: Record<string, string> = {};
        if (savedToken) {
          headers.Authorization = `Bearer ${savedToken}`;
        }

        const res = await fetch('/api/auth/me', {
          headers,
          credentials: 'same-origin',
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCurrentUser(data.user);
            setToken(savedToken || 'cookie-session');
          }
        } else {
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
          if (isMounted) {
            setToken(null);
            setCurrentUser(null);
          }
        }
      } catch (e) {
        console.error('Auth verification failed', e);
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // When currentUser is established, load the scoped data
  useEffect(() => {
    if (currentUser && token) {
      refreshData();
    }
  }, [currentUser, token, refreshData]);

  // Real authentication login call against server
  const login = async (userId: string, passwordAttempt: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: passwordAttempt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Authentication failed', 'error');
        return false;
      }

      const { user, token: newToken } = await res.json();
      sessionStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setToken(newToken);
      setCurrentUser(user);
      setActiveTab('home');
      setActiveJobCardId(null);
      showToast(`Welcome back, ${user.name} (${user.role})!`, 'success');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      showToast('Network error while authenticating', 'error');
      return false;
    }
  };

  // Secure logout
  const logout = async () => {
    const currentToken = token || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (e) {
        console.warn('Logout notification to backend failed', e);
      }
    }
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    setJobCards([]);
    setActiveJobCardId(null);
    showToast('Session ended. You have signed out.', 'info');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const openJobCard = (id: string) => {
    setActiveJobCardId(id);
  };

  // Server-authoritative Job Card Creation
  const createNewJobCard = async (customerId?: string, equipmentId?: string): Promise<JobCard | null> => {
    if (!token) return null;

    try {
      const res = await fetch('/api/jobcards', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          equipmentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to create Job Card', 'error');
        return null;
      }

      const newCard: JobCard = await res.json();
      setJobCards((prev) => [newCard, ...prev]);
      setActiveJobCardId(newCard.id);
      showToast(`New Job Card ${newCard.id} created`);
      return newCard;
    } catch (err) {
      console.error('Error creating job card:', err);
      showToast('Error creating Job Card', 'error');
      return null;
    }
  };

  // Save Job Card Draft
  const saveJobCardDraft = async (updated: JobCard) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/jobcards/${updated.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to save changes', 'error');
        return;
      }

      const savedCard: JobCard = await res.json();
      setJobCards((prev) => prev.map((jc) => (jc.id === savedCard.id ? savedCard : jc)));
    } catch (err) {
      console.error('Error saving job card:', err);
      showToast('Error saving Job Card', 'error');
    }
  };

  // Submit Job Card for Review (Field Engineer)
  const submitJobCard = async (id: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`/api/jobcards/${id}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Submission failed', 'error');
        return false;
      }

      const updatedCard: JobCard = await res.json();
      setJobCards((prev) => prev.map((jc) => (jc.id === id ? updatedCard : jc)));
      showToast(`Job Card ${id} submitted for Manager review!`, 'success');
      return true;
    } catch (err) {
      console.error('Error submitting job card:', err);
      showToast('Error submitting Job Card', 'error');
      return false;
    }
  };

  // Approve Job Card (Manager / Admin with Team Authorization)
  const approveJobCard = async (id: string, notes?: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`/api/jobcards/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Approval rejected by authorization policy', 'error');
        return false;
      }

      const updatedCard: JobCard = await res.json();
      setJobCards((prev) => prev.map((jc) => (jc.id === id ? updatedCard : jc)));
      showToast(`Job Card ${id} has been Approved!`, 'success');
      return true;
    } catch (err) {
      console.error('Error approving job card:', err);
      showToast('Error approving Job Card', 'error');
      return false;
    }
  };

  // Request Changes on Job Card
  const requestChanges = async (id: string, sections: string[], comments: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`/api/jobcards/${id}/request-changes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections, notes: comments }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to request changes', 'error');
        return false;
      }

      const updatedCard: JobCard = await res.json();
      setJobCards((prev) => prev.map((jc) => (jc.id === id ? updatedCard : jc)));
      showToast(`Changes requested for Job Card ${id}`, 'warning');
      return true;
    } catch (err) {
      console.error('Error requesting changes:', err);
      showToast('Error requesting changes', 'error');
      return false;
    }
  };

  // Reject Job Card
  const rejectJobCard = async (id: string, reason: string, comments: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`/api/jobcards/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: `${reason}${comments ? `: ${comments}` : ''}` }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Rejection failed', 'error');
        return false;
      }

      const updatedCard: JobCard = await res.json();
      setJobCards((prev) => prev.map((jc) => (jc.id === id ? updatedCard : jc)));
      showToast(`Job Card ${id} was Rejected`, 'error');
      return true;
    } catch (err) {
      console.error('Error rejecting job card:', err);
      showToast('Error rejecting Job Card', 'error');
      return false;
    }
  };

  const deleteJobCard = (id: string) => {
    setJobCards((prev) => prev.filter((jc) => jc.id !== id));
    if (activeJobCardId === id) setActiveJobCardId(null);
    showToast(`Job Card ${id} deleted`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        token,
        isLoadingAuth,
        login,
        logout,
        refreshData,
        users,
        customers,
        equipment,
        inventory,
        stockMovements,
        refreshStockMovements,
        addInventoryItem,
        updateInventoryItem,
        adjustStock,
        jobCards,
        auditLogs,
        refreshAuditLogs,
        activeTab,
        setActiveTab,
        activeJobCardId,
        setActiveJobCardId,
        openJobCard,
        createNewJobCard,
        saveJobCardDraft,
        submitJobCard,
        approveJobCard,
        requestChanges,
        rejectJobCard,
        deleteJobCard,
        documentJobCard,
        setDocumentJobCard,
        isMobileNavOpen,
        setIsMobileNavOpen,
        toggleMobileNav,
        notifications,
        markNotificationRead,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
