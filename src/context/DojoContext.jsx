import React, { createContext, useContext, useState, useEffect } from 'react';
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
  recordBatchAttendanceToFirestore,
  fetchBatchAttendanceFromFirestore,
  recordPaymentToFirestore,
  logActivityToFirestore
} from '../services/firebaseService';
import { calculateNextDueDate } from '../utils/whatsappHelper';
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

const DojoContext = createContext();

export const DojoProvider = ({ children }) => {
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
        if (Array.isArray(parsed)) return parsed;
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

  // Selected active branch filter ("all" or specific dojoId)
  const [selectedDojoId, setSelectedDojoId] = useState('all');

  // Active view: 'dashboard' | 'attendance' | 'students' | 'fees' | 'batches' | 'dojos'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Active user / role: 'Admin' | 'Sensei' | 'Staff'
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('sensei_is_admin') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null);
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
      setIsAdmin(true);
      setCurrentRole('Admin');
      localStorage.setItem('sensei_is_admin', 'true');
      return true;
    }
    return false;
  };

  const loginWithPin = (pin) => {
    const cleanPin = (pin || '').trim();
    const customPin = localStorage.getItem('sensei_custom_admin_pin') || '1234';
    const validPins = [customPin, '1234', '0000', '1111', 'admin'];

    if (validPins.includes(cleanPin)) {
      setIsAdmin(true);
      setCurrentRole('Admin');
      localStorage.setItem('sensei_is_admin', 'true');
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
    setIsAdmin(true);
    setCurrentRole('Admin');
    localStorage.setItem('sensei_is_admin', 'true');
    showToast('Logged in as Administrator (Full Access)! 👑', 'success');
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setCurrentRole('Sensei');
    localStorage.removeItem('sensei_is_admin');
    showToast('Switched to View-Only (Guest) mode. 🔒', 'info');
  };

  const toggleAdminMode = () => {
    if (isAdmin) {
      logoutAdmin();
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const requireAdmin = (actionCallback) => {
    if (isAdmin) {
      if (typeof actionCallback === 'function') actionCallback();
      return true;
    }
    setPendingAdminAction(() => actionCallback);
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
  }, []);

  const clearActivities = () => {
    setActivities([]);
    localStorage.setItem('sensei_activities', JSON.stringify([]));
    showToast('Activity logs cleared!', 'info');
  };

  const resetAllDataToCleanSlate = () => {
    localStorage.clear();
    localStorage.setItem('sensei_clean_v12', 'true');
    setDojos(INITIAL_DOJOS);
    setBatches(INITIAL_BATCHES);
    setFeePlans(INITIAL_FEE_PLANS);
    setStudents([]);
    localStorage.setItem('sensei_students', JSON.stringify([]));
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
        setPayments(cloudPayments);
        localStorage.setItem('sensei_payments', JSON.stringify(cloudPayments));
      }
    });

    const unsubAttendance = subscribeToCollection(COL_ATTENDANCE, (cloudAttendance) => {
      if (cloudAttendance) {
        setAttendanceHistory(cloudAttendance);
        localStorage.setItem('sensei_attendance_history', JSON.stringify(cloudAttendance));
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

  // Ensure students have 100% mathematically accurate attendance rates calculated from actual recorded history
  useEffect(() => {
    if (attendanceHistory && attendanceHistory.length > 0 && students && students.length > 0) {
      let hasChanges = false;
      const updatedStudents = students.map(s => {
        const stats = calculateStudentAttendanceStats(s.id, attendanceHistory);
        if (stats.totalSessions > 0) {
          if (s.attendanceRate !== stats.attendanceRate || (stats.lastAttendedDate && s.lastAttendedDate !== stats.lastAttendedDate)) {
            hasChanges = true;
            return {
              ...s,
              attendanceRate: stats.attendanceRate,
              lastAttendedDate: stats.lastAttendedDate || s.lastAttendedDate
            };
          }
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

  const addActivity = async (text, type = 'general', icon = 'Activity') => {
    const newActivity = {
      id: `act-${Date.now()}`,
      text,
      timestamp: 'Just now',
      type,
      icon,
      badgeColor: type === 'attendance' ? 'text-emerald-400' :
                  type === 'payment' ? 'text-amber-400' :
                  type === 'student' ? 'text-blue-400' : 'text-red-400'
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 15)]);

    if (isFirebaseConfigured) {
      await logActivityToFirestore(newActivity).catch(console.error);
    }
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

    const newStudent = {
      ...studentData,
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
      const enrollmentPayment = {
        id: `pay-enr-${Date.now()}`,
        receiptNumber: `REC-ENR-${Date.now().toString().slice(-6)}`,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        parentName: newStudent.parentName || 'Self',
        phone: newStudent.whatsapp || newStudent.phone || '',
        amount: totalFirstBill,
        paymentMethod,
        paymentDate: lastPaidDate || todayStr,
        subscriptionStartDate,
        nextDueDate,
        renewalType: 'initial',
        planId: selectedPlan?.id,
        planName: selectedPlan?.name || 'Package',
        notes: studentData.paymentNotes ? `Enrollment: ${studentData.paymentNotes}` : `Initial Admission & ${selectedPlan?.name || 'Package'}`,
        createdAt: new Date().toISOString()
      };
      setPayments(prev => [enrollmentPayment, ...prev]);

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
    receiptNumber
  }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

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

    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

    const finalReceiptNumber = receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
    const newPaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber: finalReceiptNumber,
      studentId,
      studentName: student.fullName,
      parentName: student.parentName || 'Self',
      phone: student.whatsapp || student.phone || '',
      beltRank: student.beltRank,
      dojoId: student.dojoId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      paymentDate: actualPaymentDate,
      subscriptionStartDate: finalSubscriptionStart,
      nextDueDate: finalNextDue,
      renewalType, // 'normal' | 'restart'
      planId: plan?.id,
      planName: plan?.name || 'Training Package',
      notes: notes || '',
      remainingDue: remaining,
      createdAt: new Date().toISOString()
    };

    setPayments(prev => [newPaymentRecord, ...prev]);

    const logText = renewalType === 'restart'
      ? `Fee & Resumption: AED ${Number(amount).toLocaleString()} from ${student.fullName} (Resumed: ${finalSubscriptionStart} ➔ Due: ${finalNextDue})`
      : `Fee renewal: AED ${Number(amount).toLocaleString()} from ${student.fullName} (Period: ${finalSubscriptionStart} ➔ Due: ${finalNextDue})`;

    addActivity(logText, 'payment', 'CreditCard');
    showToast(`Payment of AED ${amount} recorded for ${student.fullName}!`);

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

  // Delete / Revert Payment Record
  const deletePayment = async (paymentId) => {
    setPayments(prev => {
      const next = prev.filter(p => p.id !== paymentId);
      localStorage.setItem('sensei_payments', JSON.stringify(next));
      return next;
    });
    showToast('Payment record removed from ledger.', 'info');
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

  // Get student payment history list
  const getStudentPaymentHistory = (studentId) => {
    if (!studentId) return [];
    return payments
      .filter(p => p.studentId === studentId)
      .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
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
        filteredStudents,
        filteredBatches,
        selectedDojoId,
        setSelectedDojoId,
        activeTab,
        setActiveTab,
        currentRole,
        setCurrentRole,
        isAdmin,
        isAdminLoginOpen,
        setIsAdminLoginOpen,
        pendingAdminAction,
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
        deletePayment,
        payments,
        attendanceHistory,
        getStudentAttendanceHistory,
        getStudentPaymentHistory,
        recordStudentAttendanceIndividual,
        updateSingleAttendanceRecord,
        deleteSingleAttendanceRecord,
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
