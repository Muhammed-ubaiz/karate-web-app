import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// Collections References
export const COL_DOJOS = 'dojos';
export const COL_BATCHES = 'batches';
export const COL_FEE_PLANS = 'feePlans';
export const COL_BELT_RANKS = 'beltRanks';
export const COL_STUDENTS = 'students';
export const COL_ATTENDANCE = 'attendance';
export const COL_PAYMENTS = 'payments';
export const COL_ACTIVITIES = 'activities';

/**
 * --- DOJOS SERVICE ---
 */
export const fetchDojosFromFirestore = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDocs(collection(db, COL_DOJOS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveDojoToFirestore = async (dojoData) => {
  if (!isFirebaseConfigured || !db) return dojoData;
  const docRef = doc(db, COL_DOJOS, dojoData.id);
  await setDoc(docRef, {
    ...dojoData,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return dojoData;
};

export const updateDojoInFirestore = async (id, data) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_DOJOS, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteDojoFromFirestore = async (id) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_DOJOS, id);
  await deleteDoc(docRef);
};

/**
 * --- BATCHES SERVICE ---
 */
export const fetchBatchesFromFirestore = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDocs(collection(db, COL_BATCHES));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveBatchToFirestore = async (batchData) => {
  if (!isFirebaseConfigured || !db) return batchData;
  const docRef = doc(db, COL_BATCHES, batchData.id);
  await setDoc(docRef, {
    ...batchData,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return batchData;
};

export const updateBatchInFirestore = async (id, data) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_BATCHES, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteBatchFromFirestore = async (id) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_BATCHES, id);
  await deleteDoc(docRef);
};

/**
 * --- FEE PLANS SERVICE ---
 */
export const fetchFeePlansFromFirestore = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDocs(collection(db, COL_FEE_PLANS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveFeePlanToFirestore = async (planData) => {
  if (!isFirebaseConfigured || !db) return planData;
  const docRef = doc(db, COL_FEE_PLANS, planData.id);
  await setDoc(docRef, {
    ...planData,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return planData;
};

export const updateFeePlanInFirestore = async (id, data) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_FEE_PLANS, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteFeePlanFromFirestore = async (id) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_FEE_PLANS, id);
  await deleteDoc(docRef);
};

/**
 * --- BELT RANKS SERVICE ---
 */
export const fetchBeltRanksFromFirestore = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDocs(collection(db, COL_BELT_RANKS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveBeltRankToFirestore = async (beltData) => {
  if (!isFirebaseConfigured || !db) return beltData;
  const docRef = doc(db, COL_BELT_RANKS, beltData.id);
  await setDoc(docRef, {
    ...beltData,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return beltData;
};

export const deleteBeltRankFromFirestore = async (id) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_BELT_RANKS, id);
  await deleteDoc(docRef);
};

/**
 * --- STUDENTS SERVICE ---
 */
export const fetchStudentsFromFirestore = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDocs(collection(db, COL_STUDENTS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveStudentToFirestore = async (studentData) => {
  if (!isFirebaseConfigured || !db) return studentData;
  const docRef = doc(db, COL_STUDENTS, studentData.id);
  await setDoc(docRef, {
    ...studentData,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return studentData;
};

export const updateStudentInFirestore = async (id, data) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_STUDENTS, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteStudentFromFirestore = async (id) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_STUDENTS, id);
  await deleteDoc(docRef);
};

/**
 * --- ATTENDANCE SERVICE ---
 */
export const recordBatchAttendanceToFirestore = async (batchId, date, records, guestStudentIds = []) => {
  if (!isFirebaseConfigured || !db) return;
  const attendanceId = `${batchId}_${date}`;
  const docRef = doc(db, COL_ATTENDANCE, attendanceId);
  await setDoc(docRef, {
    batchId,
    date,
    records,
    guestStudentIds,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const fetchBatchAttendanceFromFirestore = async (batchId, date) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const attendanceId = `${batchId}_${date}`;
    const docRef = doc(db, COL_ATTENDANCE, attendanceId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('Error fetching attendance session:', err);
  }
  return null;
};

/**
 * --- PAYMENTS SERVICE ---
 */
export const recordPaymentToFirestore = async (paymentData) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = await addDoc(collection(db, COL_PAYMENTS), {
    ...paymentData,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...paymentData };
};

export const fetchPaymentsFromFirestore = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const snapshot = await getDocs(query(collection(db, COL_PAYMENTS), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * --- ACTIVITY LOG SERVICE ---
 */
export const logActivityToFirestore = async (activityData) => {
  if (!isFirebaseConfigured || !db) return;
  await addDoc(collection(db, COL_ACTIVITIES), {
    ...activityData,
    createdAt: serverTimestamp()
  });
};

/**
 * --- REAL-TIME LISTENERS (onSnapshot) ---
 */
export const subscribeToCollection = (collectionName, callback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = collection(db, collectionName);
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (err) => {
    console.error(`Error subscribing to ${collectionName}:`, err);
  });
};
