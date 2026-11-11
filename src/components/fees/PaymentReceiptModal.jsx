import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { getCleanWhatsAppPhone } from '../../utils/whatsappHelper';
import { formatCurrencyAmount } from '../../utils/billingHelper';
import {
  generateReceiptPngBlob,
  resolveReceiptBreakdown,
  dispatchDocumentImageToWhatsApp,
  triggerBlobDownload
} from '../../utils/receiptImageGenerator';
import { useDojo } from '../../context/DojoContext';

export const PaymentReceiptModal = ({ isOpen, onClose, receiptData }) => {
  const { showToast } = useDojo();
  const [dispatchInfo, setDispatchInfo] = useState(null);
  const [isSendingImage, setIsSendingImage] = useState(false);

  useEffect(() => {
    setDispatchInfo(null);
    setIsSendingImage(false);
  }, [isOpen, receiptData?.billNumber, receiptData?.receiptNumber]);

  if (!isOpen || !receiptData) return null;

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

  const safeSlug = String(studentName || 'student').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const pngFilename = `Receipt-${displayBillNumber}-${safeSlug || 'Student'}.png`;

  const branchSubtitle = dojoName && dojoName.toLowerCase() !== 'al muharib karate center'
    ? `${dojoName} • United Arab Emirates`
    : 'United Arab Emirates';

  const buildPlainTextReceipt = () => {
    let periodInfo = '';
    if (periodText) {
      periodInfo = `• Subscription Period: *${periodText}* (${renewalLabel})\n`;
    }

    return `🥋 *AL MUHARIB KARATE CENTER - OFFICIAL RECEIPT*\n\n` +
      `Bill / Receipt No: *${displayBillNumber}*${isReset ? ' (VOID / RESET)' : ''}\n` +
      `Date: ${date} ${time}\n` +
      `Student: *${studentName}* (${beltRank})\n` +
      `Branch: ${dojoName}\n\n` +
      `📌 *Payment Breakdown:*\n` +
      periodInfo +
      `• Base Amount: ${breakdown.baseAmount.toFixed(2)} Dhs\n` +
      `• ${breakdown.vatRate}% UAE VAT: ${breakdown.vatAmount.toFixed(2)} Dhs\n` +
      `• *Total Paid: ${formatCurrencyAmount(breakdown.totalNum)} Dhs*\n` +
      `• Payment Mode: ${paymentMethod}\n` +
      `• Remaining Balance: ${formatCurrencyAmount(remainingDue)} Dhs\n\n` +
      `Status: *${isReset ? 'RESET / VOIDED' : 'PAID & CONFIRMED ✅'}*\n\n` +
      `Thank you for training with us!\n` +
      `_Al Muharib Karate Center Administration_ 🥋`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    const blob = generateReceiptPngBlob(receiptData);
    if (!blob) return;
    triggerBlobDownload(blob, pngFilename);
    if (showToast) showToast(`Saved receipt image: ${pngFilename}`, 'success');
  };

  const handleWhatsAppImageShare = async () => {
    if (isSendingImage) return;
    setIsSendingImage(true);
    try {
      const blob = generateReceiptPngBlob(receiptData);
      const res = await dispatchDocumentImageToWhatsApp({
        blob,
        filename: pngFilename,
        phone,
        fallbackText: buildPlainTextReceipt(),
        onToast: showToast
      });
      if (res && res.method !== 'cancelled') {
        setDispatchInfo(res);
      }
    } finally {
      setIsSendingImage(false);
    }
  };

  const handleWhatsAppTextShare = () => {
    const cleanPhone = getCleanWhatsAppPhone(phone);
    const message = buildPlainTextReceipt();
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="printable-portal-root fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div className="printable-portal-card w-full max-w-xl bg-[#18181c] border border-zinc-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Action Controls (Hidden in Print) */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Official Printable Receipt
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={isSendingImage}
              onClick={handleWhatsAppImageShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/40 cursor-pointer active:scale-95"
              title="Send Official Receipt image directly to parent on WhatsApp"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="sm:hidden">Send Image</span>
              <span className="hidden sm:inline">Send Receipt Image (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer active:scale-95"
              title="Download printable receipt PNG image"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer active:scale-95"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppTextShare}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-300 rounded-xl text-[11px] font-semibold border border-zinc-700/80 transition-all cursor-pointer"
              title="Send text-only receipt via WhatsApp"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Text</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Image Helper Banner after clicking Send Image */}
        {dispatchInfo && (
          <div className="px-4 py-2.5 bg-emerald-950/80 border-b border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-2 text-emerald-200 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {dispatchInfo.method === 'clipboard'
                  ? 'Receipt image copied! In the WhatsApp chat, press Ctrl+V (or Paste) and send.'
                  : dispatchInfo.method === 'download'
                  ? 'Receipt image downloaded! Attach the PNG file inside WhatsApp.'
                  : 'Receipt image ready to share!'}
              </span>
            </div>
            {dispatchInfo.waUrl && (
              <a
                href={dispatchInfo.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shrink-0"
              >
                <span>Open WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* White-Paper Printable Official Receipt Preview */}
        <div className="p-3.5 sm:p-5 overflow-y-auto bg-zinc-950/60 print:p-0 print:bg-white">
          <div className="printable-paper bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Top Crimson / Reset Accent Strip */}
            <div className={`h-2.5 w-full ${isReset ? 'bg-orange-600' : 'bg-red-600'}`} />

            <div className="p-5 sm:p-7 space-y-5">
              {/* Academy Brand Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-black text-2xl mb-2.5">
                  🥋
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  Al Muharib Karate Center
                </h2>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {branchSubtitle}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  TRN: 100293847500003 • Official Tax Invoice &amp; Payment Receipt
                </p>

                <div className="mt-3 flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                      isReset
                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    {isReset ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Void / Reset Receipt</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid &amp; Confirmed{isEdited ? ' • Corrected' : ''}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Reset Warning if Voided */}
              {isReset && (
                <div className="p-3 bg-orange-50 border border-orange-300 rounded-xl text-xs text-orange-900 font-semibold text-center">
                  THIS TRANSACTION WAS RESET / VOIDED{resetReason ? ` — Reason: ${resetReason}` : ''}
                </div>
              )}

              {/* Receipt Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Bill / Receipt Number
                  </span>
                  <span className="font-mono font-extrabold text-base text-amber-700 break-all">
                    {displayBillNumber}
                  </span>
                  {isEdited && (
                    <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Corrected
                    </span>
                  )}
                </div>

                <div className="sm:text-right min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Date &amp; Time
                  </span>
                  <span className="font-bold text-slate-900">{date} • {time}</span>
                </div>

                <div className="pt-2.5 border-t border-slate-200 min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Student Name
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm break-words block">
                    {studentName}
                  </span>
                  <span className="block text-[11px] text-amber-700 font-bold">{beltRank}</span>
                </div>

                <div className="sm:text-right pt-2.5 border-t border-slate-200 min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Parent / Contact
                  </span>
                  <span className="font-bold text-slate-900 break-words block">{parentName || 'Self'}</span>
                  <span className="block text-[11px] font-medium text-slate-600">{phone || '—'}</span>
                </div>
              </div>

              {/* Payment Breakdown Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Payment Breakdown
                </span>
                <div className="rounded-xl border border-slate-300 overflow-hidden divide-y divide-slate-200 text-xs">
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                    <span>Description</span>
                    <span>Amount (Dhs)</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 px-3.5 py-3 text-slate-900">
                    <div className="min-w-0">
                      <span className="font-extrabold block text-sm">
                        {planName ? `Karate Training — ${planName}` : 'Karate Training Subscription'}
                      </span>
                      {periodText && (
                        <span className="text-[11px] text-amber-700 font-bold block mt-0.5">
                          Period: {periodText} ({renewalLabel})
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {notes || 'Karate training sessions'}
                      </span>
                    </div>
                    <span className="font-bold text-sm shrink-0 text-slate-900">
                      {breakdown.baseAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-3.5 py-2.5 text-slate-600 text-xs">
                    <span className="font-semibold">UAE VAT ({breakdown.vatRate}%)</span>
                    <span className="font-bold text-amber-700">+{breakdown.vatAmount.toFixed(2)}</span>
                  </div>

                  <div
                    className={`flex items-center justify-between px-3.5 py-3.5 font-bold text-sm ${
                      isReset ? 'bg-orange-50 text-orange-900' : 'bg-emerald-50 text-slate-900'
                    }`}
                  >
                    <span className="font-extrabold">
                      {isReset ? 'Total Voided Amount' : 'Total Amount Paid'}
                    </span>
                    <span
                      className={`text-lg font-black ${
                        isReset ? 'text-orange-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrencyAmount(breakdown.totalNum)} Dhs
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method & Remaining Balance */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Payment Method:</span>
                  <span className="font-extrabold text-slate-900">{paymentMethod}</span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 font-semibold block text-[11px]">Remaining Due:</span>
                  <span className={`font-extrabold ${Number(remainingDue) > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatCurrencyAmount(remainingDue)} Dhs
                  </span>
                </div>
              </div>

              {/* Verification Stamp & Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className={`flex items-center gap-1.5 ${isReset ? 'text-orange-700' : 'text-emerald-700'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-extrabold text-[11px] uppercase tracking-wider block">
                      {isReset ? 'Voided Record' : 'Payment Verified & Authorized'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Thank you for training with us!
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1.5 border border-dashed border-slate-400 rounded-lg text-[10px] text-slate-700 font-mono text-center">
                    <span className="font-bold block">AL MUHARIB KARATE CENTER</span>
                    <span className="text-[9px] text-slate-500">Official Administration Stamp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
