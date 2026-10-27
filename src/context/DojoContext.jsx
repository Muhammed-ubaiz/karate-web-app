import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_DOJOS,
  INITIAL_BATCHES,
  INITIAL_FEE_PLANS,
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
  fetchFeePlansFromFirestore,
  saveFeePlanToFirestore,
  fetchStudentsFromFirestore,
  saveStudentToFirestore,
  updateStudentInFirestore,
  recordBatchAttendanceToFirestore,
  recordPaymentToFirestore,
  logActivityToFirestore
} from '../services/firebaseService';

const DojoContext = createContext();

export const DojoProvider = ({ children }) => {
  // Load from LocalStorage or use defaults
  const [dojos, setDojos] = useState(() => {
    const saved = localStorage.getItem('sensei_dojos');
    return saved ? JSON.parse(saved) : INITIAL_DOJOS;
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('sensei_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [feePlans, setFeePlans] = useState(() => {
    const saved = localStorage.getItem('sensei_fee_plans');
    return saved ? JSON.parse(saved) : INITIAL_FEE_PLANS;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('sensei_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
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
  const [currentRole, setCurrentRole] = useState('Sensei');

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

  // Sync with Firestore if configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const loadFirestoreData = async () => {
      try {
        const [cloudDojos, cloudBatches, cloudPlans, cloudStudents] = await Promise.all([
          fetchDojosFromFirestore(),
          fetchBatchesFromFirestore(),
          fetchFeePlansFromFirestore(),
          fetchStudentsFromFirestore()
        ]);

        if (cloudDojos && cloudDojos.length > 0) setDojos(cloudDojos);
        if (cloudBatches && cloudBatches.length > 0) setBatches(cloudBatches);
        if (cloudPlans && cloudPlans.length > 0) setFeePlans(cloudPlans);
        if (cloudStudents && cloudStudents.length > 0) setStudents(cloudStudents);
      } catch (err) {
        console.error('Error fetching Firestore data:', err);
      }
    };

    loadFirestoreData();
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
    localStorage.setItem('sensei_students', JSON.stringify(students));
  }, [students]);

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

  // Add Student
  const addStudent = async (studentData) => {
    const newStudent = {
      ...studentData,
      id: `std-${Date.now()}`,
      attendanceRate: 100,
      dueAmount: studentData.hasRegistrationFee ? 800 : 0,
      feeStatus: studentData.hasRegistrationFee ? 'Pending' : 'Paid',
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

    if (isFirebaseConfigured) {
      await saveStudentToFirestore(newStudent).catch(console.error);
    }
  };

  // Update Student Status
  const updateStudentStatus = async (studentId, status) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
    showToast(`Student status updated to ${status}`);

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, { status }).catch(console.error);
    }
  };

  // Record Payment
  const recordPayment = async ({ studentId, amount, paymentMethod, notes }) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const remaining = Math.max(0, (student.dueAmount || 0) - amount);
    const updatedFeeStatus = remaining === 0 ? 'Paid' : 'Pending';

    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          dueAmount: remaining,
          feeStatus: updatedFeeStatus,
          lastPaidDate: new Date().toISOString().split('T')[0]
        };
      }
      return s;
    }));

    addActivity(`Fee recorded: ₹${amount.toLocaleString()} received from ${student.fullName} (${paymentMethod})`, 'payment', 'CreditCard');
    showToast(`Payment of ₹${amount} recorded for ${student.fullName}!`);

    if (isFirebaseConfigured) {
      await updateStudentInFirestore(studentId, {
        dueAmount: remaining,
        feeStatus: updatedFeeStatus,
        lastPaidDate: new Date().toISOString().split('T')[0]
      }).catch(console.error);

      await recordPaymentToFirestore({
        receiptNumber: `REC-${Date.now()}`,
        studentId,
        studentName: student.fullName,
        amount,
        paymentMethod,
        notes
      }).catch(console.error);
    }
  };

  // Mark Attendance batch
  const markAttendanceBatch = async (batchId, date, records) => {
    const batch = batches.find(b => b.id === batchId);
    const presentCount = Object.values(records).filter(status => status === 'Present').length;
    const totalCount = Object.keys(records).length;

    addActivity(`Attendance recorded: ${batch?.name || 'Batch'} (${presentCount}/${totalCount} present)`, 'attendance', 'CheckCircle');
    showToast(`Attendance marked for ${presentCount} students!`);

    if (isFirebaseConfigured) {
      await recordBatchAttendanceToFirestore(batchId, date, records).catch(console.error);
    }
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
        modalState,
        setModalState,
        toast,
        showToast,
        addDojo,
        updateDojo,
        deleteDojo,
        addBatch,
        addFeePlan,
        addStudent,
        updateStudentStatus,
        recordPayment,
        markAttendanceBatch,
        isFirebaseConfigured
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};

export const useDojo = () => useContext(DojoContext);
