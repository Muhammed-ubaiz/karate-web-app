import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  INITIAL_DOJOS,
  INITIAL_BATCHES,
  INITIAL_FEE_PLANS,
  INITIAL_BELT_RANKS,
  INITIAL_STUDENTS,
  INITIAL_ACTIVITIES
} from '../data/mockData';
import { isFirebaseConfigured } from '../config/firebase';
import {
  fetchDojosFromFirestore,
  saveDojoToFirestore,
  updateDojoInFirestore,
  deleteDojoFromFirestore,
  fetchBatchesFromFirestore,
  saveBatchToFirestore,
  updateBatchInFirestore,
  deleteBatchFromFirestore,
  fetchFeePlansFromFirestore,
  saveFeePlanToFirestore,
  updateFeePlanInFirestore,
  deleteFeePlanFromFirestore,
  fetchBeltRanksFromFirestore,
  saveBeltRankToFirestore,
  deleteBeltRankFromFirestore,
  fetchStudentsFromFirestore,
  saveStudentToFirestore,
  updateStudentInFirestore,
  deleteStudentFromFirestore,
  subscribeToCollection,
  COL_STUDENTS,
  COL_FEE_PLANS,
  COL_BELT_RANKS,
  COL_BATCHES,
  COL_DOJOS,
  COL_PAYMENTS,
  COL_ATTENDANCE,
  COL_ACTIVITIES,
  recordBatchAttendanceToFirestore,
  fetchBatchAttendanceFromFirestore,
  deleteBatchAttendanceFromFirestore,
  clearAllAttendanceFromFirestore,
  recordPaymentToFirestore,
  updatePaymentInFirestore,
  deletePaymentFromFirestore,
  logActivityToFirestore
} from '../services/firebaseService';
import { calculateNextDueDate, formatDisplayDate, normalizeDateToISO } from '../utils/whatsappHelper';
import {
  showToastAlert,
  showSuccessAlert,
  showConfirmDialog,
  showErrorAlert
} from '../utils/sweetAlert';

// Accurate Attendance Calculation Helper for all-time stats
export const calculateStudentAttendanceStats = (studentId, history = []) => {
  if (!studentId || !Array.isArray(history)) {
    return {
      totalSessions: 0,
      attended: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 100,
      lastAttendedDate: null
    };
  }

  let totalSessions = 0;
  let present = 0;
  let absent = 0;
  let late = 0;
  let lastAttendedDate = null;

  history.forEach(session => {
    const status = session.records?.[studentId];
    if (status) {
      totalSessions += 1;
      if (status === 'Present') {
        present += 1;
      } else if (status === 'Late') {
        late += 1;
      } else if (status === 'Absent') {
        absent += 1;
      }

      if (status === 'Present' || status === 'Late') {
        if (!lastAttendedDate || session.date > lastAttendedDate) {
          lastAttendedDate = session.date;
        }
      }
    }
  });

  const attended = present + late;
  const attendanceRate = totalSessions > 0
    ? Math.round((attended / totalSessions) * 100)
    : 100;

  return {
    totalSessions,
    attended,
    present,
    absent,
    late,
    attendanceRate,
    lastAttendedDate
  };
};

// Accurate Month-wise Attendance Calculation Helper
export const calculateStudentMonthlyAttendanceStats = (studentId, history = [], year = null, month = null) => {
  if (!studentId || !Array.isArray(history)) {
    return {
      totalSessions: 0,
      attended: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 100,
      records: []
    };
  }

  const records = [];
  let totalSessions = 0;
  let present = 0;
  let absent = 0;
  let late = 0;

  history.forEach(session => {
    const status = session.records?.[studentId];
    if (!status) return;

    if (year !== null && month !== null && year !== '' && month !== '') {
      const parts = (session.date || '').split('-');
      if (parts.length < 2) return;
      const sYear = parseInt(parts[0], 10);
      const sMonth = parseInt(parts[1], 10);
      if (sYear !== Number(year) || sMonth !== Number(month)) return;
    }

    totalSessions += 1;
    if (status === 'Present') present += 1;
    else if (status === 'Late') late += 1;
    else if (status === 'Absent') absent += 1;

    records.push({
      id: `${session.id || session.batchId + '_' + session.date}_${studentId}`,
      sessionId: session.id || `att-${session.batchId}_${session.date}`,
      date: session.date,
      batchId: session.batchId,
      batchName: session.batchName || 'Training Session',
      dojoId: session.dojoId,
      status,
      isGuest: Array.isArray(session.guestStudentIds) && session.guestStudentIds.includes(studentId),
      notes: session.notes || '',
      timestamp: session.timestamp
    });
  });

  records.sort((a, b) => new Date(b.date) - new Date(a.date));

  const attended = present + late;
  const attendanceRate = totalSessions > 0
    ? Math.round((attended / totalSessions) * 100)
    : 100;

  return {
    totalSessions,
    attended,
    present,
    absent,
    late,
    attendanceRate,
    records
  };
};

// Safe timestamp conversion helper (supports ISO strings, Date, Firestore Timestamps)
export const toIsoTimestamp = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val instanceof Date) return isNaN(val.getTime()) ? '' : val.toISOString();
  if (typeof val?.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      return '';
    }
  }
  if (typeof val?.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  return '';
};

export const formatActivityTimeDisplay = (isoStr) => {
  const iso = toIsoTimestamp(isoStr) || new Date().toISOString();
  try {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch {}
  return 'Just now';
};

export const normalizeBillKey = (val) => String(val || '').trim().toUpperCase();

export const extractBillSequence = (billStr) => {
  const str = String(billStr || '').trim();
  if (!str) return 0;
  const billMatch = str.match(/^BILL-(\d+)$/i);
  if (billMatch) return parseInt(billMatch[1], 10) || 0;
  const numericMatch = str.match(/^0*(\d{1,5})$/);
  if (numericMatch) return parseInt(numericMatch[1], 10) || 0;
  return 0;
};

export const formatBillSerial = (seqNum) => {
  const safeNum = Math.max(1, Number(seqNum) || 1);
  return `BILL-${String(safeNum).padStart(4, '0')}`;
};

export const normalizePaymentRecord = (p) => {
  if (!p) return p;
  const bill = String(p.billNumber || p.receiptNumber || '').trim();
  const createdAtIso = toIsoTimestamp(p.createdAt) || toIsoTimestamp(p.updatedAt) || new Date().toISOString();
  return {
    ...p,
    billNumber: bill,
    receiptNumber: bill,
    status: p.status || 'Active',
    createdAt: createdAtIso
  };
};

export const sortPaymentsDesc = (list = []) => {
  const getPayTime = (p) => {
    const normDate = p?.paymentDate ? normalizeDateToISO(p.paymentDate) : '';
    const dateVal = /^\d{4}-\d{2}-\d{2}$/.test(normDate)
      ? normDate
      : (p?.paymentDate || toIsoTimestamp(p?.createdAt) || 0);
    return new Date(dateVal).getTime() || 0;
  };
  return [...list].sort((a, b) => {
    const dateA = getPayTime(a);
    const dateB = getPayTime(b);
    if (dateB !== dateA) return dateB - dateA;
    const createdA = new Date(toIsoTimestamp(a?.createdAt) || 0).getTime() || 0;
    const createdB = new Date(toIsoTimestamp(b?.createdAt) || 0).getTime() || 0;
    return createdB - createdA;
  });
};

export const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getPaymentMonthKey = (payment) => {
  if (!payment) return '';
  const normDate = payment.paymentDate ? normalizeDateToISO(payment.paymentDate) : '';
  if (/^\d{4}-\d{2}/.test(normDate)) {
    return normDate.slice(0, 7);
  }
  const isoCreated = toIsoTimestamp(payment.createdAt);
  if (/^\d{4}-\d{2}/.test(isoCreated)) {
    return isoCreated.slice(0, 7);
  }
  return '';
};

export const formatMonthKeyLabel = (monthKey) => {
  if (!monthKey || monthKey === 'unknown') return 'Unspecified Month';
  if (monthKey === 'all') return 'All Months (Month-by-Month)';
  const match = String(monthKey).match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(monthKey);
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return String(monthKey);
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};

export const shiftMonthKey = (monthKey, delta = 0) => {
  const base = /^\d{4}-\d{2}$/.test(String(monthKey || ''))
    ? String(monthKey)
    : getCurrentMonthKey();
  const [y, m] = base.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const groupPaymentsByMonth = (paymentList = []) => {
  if (!Array.isArray(paymentList) || paymentList.length === 0) return [];
  const sorted = sortPaymentsDesc(paymentList.map(normalizePaymentRecord));
  const groupsMap = new Map();

  sorted.forEach((p) => {
    const key = getPaymentMonthKey(p) || 'unknown';
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key).push(p);
  });

  return Array.from(groupsMap.entries())
    .sort(([a], [b]) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return b.localeCompare(a);
    })
    .map(([monthKey, transactions]) => {
      const validTransactions = transactions.filter((t) => t.status !== 'Reset');
      const totalCollected = validTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      return {
        monthKey,
        monthLabel: formatMonthKeyLabel(monthKey),
        transactions,
        totalCollected,
        validCount: validTransactions.length,
        resetCount: transactions.length - validTransactions.length,
        totalCount: transactions.length
      };
    });
};

const DojoContext = createContext();

export const DojoProvider = ({ children, initialFeesSubTab = 'plans' }) => {
  // Load from LocalStorage or use defaults
  const [dojos, setDojos] = useState(() => {
    const saved = localStorage.getItem('sensei_dojos');
    return saved ? JSON.parse(saved) : INITIAL_DOJOS;
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('sensei_batches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => ({
            ...b,
            scheduleDays: Array.isArray(b.scheduleDays) ? b.scheduleDays : ['Mon', 'Wed', 'Fri']
          }));
        }
      } catch {}
    }
    return INITIAL_BATCHES;
  });

  const [feePlans, setFeePlans] = useState(() => {
    const saved = localStorage.getItem('sensei_fee_plans');
    return saved ? JSON.parse(saved) : INITIAL_FEE_PLANS;
  });

  const [beltRanks, setBeltRanks] = useState(() => {
    const saved = localStorage.getItem('sensei_belt_ranks');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return INITIAL_BELT_RANKS;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('sensei_students');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return INITIAL_STUDENTS;
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('sensei_payments');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizePaymentRecord);
      } catch {}
    }
    return [];
  });

  const [attendanceHistory, setAttendanceHistory] = useState(() => {
    const saved = localStorage.getItem('sensei_attendance_history');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('sensei_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // Dedicated permanent audit log for payment creations, edits/corrections, resets, and deletions
  const [paymentAuditLogs, setPaymentAuditLogs] = useState(() => {
    const saved = localStorage.getItem('sensei_payment_audit_logs');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Selected active branch filter ("all" or specific dojoId)
  const [selectedDojoId, setSelectedDojoId] = useState('all');

  // Active view: 'dashboard' | 'attendance' | 'students' | 'fees' | 'batches' | 'dojos'
  const [activeTab, setActiveTab] = useState('dashboard');
  // Sub-tab inside Fees & Billing: 'plans' | 'ledger' | 'logs'
  const [activeFeesSubTab, setActiveFeesSubTab] = useState(initialFeesSubTab);

  // Active user / role: 'Admin' | 'Sensei' | 'Staff'
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('sensei_is_admin') === 'true';
  });
  const isAdminRef = useRef(isAdmin);
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  const [authorizedStaffName, setAuthorizedStaffName] = useState(() => {
    return localStorage.getItem('sensei_staff_name') || 'Admin';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null);
  const [adminPromptMessage, setAdminPromptMessage] = useState('');
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('sensei_is_admin') === 'true' ? 'Admin' : 'Sensei';
  });

  const loginAdmin = (username, password) => {
    const cleanUser = (username || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    // Primary Required Master Credentials:
    // Username: admin@gmail.com
    // Password: 2Akjhy@555##d
    const isMasterUser = cleanUser === 'admin@gmail.com' || cleanUser === 'admin';
    const isMasterPass = cleanPass === '2Akjhy@555##d' || cleanPass === 'admin';

    const customPass = localStorage.getItem('sensei_custom_admin_pass');
    const isCustomPass = customPass && cleanPass === customPass.trim();

    if (isMasterUser && (isMasterPass || isCustomPass)) {
      isAdminRef.current = true;
      setIsAdmin(true);
      setCurrentRole('Admin');
      const staffLabel = cleanUser === 'admin@gmail.com' ? 'Admin (Master)' : 'Admin';
      setAuthorizedStaffName(staffLabel);
      localStorage.setItem('sensei_is_admin', 'true');
      localStorage.setItem('sensei_staff_name', staffLabel);
      return true;
    }
    return false;
  };

  const loginWithPin = (pin) => {
    const cleanPin = (pin || '').trim();
    const customPin = localStorage.getItem('sensei_custom_admin_pin') || '1234';
    const validPins = [customPin, '1234', '0000', '1111', 'admin'];

    if (validPins.includes(cleanPin)) {
      isAdminRef.current = true;
      setIsAdmin(true);
      setCurrentRole('Admin');
      setAuthorizedStaffName('Authorized Staff');
      localStorage.setItem('sensei_is_admin', 'true');
      localStorage.setItem('sensei_staff_name', 'Authorized Staff');
      return true;
    }
    return false;
  };

  const changeAdminPassword = (newPass) => {
    if (!newPass || newPass.trim().length < 3) {
      showToast('Password must be at least 3 characters', 'error');
      return false;
    }
    localStorage.setItem('sensei_custom_admin_pass', newPass.trim());
    showToast('Admin master passcode updated successfully!', 'success');
    return true;
  };

  const quickAdminLogin = () => {
    isAdminRef.current = true;
    setIsAdmin(true);
    setCurrentRole('Admin');
    setAuthorizedStaffName('Admin');
    localStorage.setItem('sensei_is_admin', 'true');
    localStorage.setItem('sensei_staff_name', 'Admin');
    showToast('Logged in as Administrator (Full Access)! 👑', 'success');
  };

  const logoutAdmin = () => {
    isAdminRef.current = false;
    setIsAdmin(false);
    setCurrentRole('Sensei');
    localStorage.removeItem('sensei_is_admin');
    showToast('Switched to View-Only (Guest) mode. 🔒', 'info');
  };

  const toggleAdminMode = () => {
    if (isAdminRef.current) {
      logoutAdmin();
    } else {
      setAdminPromptMessage('');
      setIsAdminLoginOpen(true);
    }
  };

  const closeAdminLoginModal = () => {
    setIsAdminLoginOpen(false);
    setPendingAdminAction(null);
    setAdminPromptMessage('');
  };

  const requireAdmin = (actionCallback, promptMessage = '') => {
    if (isAdminRef.current) {
      if (typeof actionCallback === 'function') actionCallback();
      return true;
    }
    setPendingAdminAction(() => actionCallback);
    setAdminPromptMessage(promptMessage || '');
    setIsAdminLoginOpen(true);
    return false;
  };

  // Modals state
  const [modalState, setModalState] = useState({
    addDojo: false,
    addBatch: false,
    addFeePlan: false,
    addStudent: false,
    recordPayment: false,
    viewStudent: null,
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Automatic clean state sync - Ensures clean slate for newly configured academies
  useEffect(() => {
    const isCleaned = localStorage.getItem('sensei_clean_v15');
    if (!isCleaned) {
      localStorage.setItem('sensei_clean_v15', 'true');
      localStorage.setItem('sensei_belt_ranks', JSON.stringify([]));
      setBeltRanks([]);
    }

    // Auto-sync cleared attendance state
    const isAttendanceCleared = localStorage.getItem('sensei_attendance_cleared_v1');
    if (!isAttendanceCleared) {
      localStorage.setItem('sensei_attendance_cleared_v1', 'true');
      localStorage.setItem('sensei_attendance_history', JSON.stringify([]));
      setAttendanceHistory([]);
    }
  }, []);

  const clearActivities = () => {
    if (!isAdminRef.current) {
      showErrorAlert('Authorization Required 🔒', 'Only authorized staff / administrators can clear the dashboard activity feed.');
      return false;
    }
    const clearedAt = new Date().toISOString();
    localStorage.setItem('sensei_feed_cleared_at', clearedAt);
    setActivities([]);
    localStorage.setItem('sensei_activities', JSON.stringify([]));
    showToast('Dashboard activity feed cleared! Payment audit logs remain preserved.', 'info');
    return true;
  };

  const resetAllDataToCleanSlate = () => {
    localStorage.clear();
    localStorage.setItem('sensei_clean_v12', 'true');
    setDojos(INITIAL_DOJOS);
    setBatches(INITIAL_BATCHES);
    setFeePlans(INITIAL_FEE_PLANS);
    setStudents([]);
    localStorage.setItem('sensei_students', JSON.stringify([]));
    setPayments([]);
    localStorage.setItem('sensei_payments', JSON.stringify([]));
    setPaymentAuditLogs([]);
    localStorage.setItem('sensei_payment_audit_logs', JSON.stringify([]));
    setActivities(INITIAL_ACTIVITIES);
    localStorage.setItem('sensei_activities', JSON.stringify(INITIAL_ACTIVITIES));
    setSelectedDojoId('all');
    showToast('Clean academy reset complete! Ready to enroll students.', 'success');
  };

  const loadDemoStudent = async () => {
    // Demo student permanently disabled upon user request
    showToast('Demo student has been removed from system.', 'info');
  };

  // Real-time bidirectional sync with Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // Seed initial master structures on first run if cloud is empty
    const initCloudData = async () => {
      try {
        const cloudDojos = await fetchDojosFromFirestore();
        if (!cloudDojos || cloudDojos.length === 0) {
          for (const d of INITIAL_DOJOS) await saveDojoToFirestore(d).catch(console.error);
          for (const b of INITIAL_BATCHES) await saveBatchToFirestore(b).catch(console.error);
          for (const p of INITIAL_FEE_PLANS) await saveFeePlanToFirestore(p).catch(console.error);
        }

        // Purge old belts from Firestore if requested, giving a 100% clean slate
        const hasPurgedOldBelts = localStorage.getItem('sensei_purged_old_belts_v3');
        if (!hasPurgedOldBelts) {
          const cloudBelts = await fetchBeltRanksFromFirestore();
          if (cloudBelts && cloudBelts.length > 0) {
            for (const b of cloudBelts) {
              if (b.id) await deleteBeltRankFromFirestore(b.id).catch(() => {});
            }
          }
          localStorage.setItem('sensei_purged_old_belts_v3', 'true');
          setBeltRanks([]);
          localStorage.setItem('sensei_belt_ranks', JSON.stringify([]));
        }

        // Search for and permanently purge all demo students from Firestore
        const allStudents = await fetchStudentsFromFirestore();
        if (allStudents && allStudents.length > 0) {
          for (const s of allStudents) {
            const isDemo =
              (s.id && s.id.includes('demo')) ||
              s.phone === '9072958753' ||
              s.phone === '7034296606' ||
              s.whatsapp === '9072958753' ||
              s.whatsapp === '7034296606' ||
              (s.fullName && s.fullName.toLowerCase().includes('demo')) ||
              (s.fullName && s.fullName.toLowerCase().includes('ayaan'));

            if (isDemo) {
              await deleteStudentFromFirestore(s.id).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('Initial Firestore seed check:', err);
      }
    };

    initCloudData();

    // Live real-time Firestore listeners across all devices
    const unsubStudents = subscribeToCollection(COL_STUDENTS, (cloudStudents) => {
      if (cloudStudents) {
        const cleanList = cloudStudents.filter(s => {
          const isDemo =
            (s.id && s.id.includes('demo')) ||
            s.phone === '9072958753' ||
            s.phone === '7034296606' ||
            s.whatsapp === '9072958753' ||
            s.whatsapp === '7034296606' ||
            (s.fullName && s.fullName.toLowerCase().includes('demo')) ||
            (s.fullName && s.fullName.toLowerCase().includes('ayaan'));

          if (isDemo) {
            deleteStudentFromFirestore(s.id).catch(() => {});
            return false;
          }
          return true;
        });

        setStudents(cleanList);
        localStorage.setItem('sensei_students', JSON.stringify(cleanList));
      }
    });

    const unsubFeePlans = subscribeToCollection(COL_FEE_PLANS, (cloudPlans) => {
      if (cloudPlans) setFeePlans(cloudPlans);
    });

    const unsubBelts = subscribeToCollection(COL_BELT_RANKS, (cloudBelts) => {
      if (cloudBelts) {
        const sorted = [...cloudBelts].sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0));
        setBeltRanks(sorted);
      }
    });

    const unsubBatches = subscribeToCollection(COL_BATCHES, (cloudBatches) => {
      if (cloudBatches && cloudBatches.length > 0) {
        setBatches(cloudBatches.map(b => ({
          ...b,
          scheduleDays: Array.isArray(b.scheduleDays) ? b.scheduleDays : ['Mon', 'Wed', 'Fri']
        })));
      }
    });

    const unsubDojos = subscribeToCollection(COL_DOJOS, (cloudDojos) => {
      if (cloudDojos && cloudDojos.length > 0) setDojos(cloudDojos);
    });

    const unsubPayments = subscribeToCollection(COL_PAYMENTS, (cloudPayments) => {
      if (cloudPayments) {
        const normalized = sortPaymentsDesc(cloudPayments.map(normalizePaymentRecord));
        setPayments(normalized);
        localStorage.setItem('sensei_payments', JSON.stringify(normalized));
      }
    });

    const unsubAttendance = subscribeToCollection(COL_ATTENDANCE, (cloudAttendance) => {
      if (cloudAttendance) {
        setAttendanceHistory(cloudAttendance);
        localStorage.setItem('sensei_attendance_history', JSON.stringify(cloudAttendance));
      }
    });

    const unsubActivities = subscribeToCollection(COL_ACTIVITIES, (cloudActivities) => {
      if (cloudActivities && cloudActivities.length > 0) {
        const normalizedActs = cloudActivities.map(a => {
          const iso = toIsoTimestamp(a.createdAtIso || a.serverCreatedAt || a.createdAt) || '';
          return {
            ...a,
            createdAtIso: iso,
            timestamp: a.timestamp && a.timestamp !== 'Just now' ? a.timestamp : (iso ? formatActivityTimeDisplay(iso) : 'Just now')
          };
        }).sort((a, b) => {
          const tA = new Date(a.createdAtIso || 0).getTime() || 0;
          const tB = new Date(b.createdAtIso || 0).getTime() || 0;
          return tB - tA;
        });

        const clearedAt = localStorage.getItem('sensei_feed_cleared_at');
        const clearedTime = clearedAt ? new Date(clearedAt).getTime() : 0;
        const visibleFeed = clearedTime > 0
          ? normalizedActs.filter(a => (new Date(a.createdAtIso || 0).getTime() || 0) > clearedTime)
          : normalizedActs;

        setActivities(visibleFeed.slice(0, 100));
        localStorage.setItem('sensei_activities', JSON.stringify(visibleFeed.slice(0, 100)));

        // Merge payment audit logs permanently (never filtered by feed clear)
        const cloudPaymentLogs = normalizedActs.filter(
          a => a.type === 'payment' || (a.actionType && a.actionType.startsWith('payment_'))
        );
        if (cloudPaymentLogs.length > 0) {
          setPaymentAuditLogs(prev => {
            const byId = new Map();
            [...cloudPaymentLogs, ...prev].forEach(item => {
              if (item?.id && !byId.has(item.id)) {
                byId.set(item.id, item);
              }
            });
            const merged = Array.from(byId.values()).sort((a, b) => {
              const tA = new Date(a.createdAtIso || 0).getTime() || 0;
              const tB = new Date(b.createdAtIso || 0).getTime() || 0;
              return tB - tA;
            }).slice(0, 500);
            localStorage.setItem('sensei_payment_audit_logs', JSON.stringify(merged));
            return merged;
          });
        }
      }
    });

    return () => {
      unsubStudents();
      unsubFeePlans();
      unsubBelts();
      unsubBatches();
      unsubDojos();
      unsubPayments();
      unsubAttendance();
      unsubActivities();
    };
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('sensei_dojos', JSON.stringify(dojos));
  }, [dojos]);

  useEffect(() => {
    localStorage.setItem('sensei_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('sensei_fee_plans', JSON.stringify(feePlans));
  }, [feePlans]);

  useEffect(() => {
    localStorage.setItem('sensei_belt_ranks', JSON.stringify(beltRanks));
  }, [beltRanks]);

  useEffect(() => {
    localStorage.setItem('sensei_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('sensei_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('sensei_attendance_history', JSON.stringify(attendanceHistory));
  }, [attendanceHistory]);

  useEffect(() => {
    localStorage.setItem('sensei_payment_audit_logs', JSON.stringify(paymentAuditLogs));
  }, [paymentAuditLogs]);

  // Ensure students have 100% mathematically accurate attendance rates calculated from actual recorded history
  useEffect(() => {
    if (students && students.length > 0) {
      let hasChanges = false;
      const history = Array.isArray(attendanceHistory) ? attendanceHistory : [];
      const updatedStudents = students.map(s => {
        const stats = calculateStudentAttendanceStats(s.id, history);
        const targetRate = stats.totalSessions > 0 ? stats.attendanceRate : 100;
        const targetLastDate = stats.totalSessions > 0 ? stats.lastAttendedDate : null;

        if (s.attendanceRate !== targetRate || (s.lastAttendedDate || null) !== targetLastDate) {
          hasChanges = true;
          return {
            ...s,
            attendanceRate: targetRate,
            lastAttendedDate: targetLastDate
          };
        }
        return s;
      });

      if (hasChanges) {
        setStudents(updatedStudents);
        localStorage.setItem('sensei_students', JSON.stringify(updatedStudents));
      }
    }
  }, [attendanceHistory]);

  useEffect(() => {
    localStorage.setItem('sensei_activities', JSON.stringify(activities));
  }, [activities]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const addActivity = async (text, type = 'general', icon = 'Activity', metadata = {}) => {
    const nowIso = new Date().toISOString();
    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      timestamp: formatActivityTimeDisplay(nowIso),
      createdAtIso: nowIso,
      type,
      icon,
      badgeColor: metadata.badgeColor || (
        type === 'attendance' ? 'text-emerald-400' :
        type === 'payment' ? 'text-amber-400' :
        type === 'student' ? 'text-blue-400' : 'text-red-400'
      ),
      ...metadata
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 99)]);

    if (type === 'payment' || (metadata.actionType && metadata.actionType.startsWith('payment_'))) {
      setPaymentAuditLogs(prev => {
        const next = [newActivity, ...prev.slice(0, 499)];
        localStorage.setItem('sensei_payment_audit_logs', JSON.stringify(next));
        return next;
      });
    }

    if (isFirebaseConfigured) {
      await logActivityToFirestore(newActivity).catch(console.error);
    }
    return newActivity;
  };

  // Add Dojo
  const addDojo = async (dojoData) => {
    const newDojo = {
      ...dojoData,
      id: `dojo-${Date.now()}`,
      studentCount: 0,
      batchesCount: 0,
      logo: dojoData.logo || '🥋'
    };
    setDojos(prev => [newDojo, ...prev]);
    addActivity(`New Dojo branch created: ${newDojo.name}`, 'general', 'Building');
    showToast(`Dojo branch "${newDojo.name}" created successfully!`);

    if (isFirebaseConfigured) {
      await saveDojoToFirestore(newDojo).catch(console.error);
    }
  };

  // Update Dojo
  const updateDojo = async (id, updatedData) => {
    setDojos(prev => prev.map(d => d.id === id ? { ...d, ...updatedData } : d));
    showToast('Dojo branch updated successfully!');

    if (isFirebaseConfigured) {
      await updateDojoInFirestore(id, updatedData).catch(console.error);
    }
  };

  // Delete Dojo
  const deleteDojo = async (id) => {
    const target = dojos.find(d => d.id === id);
    setDojos(prev => prev.filter(d => d.id !== id));
    showToast(`Dojo "${target?.name || ''}" removed.`, 'info');

    if (isFirebaseConfigured) {
      await deleteDojoFromFirestore(id).catch(console.error);
    }
  };

  // Add Batch
  const addBatch = async (batchData) => {
    const newBatch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      enrolledCount: 0
    };
    setBatches(prev => [newBatch, ...prev]);
    setDojos(prev => prev.map(d => d.id === newBatch.dojoId ? { ...d, batchesCount: d.batchesCount + 1 } : d));
    addActivity(`New Batch added: ${newBatch.name}`, 'general', 'Calendar');
    showToast(`Batch "${newBatch.name}" created successfully!`);

    if (isFirebaseConfigured) {
      await saveBatchToFirestore(newBatch).catch(console.error);
    }
  };

  // Update Batch
  const updateBatch = async (batchId, updatedData) => {
    const existing = batches.find(b => b.id === batchId);
    if (!existing) return false;

    // Recalculate dojos batch count if dojoId changed
    if (updatedData.dojoId && updatedData.dojoId !== existing.dojoId) {
      setDojos(prev => prev.map(d => {
        if (d.id === existing.dojoId) return { ...d, batchesCount: Math.max(0, d.batchesCount - 1) };
        if (d.id === updatedData.dojoId) return { ...d, batchesCount: d.batchesCount + 1 };
        return d;
      }));
    }

    const merged = { ...existing, ...updatedData };
    setBatches(prev => {
      const next = prev.map(b => b.id === batchId ? merged : b);
      localStorage.setItem('sensei_batches', JSON.stringify(next));
      return next;
    });

    addActivity(`Class Batch updated: ${merged.name}`, 'general', 'Calendar');
    showToast(`Batch "${merged.name}" updated successfully!`, 'success');

    if (isFirebaseConfigured) {
      await updateBatchInFirestore(batchId, updatedData).catch(console.error);
    }
    return true;
  };

  // Delete Batch
  const deleteBatch = async (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return false;

    // Auto-unassign students enrolled in this batch so deleting is never blocked
    const enrolledStudents = students.filter(s => s.batchId === batchId);
    if (enrolledStudents.length > 0) {
      setStudents(prev => {
        const updated = prev.map(s => s.batchId === batchId ? { ...s, batchId: '', batchName: 'Unassigned' } : s);
        localStorage.setItem('sensei_students', JSON.stringify(updated));
        return updated;
      });

      if (isFirebaseConfigured) {
        for (const s of enrolledStudents) {
          saveStudentToFirestore({ ...s, batchId: '', batchName: 'Unassigned' }).catch(console.error);
        }
      }
    }

    setBatches(prev => {
      const remaining = prev.filter(b => b.id !== batchId);
      localStorage.setItem('sensei_batches', JSON.stringify(remaining));
      return remaining;
    });

    // Update dojo's batchesCount
    if (batch.dojoId) {
      setDojos(prev => prev.map(d => d.id === batch.dojoId ? { ...d, batchesCount: Math.max(0, d.batchesCount - 1) } : d));
    }

    addActivity(`Batch removed: ${batch.name}`, 'general', 'Trash2');
    showToast(`Batch "${batch.name}" deleted.`, 'info');

    if (isFirebaseConfigured) {
      await deleteBatchFromFirestore(batchId).catch(console.error);
    }
    return true;
  };

  // Add Fee Plan
  const addFeePlan = async (planData) => {
    const newPlan = {
      ...planData,
      id: `plan-${Date.now()}`
    };
    if (newPlan.isDefault) {
      setFeePlans(prev => prev.map(p => ({ ...p, isDefault: false })).concat(newPlan));
    } else {
      setFeePlans(prev => [newPlan, ...prev]);
    }
    addActivity(`New Fee Structure created: ${newPlan.name}`, 'payment', 'CreditCard');
    showToast(`Fee Plan "${newPlan.name}" created!`);

    if (isFirebaseConfigured) {
      await saveFeePlanToFirestore(newPlan).catch(console.error);
    }
  };

  // Update Fee Plan
  const updateFeePlan = async (planId, updatedData) => {
    setFeePlans(prev => {
      return prev.map(p => {
        if (p.id === planId) {
          return { ...p, ...updatedData };
        }
        if (updatedData.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      });
    });

    addActivity(`Fee Structure updated: ${updatedData.name || 'Fee Plan'}`, 'payment', 'CreditCard');
    showToast(`Fee Plan "${updatedData.name}" updated successfully!`, 'success');

    if (isFirebaseConfigured) {
      await updateFeePlanInFirestore(planId, updatedData).catch(console.error);
    }
  };

  // Delete Fee Plan
  const deleteFeePlan = async (planId) => {
    const plan = feePlans.find(p => p.id === planId);
    if (!plan) return false;

    const enrolledStudents = students.filter(s => s.tuitionPlanId === planId);
    if (enrolledStudents.length > 0) {
      showErrorAlert(
        'Cannot Delete Plan',
        `There are ${enrolledStudents.length} students currently assigned to "${plan.name}". Please reassign them to another fee plan first.`
      );
      return false;
    }

    setFeePlans(prev => prev.filter(p => p.id !== planId));
    addActivity(`Fee Plan removed: ${plan.name}`, 'payment', 'Trash2');
    showToast(`Fee Plan "${plan.name}" deleted.`, 'info');

    if (isFirebaseConfigured) {
      await deleteFeePlanFromFirestore(planId).catch(console.error);
    }
    return true;
  };

  // Bill Number Helpers (Physical Bill Book Serial Tracking)
  const advanceBillSerial = (billStr) => {
    const seq = extractBillSequence(billStr);
    if (seq > 0) {
      const currentStored = parseInt(localStorage.getItem('sensei_last_bill_serial') || '0', 10) || 0;
      if (seq > currentStored) {
        localStorage.setItem('sensei_last_bill_serial', String(seq));
      }
    }
  };

  const getNextBillNumber = (extraExcludePayments = null) => {
    const paymentList = Array.isArray(extraExcludePayments) ? extraExcludePayments : payments;
    const storedSerial = parseInt(localStorage.getItem('sensei_last_bill_serial') || '0', 10) || 0;

    let maxSeq = storedSerial;
    paymentList.forEach(p => {
      const seq = extractBillSequence(p.billNumber || p.receiptNumber);
      if (seq > maxSeq) maxSeq = seq;
    });
    paymentAuditLogs.forEach(log => {
      const seq = extractBillSequence(log.billNumber);
      if (seq > maxSeq) maxSeq = seq;
    });

    let nextSeq = maxSeq + 1;
    let candidate = formatBillSerial(nextSeq);
    const usedKeys = new Set(
      paymentList.map(p => normalizeBillKey(p.billNumber || p.receiptNumber)).filter(Boolean)
    );

    while (usedKeys.has(normalizeBillKey(candidate))) {
      nextSeq += 1;
      candidate = formatBillSerial(nextSeq);
    }

    return candidate;
  };

  const isBillNumberUnique = (billNumber, excludePaymentId = null) => {
    const clean = String(billNumber || '').trim();
    if (!clean) {
      return { valid: false, error: 'Bill / Receipt Number is required.' };
    }
    const targetKey = normalizeBillKey(clean);
    const conflict = payments.find(
      p => p.id !== excludePaymentId && normalizeBillKey(p.billNumber || p.receiptNumber) === targetKey
    );
    if (conflict) {
      return {
        valid: false,
        error: `Bill Number "${clean}" is already assigned to ${conflict.studentName || 'another transaction'}${conflict.status === 'Reset' ? ' (Reset/Voided)' : ''}. Every payment must have a unique bill number.`,
        existingPayment: conflict
      };
    }
    return { valid: true };
  };

  // Add Student
  const addStudent = async (studentData) => {
    const selectedPlan = feePlans.find(p => p.id === studentData.tuitionPlanId) || feePlans[0];
    const tuition = Number(selectedPlan?.tuitionFee || 0);
    const admission = studentData.hasRegistrationFee ? Number(selectedPlan?.registrationFee ?? 100) : 0;
    const uniform = studentData.includeUniform !== false ? Number(selectedPlan?.uniformFee ?? 0) : 0;
    const subtotal = tuition + admission + uniform;
    const vatRate = selectedPlan?.vatRate ?? 5;
    const totalFirstBill = Math.round(subtotal + (subtotal * vatRate) / 100);

    const isPaid = Boolean(studentData.paidAtRegistration);
    const paymentMethod = studentData.paymentMethod || 'Cash';
    const todayStr = new Date().toISOString().split('T')[0];
    const lastPaidDate = studentData.lastPaidDate || (isPaid ? (studentData.joinDate || todayStr) : '');
    const subscriptionStartDate = studentData.subscriptionStartDate || studentData.joinDate || todayStr;
    const nextDueDate = studentData.nextDueDate || calculateNextDueDate(subscriptionStartDate, selectedPlan);

    const { billNumber: _omitBill, ...cleanStudentFields } = studentData;

    const newStudent = {
      ...cleanStudentFields,
      id: `std-${Date.now()}`,
      attendanceRate: 100,
      dueAmount: isPaid ? 0 : (studentData.initialDueAmount !== undefined ? studentData.initialDueAmount : totalFirstBill),
      feeStatus: isPaid ? 'Paid' : 'Pending',
      lastPaidDate,
      subscriptionStartDate,
      nextDueDate,
      lastPaymentMethod: isPaid ? paymentMethod : (studentData.lastPaymentMethod || ''),
      status: 'Active'
    };
    setStudents(prev => [newStudent, ...prev]);

    if (newStudent.batchId) {
      setBatches(prev => prev.map(b => b.id === newStudent.batchId ? { ...b, enrolledCount: b.enrolledCount + 1 } : b));
    }
    if (newStudent.dojoId) {
      setDojos(prev => prev.map(d => d.id === newStudent.dojoId ? { ...d, studentCount: d.studentCount + 1 } : d));
    }

    addActivity(`New Student enrolled: ${newStudent.fullName} (${newStudent.beltRank})`, 'student', 'UserPlus');
    showToast(`Student "${newStudent.fullName}" enrolled successfully!`);

    // Record enrollment receipt if paid at desk
    if (isPaid) {
      const requestedBill = String(studentData.billNumber || '').trim();
      const finalBillNumber = (requestedBill && isBillNumberUnique(requestedBill).valid)
        ? requestedBill
        : getNextBillNumber();

      advanceBillSerial(finalBillNumber);

      const enrollmentPayment = {
        id: `pay-enr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        billNumber: finalBillNumber,
        receiptNumber: finalBillNumber,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        parentName: newStudent.parentName || 'Self',
        phone: newStudent.whatsapp || newStudent.phone || '',
        beltRank: newStudent.beltRank || '',
        dojoId: newStudent.dojoId || '',
        amount: totalFirstBill,
        paymentMethod,
        paymentDate: lastPaidDate || todayStr,
        subscriptionStartDate,
        nextDueDate,
        renewalType: 'initial',
        planId: selectedPlan?.id || '',
        planName: selectedPlan?.name || 'Package',
        notes: studentData.paymentNotes ? `Enrollment: ${studentData.paymentNotes}` : `Initial Admission & ${selectedPlan?.name || 'Package'}`,
        remainingDue: 0,
        status: 'Active',
        createdBy: authorizedStaffName || 'Admin',
        createdAt: new Date().toISOString(),
        previousStudentSnapshot: {
          dueAmount: totalFirstBill,
          feeStatus: 'Pending',
          lastPaidDate: '',
          subscriptionStartDate,
          nextDueDate,
          lastPaymentMethod: '',
          tuitionPlanId: selectedPlan?.id || ''
        }
      };

      setPayments(prev => {
        const next = [enrollmentPayment, ...prev];
        localStorage.setItem('sensei_payments', JSON.stringify(next));
        return next;
      });

      addActivity(
        `Payment Recorded [${finalBillNumber}]: AED ${totalFirstBill.toLocaleString()} from ${newStudent.fullName} (${paymentMethod}) — Initial Admission`,
        'payment',
        'CreditCard',
        {
          actionType: 'payment_recorded',
          billNumber: finalBillNumber,
          paymentId: enrollmentPayment.id,
          studentId: newStudent.id,
          studentName: newStudent.fullName,
          amount: totalFirstBill,
          paymentMethod,
          paymentDate: enrollmentPayment.paymentDate,
          performedBy: authorizedStaffName || 'Admin'
        }
      );

      if (isFirebaseConfigured) {
        await recordPaymentToFirestore(enrollmentPayment).catch(console.error);
      }
    }

    if (isFirebaseConfigured) {
      await saveStudentToFirestore(newStudent).catch(console.error);
    }
  };

  // Update Student Status (Supports Active, Inactive, Stopped, Blocked, Frozen)
  const updateStudentStatus = async (studentId, status) => {
    const student = students.find(s => s.id === studentId);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));

    if (status === 'Active') {
      addActivity(`Reactivated student: ${student?.fullName || 'Student'} is now Active 🥋`, 'student', 'UserCheck');
      showToast(`${student?.fullName || 'Student'} has been set to Active! 🥋`, 'success');
    } else if (status === 'Inactive' || status === 'Stopped') {
      addActivity(`Student ${student?.fullName || 'Student'} moved to ${status} list`, 'student', 'UserMinus');
      showToast(`${student?.fullName || 'Student'} moved to ${status} list.`);
    } else {
      showToast(`Student status updated to ${status}`);
    }

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, { status }).catch(console.error);
    }
  };

  // Reactivate student account without losing any previous attendance records or payment history
  const reactivateStudent = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'Active' } : s));
    addActivity(`Reactivated student: ${student.fullName} restored to Active enrollment 🥋`, 'student', 'UserCheck');
    showToast(`${student.fullName} has been reactivated successfully! 🥋`, 'success');

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, { status: 'Active' }).catch(console.error);
    }
  };

  // Freeze / Pause Student Subscription & Extend Due Date (Rule: Min 1 month, Max 1 per calendar year)
  const freezeStudentSubscription = async ({ studentId, startDate, endDate, durationMonths, reason }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return false;

    const months = Math.max(1, Number(durationMonths) || 1);
    const startYear = new Date(startDate).getFullYear();

    // Check 1-per-calendar-year limit
    const alreadyUsed = (student.freezeHistory || []).some(f => {
      const fYear = f.year || (f.startDate ? new Date(f.startDate).getFullYear() : null);
      return fYear === startYear;
    });

    if (alreadyUsed && student.status !== 'Frozen') {
      showErrorAlert(
        'Annual Limit Reached',
        `Students can freeze their subscription only once per calendar year. ${student.fullName} has already utilized their freeze for ${startYear}.`
      );
      return false;
    }

    const origDue = student.nextDueDate || startDate;
    const newDueDate = calculateNextDueDate(origDue, months);

    const freezeRecord = {
      id: `frz-${Date.now()}`,
      year: startYear,
      startDate,
      endDate,
      durationMonths: months,
      reason: reason || 'Approved break',
      originalDueDate: origDue,
      newDueDate,
      createdAt: new Date().toISOString(),
      status: 'Active'
    };

    const updatedStudent = {
      ...student,
      status: 'Frozen',
      nextDueDate,
      currentFreeze: freezeRecord,
      freezeHistory: [freezeRecord, ...(student.freezeHistory || [])]
    };

    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

    addActivity(
      `Subscription Frozen: ${student.fullName} paused for ${months}M break. Due date extended from ${origDue} to ${newDueDate}`,
      'student',
      'Clock'
    );

    showSuccessAlert(
      'Subscription Frozen! ❄️',
      `${student.fullName}'s subscription has been paused for ${months} month(s). Due date automatically extended from ${origDue} to ${newDueDate}.`
    );

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, {
        status: 'Frozen',
        nextDueDate,
        currentFreeze: freezeRecord,
        freezeHistory: updatedStudent.freezeHistory
      }).catch(console.error);
    }

    return true;
  };

  // Resume / Unfreeze Student Subscription
  const unfreezeStudentSubscription = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return false;

    const updatedHistory = (student.freezeHistory || []).map(f => {
      if (f.id === student.currentFreeze?.id) {
        return { ...f, status: 'Completed', resumedAt: new Date().toISOString() };
      }
      return f;
    });

    const updatedStudent = {
      ...student,
      status: 'Active',
      currentFreeze: null,
      freezeHistory: updatedHistory
    };

    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

    addActivity(
      `Training Resumed: ${student.fullName} resumed classes. Subscription active until ${student.nextDueDate}`,
      'student',
      'CheckCircle'
    );

    showSuccessAlert(
      'Training Resumed! 🥋',
      `Welcome back ${student.fullName}! Subscription is active with remaining period covered until ${student.nextDueDate}.`
    );

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, {
        status: 'Active',
        currentFreeze: null,
        freezeHistory: updatedHistory
      }).catch(console.error);
    }

    return true;
  };

  // Update Student Photo
  const updateStudentPhoto = async (studentId, photoUrl) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, photoUrl } : s));
    showToast('Student photo updated from gallery! 📸', 'success');

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, { photoUrl }).catch(console.error);
    }
  };

  // Full Student Details Update
  const updateStudent = async (studentId, updatedData) => {
    const prevStudent = students.find(s => s.id === studentId);
    if (!prevStudent) return;

    // Handle batch change enrolled count
    if (updatedData.batchId && updatedData.batchId !== prevStudent.batchId) {
      setBatches(prev => prev.map(b => {
        if (b.id === prevStudent.batchId) return { ...b, enrolledCount: Math.max(0, b.enrolledCount - 1) };
        if (b.id === updatedData.batchId) return { ...b, enrolledCount: b.enrolledCount + 1 };
        return b;
      }));
    }

    // Handle dojo change student count
    if (updatedData.dojoId && updatedData.dojoId !== prevStudent.dojoId) {
      setDojos(prev => prev.map(d => {
        if (d.id === prevStudent.dojoId) return { ...d, studentCount: Math.max(0, d.studentCount - 1) };
        if (d.id === updatedData.dojoId) return { ...d, studentCount: d.studentCount + 1 };
        return d;
      }));
    }

    const merged = { ...prevStudent, ...updatedData };
    setStudents(prev => prev.map(s => s.id === studentId ? merged : s));
    addActivity(`Student profile updated: ${merged.fullName} (${merged.beltRank})`, 'student', 'UserCheck');
    showToast(`Student "${merged.fullName}" updated successfully!`, 'success');

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, updatedData).catch(console.error);
    }
  };

  // Add Custom Belt Rank
  const addBeltRank = async (beltData) => {
    const newBelt = {
      ...beltData,
      id: `belt-${Date.now()}`,
      level: Number(beltData.level) || 1,
      badgeBg: beltData.badgeBg || '#ffffff',
      textColor: beltData.textColor || '#18181b',
      colorClass: beltData.colorClass || 'belt-custom'
    };

    setBeltRanks(prev => [...prev, newBelt].sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0)));
    addActivity(`New Belt Rank added: ${newBelt.name}`, 'general', 'Award');
    showToast(`Belt Rank "${newBelt.name}" created!`, 'success');

    if (isFirebaseConfigured) {
      await saveBeltRankToFirestore(newBelt).catch(console.error);
    }
    return newBelt;
  };

  // Update Belt Rank
  const updateBeltRank = async (beltId, data) => {
    setBeltRanks(prev => prev.map(b => b.id === beltId ? { ...b, ...data } : b));
    showToast('Belt Rank updated!', 'success');

    if (isFirebaseConfigured) {
      const target = beltRanks.find(b => b.id === beltId);
      if (target) {
        await saveBeltRankToFirestore({ ...target, ...data }).catch(console.error);
      }
    }
  };

  // Delete Individual Belt Rank
  const deleteBeltRank = async (beltIdentifier) => {
    const belt = beltRanks.find(b => b.id === beltIdentifier || b.name === beltIdentifier);
    const targetId = belt?.id || beltIdentifier;
    const targetName = belt?.name || beltIdentifier;

    setBeltRanks(prev => {
      const remaining = prev.filter(b => b.id !== targetId && b.name !== targetName);
      localStorage.setItem('sensei_belt_ranks', JSON.stringify(remaining));
      return remaining;
    });

    addActivity(`Belt Rank deleted: ${targetName}`, 'general', 'Trash2');
    showToast(`Belt Rank "${targetName}" deleted.`, 'info');

    if (isFirebaseConfigured && targetId) {
      await deleteBeltRankFromFirestore(targetId).catch(console.error);
    }
    return true;
  };

  // Delete All Belt Ranks (Clean Slate for fresh custom academy creation)
  const deleteAllBeltRanks = async () => {
    const toDelete = [...beltRanks];
    setBeltRanks([]);
    localStorage.setItem('sensei_belt_ranks', JSON.stringify([]));
    addActivity('All Belt Ranks cleared', 'general', 'Trash2');
    showToast('All Belt Ranks deleted! You can now create your custom ranks.', 'info');

    if (isFirebaseConfigured) {
      for (const b of toDelete) {
        if (b.id) await deleteBeltRankFromFirestore(b.id).catch(() => {});
      }
      try {
        const cloudBelts = await fetchBeltRanksFromFirestore();
        if (cloudBelts && cloudBelts.length > 0) {
          for (const b of cloudBelts) {
            if (b.id) await deleteBeltRankFromFirestore(b.id).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Error clearing Firestore belts:', err);
      }
    }
  };

  // Reset to standard karate belt hierarchy (8 classic belts)
  const resetBeltRanksToDefault = async () => {
    const STANDARD_BELTS = [
      { id: 'belt-1', name: 'White Belt', colorClass: 'belt-white', badgeBg: '#ffffff', textColor: '#18181b', level: 10 },
      { id: 'belt-2', name: 'Yellow Belt', colorClass: 'belt-yellow', badgeBg: '#eab308', textColor: '#ffffff', level: 9 },
      { id: 'belt-3', name: 'Orange Belt', colorClass: 'belt-orange', badgeBg: '#f97316', textColor: '#ffffff', level: 8 },
      { id: 'belt-4', name: 'Green Belt', colorClass: 'belt-green', badgeBg: '#22c55e', textColor: '#ffffff', level: 7 },
      { id: 'belt-5', name: 'Blue Belt', colorClass: 'belt-blue', badgeBg: '#3b82f6', textColor: '#ffffff', level: 6 },
      { id: 'belt-6', name: 'Purple Belt', colorClass: 'belt-purple', badgeBg: '#a855f7', textColor: '#ffffff', level: 5 },
      { id: 'belt-7', name: 'Brown Belt', colorClass: 'belt-brown', badgeBg: '#78350f', textColor: '#ffffff', level: 3 },
      { id: 'belt-8', name: 'Black Belt (1st Dan)', colorClass: 'belt-black', badgeBg: '#18181b', textColor: '#ffffff', level: 1 }
    ];
    setBeltRanks(STANDARD_BELTS);
    localStorage.setItem('sensei_belt_ranks', JSON.stringify(STANDARD_BELTS));
    showToast('Belt Ranks reset to standard martial arts list!', 'success');

    if (isFirebaseConfigured) {
      for (const b of STANDARD_BELTS) {
        await saveBeltRankToFirestore(b).catch(() => {});
      }
    }
  };

  // Delete Student Profile
  const deleteStudent = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setStudents(prev => {
      const remaining = prev.filter(s => s.id !== studentId);
      localStorage.setItem('sensei_students', JSON.stringify(remaining));
      return remaining;
    });

    // Update batch and dojo enrolled counts
    if (student.batchId) {
      setBatches(prev => prev.map(b => b.id === student.batchId ? { ...b, enrolledCount: Math.max(0, b.enrolledCount - 1) } : b));
    }
    if (student.dojoId) {
      setDojos(prev => prev.map(d => d.id === student.dojoId ? { ...d, studentCount: Math.max(0, d.studentCount - 1) } : d));
    }

    addActivity(`Student removed from roster: ${student.fullName}`, 'student', 'Trash2');
    showToast(`Student "${student.fullName}" deleted successfully!`, 'info');

    if (isFirebaseConfigured) {
      await deleteStudentFromFirestore(studentId).catch(console.error);
    }
  };

  // Helper: Revert student billing state when a payment is reset or deleted
  const computeRevertedStudentUpdate = (payment, remainingActivePayments) => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return null;

    const sortedRemaining = sortPaymentsDesc(remainingActivePayments);
    const latestOther = sortedRemaining[0] || null;

    let isLatest = true;
    if (latestOther) {
      const pTime = new Date(payment.paymentDate || payment.createdAt || 0).getTime() || 0;
      const otherTime = new Date(latestOther.paymentDate || latestOther.createdAt || 0).getTime() || 0;
      if (otherTime > pTime) {
        isLatest = false;
      } else if (otherTime === pTime) {
        const pCreated = new Date(payment.createdAt || 0).getTime() || 0;
        const otherCreated = new Date(latestOther.createdAt || 0).getTime() || 0;
        if (otherCreated > pCreated) isLatest = false;
      }
    }

    let updatedFields;
    if (isLatest && payment.previousStudentSnapshot) {
      const snap = payment.previousStudentSnapshot;
      updatedFields = {
        dueAmount: Number(snap.dueAmount) || 0,
        feeStatus: snap.feeStatus || ((Number(snap.dueAmount) || 0) > 0 ? 'Pending' : 'Paid'),
        lastPaidDate: snap.lastPaidDate || '',
        subscriptionStartDate: snap.subscriptionStartDate || student.subscriptionStartDate || '',
        nextDueDate: snap.nextDueDate || student.nextDueDate || '',
        lastPaymentMethod: snap.lastPaymentMethod || '',
        ...(snap.tuitionPlanId ? { tuitionPlanId: snap.tuitionPlanId } : {})
      };
    } else if (isLatest) {
      const restoredDue = (Number(student.dueAmount) || 0) + (Number(payment.amount) || 0);
      updatedFields = {
        dueAmount: restoredDue,
        feeStatus: restoredDue > 0 ? 'Pending' : 'Paid',
        lastPaidDate: latestOther ? (latestOther.paymentDate || '') : '',
        subscriptionStartDate: latestOther ? (latestOther.subscriptionStartDate || student.subscriptionStartDate || '') : (student.subscriptionStartDate || ''),
        nextDueDate: latestOther ? (latestOther.nextDueDate || student.nextDueDate || '') : (student.nextDueDate || ''),
        lastPaymentMethod: latestOther ? (latestOther.paymentMethod || '') : ''
      };
    } else {
      // Older payment was reset/deleted while a newer payment remains active
      const restoredDue = (Number(student.dueAmount) || 0) + (Number(payment.amount) || 0);
      updatedFields = {
        dueAmount: restoredDue,
        feeStatus: restoredDue > 0 ? 'Pending' : 'Paid'
      };
    }

    return {
      studentId: student.id,
      updatedFields,
      updatedStudent: { ...student, ...updatedFields }
    };
  };

  // Record Payment (Supports Normal Renewal from previous due date, and Restart After Break from actual resume date)
  const recordPayment = async ({
    studentId,
    amount,
    paymentMethod,
    paymentDate,
    subscriptionStartDate,
    nextDueDate,
    renewalType = 'normal',
    planId,
    notes,
    billNumber,
    receiptNumber
  }) => {
    if (!isAdminRef.current) {
      showErrorAlert('Authorization Required 🔒', 'Only authorized staff / administrators can record payments.');
      return null;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const requestedBill = String(billNumber || receiptNumber || '').trim();
    const finalBillNumber = requestedBill || getNextBillNumber();

    const billCheck = isBillNumberUnique(finalBillNumber);
    if (!billCheck.valid) {
      showErrorAlert('Duplicate Bill Number ⚠️', billCheck.error);
      return null;
    }

    advanceBillSerial(finalBillNumber);

    const previousStudentSnapshot = {
      dueAmount: Number(student.dueAmount) || 0,
      feeStatus: student.feeStatus || 'Pending',
      lastPaidDate: student.lastPaidDate || '',
      subscriptionStartDate: student.subscriptionStartDate || '',
      nextDueDate: student.nextDueDate || '',
      lastPaymentMethod: student.lastPaymentMethod || '',
      tuitionPlanId: student.tuitionPlanId || ''
    };

    const remaining = Math.max(0, (student.dueAmount || 0) - Number(amount));
    const updatedFeeStatus = remaining === 0 ? 'Paid' : 'Pending';
    const todayStr = new Date().toISOString().split('T')[0];
    const actualPaymentDate = paymentDate || todayStr;

    const targetPlanId = planId || student.tuitionPlanId;
    const plan = feePlans.find(p => p.id === targetPlanId) || feePlans[0];

    // Determine accurate subscription cycle:
    // 1. Normal Renewal: Starts from previous subscription due date (not payment received date!)
    // 2. Restart After Break: Starts from actual resumption date
    const finalSubscriptionStart = subscriptionStartDate ||
      (renewalType === 'restart'
        ? actualPaymentDate
        : (student.nextDueDate || student.lastPaidDate || todayStr));

    const finalNextDue = nextDueDate || calculateNextDueDate(finalSubscriptionStart, plan);

    const updatedStudent = {
      ...student,
      dueAmount: remaining,
      feeStatus: updatedFeeStatus,
      lastPaidDate: actualPaymentDate,
      subscriptionStartDate: finalSubscriptionStart,
      nextDueDate: finalNextDue,
      lastPaymentMethod: paymentMethod || student.lastPaymentMethod || 'Cash',
      status: 'Active',
      ...(planId ? { tuitionPlanId: planId } : {})
    };

    setStudents(prev => {
      const next = prev.map(s => s.id === studentId ? updatedStudent : s);
      localStorage.setItem('sensei_students', JSON.stringify(next));
      return next;
    });

    const newPaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      billNumber: finalBillNumber,
      receiptNumber: finalBillNumber,
      studentId,
      studentName: student.fullName,
      parentName: student.parentName || 'Self',
      phone: student.whatsapp || student.phone || '',
      beltRank: student.beltRank || '',
      dojoId: student.dojoId || '',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      paymentDate: actualPaymentDate,
      subscriptionStartDate: finalSubscriptionStart,
      nextDueDate: finalNextDue,
      renewalType, // 'normal' | 'restart' | 'initial'
      planId: plan?.id || '',
      planName: plan?.name || 'Training Package',
      notes: notes || '',
      remainingDue: remaining,
      status: 'Active',
      createdBy: authorizedStaffName || 'Admin',
      createdAt: new Date().toISOString(),
      previousStudentSnapshot
    };

    setPayments(prev => {
      const next = [newPaymentRecord, ...prev];
      localStorage.setItem('sensei_payments', JSON.stringify(next));
      return next;
    });

    const logText = renewalType === 'restart'
      ? `Payment Recorded [${finalBillNumber}]: AED ${Number(amount).toLocaleString()} from ${student.fullName} via ${newPaymentRecord.paymentMethod} (Resumed: ${finalSubscriptionStart} ➔ Due: ${finalNextDue})`
      : `Payment Recorded [${finalBillNumber}]: AED ${Number(amount).toLocaleString()} from ${student.fullName} via ${newPaymentRecord.paymentMethod} (Period: ${finalSubscriptionStart} ➔ Due: ${finalNextDue})`;

    addActivity(logText, 'payment', 'CreditCard', {
      actionType: 'payment_recorded',
      billNumber: finalBillNumber,
      paymentId: newPaymentRecord.id,
      studentId,
      studentName: student.fullName,
      amount: Number(amount),
      paymentMethod: newPaymentRecord.paymentMethod,
      paymentDate: actualPaymentDate,
      performedBy: authorizedStaffName || 'Admin',
      badgeColor: 'text-emerald-400'
    });
    showToast(`Payment [${finalBillNumber}] of AED ${amount} recorded for ${student.fullName}!`);

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, {
        dueAmount: remaining,
        feeStatus: updatedFeeStatus,
        lastPaidDate: actualPaymentDate,
        subscriptionStartDate: finalSubscriptionStart,
        nextDueDate: finalNextDue,
        lastPaymentMethod: paymentMethod || student.lastPaymentMethod || 'Cash',
        status: 'Active',
        ...(planId ? { tuitionPlanId: planId } : {})
      }).catch(console.error);

      await recordPaymentToFirestore(newPaymentRecord).catch(console.error);
    }

    return { student: updatedStudent, payment: newPaymentRecord };
  };

  // Edit / Correct Existing Payment Transaction (Authorized Staff Only)
  const updatePayment = async (paymentId, updatedData, reason = '') => {
    if (!isAdminRef.current) {
      showErrorAlert('Authorization Required 🔒', 'Only authorized staff / administrators can edit payment transactions.');
      return false;
    }

    const existing = payments.find(p => p.id === paymentId);
    if (!existing) return false;

    const cleanBill = String(updatedData.billNumber || updatedData.receiptNumber || existing.billNumber || existing.receiptNumber || '').trim();
    const billCheck = isBillNumberUnique(cleanBill, paymentId);
    if (!billCheck.valid) {
      showErrorAlert('Duplicate Bill Number ⚠️', billCheck.error);
      return false;
    }

    const newAmount = Number(updatedData.amount);
    if (!newAmount || newAmount <= 0) {
      showErrorAlert('Invalid Amount', 'Payment amount must be greater than 0.');
      return false;
    }

    advanceBillSerial(cleanBill);

    const targetPlanId = updatedData.planId !== undefined ? updatedData.planId : existing.planId;
    const plan = feePlans.find(p => p.id === targetPlanId);
    const newMethod = updatedData.paymentMethod || existing.paymentMethod || 'Cash';
    const newPaymentDate = updatedData.paymentDate || existing.paymentDate || new Date().toISOString().split('T')[0];
    const newSubStart = updatedData.subscriptionStartDate !== undefined ? updatedData.subscriptionStartDate : (existing.subscriptionStartDate || '');
    const newNextDue = updatedData.nextDueDate !== undefined ? updatedData.nextDueDate : (existing.nextDueDate || '');
    const newRenewalType = updatedData.renewalType || existing.renewalType || 'normal';
    const newNotes = updatedData.notes !== undefined ? updatedData.notes : (existing.notes || '');
    const cleanReason = String(reason || '').trim() || 'Transaction corrected by authorized staff';

    // Track field-level changes for audit log
    const oldBill = existing.billNumber || existing.receiptNumber || '';
    const changesSummary = [];
    if (normalizeBillKey(oldBill) !== normalizeBillKey(cleanBill)) {
      changesSummary.push(`Bill No: ${oldBill || '—'} → ${cleanBill}`);
    }
    if (Number(existing.amount) !== newAmount) {
      changesSummary.push(`Amount: ${Number(existing.amount).toLocaleString()} Dhs → ${newAmount.toLocaleString()} Dhs`);
    }
    if ((existing.paymentMethod || '') !== newMethod) {
      changesSummary.push(`Method: ${existing.paymentMethod || '—'} → ${newMethod}`);
    }
    if ((existing.paymentDate || '') !== newPaymentDate) {
      changesSummary.push(`Date: ${existing.paymentDate || '—'} → ${newPaymentDate}`);
    }
    if ((existing.subscriptionStartDate || '') !== (newSubStart || '')) {
      changesSummary.push(`Start: ${existing.subscriptionStartDate || '—'} → ${newSubStart || '—'}`);
    }
    if ((existing.nextDueDate || '') !== (newNextDue || '')) {
      changesSummary.push(`Next Due: ${existing.nextDueDate || '—'} → ${newNextDue || '—'}`);
    }
    if ((existing.renewalType || 'normal') !== newRenewalType) {
      changesSummary.push(`Mode: ${existing.renewalType || 'normal'} → ${newRenewalType}`);
    }
    if ((existing.planId || '') !== (targetPlanId || '')) {
      changesSummary.push(`Package: ${existing.planName || '—'} → ${plan?.name || 'Package'}`);
    }
    if ((existing.notes || '') !== newNotes) {
      changesSummary.push(`Notes updated`);
    }

    const nowIso = new Date().toISOString();
    const staffName = authorizedStaffName || 'Admin';

    // Sync student balance & dates if transaction is active (not Reset)
    const student = students.find(s => s.id === existing.studentId);
    let updatedRemainingDue = existing.remainingDue ?? 0;

    if (student && existing.status !== 'Reset') {
      const otherActive = payments.filter(
        p => p.studentId === existing.studentId && p.id !== paymentId && p.status !== 'Reset'
      );
      const sortedOthers = sortPaymentsDesc(otherActive);
      const latestOther = sortedOthers[0] || null;

      const checkIsLatest = (payDate) => {
        if (!latestOther) return true;
        const pTime = new Date(payDate || existing.createdAt || 0).getTime() || 0;
        const otherTime = new Date(latestOther.paymentDate || latestOther.createdAt || 0).getTime() || 0;
        if (otherTime > pTime) return false;
        if (otherTime === pTime) {
          const pCreated = new Date(existing.createdAt || 0).getTime() || 0;
          const otherCreated = new Date(latestOther.createdAt || 0).getTime() || 0;
          if (otherCreated > pCreated) return false;
        }
        return true;
      };

      const wasLatest = checkIsLatest(existing.paymentDate);
      const isLatest = checkIsLatest(newPaymentDate);

      let newDue;
      if (isLatest && existing.previousStudentSnapshot) {
        newDue = Math.max(0, (Number(existing.previousStudentSnapshot.dueAmount) || 0) - newAmount);
      } else {
        const delta = newAmount - (Number(existing.amount) || 0);
        newDue = Math.max(0, (Number(student.dueAmount) || 0) - delta);
      }
      updatedRemainingDue = newDue;
      const newFeeStatus = newDue === 0 ? 'Paid' : 'Pending';

      const studentPatch = isLatest
        ? {
            dueAmount: newDue,
            feeStatus: newFeeStatus,
            lastPaidDate: newPaymentDate,
            subscriptionStartDate: newSubStart,
            nextDueDate: newNextDue,
            lastPaymentMethod: newMethod,
            ...(targetPlanId ? { tuitionPlanId: targetPlanId } : {})
          }
        : (wasLatest && latestOther)
        ? {
            dueAmount: newDue,
            feeStatus: newFeeStatus,
            lastPaidDate: latestOther.paymentDate || '',
            subscriptionStartDate: latestOther.subscriptionStartDate || student.subscriptionStartDate || '',
            nextDueDate: latestOther.nextDueDate || student.nextDueDate || '',
            lastPaymentMethod: latestOther.paymentMethod || '',
            ...(latestOther.planId ? { tuitionPlanId: latestOther.planId } : {})
          }
        : {
            dueAmount: newDue,
            feeStatus: newFeeStatus
          };

      setStudents(prev => {
        const next = prev.map(s => s.id === student.id ? { ...s, ...studentPatch } : s);
        localStorage.setItem('sensei_students', JSON.stringify(next));
        return next;
      });

      if (isFirebaseConfigured) {
        await updateStudentInFirestore(student.id, studentPatch).catch(console.error);
      }
    }

    const editEntry = {
      editedAt: nowIso,
      editedBy: staffName,
      reason: cleanReason,
      changes: changesSummary.length > 0 ? changesSummary : ['Transaction details updated'],
      previousValues: {
        billNumber: oldBill,
        amount: Number(existing.amount),
        paymentMethod: existing.paymentMethod,
        paymentDate: existing.paymentDate,
        subscriptionStartDate: existing.subscriptionStartDate,
        nextDueDate: existing.nextDueDate
      }
    };

    const updatedPayment = {
      ...existing,
      billNumber: cleanBill,
      receiptNumber: cleanBill,
      amount: newAmount,
      paymentMethod: newMethod,
      paymentDate: newPaymentDate,
      subscriptionStartDate: newSubStart,
      nextDueDate: newNextDue,
      renewalType: newRenewalType,
      planId: targetPlanId || '',
      planName: plan?.name || existing.planName || 'Training Package',
      notes: newNotes,
      remainingDue: updatedRemainingDue,
      isEdited: true,
      lastEditedAt: nowIso,
      lastEditedBy: staffName,
      editReason: cleanReason,
      editHistory: [editEntry, ...(existing.editHistory || [])]
    };

    setPayments(prev => {
      const next = prev.map(p => p.id === paymentId ? updatedPayment : p);
      localStorage.setItem('sensei_payments', JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured) {
      await updatePaymentInFirestore(paymentId, updatedPayment).catch(console.error);
    }

    const diffText = changesSummary.length > 0 ? changesSummary.join(' • ') : 'Details updated';
    addActivity(
      `Edited Payment [${cleanBill}] for ${existing.studentName || student?.fullName || 'Student'}: ${diffText} (${cleanReason}) — by ${staffName}`,
      'payment',
      'Pencil',
      {
        actionType: 'payment_edited',
        billNumber: cleanBill,
        previousBillNumber: oldBill,
        paymentId,
        studentId: existing.studentId,
        studentName: existing.studentName || student?.fullName || 'Student',
        amount: newAmount,
        previousAmount: Number(existing.amount),
        paymentMethod: newMethod,
        paymentDate: newPaymentDate,
        changesSummary: editEntry.changes,
        reason: cleanReason,
        performedBy: staffName,
        badgeColor: 'text-amber-400'
      }
    );

    showToast(`Payment [${cleanBill}] updated and logged!`, 'success');
    return updatedPayment;
  };

  // Reset / Revert Payment Transaction (Authorized Staff Only — rolls back student due & dates, marks bill as Reset)
  const resetPayment = async (paymentId, reason = '') => {
    if (!isAdminRef.current) {
      showErrorAlert('Authorization Required 🔒', 'Only authorized staff / administrators can reset payment transactions.');
      return false;
    }

    const existing = payments.find(p => p.id === paymentId);
    if (!existing) return false;
    if (existing.status === 'Reset') {
      showToast('This payment transaction has already been reset.', 'info');
      return false;
    }

    const billNo = existing.billNumber || existing.receiptNumber || '—';
    const cleanReason = String(reason || '').trim() || 'Transaction reset / voided by authorized staff';
    const nowIso = new Date().toISOString();
    const staffName = authorizedStaffName || 'Admin';

    const remainingActive = payments.filter(
      p => p.studentId === existing.studentId && p.id !== paymentId && p.status !== 'Reset'
    );
    const revertResult = computeRevertedStudentUpdate(existing, remainingActive);

    if (revertResult) {
      setStudents(prev => {
        const next = prev.map(s => s.id === revertResult.studentId ? revertResult.updatedStudent : s);
        localStorage.setItem('sensei_students', JSON.stringify(next));
        return next;
      });
      if (isFirebaseConfigured) {
        await updateStudentInFirestore(revertResult.studentId, revertResult.updatedFields).catch(console.error);
      }
    }

    const resetRecord = {
      ...existing,
      billNumber: billNo,
      receiptNumber: billNo,
      status: 'Reset',
      resetAt: nowIso,
      resetBy: staffName,
      resetReason: cleanReason
    };

    setPayments(prev => {
      const next = prev.map(p => p.id === paymentId ? resetRecord : p);
      localStorage.setItem('sensei_payments', JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured) {
      await updatePaymentInFirestore(paymentId, resetRecord).catch(console.error);
    }

    addActivity(
      `Reset Payment [${billNo}] (AED ${Number(existing.amount).toLocaleString()}, ${existing.paymentMethod}) for ${existing.studentName || 'Student'} — Balance reverted (${cleanReason}) — by ${staffName}`,
      'payment',
      'RotateCcw',
      {
        actionType: 'payment_reset',
        billNumber: billNo,
        paymentId,
        studentId: existing.studentId,
        studentName: existing.studentName || 'Student',
        amount: Number(existing.amount),
        paymentMethod: existing.paymentMethod,
        paymentDate: existing.paymentDate,
        revertedDueAmount: revertResult?.updatedFields?.dueAmount,
        reason: cleanReason,
        performedBy: staffName,
        badgeColor: 'text-orange-400'
      }
    );

    showToast(`Payment [${billNo}] reset & student fee balance reverted.`, 'info');
    return true;
  };

  // Delete Payment Record (Authorized Staff Only — reverts student balance if active & logs permanently)
  const deletePayment = async (paymentId, reason = '') => {
    if (!isAdminRef.current) {
      showErrorAlert('Authorization Required 🔒', 'Only authorized staff / administrators can delete payment transactions.');
      return false;
    }

    const existing = payments.find(p => p.id === paymentId);
    if (!existing) return false;

    const billNo = existing.billNumber || existing.receiptNumber || '—';
    const cleanReason = String(reason || '').trim() || 'Transaction deleted by authorized staff';
    const staffName = authorizedStaffName || 'Admin';

    // Only revert student balance if the payment was still active (not already Reset)
    if (existing.status !== 'Reset') {
      const remainingActive = payments.filter(
        p => p.studentId === existing.studentId && p.id !== paymentId && p.status !== 'Reset'
      );
      const revertResult = computeRevertedStudentUpdate(existing, remainingActive);
      if (revertResult) {
        setStudents(prev => {
          const next = prev.map(s => s.id === revertResult.studentId ? revertResult.updatedStudent : s);
          localStorage.setItem('sensei_students', JSON.stringify(next));
          return next;
        });
        if (isFirebaseConfigured) {
          await updateStudentInFirestore(revertResult.studentId, revertResult.updatedFields).catch(console.error);
        }
      }
    }

    setPayments(prev => {
      const next = prev.filter(p => p.id !== paymentId);
      localStorage.setItem('sensei_payments', JSON.stringify(next));
      return next;
    });

    if (isFirebaseConfigured) {
      await deletePaymentFromFirestore(paymentId).catch(console.error);
    }

    addActivity(
      `Deleted Payment [${billNo}] (AED ${Number(existing.amount).toLocaleString()}, ${existing.paymentMethod || 'Cash'}, Date: ${formatDisplayDate(existing.paymentDate || existing.createdAt)}) for ${existing.studentName || 'Student'} (${cleanReason}) — by ${staffName}`,
      'payment',
      'Trash2',
      {
        actionType: 'payment_deleted',
        billNumber: billNo,
        paymentId,
        studentId: existing.studentId,
        studentName: existing.studentName || 'Student',
        amount: Number(existing.amount),
        paymentMethod: existing.paymentMethod,
        paymentDate: existing.paymentDate,
        wasResetBeforeDelete: existing.status === 'Reset',
        reason: cleanReason,
        performedBy: staffName,
        badgeColor: 'text-red-400'
      }
    );

    showToast(`Payment [${billNo}] deleted and recorded in activity log.`, 'info');
    return true;
  };

  // Mark or Edit Attendance batch (Supports current date, past missed dates, and editing previously recorded sessions)
  const markAttendanceBatch = async (batchId, date, records, guestStudentIds = []) => {
    const batch = batches.find(b => b.id === batchId);
    const presentCount = Object.values(records).filter(status => status === 'Present' || status === 'Late').length;
    const totalCount = Object.keys(records).length;

    // Check if session was already recorded previously
    const isExistingSession = attendanceHistory.some(s => s.batchId === batchId && s.date === date);

    // Save batch session to local attendance history
    const sessionRecord = {
      id: `att-${batchId}_${date}`,
      batchId,
      batchName: batch?.name || 'General Batch',
      dojoId: batch?.dojoId,
      date,
      records: { ...records },
      guestStudentIds: [...guestStudentIds],
      timestamp: new Date().toISOString()
    };

    let nextHistory;
    setAttendanceHistory(prev => {
      const filtered = prev.filter(s => !(s.batchId === batchId && s.date === date));
      nextHistory = [sessionRecord, ...filtered];
      localStorage.setItem('sensei_attendance_history', JSON.stringify(nextHistory));
      return nextHistory;
    });

    // Update students attendance rates and lastAttendedDate with 100% mathematical accuracy
    setStudents(prev => prev.map(s => {
      if (records[s.id] !== undefined) {
        const stats = calculateStudentAttendanceStats(s.id, nextHistory || [sessionRecord]);
        return {
          ...s,
          lastAttendedDate: stats.lastAttendedDate || (records[s.id] === 'Present' || records[s.id] === 'Late' ? date : s.lastAttendedDate),
          attendanceRate: stats.attendanceRate
        };
      }
      return s;
    }));

    if (isExistingSession) {
      addActivity(`Updated attendance session: ${batch?.name || 'Batch'} on ${date} (${presentCount}/${totalCount} attended)`, 'attendance', 'RefreshCw');
      showToast(`Attendance record updated for ${date}!`, 'success');
    } else {
      addActivity(`Attendance recorded: ${batch?.name || 'Batch'} on ${date} (${presentCount}/${totalCount} attended)`, 'attendance', 'CheckCircle');
      showToast(`Attendance marked for ${presentCount} students on ${date}!`, 'success');
    }

    if (isFirebaseConfigured) {
      await recordBatchAttendanceToFirestore(batchId, date, records, guestStudentIds).catch(console.error);
    }
  };

  // Correct or add individual attendance record for any date (Supports correcting mistakes and adding missed dates)
  const updateSingleAttendanceRecord = async ({ studentId, date, batchId, status, notes }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const targetBatch = batches.find(b => b.id === (batchId || student.batchId)) || batches[0];
    const targetBatchId = targetBatch?.id || 'manual';

    let nextHistory;
    setAttendanceHistory(prev => {
      const existingSessionIndex = prev.findIndex(s => s.batchId === targetBatchId && s.date === date);
      if (existingSessionIndex >= 0) {
        nextHistory = [...prev];
        nextHistory[existingSessionIndex] = {
          ...nextHistory[existingSessionIndex],
          records: {
            ...nextHistory[existingSessionIndex].records,
            [studentId]: status
          },
          ...(notes !== undefined ? { notes } : {})
        };
      } else {
        const newSession = {
          id: `att-${targetBatchId}_${date}`,
          batchId: targetBatchId,
          batchName: targetBatch?.name || 'Training Session',
          dojoId: student.dojoId,
          date,
          records: { [studentId]: status },
          guestStudentIds: [],
          notes: notes || '',
          timestamp: new Date().toISOString()
        };
        nextHistory = [newSession, ...prev];
      }
      localStorage.setItem('sensei_attendance_history', JSON.stringify(nextHistory));
      return nextHistory;
    });

    // Recalculate student stats accurately
    const updatedStats = calculateStudentAttendanceStats(studentId, nextHistory);
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          lastAttendedDate: updatedStats.lastAttendedDate || s.lastAttendedDate,
          attendanceRate: updatedStats.attendanceRate
        };
      }
      return s;
    }));

    addActivity(`Attendance updated: ${student.fullName} marked ${status} on ${date}`, 'attendance', 'CheckCircle');
    showToast(`Updated ${student.fullName} to ${status} on ${date}!`, 'success');

    if (isFirebaseConfigured) {
      const session = nextHistory.find(s => s.batchId === targetBatchId && s.date === date);
      if (session) {
        await recordBatchAttendanceToFirestore(targetBatchId, date, session.records, session.guestStudentIds || []).catch(console.error);
      }
      await updateStudentInFirestore(studentId, {
        lastAttendedDate: updatedStats.lastAttendedDate || student.lastAttendedDate,
        attendanceRate: updatedStats.attendanceRate
      }).catch(console.error);
    }
  };

  // Alias for backward compatibility
  const recordStudentAttendanceIndividual = async (params) => {
    return updateSingleAttendanceRecord(params);
  };

  // Delete / Remove an accidental individual attendance entry
  const deleteSingleAttendanceRecord = async ({ studentId, date, batchId }) => {
    const student = students.find(s => s.id === studentId);
    let nextHistory;
    setAttendanceHistory(prev => {
      const existingSessionIndex = prev.findIndex(s => (!batchId || s.batchId === batchId) && s.date === date);
      if (existingSessionIndex >= 0) {
        nextHistory = [...prev];
        const updatedRecords = { ...nextHistory[existingSessionIndex].records };
        delete updatedRecords[studentId];
        nextHistory[existingSessionIndex] = {
          ...nextHistory[existingSessionIndex],
          records: updatedRecords
        };
        localStorage.setItem('sensei_attendance_history', JSON.stringify(nextHistory));
        return nextHistory;
      }
      return prev;
    });

    if (student && nextHistory) {
      const updatedStats = calculateStudentAttendanceStats(studentId, nextHistory);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendanceRate: updatedStats.attendanceRate, lastAttendedDate: updatedStats.lastAttendedDate } : s));
      showToast(`Removed attendance record for ${student.fullName} on ${date}`, 'info');

      if (isFirebaseConfigured) {
        const session = nextHistory.find(s => (!batchId || s.batchId === batchId) && s.date === date);
        if (session) {
          await recordBatchAttendanceToFirestore(session.batchId, date, session.records, session.guestStudentIds || []).catch(console.error);
        }
      }
    }
  };

  // Delete an entire attendance session
  const deleteAttendanceSession = async (batchId, date) => {
    const session = attendanceHistory.find(s => s.batchId === batchId && s.date === date);
    const nextHistory = attendanceHistory.filter(s => !(s.batchId === batchId && s.date === date));
    setAttendanceHistory(nextHistory);
    localStorage.setItem('sensei_attendance_history', JSON.stringify(nextHistory));

    // Update students
    setStudents(prev => prev.map(s => {
      const stats = calculateStudentAttendanceStats(s.id, nextHistory);
      return {
        ...s,
        attendanceRate: stats.totalSessions > 0 ? stats.attendanceRate : 100,
        lastAttendedDate: stats.totalSessions > 0 ? stats.lastAttendedDate : null
      };
    }));

    if (isFirebaseConfigured) {
      await deleteBatchAttendanceFromFirestore(batchId, date).catch(console.error);
    }

    addActivity(`Deleted attendance session for ${session?.batchName || 'Batch'} on ${date}`, 'attendance', 'Trash2');
    showToast(`Attendance session for ${date} deleted.`, 'info');
  };

  // Clear all attendance records while preserving students, fees, and class schedules
  const clearAllAttendanceRecords = async () => {
    setAttendanceHistory([]);
    localStorage.setItem('sensei_attendance_history', JSON.stringify([]));

    // Reset attendance metrics on all students without touching any other fields
    setStudents(prev => prev.map(s => ({
      ...s,
      attendanceRate: 100,
      lastAttendedDate: null
    })));

    if (isFirebaseConfigured) {
      await clearAllAttendanceFromFirestore().catch(console.error);
    }

    addActivity('All attendance records cleared', 'attendance', 'RotateCcw');
    showToast('All attendance records cleared successfully!', 'success');
  };

  // Get student attendance history list
  const getStudentAttendanceHistory = (studentId) => {
    if (!studentId) return [];
    const logs = [];
    attendanceHistory.forEach(session => {
      const status = session.records?.[studentId];
      if (status) {
        logs.push({
          id: `${session.id}_${studentId}`,
          sessionId: session.id,
          date: session.date,
          batchId: session.batchId,
          batchName: session.batchName || 'Training Session',
          status,
          isGuest: Array.isArray(session.guestStudentIds) && session.guestStudentIds.includes(studentId),
          notes: session.notes || '',
          timestamp: session.timestamp
        });
      }
    });
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get student payment history list (sorted newest first, normalized)
  const getStudentPaymentHistory = (studentId) => {
    if (!studentId) return [];
    return sortPaymentsDesc(
      payments
        .filter(p => p.studentId === studentId)
        .map(normalizePaymentRecord)
    );
  };

  // Get total valid amount paid by a student (excludes Reset / Voided transactions)
  const getStudentTotalPaid = (studentId) => {
    if (!studentId) return 0;
    return payments
      .filter(p => p.studentId === studentId && p.status !== 'Reset')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  };

  // Search payments across bill numbers, student names, methods, notes
  const searchPayments = (queryText = '') => {
    const q = String(queryText || '').trim().toLowerCase();
    const list = sortPaymentsDesc(payments.map(normalizePaymentRecord));
    if (!q) return list;
    return list.filter(p => {
      const bill = (p.billNumber || p.receiptNumber || '').toLowerCase();
      const sName = (p.studentName || '').toLowerCase();
      const method = (p.paymentMethod || '').toLowerCase();
      const plan = (p.planName || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return (
        bill.includes(q) ||
        sName.includes(q) ||
        method.includes(q) ||
        plan.includes(q) ||
        notes.includes(q) ||
        phone.includes(q)
      );
    });
  };

  // Get monthly payment transactions & summary (supports specific 'YYYY-MM' month or 'all')
  const getMonthlyPayments = (monthKey = 'all', dojoId = selectedDojoId) => {
    const branchFiltered = (dojoId && dojoId !== 'all')
      ? payments.filter(p => {
          const studentObj = students.find(s => s.id === p.studentId);
          return (p.dojoId || studentObj?.dojoId) === dojoId;
        })
      : payments;

    const normalized = sortPaymentsDesc(branchFiltered.map(normalizePaymentRecord));
    const filteredByMonth = (!monthKey || monthKey === 'all')
      ? normalized
      : normalized.filter(p => getPaymentMonthKey(p) === monthKey);

    const validTransactions = filteredByMonth.filter(p => p.status !== 'Reset');
    const totalCollected = validTransactions.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      monthKey: monthKey || 'all',
      monthLabel: formatMonthKeyLabel(monthKey || 'all'),
      transactions: filteredByMonth,
      validCount: validTransactions.length,
      resetCount: filteredByMonth.length - validTransactions.length,
      totalCollected,
      groups: groupPaymentsByMonth(filteredByMonth)
    };
  };

  // Filtered lists by selected dojo
  const filteredStudents = selectedDojoId === 'all'
    ? students
    : students.filter(s => s.dojoId === selectedDojoId);

  const filteredBatches = selectedDojoId === 'all'
    ? batches
    : batches.filter(b => b.dojoId === selectedDojoId);

  return (
    <DojoContext.Provider
      value={{
        dojos,
        batches,
        feePlans,
        beltRanks,
        students,
        activities,
        paymentAuditLogs,
        filteredStudents,
        filteredBatches,
        selectedDojoId,
        setSelectedDojoId,
        activeTab,
        setActiveTab,
        activeFeesSubTab,
        setActiveFeesSubTab,
        currentRole,
        setCurrentRole,
        isAdmin,
        authorizedStaffName,
        setAuthorizedStaffName,
        isAdminLoginOpen,
        setIsAdminLoginOpen,
        closeAdminLoginModal,
        pendingAdminAction,
        adminPromptMessage,
        loginAdmin,
        loginWithPin,
        changeAdminPassword,
        quickAdminLogin,
        logoutAdmin,
        toggleAdminMode,
        requireAdmin,
        modalState,
        setModalState,
        toast,
        showToast,
        showSuccessAlert,
        showConfirmDialog,
        showErrorAlert,
        addDojo,
        updateDojo,
        deleteDojo,
        addBatch,
        updateBatch,
        deleteBatch,
        addFeePlan,
        updateFeePlan,
        deleteFeePlan,
        addBeltRank,
        updateBeltRank,
        deleteBeltRank,
        deleteAllBeltRanks,
        resetBeltRanksToDefault,
        addStudent,
        updateStudent,
        updateStudentStatus,
        reactivateStudent,
        updateStudentPhoto,
        deleteStudent,
        freezeStudentSubscription,
        unfreezeStudentSubscription,
        loadDemoStudent,
        recordPayment,
        updatePayment,
        resetPayment,
        deletePayment,
        getNextBillNumber,
        isBillNumberUnique,
        getStudentTotalPaid,
        searchPayments,
        getMonthlyPayments,
        groupPaymentsByMonth,
        getPaymentMonthKey,
        formatMonthKeyLabel,
        payments,
        attendanceHistory,
        getStudentAttendanceHistory,
        getStudentPaymentHistory,
        recordStudentAttendanceIndividual,
        updateSingleAttendanceRecord,
        deleteSingleAttendanceRecord,
        deleteAttendanceSession,
        clearAllAttendanceRecords,
        calculateStudentAttendanceStats,
        calculateStudentMonthlyAttendanceStats,
        markAttendanceBatch,
        fetchBatchAttendanceFromFirestore,
        clearActivities,
        resetAllDataToCleanSlate,
        isFirebaseConfigured
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};

export const useDojo = () => useContext(DojoContext);
