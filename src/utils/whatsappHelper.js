/**
 * WhatsApp Helper Utilities for Karate Dojo App
 */

// Clean any phone number to international WhatsApp format (handles both UAE +971 and India +91)
export const getCleanWhatsAppPhone = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = phoneStr.replace(/[^0-9]/g, '');
  if (!digits) return '';

  // If starts with 00 -> remove 00
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Already 12 digits starting with 971 or 91
  if ((digits.startsWith('971') && digits.length === 12) || (digits.startsWith('91') && digits.length === 12)) {
    return digits;
  }

  // UAE 10 digits starting with 05 (050xxxxxxx, 052xxxxxxx, 054, 055, 056, 058) -> 97150xxxxxxx
  if (digits.length === 10 && digits.startsWith('05')) {
    return '971' + digits.slice(1);
  }

  // UAE 9 digits starting with 5 (e.g. 501234567) -> 971501234567
  if (digits.length === 9 && digits.startsWith('5')) {
    return '971' + digits;
  }

  // Indian 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 7034296606) -> 917034296606
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return '91' + digits;
  }

  // Other 10-digit number with leading 0 -> remove 0 and prefix 971
  if (digits.length === 10 && digits.startsWith('0')) {
    return '971' + digits.slice(1);
  }

  // Fallback for 10 digits
  if (digits.length === 10) {
    return '91' + digits;
  }

  return digits;
};

// Normalize any date format (YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY) to standard ISO YYYY-MM-DD
export const normalizeDateToISO = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD.MM.YYYY or D.M.YYYY
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // DD/MM/YYYY or D/M/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {}

  return str;
};

// Format date into clean human-readable date, e.g. "03 Oct 2026"
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const iso = normalizeDateToISO(dateStr);
  try {
    const parts = iso.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
  } catch {}
  return dateStr;
};

// Format date into DD.MM.YYYY (e.g. "03.10.2026")
export const formatDisplayDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const iso = normalizeDateToISO(dateStr);
  try {
    const parts = iso.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
    }
  } catch {}
  return dateStr;
};

// Calculate next payment due date based on base date and fee plan duration (e.g. 1, 3, 6, 12 months)
export const calculateNextDueDate = (baseDateStr, planOrMonths) => {
  if (!baseDateStr) return '';
  const iso = normalizeDateToISO(baseDateStr);
  try {
    const parts = iso.split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const durationMonths = typeof planOrMonths === 'number'
      ? planOrMonths
      : Number(planOrMonths?.durationMonths || 1);

    const target = new Date(year, month + durationMonths, day);
    if (target.getDate() !== day) {
      target.setDate(0); // Clamps to end of month if month is shorter
    }
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
};

// Check if a student is due for fees (dueAmount > 0, status Overdue/Pending, or billing period ended via nextDueDate)
export const isStudentFeeDue = (student) => {
  if (!student) return false;
  if (Number(student.dueAmount) > 0) return true;
  if (student.feeStatus === 'Overdue') return true;

  const todayStr = new Date().toISOString().split('T')[0];

  // Primary check: Has the student's billing period ended according to their nextDueDate?
  if (student.nextDueDate) {
    if (todayStr >= student.nextDueDate) {
      return true; // Bill has become due!
    }
    if (student.feeStatus === 'Paid') {
      return false; // In advance/covered
    }
  }

  if (student.feeStatus === 'Pending') return true;

  // Fallback check if nextDueDate is not recorded yet: 30 days since last payment or join
  const refDateStr = student.lastPaidDate || student.joinDate;
  if (refDateStr) {
    const refDate = new Date(refDateStr);
    const now = new Date();
    const diffDays = Math.floor((now - refDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 30 && student.feeStatus !== 'Paid') {
      return true;
    }
  }

  return false;
};

// Calculate effective pending due for a student
export const getStudentDueAmount = (student, feePlans = []) => {
  if (!student) return 0;
  if (Number(student.dueAmount) > 0) {
    return Number(student.dueAmount);
  }

  // If due condition is met (e.g. nextDueDate arrived), calculate plan amount automatically
  if (isStudentFeeDue(student)) {
    const plan = feePlans.find(p => p.id === student.tuitionPlanId) || feePlans[0];
    const tuition = Number(plan?.tuitionFee || 250);
    const vatRate = Number(plan?.vatRate ?? 5);
    const vat = (tuition * vatRate) / 100;
    return Math.round(tuition + vat);
  }

  return 0;
};

// Generate polite, personalized WhatsApp fee reminder message
export const generateWhatsAppFeeReminder = (student, dojo, feePlans = []) => {
  const dojoName = dojo ? dojo.name : 'Karate Academy';
  const recipientName = student.parentName && student.parentName !== 'Self'
    ? student.parentName
    : student.fullName;

  const dueAmount = getStudentDueAmount(student, feePlans);
  const formattedAmount = dueAmount > 0 ? dueAmount.toLocaleString() : '250';
  const dojoPhone = dojo?.phone || '+971 50 123 4567';

  const plan = feePlans.find(p => p.id === student.tuitionPlanId);
  const planName = plan ? plan.name : 'Karate Training Package';
  const dueDateFormatted = student.nextDueDate ? formatDisplayDate(student.nextDueDate) : 'Immediate';
  const lastPaidFormatted = student.lastPaidDate ? formatDisplayDate(student.lastPaidDate) : null;

  let feeDetailsText = `📌 *Fee Renewal Details:*\n` +
    `• Package: *${planName}*\n` +
    `• Outstanding Due: *${formattedAmount} Dhs* (Includes 5% UAE VAT)\n` +
    `• Payment Due Date: *${dueDateFormatted}*\n`;

  if (lastPaidFormatted) {
    feeDetailsText += `• Last Covered Period Paid: *${lastPaidFormatted}*\n`;
  }

  feeDetailsText += `• Branch: ${dojoName}\n\n`;

  return `🥋 *${dojoName.toUpperCase()} - FEE REMINDER*\n\n` +
    `Dear ${recipientName},\n\n` +
    `This is a friendly reminder that the karate tuition fee for *${student.fullName}* (${student.beltRank}) is due for renewal.\n\n` +
    feeDetailsText +
    `Kindly remit the fee at your earliest convenience via:\n` +
    `💳 Card / POS Machine\n` +
    `🏦 Bank Transfer\n` +
    `📱 Apple Pay / Online Link\n` +
    `🥋 Cash at Dojo Reception\n\n` +
    `Thank you for your continuous support!\n\n` +
    `_Sensei Administration Desk - ${dojoName}_\n` +
    `📞 ${dojoPhone} 🥋`;
};

// Build complete direct WhatsApp wa.me link for a student
export const buildStudentWhatsAppUrl = (student, dojo, feePlans = []) => {
  const rawPhone = student.whatsapp || student.phone || student.parentPhone || '';
  const cleanPhone = getCleanWhatsAppPhone(rawPhone);
  if (!cleanPhone) return '';

  const message = generateWhatsAppFeeReminder(student, dojo, feePlans);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
