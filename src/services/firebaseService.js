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
const COL_DOJOS = 'dojos';
const COL_BATCHES = 'batches';
const COL_FEE_PLANS = 'feePlans';
const COL_STUDENTS = 'students';
const COL_ATTENDANCE = 'attendance';
const COL_PAYMENTS = 'payments';
const COL_ACTIVITIES = 'activities';

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
  const docRef = await addDoc(collection(db, COL_DOJOS), {
    ...dojoData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...dojoData };
};

export const updateDojoInFirestore = async (id, data) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_DOJOS, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteDojoFromFirestore = async (id) => {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, COL_DOJOS, id));
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
  const docRef = await addDoc(collection(db, COL_BATCHES), {
    ...batchData,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...batchData };
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
  const docRef = await addDoc(collection(db, COL_FEE_PLANS), {
    ...planData,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...planData };
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
  const docRef = await addDoc(collection(db, COL_STUDENTS), {
    ...studentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...studentData };
};

export const updateStudentInFirestore = async (id, data) => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, COL_STUDENTS, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

/**
 * --- ATTENDANCE SERVICE ---
 */
export const recordBatchAttendanceToFirestore = async (batchId, date, records) => {
  if (!isFirebaseConfigured || !db) return;
  const attendanceId = `${batchId}_${date}`;
  const docRef = doc(db, COL_ATTENDANCE, attendanceId);
  await setDoc(docRef, {
    batchId,
    date,
    records,
    updatedAt: serverTimestamp()
  }, { merge: true });
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
