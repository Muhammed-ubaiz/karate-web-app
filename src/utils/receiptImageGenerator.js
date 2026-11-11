/**
 * High-Resolution Printable Receipt & Official Fee Due Notice Image Generator
 * Renders crisp white-paper PNG documents on HTML5 Canvas for direct WhatsApp sharing,
 * clipboard pasting, and image downloads without external screenshot dependencies.
 */
import {
  getCleanWhatsAppPhone,
  formatDisplayDate,
  getStudentDueBreakdown
} from './whatsappHelper.js';
import {
  calculateVatBreakdownFromTotal,
  formatCurrencyAmount
} from './billingHelper.js';

const ACADEMY_NAME = 'AL MUHARIB KARATE CENTER';
const ACADEMY_TRN = '100293847500003';
const SANS_FONT = '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
const MONO_FONT = '"Consolas", "Courier New", monospace';

const drawRoundedRectPath = (ctx, x, y, width, height, radius = 8) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const wrapTextLines = (ctx, text, maxWidth) => {
  const clean = String(text || '').trim();
  if (!clean) return [];
  const words = clean.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      // Break ultra-long unspaced tokens if needed
      if (ctx.measureText(word).width > maxWidth) {
        let partial = '';
        for (const ch of word) {
          if (ctx.measureText(partial + ch).width > maxWidth) {
            if (partial) lines.push(partial);
            partial = ch;
          } else {
            partial += ch;
          }
        }
        currentLine = partial;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

const drawKarateCrest = (ctx, cx, cy, radius) => {
  // Subtle crimson circle background
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fef2f2';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fecaca';
  ctx.stroke();

  // Inner red gi/triangle emblem
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.44, cy + radius * 0.34);
  ctx.lineTo(cx, cy - radius * 0.5);
  ctx.lineTo(cx + radius * 0.44, cy + radius * 0.34);
  ctx.lineTo(cx, cy + radius * 0.08);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // Gold center sun dot
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.02, radius * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // Black/dark belt arc
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.52, cy + radius * 0.42);
  ctx.quadraticCurveTo(cx, cy + radius * 0.64, cx + radius * 0.52, cy + radius * 0.42);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#18181b';
  ctx.stroke();
  ctx.restore();
};

const drawCheckBadgeIcon = (ctx, cx, cy, r, bgColor = '#059669') => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.05);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.32);
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
};

const drawAlertBadgeIcon = (ctx, cx, cy, r, bgColor = '#dc2626') => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(r * 1.35)}px ${SANS_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', cx, cy + 0.5);
  ctx.restore();
};

const dataUrlToBlob = (dataUrl) => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export const triggerBlobDownload = (blob, filename) => {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/**
 * Resolve consistent VAT & base figures for a receipt object
 */
export const resolveReceiptBreakdown = (receiptData = {}) => {
  const totalNum = Number(receiptData.amount) || 0;
  const vatRate = Number(receiptData.vatRate ?? 5);

  if (
    receiptData.baseAmount !== undefined &&
    receiptData.vatAmount !== undefined &&
    Math.abs(Number(receiptData.baseAmount) + Number(receiptData.vatAmount) - totalNum) < 0.02
  ) {
    return {
      baseAmount: Number(receiptData.baseAmount),
      vatRate,
      vatAmount: Number(receiptData.vatAmount),
      totalNum
    };
  }

  const derived = calculateVatBreakdownFromTotal(totalNum, vatRate);
  return {
    baseAmount: derived.baseAmount,
    vatRate: derived.vatRate,
    vatAmount: derived.vatAmount,
    totalNum: derived.totalWithVat
  };
};

/**
 * Generates a crisp high-DPI white-paper PNG Blob of an Official Receipt.
 */
export const generateReceiptPngBlob = (receiptData) => {
  if (!receiptData || typeof document === 'undefined') return null;

  const {
    billNumber,
    receiptNumber,
    date = new Date().toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }),
    time = new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
    studentName = 'Student',
    parentName = '',
    phone = '',
    beltRank = 'Karateka',
    dojoName = 'Al Muharib Karate Center',
    paymentMethod = 'Card / POS',
    planName = '',
    notes = 'Tuition fee renewal',
    remainingDue = 0,
    subscriptionStartDate = '',
    nextDueDate = '',
    renewalType = 'normal',
    status = 'Active',
    isEdited = false,
    resetReason = ''
  } = receiptData;

  const displayBillNumber = billNumber || receiptNumber || `BILL-${Date.now().toString().slice(-4)}`;
  const isReset = status === 'Reset';
  const breakdown = resolveReceiptBreakdown(receiptData);

  const renewalLabel = renewalType === 'restart'
    ? 'Resumed After Break'
    : renewalType === 'initial'
    ? 'Initial Admission'
    : 'Regular Renewal';

  const periodText = subscriptionStartDate && nextDueDate
    ? `${subscriptionStartDate} to ${nextDueDate}`
    : '';

  const width = 760;
  const padX = 42;
  const innerWidth = width - padX * 2;
  const halfColWidth = (innerWidth - 32) / 2 - 12;

  // Measure dynamic text lines first using a scratch context
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');

  mCtx.font = `700 13px ${SANS_FONT}`;
  const branchText = dojoName && dojoName.toLowerCase() !== 'al muharib karate center'
    ? `${dojoName}  •  United Arab Emirates`
    : 'United Arab Emirates';
  const branchLines = wrapTextLines(mCtx, branchText, innerWidth - 40);

  mCtx.font = `700 17px ${SANS_FONT}`;
  const studentLines = wrapTextLines(mCtx, studentName, halfColWidth);

  mCtx.font = `600 14px ${SANS_FONT}`;
  const parentLines = wrapTextLines(mCtx, parentName || 'Self', halfColWidth);

  mCtx.font = `500 13px ${SANS_FONT}`;
  const notesText = notes || 'Karate training sessions';
  const notesLines = wrapTextLines(mCtx, notesText, innerWidth - 180);

  let resetLines = [];
  if (isReset) {
    mCtx.font = `700 13px ${SANS_FONT}`;
    const resetMsg = `VOIDED / RESET TRANSACTION${resetReason ? ` — Reason: ${resetReason}` : ''}`;
    resetLines = wrapTextLines(mCtx, resetMsg, innerWidth - 36);
  }

  // Compute exact dynamic height
  const headerTop = 34;
  const crestBlockH = 56;
  const titleBlockH = 30 + branchLines.length * 18 + 20;
  const statusPillH = 34;
  const resetBannerH = isReset ? (resetLines.length * 18 + 22) : 0;

  const metaTopRowH = 44;
  const metaBottomRowH = Math.max(studentLines.length * 21, parentLines.length * 19) + 38;
  const metaBoxH = 18 + metaTopRowH + 14 + metaBottomRowH + 14;

  const itemDescLinesCount =
    1 + // Main title
    (periodText ? 1 : 0) +
    Math.max(1, notesLines.length);
  const itemRowH = 26 + itemDescLinesCount * 20;
  const vatRowH = 42;
  const totalRowH = 56;
  const tableHeaderH = 36;
  const tableH = tableHeaderH + itemRowH + vatRowH + totalRowH;

  const summaryBoxH = 62;
  const footerH = 68;

  const totalHeight =
    headerTop +
    crestBlockH +
    titleBlockH +
    14 +
    statusPillH +
    (resetBannerH ? resetBannerH + 16 : 0) +
    18 +
    metaBoxH +
    22 +
    24 + // "PAYMENT BREAKDOWN" section label
    tableH +
    18 +
    summaryBoxH +
    22 +
    footerH +
    24;

  // Render crisp @2x canvas
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // White paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Subtle outer border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, totalHeight - 2);

  // Top crimson accent bar
  ctx.fillStyle = isReset ? '#ea580c' : '#dc2626';
  ctx.fillRect(0, 0, width, 10);

  let y = headerTop;

  // Center emblem crest
  drawKarateCrest(ctx, width / 2, y + 26, 26);
  y += crestBlockH + 6;

  // Academy Title
  ctx.fillStyle = '#0f172a';
  ctx.font = `900 24px ${SANS_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ACADEMY_NAME, width / 2, y);
  y += 30;

  // Branch & Country
  ctx.fillStyle = '#475569';
  ctx.font = `600 13px ${SANS_FONT}`;
  branchLines.forEach((line) => {
    ctx.fillText(line, width / 2, y);
    y += 18;
  });

  // TRN & Document Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = `600 11.5px ${SANS_FONT}`;
  ctx.fillText(`TRN: ${ACADEMY_TRN}  •  OFFICIAL TAX INVOICE & RECEIPT`, width / 2, y + 2);
  y += 24;

  // Status Pill
  const pillText = isReset
    ? 'VOID / RESET RECEIPT'
    : (isEdited ? 'PAID & CONFIRMED  •  CORRECTED' : 'PAID & CONFIRMED');
  ctx.font = `800 11.5px ${SANS_FONT}`;
  const pillWidth = ctx.measureText(pillText).width + 44;
  const pillX = (width - pillWidth) / 2;
  drawRoundedRectPath(ctx, pillX, y, pillWidth, 28, 14);
  ctx.fillStyle = isReset ? '#fff7ed' : '#ecfdf5';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = isReset ? '#fdba74' : '#6ee7b7';
  ctx.stroke();

  if (isReset) {
    drawAlertBadgeIcon(ctx, pillX + 16, y + 14, 7.5, '#ea580c');
  } else {
    drawCheckBadgeIcon(ctx, pillX + 16, y + 14, 7.5, '#059669');
  }
  ctx.fillStyle = isReset ? '#c2410c' : '#047857';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, pillX + 29, y + 14.5);
  y += statusPillH;

  // Divider below header
  ctx.beginPath();
  ctx.moveTo(padX, y + 4);
  ctx.lineTo(width - padX, y + 4);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();
  y += 18;

  // Reset warning banner if voided
  if (isReset) {
    drawRoundedRectPath(ctx, padX, y, innerWidth, resetBannerH, 12);
    ctx.fillStyle = '#fff7ed';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fb923c';
    ctx.stroke();

    ctx.fillStyle = '#9a3412';
    ctx.font = `700 13px ${SANS_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let ry = y + 11;
    resetLines.forEach((line) => {
      ctx.fillText(line, width / 2, ry);
      ry += 18;
    });
    y += resetBannerH + 16;
  }

  // Metadata Box
  drawRoundedRectPath(ctx, padX, y, innerWidth, metaBoxH, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  const leftColX = padX + 18;
  const rightColX = width - padX - 18;
  let my = y + 16;

  // Bill / Receipt No
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('BILL / RECEIPT NUMBER', leftColX, my);

  ctx.fillStyle = '#b45309';
  ctx.font = `800 17px ${MONO_FONT}`;
  ctx.fillText(displayBillNumber, leftColX, my + 16);

  // Date & Time
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('DATE & TIME', rightColX, my);

  ctx.fillStyle = '#0f172a';
  ctx.font = `700 14px ${SANS_FONT}`;
  ctx.fillText(`${date}  •  ${time}`, rightColX, my + 16);

  my += metaTopRowH + 8;

  // Inner divider inside meta box
  ctx.beginPath();
  ctx.moveTo(padX + 14, my);
  ctx.lineTo(width - padX - 14, my);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  my += 12;

  // Student Name & Belt
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('STUDENT NAME', leftColX, my);

  let sy = my + 16;
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 17px ${SANS_FONT}`;
  studentLines.forEach((line) => {
    ctx.fillText(line, leftColX, sy);
    sy += 21;
  });
  ctx.fillStyle = '#b45309';
  ctx.font = `700 12.5px ${SANS_FONT}`;
  ctx.fillText(beltRank || 'Student', leftColX, sy + 1);

  // Parent / Contact
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('PARENT / CONTACT', rightColX, my);

  let py = my + 16;
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 14px ${SANS_FONT}`;
  parentLines.forEach((line) => {
    ctx.fillText(line, rightColX, py);
    py += 19;
  });
  ctx.fillStyle = '#475569';
  ctx.font = `600 12.5px ${SANS_FONT}`;
  ctx.fillText(phone || '—', rightColX, py + 1);

  y += metaBoxH + 22;

  // Section Label: PAYMENT BREAKDOWN
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = `800 11px ${SANS_FONT}`;
  ctx.fillText('PAYMENT BREAKDOWN', padX, y);
  y += 22;

  // Payment Breakdown Table Container
  drawRoundedRectPath(ctx, padX, y, innerWidth, tableH, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.save();
  drawRoundedRectPath(ctx, padX, y, innerWidth, tableH, 14);
  ctx.clip();

  // Table Header Row
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(padX, y, innerWidth, tableHeaderH);
  ctx.fillStyle = '#475569';
  ctx.font = `800 11px ${SANS_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('DESCRIPTION', padX + 18, y + tableHeaderH / 2);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT (DHS)', width - padX - 18, y + tableHeaderH / 2);

  let ty = y + tableHeaderH;

  // Divider under table header
  ctx.beginPath();
  ctx.moveTo(padX, ty);
  ctx.lineTo(width - padX, ty);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Item Row 1 (Subscription & Period)
  let iy = ty + 15;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 14.5px ${SANS_FONT}`;
  const subLabel = planName
    ? `Karate Training — ${planName}`
    : 'Karate Training Subscription';
  ctx.fillText(subLabel, padX + 18, iy);
  iy += 21;

  if (periodText) {
    ctx.fillStyle = '#b45309';
    ctx.font = `700 12.5px ${SANS_FONT}`;
    ctx.fillText(`Period: ${periodText}  (${renewalLabel})`, padX + 18, iy);
    iy += 20;
  }

  ctx.fillStyle = '#64748b';
  ctx.font = `500 12.5px ${SANS_FONT}`;
  notesLines.forEach((line) => {
    ctx.fillText(line, padX + 18, iy);
    iy += 18;
  });

  // Base Amount on Right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 15px ${SANS_FONT}`;
  ctx.fillText(breakdown.baseAmount.toFixed(2), width - padX - 18, ty + 20);

  ty += itemRowH;

  // Row Divider
  ctx.beginPath();
  ctx.moveTo(padX, ty);
  ctx.lineTo(width - padX, ty);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // VAT Row
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#475569';
  ctx.font = `600 13px ${SANS_FONT}`;
  ctx.fillText(`UAE VAT (${breakdown.vatRate}%)`, padX + 18, ty + vatRowH / 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#b45309';
  ctx.font = `700 13.5px ${SANS_FONT}`;
  ctx.fillText(`+${breakdown.vatAmount.toFixed(2)}`, width - padX - 18, ty + vatRowH / 2);

  ty += vatRowH;

  // Total Paid Highlight Row
  ctx.fillStyle = isReset ? '#fff7ed' : '#ecfdf5';
  ctx.fillRect(padX, ty, innerWidth, totalRowH);

  ctx.beginPath();
  ctx.moveTo(padX, ty);
  ctx.lineTo(width - padX, ty);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 15.5px ${SANS_FONT}`;
  ctx.fillText(isReset ? 'Total Voided Amount' : 'Total Amount Paid', padX + 18, ty + totalRowH / 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = isReset ? '#c2410c' : '#059669';
  ctx.font = `900 22px ${SANS_FONT}`;
  ctx.fillText(`${formatCurrencyAmount(breakdown.totalNum)} Dhs`, width - padX - 18, ty + totalRowH / 2);

  ctx.restore(); // End table clip
  y += tableH + 18;

  // Payment Method & Remaining Due Summary Strip
  drawRoundedRectPath(ctx, padX, y, innerWidth, summaryBoxH, 12);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 11px ${SANS_FONT}`;
  ctx.fillText('Payment Method', padX + 18, y + 12);
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 14.5px ${SANS_FONT}`;
  ctx.fillText(paymentMethod, padX + 18, y + 30);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 11px ${SANS_FONT}`;
  ctx.fillText('Remaining Balance Due', width - padX - 18, y + 12);
  ctx.fillStyle = Number(remainingDue) > 0 ? '#dc2626' : '#059669';
  ctx.font = `800 14.5px ${SANS_FONT}`;
  ctx.fillText(`${formatCurrencyAmount(remainingDue)} Dhs`, width - padX - 18, y + 30);

  y += summaryBoxH + 22;

  // Footer Divider
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(width - padX, y);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  const fy = y + 26;
  drawCheckBadgeIcon(ctx, padX + 10, fy, 9, isReset ? '#ea580c' : '#059669');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isReset ? '#c2410c' : '#047857';
  ctx.font = `800 12px ${SANS_FONT}`;
  ctx.fillText(
    isReset ? 'RECORD VOIDED IN LEDGER' : 'PAYMENT VERIFIED & AUTHORIZED',
    padX + 26,
    fy - 7
  );
  ctx.fillStyle = '#64748b';
  ctx.font = `500 11.5px ${SANS_FONT}`;
  ctx.fillText('Thank you for training with Al Muharib Karate Center!', padX + 26, fy + 10);

  // Dashed Official Stamp Box on Bottom-Right
  const stampW = 212;
  const stampH = 40;
  const stampX = width - padX - stampW;
  const stampY = y + 12;
  ctx.save();
  ctx.setLineDash([4, 3]);
  drawRoundedRectPath(ctx, stampX, stampY, stampW, stampH, 10);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#334155';
  ctx.font = `700 10.5px ${MONO_FONT}`;
  ctx.fillText('AL MUHARIB KARATE CENTER', stampX + stampW / 2, stampY + 14);
  ctx.fillStyle = '#64748b';
  ctx.font = `600 9.5px ${MONO_FONT}`;
  ctx.fillText('Official Administration Stamp', stampX + stampW / 2, stampY + 28);

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrlToBlob(dataUrl);
};

/**
 * Generates a crisp high-DPI white-paper PNG Blob of an Official Fee Due Notice.
 */
export const generateDueNoticePngBlob = ({ student, dojo, feePlans = [] }) => {
  if (!student || typeof document === 'undefined') return null;

  const breakdown = getStudentDueBreakdown(student, feePlans);
  const dojoName = dojo?.name || 'Al Muharib Karate Center';
  const dojoPhone = dojo?.phone || '+971 50 123 4567';
  const planName = breakdown.plan?.name || 'Karate Training Package';
  const billingCycle = breakdown.plan?.billingCycle || `${breakdown.plan?.durationMonths || 1} Month(s)`;
  const parentDisplay = student.parentName && student.parentName !== 'Self'
    ? student.parentName
    : 'Parent / Guardian';
  const phoneDisplay = student.whatsapp || student.phone || student.parentPhone || '—';

  const todayISO = new Date().toISOString().split('T')[0];
  const issueDateDisplay = formatDisplayDate(todayISO);
  const dueDateDisplay = student.nextDueDate ? formatDisplayDate(student.nextDueDate) : 'Immediate Payment';
  const lastPaidDisplay = student.lastPaidDate ? formatDisplayDate(student.lastPaidDate) : null;
  const isPastDue = Boolean(student.nextDueDate && todayISO > student.nextDueDate);

  const refCode = `DUE-${todayISO.replace(/-/g, '').slice(2, 6)}-${String(student.id || '001').slice(-4).toUpperCase()}`;

  const width = 760;
  const padX = 42;
  const innerWidth = width - padX * 2;
  const halfColWidth = (innerWidth - 32) / 2 - 12;

  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');

  mCtx.font = `600 13px ${SANS_FONT}`;
  const branchText = dojoName.toLowerCase() !== 'al muharib karate center'
    ? `${dojoName}  •  United Arab Emirates`
    : 'United Arab Emirates';
  const branchLines = wrapTextLines(mCtx, branchText, innerWidth - 40);

  mCtx.font = `800 17px ${SANS_FONT}`;
  const studentLines = wrapTextLines(mCtx, student.fullName || 'Student', halfColWidth);

  mCtx.font = `700 14px ${SANS_FONT}`;
  const parentLines = wrapTextLines(mCtx, parentDisplay, halfColWidth);

  const headerTop = 34;
  const crestBlockH = 56;
  const titleBlockH = 30 + branchLines.length * 18 + 20;
  const statusPillH = 34;
  const metaTopRowH = 44;
  const metaBottomRowH = Math.max(studentLines.length * 21, parentLines.length * 19) + 38;
  const metaBoxH = 18 + metaTopRowH + 14 + metaBottomRowH + 14;

  const itemDescLinesCount = 2 + (lastPaidDisplay ? 1 : 0);
  const itemRowH = 26 + itemDescLinesCount * 20;
  const vatRowH = 42;
  const totalRowH = 56;
  const tableHeaderH = 36;
  const tableH = tableHeaderH + itemRowH + vatRowH + totalRowH;

  const paymentModesBoxH = 74;
  const footerH = 68;

  const totalHeight =
    headerTop +
    crestBlockH +
    titleBlockH +
    14 +
    statusPillH +
    18 +
    metaBoxH +
    22 +
    22 +
    tableH +
    18 +
    paymentModesBoxH +
    22 +
    footerH +
    24;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // White Paper Base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Subtle Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, totalHeight - 2);

  // Top Crimson Bar
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, width, 10);

  let y = headerTop;
  drawKarateCrest(ctx, width / 2, y + 26, 26);
  y += crestBlockH + 6;

  ctx.fillStyle = '#0f172a';
  ctx.font = `900 24px ${SANS_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ACADEMY_NAME, width / 2, y);
  y += 30;

  ctx.fillStyle = '#475569';
  ctx.font = `600 13px ${SANS_FONT}`;
  branchLines.forEach((line) => {
    ctx.fillText(line, width / 2, y);
    y += 18;
  });

  ctx.fillStyle = '#64748b';
  ctx.font = `600 11.5px ${SANS_FONT}`;
  ctx.fillText(`TRN: ${ACADEMY_TRN}  •  OFFICIAL FEE DUE NOTICE & RENEWAL STATEMENT`, width / 2, y + 2);
  y += 24;

  // Due Status Pill
  const pillText = isPastDue ? 'PAYMENT OVERDUE  •  RENEWAL REQUIRED' : 'TUITION FEE DUE  •  FRIENDLY REMINDER';
  ctx.font = `800 11.5px ${SANS_FONT}`;
  const pillWidth = ctx.measureText(pillText).width + 44;
  const pillX = (width - pillWidth) / 2;
  drawRoundedRectPath(ctx, pillX, y, pillWidth, 28, 14);
  ctx.fillStyle = isPastDue ? '#fef2f2' : '#fffbeb';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = isPastDue ? '#fca5a5' : '#fcd34d';
  ctx.stroke();

  drawAlertBadgeIcon(ctx, pillX + 16, y + 14, 7.5, isPastDue ? '#dc2626' : '#d97706');
  ctx.fillStyle = isPastDue ? '#b91c1c' : '#b45309';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, pillX + 29, y + 14.5);
  y += statusPillH;

  ctx.beginPath();
  ctx.moveTo(padX, y + 4);
  ctx.lineTo(width - padX, y + 4);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();
  y += 18;

  // Metadata Box
  drawRoundedRectPath(ctx, padX, y, innerWidth, metaBoxH, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  const leftColX = padX + 18;
  const rightColX = width - padX - 18;
  let my = y + 16;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('NOTICE REFERENCE & ISSUE DATE', leftColX, my);

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 14px ${MONO_FONT}`;
  ctx.fillText(`${refCode}`, leftColX, my + 16);
  ctx.fillStyle = '#64748b';
  ctx.font = `600 11.5px ${SANS_FONT}`;
  ctx.fillText(`Issued: ${issueDateDisplay}`, leftColX + 145, my + 17.5);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('PAYMENT DUE DATE', rightColX, my);

  ctx.fillStyle = '#dc2626';
  ctx.font = `800 15px ${SANS_FONT}`;
  ctx.fillText(dueDateDisplay, rightColX, my + 16);

  my += metaTopRowH + 8;
  ctx.beginPath();
  ctx.moveTo(padX + 14, my);
  ctx.lineTo(width - padX - 14, my);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();
  my += 12;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('STUDENT NAME', leftColX, my);

  let sy = my + 16;
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 17px ${SANS_FONT}`;
  studentLines.forEach((line) => {
    ctx.fillText(line, leftColX, sy);
    sy += 21;
  });
  ctx.fillStyle = '#b45309';
  ctx.font = `700 12.5px ${SANS_FONT}`;
  ctx.fillText(student.beltRank || 'Karateka', leftColX, sy + 1);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10.5px ${SANS_FONT}`;
  ctx.fillText('PARENT / GUARDIAN', rightColX, my);

  let py = my + 16;
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 14px ${SANS_FONT}`;
  parentLines.forEach((line) => {
    ctx.fillText(line, rightColX, py);
    py += 19;
  });
  ctx.fillStyle = '#475569';
  ctx.font = `600 12.5px ${SANS_FONT}`;
  ctx.fillText(phoneDisplay, rightColX, py + 1);

  y += metaBoxH + 22;

  // Section Label
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = `800 11px ${SANS_FONT}`;
  ctx.fillText('FEE RENEWAL BREAKDOWN', padX, y);
  y += 22;

  // Table Container
  drawRoundedRectPath(ctx, padX, y, innerWidth, tableH, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.save();
  drawRoundedRectPath(ctx, padX, y, innerWidth, tableH, 14);
  ctx.clip();

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(padX, y, innerWidth, tableHeaderH);
  ctx.fillStyle = '#475569';
  ctx.font = `800 11px ${SANS_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('FEE DESCRIPTION', padX + 18, y + tableHeaderH / 2);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT (DHS)', width - padX - 18, y + tableHeaderH / 2);

  let ty = y + tableHeaderH;
  ctx.beginPath();
  ctx.moveTo(padX, ty);
  ctx.lineTo(width - padX, ty);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  let iy = ty + 15;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 14.5px ${SANS_FONT}`;
  ctx.fillText(`${planName} (${billingCycle})`, padX + 18, iy);
  iy += 21;

  ctx.fillStyle = '#475569';
  ctx.font = `600 12.5px ${SANS_FONT}`;
  ctx.fillText(`Branch: ${dojoName}`, padX + 18, iy);
  iy += 19;

  if (lastPaidDisplay) {
    ctx.fillStyle = '#64748b';
    ctx.font = `500 12.5px ${SANS_FONT}`;
    ctx.fillText(`Last Payment Date: ${lastPaidDisplay}`, padX + 18, iy);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 15px ${SANS_FONT}`;
  ctx.fillText(breakdown.baseAmount.toFixed(2), width - padX - 18, ty + 20);

  ty += itemRowH;
  ctx.beginPath();
  ctx.moveTo(padX, ty);
  ctx.lineTo(width - padX, ty);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#475569';
  ctx.font = `600 13px ${SANS_FONT}`;
  ctx.fillText(`UAE VAT (${breakdown.vatRate}%)`, padX + 18, ty + vatRowH / 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#b45309';
  ctx.font = `700 13.5px ${SANS_FONT}`;
  ctx.fillText(`+${breakdown.vatAmount.toFixed(2)}`, width - padX - 18, ty + vatRowH / 2);

  ty += vatRowH;
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(padX, ty, innerWidth, totalRowH);
  ctx.beginPath();
  ctx.moveTo(padX, ty);
  ctx.lineTo(width - padX, ty);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 15.5px ${SANS_FONT}`;
  ctx.fillText(`Total Outstanding Due (Incl. ${breakdown.vatRate}% VAT)`, padX + 18, ty + totalRowH / 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#dc2626';
  ctx.font = `900 22px ${SANS_FONT}`;
  ctx.fillText(`${formatCurrencyAmount(breakdown.totalDue)} Dhs`, width - padX - 18, ty + totalRowH / 2);

  ctx.restore();
  y += tableH + 18;

  // Accepted Payment Modes Box
  drawRoundedRectPath(ctx, padX, y, innerWidth, paymentModesBoxH, 12);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#475569';
  ctx.font = `800 10.5px ${SANS_FONT}`;
  ctx.fillText('ACCEPTED PAYMENT METHODS', padX + 18, y + 12);

  const modes = ['Card / POS Machine', 'Bank Transfer', 'Apple Pay / Link', 'Cash at Dojo'];
  const pillGap = 10;
  const modeW = (innerWidth - 36 - pillGap * (modes.length - 1)) / modes.length;
  modes.forEach((mode, idx) => {
    const mx = padX + 18 + idx * (modeW + pillGap);
    const modeY = y + 33;
    drawRoundedRectPath(ctx, mx, modeY, modeW, 28, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 11px ${SANS_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mode, mx + modeW / 2, modeY + 14.5);
  });

  y += paymentModesBoxH + 22;

  // Footer
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(width - padX, y);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  const fy = y + 26;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 12px ${SANS_FONT}`;
  ctx.fillText(`Inquiry Desk: ${dojoPhone}`, padX, fy - 8);
  ctx.fillStyle = '#64748b';
  ctx.font = `500 11.5px ${SANS_FONT}`;
  ctx.fillText('Kindly remit at your earliest convenience. Thank you!', padX, fy + 10);

  const stampW = 212;
  const stampH = 40;
  const stampX = width - padX - stampW;
  const stampY = y + 12;
  ctx.save();
  ctx.setLineDash([4, 3]);
  drawRoundedRectPath(ctx, stampX, stampY, stampW, stampH, 10);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#334155';
  ctx.font = `700 10.5px ${MONO_FONT}`;
  ctx.fillText('AL MUHARIB KARATE CENTER', stampX + stampW / 2, stampY + 14);
  ctx.fillStyle = '#64748b';
  ctx.font = `600 9.5px ${MONO_FONT}`;
  ctx.fillText('Administration Desk', stampX + stampW / 2, stampY + 28);

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrlToBlob(dataUrl);
};

/**
 * Checks whether the current browser likely supports native File sharing (primarily mobile devices).
 */
export const canNativeShareImageFiles = () => {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (!isMobileDevice) return false;
  try {
    if (navigator.canShare) {
      const dummy = new File([new Uint8Array([0])], 'test.png', { type: 'image/png' });
      return navigator.canShare({ files: [dummy] });
    }
  } catch {
    return false;
  }
  return true;
};

/**
 * Dispatches a PNG receipt / due-notice image to WhatsApp:
 * - Mobile (native share sheet with PNG file support): shares the PNG directly to WhatsApp/apps.
 * - Desktop (Windows/Mac): copies the PNG to the system clipboard and opens the parent's exact
 *   WhatsApp chat (`wa.me/<cleanPhone>`) so staff just presses Ctrl+V -> Enter!
 * - Fallback if clipboard write isn't permitted: downloads PNG and opens `wa.me/<cleanPhone>`.
 *
 * Returns { method: 'native-share' | 'clipboard' | 'download' | 'cancelled', waUrl, popupBlocked }
 */
export const dispatchDocumentImageToWhatsApp = async ({
  blob,
  filename,
  phone,
  fallbackText = '',
  preferNativeShare = false,
  onToast = null
}) => {
  const cleanPhone = getCleanWhatsAppPhone(phone);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}`
    : `https://wa.me/${fallbackText ? `?text=${encodeURIComponent(fallbackText)}` : ''}`;

  const isMobileDevice = typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  if ((preferNativeShare || isMobileDevice) && typeof navigator !== 'undefined' && navigator.share && blob) {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename.replace(/\.png$/i, '')
        });
        if (onToast) onToast('Shared official document image!', 'success');
        return { method: 'native-share', waUrl, popupBlocked: false };
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { method: 'cancelled', waUrl, popupBlocked: false };
      }
    }
  }

  let copiedToClipboard = false;
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined' && blob) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      copiedToClipboard = true;
    } catch (err) {
      console.warn('Clipboard PNG copy failed, falling back to download:', err);
    }
  }

  if (!copiedToClipboard && blob) {
    triggerBlobDownload(blob, filename);
  }

  const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
  const popupBlocked = !win;

  if (copiedToClipboard) {
    if (onToast) {
      onToast(
        cleanPhone
          ? 'Document image copied! Press Ctrl+V (or Paste) in WhatsApp to send.'
          : 'Document image copied! Select parent in WhatsApp and press Ctrl+V.',
        'success'
      );
    }
    return { method: 'clipboard', waUrl, popupBlocked };
  }

  if (onToast) {
    onToast('Document image downloaded! Attach it in the opened WhatsApp chat.', 'info');
  }
  return { method: 'download', waUrl, popupBlocked };
};
