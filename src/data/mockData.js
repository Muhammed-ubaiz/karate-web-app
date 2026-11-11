export const INITIAL_DOJOS = [
  {
    id: 'dojo-main',
    name: 'Al Muharib Karate Center',
    instructor: 'Chief Sensei',
    address: 'United Arab Emirates',
    phone: '+971 50 123 4567',
    email: 'contact@almuharibkarate.ae',
    status: 'Active',
    studentCount: 0,
    batchesCount: 1,
    logo: '🥋'
  }
];

export const INITIAL_BATCHES = [
  {
    id: 'batch-1',
    dojoId: 'dojo-main',
    name: 'General Karate Batch (All Levels)',
    scheduleDays: ['Mon', 'Wed', 'Fri'],
    startTime: '17:00',
    durationMinutes: 60,
    maxCapacity: 30,
    enrolledCount: 0,
    instructor: 'Chief Sensei',
    level: 'All Levels'
  }
];

export const INITIAL_FEE_PLANS = [
  {
    id: 'plan-monthly',
    name: 'Monthly Package',
    durationMonths: 1,
    billingCycle: 'Monthly',
    tuitionFee: 250,
    registrationFee: 100,
    uniformFee: 125,
    vatRate: 5,
    dueDayOfMonth: 5,
    scheduleNote: 'Weekly 3 days with 1 hr',
    specialOffer: '',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: true,
    currency: 'Dhs',
    description: 'Standard monthly training package with 3 sessions per week.'
  },
  {
    id: 'plan-3months',
    name: '3 Months Package',
    durationMonths: 3,
    billingCycle: 'Quarterly',
    tuitionFee: 650,
    registrationFee: 100,
    uniformFee: 0,
    uniformValue: 125,
    vatRate: 5,
    dueDayOfMonth: 5,
    scheduleNote: 'Weekly 3 days with 1 hr',
    specialOffer: 'Special Offer: Free Uniform (worth 125 Dhs)',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: 'Dhs',
    description: '3-Month package with complimentary karate uniform.'
  },
  {
    id: 'plan-6months',
    name: '6 Months Package',
    durationMonths: 6,
    billingCycle: 'Half-Yearly',
    tuitionFee: 1200,
    registrationFee: 100,
    uniformFee: 0,
    uniformValue: 125,
    vatRate: 5,
    dueDayOfMonth: 5,
    scheduleNote: 'Weekly 3 days with 1 hr',
    specialOffer: 'Special Offer: Free Uniform (worth 125 Dhs)',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: 'Dhs',
    description: 'Half-yearly package with complimentary karate uniform.'
  },
  {
    id: 'plan-1year',
    name: '1 Year Package',
    durationMonths: 12,
    billingCycle: 'Yearly',
    tuitionFee: 2200,
    registrationFee: 100,
    uniformFee: 0,
    uniformValue: 125,
    vatRate: 5,
    dueDayOfMonth: 5,
    scheduleNote: 'Weekly 3 days with 1 hr',
    specialOffer: 'Special Offer: Free Uniform (worth 125 Dhs)',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: 'Dhs',
    description: 'Annual full master package with complimentary karate uniform.'
  }
];

export const INITIAL_BELT_RANKS = [];

export const BELT_RANKS = INITIAL_BELT_RANKS;

// Empty initial students roster - Starts clean so admins can enroll real students
export const INITIAL_STUDENTS = [];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act-init-1',
    text: 'Al Muharib Karate Center Management System ready. Add your students to get started.',
    type: 'general',
    icon: 'Award',
    time: 'Just now'
  }
];
