/**
 * Mongoose Schema Architecture for SenseiBook (MongoDB Option)
 */
import mongoose from 'mongoose';
const { Schema } = mongoose;

// 1. Dojo Schema
export const DojoSchema = new Schema({
  name: { type: String, required: true },
  instructor: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  logo: { type: String, default: '🥋' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

// 2. Class Batch Schema
export const BatchSchema = new Schema({
  dojoId: { type: Schema.Types.ObjectId, ref: 'Dojo', required: true, index: true },
  name: { type: String, required: true },
  scheduleDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  startTime: { type: String, required: true }, // "17:00"
  durationMinutes: { type: Number, default: 60 },
  maxCapacity: { type: Number, required: true, default: 25 },
  level: { type: String, default: 'Beginner' }
}, { timestamps: true });

// 3. Tuition Fee Plan Schema
export const FeePlanSchema = new Schema({
  dojoId: { type: Schema.Types.ObjectId, ref: 'Dojo' },
  name: { type: String, required: true },
  durationMonths: { type: Number, default: 1 },
  billingCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Annual'], default: 'Monthly' },
  tuitionFee: { type: Number, required: true },
  registrationFee: { type: Number, default: 0 },
  dueDayOfMonth: { type: Number, min: 1, max: 28, default: 5 },
  activeMonths: [{ type: Number, min: 1, max: 12 }],
  isDefault: { type: Boolean, default: false },
  currency: { type: String, default: '₹' },
  description: { type: String }
}, { timestamps: true });

// 4. Student Schema
export const StudentSchema = new Schema({
  fullName: { type: String, required: true, index: true },
  photoUrl: { type: String },
  dob: { type: Date },
  joinDate: { type: Date, default: Date.now },
  email: { type: String },
  phone: { type: String, required: true, index: true },
  whatsapp: { type: String },
  parentName: { type: String },
  parentPhone: { type: String },
  dojoId: { type: Schema.Types.ObjectId, ref: 'Dojo', required: true, index: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  beltRank: {
    type: String,
    enum: [
      'White Belt', 'Yellow Belt', 'Orange Belt',
      'Green Belt', 'Blue Belt', 'Purple Belt',
      'Brown Belt', 'Black Belt (1st Dan)', 'Black Belt (2nd Dan)'
    ],
    default: 'White Belt',
    index: true
  },
  tuitionPlanId: { type: Schema.Types.ObjectId, ref: 'FeePlan', required: true },
  hasRegistrationFee: { type: Boolean, default: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Blocked'], default: 'Active', index: true },
  feeStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending', index: true },
  dueAmount: { type: Number, default: 0 },
  lastPaidDate: { type: Date },
  medicalNotes: { type: String },
  experience: { type: String }
}, { timestamps: true });

// 5. Attendance Schema
export const AttendanceSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
  status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
  markedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });
AttendanceSchema.index({ studentId: 1, batchId: 1, date: 1 }, { unique: true });

// 6. Payment Transaction Schema
export const PaymentSchema = new Schema({
  receiptNumber: { type: String, required: true, unique: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['UPI / GPay', 'Cash at Dojo', 'Card POS', 'Bank Transfer'], default: 'UPI / GPay' },
  referenceId: { type: String },
  notes: { type: String },
  recordedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  whatsappSent: { type: Boolean, default: false }
}, { timestamps: true });
