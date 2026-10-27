export const INITIAL_DOJOS = [
  {
    id: 'dojo-1',
    name: 'Tiger Claw Dojo - Main Branch',
    instructor: 'Master Kenjiro Sato (6th Dan)',
    address: 'Sector 14, Central Sports Complex, Metro Line',
    phone: '+91 98765 43210',
    email: 'kenjiro@tigerclawdojo.com',
    status: 'Active',
    studentCount: 51,
    batchesCount: 3,
    logo: '🥋'
  },
  {
    id: 'dojo-2',
    name: 'Dragon Spirit Academy',
    instructor: 'Sensei Elena Rostova (4th Dan)',
    address: 'North Block, Level 2, West City Mall Hub',
    phone: '+91 98450 12345',
    email: 'elena@dragonspirit.com',
    status: 'Active',
    studentCount: 33,
    batchesCount: 2,
    logo: '🐉'
  },
  {
    id: 'dojo-3',
    name: 'Iron Fist Karate - South Hub',
    instructor: 'Sensei Marcus Vance (3rd Dan)',
    address: 'South City Community Recreation Hall',
    phone: '+91 97112 34567',
    email: 'marcus@ironfist.org',
    status: 'Inactive',
    studentCount: 0,
    batchesCount: 1,
    logo: '🥊'
  }
];

export const INITIAL_BATCHES = [
  {
    id: 'batch-1',
    dojoId: 'dojo-1',
    name: 'Kids Beginner (White to Orange)',
    scheduleDays: ['Mon', 'Wed', 'Fri'],
    startTime: '16:30',
    durationMinutes: 60,
    maxCapacity: 25,
    enrolledCount: 22,
    instructor: 'Master Kenjiro Sato',
    level: 'Beginner'
  },
  {
    id: 'batch-2',
    dojoId: 'dojo-1',
    name: 'Adults Advanced Kumite',
    scheduleDays: ['Tue', 'Thu', 'Sat'],
    startTime: '18:00',
    durationMinutes: 90,
    maxCapacity: 20,
    enrolledCount: 18,
    instructor: 'Sensei Hiro Tanaka',
    level: 'Advanced'
  },
  {
    id: 'batch-3',
    dojoId: 'dojo-1',
    name: 'Black Belt Elite Training',
    scheduleDays: ['Sat', 'Sun'],
    startTime: '07:30',
    durationMinutes: 120,
    maxCapacity: 15,
    enrolledCount: 11,
    instructor: 'Master Kenjiro Sato',
    level: 'Elite'
  },
  {
    id: 'batch-4',
    dojoId: 'dojo-2',
    name: 'Morning Fitness & Kata',
    scheduleDays: ['Mon', 'Wed', 'Fri'],
    startTime: '06:30',
    durationMinutes: 60,
    maxCapacity: 20,
    enrolledCount: 14,
    instructor: 'Sensei Elena Rostova',
    level: 'All Levels'
  },
  {
    id: 'batch-5',
    dojoId: 'dojo-2',
    name: 'Junior Karate Warriors',
    scheduleDays: ['Tue', 'Thu', 'Sat'],
    startTime: '17:00',
    durationMinutes: 60,
    maxCapacity: 22,
    enrolledCount: 19,
    instructor: 'Sensei Elena Rostova',
    level: 'Intermediate'
  }
];

export const INITIAL_FEE_PLANS = [
  {
    id: 'plan-1',
    name: 'Standard Monthly Plan',
    durationMonths: 1,
    billingCycle: 'Monthly',
    tuitionFee: 3000,
    registrationFee: 800,
    dueDayOfMonth: 5,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: true,
    currency: '₹',
    description: 'Regular monthly training with full access to assigned batch.'
  },
  {
    id: 'plan-2',
    name: 'Quarterly Belt Master Plan',
    durationMonths: 3,
    billingCycle: 'Quarterly',
    tuitionFee: 8200,
    registrationFee: 0,
    dueDayOfMonth: 1,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: '₹',
    description: '3 months advance plan with 10% fee concession & free grading handbook.'
  },
  {
    id: 'plan-3',
    name: 'Yearly Champion Pass',
    durationMonths: 12,
    billingCycle: 'Annual',
    tuitionFee: 30000,
    registrationFee: 0,
    dueDayOfMonth: 1,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: '₹',
    description: 'Full 12-month membership + free karate gi uniform & tournament prep.'
  }
];

export const BELT_RANKS = [
  { name: 'White Belt', colorClass: 'belt-white', level: 10 },
  { name: 'Yellow Belt', colorClass: 'belt-yellow', level: 9 },
  { name: 'Orange Belt', colorClass: 'belt-orange', level: 8 },
  { name: 'Green Belt', colorClass: 'belt-green', level: 7 },
  { name: 'Blue Belt', colorClass: 'belt-blue', level: 6 },
  { name: 'Purple Belt', colorClass: 'belt-purple', level: 5 },
  { name: 'Brown Belt', colorClass: 'belt-brown', level: 3 },
  { name: 'Black Belt (1st Dan)', colorClass: 'belt-black', level: 1 }
];

export const INITIAL_STUDENTS = [
  {
    id: 'std-1',
    fullName: 'Aryan Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dob: '2012-05-14',
    joinDate: '2023-01-10',
    email: 'aryan.sharma@example.com',
    phone: '+91 98234 56789',
    whatsapp: '+91 98234 56789',
    parentName: 'Ramesh Sharma',
    parentPhone: '+91 98234 56789',
    dojoId: 'dojo-1',
    batchId: 'batch-1',
    beltRank: 'Yellow Belt',
    tuitionPlanId: 'plan-1',
    status: 'Active',
    feeStatus: 'Paid',
    attendanceRate: 92,
    lastPaidDate: '2026-10-04',
    dueAmount: 0,
    medicalNotes: 'Mild asthma, carries inhaler in kit bag',
    experience: '6 months prior basic taekwondo'
  },
  {
    id: 'std-2',
    fullName: 'Maya Patel',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    dob: '2010-09-22',
    joinDate: '2022-06-15',
    email: 'maya.patel@example.com',
    phone: '+91 98111 22334',
    whatsapp: '+91 98111 22334',
    parentName: 'Sunita Patel',
    parentPhone: '+91 98111 22334',
    dojoId: 'dojo-1',
    batchId: 'batch-1',
    beltRank: 'Orange Belt',
    tuitionPlanId: 'plan-1',
    status: 'Active',
    feeStatus: 'Overdue',
    attendanceRate: 88,
    lastPaidDate: '2026-08-05',
    dueAmount: 3000,
    medicalNotes: 'None',
    experience: 'State championship bronze medalist 2025'
  },
  {
    id: 'std-3',
    fullName: 'Kabir Verma',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    dob: '1998-11-03',
    joinDate: '2021-03-01',
    email: 'kabir.v@example.com',
    phone: '+91 98990 77665',
    whatsapp: '+91 98990 77665',
    parentName: 'Self',
    parentPhone: '+91 98990 77665',
    dojoId: 'dojo-1',
    batchId: 'batch-2',
    beltRank: 'Blue Belt',
    tuitionPlanId: 'plan-2',
    status: 'Active',
    feeStatus: 'Paid',
    attendanceRate: 96,
    lastPaidDate: '2026-10-01',
    dueAmount: 0,
    medicalNotes: 'Previous meniscus surgery in 2020 (healed)',
    experience: 'College judo team captain'
  },
  {
    id: 'std-4',
    fullName: 'Ananya Deshmukh',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    dob: '2014-02-18',
    joinDate: '2023-08-20',
    email: 'ananya.d@example.com',
    phone: '+91 97654 32190',
    whatsapp: '+91 97654 32190',
    parentName: 'Vikram Deshmukh',
    parentPhone: '+91 97654 32190',
    dojoId: 'dojo-2',
    batchId: 'batch-5',
    beltRank: 'Yellow Belt',
    tuitionPlanId: 'plan-1',
    status: 'Active',
    feeStatus: 'Overdue',
    attendanceRate: 74,
    lastPaidDate: '2026-07-28',
    dueAmount: 3000,
    medicalNotes: 'None',
    experience: 'Beginner'
  },
  {
    id: 'std-5',
    fullName: 'Rohan Singhania',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dob: '1995-07-12',
    joinDate: '2020-01-15',
    email: 'rohan.s@example.com',
    phone: '+91 98333 44556',
    whatsapp: '+91 98333 44556',
    parentName: 'Self',
    parentPhone: '+91 98333 44556',
    dojoId: 'dojo-1',
    batchId: 'batch-3',
    beltRank: 'Black Belt (1st Dan)',
    tuitionPlanId: 'plan-3',
    status: 'Active',
    feeStatus: 'Paid',
    attendanceRate: 100,
    lastPaidDate: '2026-01-15',
    dueAmount: 0,
    medicalNotes: 'None',
    experience: 'Assistant coach for junior squad'
  },
  {
    id: 'std-6',
    fullName: 'Devansh Nair',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    dob: '2011-12-05',
    joinDate: '2023-04-10',
    email: 'devansh.n@example.com',
    phone: '+91 97110 88992',
    whatsapp: '+91 97110 88992',
    parentName: 'Priya Nair',
    parentPhone: '+91 97110 88992',
    dojoId: 'dojo-2',
    batchId: 'batch-5',
    beltRank: 'White Belt',
    tuitionPlanId: 'plan-1',
    status: 'Blocked',
    feeStatus: 'Overdue',
    attendanceRate: 45,
    lastPaidDate: '2026-06-10',
    dueAmount: 6000,
    medicalNotes: 'Chronic knee sprain',
    experience: 'None'
  }
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'attendance',
    text: 'Attendance marked for Kids Beginner Batch (19/22 present)',
    timestamp: 'Today, 05:45 PM',
    icon: 'CheckCircle',
    badgeColor: 'text-emerald-400'
  },
  {
    id: 'act-2',
    type: 'payment',
    text: 'Fee recorded: ₹3,000 received from Aryan Sharma (Cash)',
    timestamp: 'Today, 03:20 PM',
    icon: 'CreditCard',
    badgeColor: 'text-amber-400'
  },
  {
    id: 'act-3',
    type: 'student',
    text: 'New Student registered: Maya Patel enrolled in Kids Beginner',
    timestamp: 'Yesterday, 06:15 PM',
    icon: 'UserPlus',
    badgeColor: 'text-blue-400'
  },
  {
    id: 'act-4',
    type: 'alert',
    text: 'WhatsApp reminder broadcast sent to 4 overdue students',
    timestamp: '25 Oct, 11:00 AM',
    icon: 'MessageSquare',
    badgeColor: 'text-red-400'
  },
  {
    id: 'act-5',
    type: 'belt',
    text: 'Belt promotion exam completed: 6 students promoted to Yellow Belt',
    timestamp: '22 Oct, 07:30 PM',
    icon: 'Award',
    badgeColor: 'text-purple-400'
  }
];
