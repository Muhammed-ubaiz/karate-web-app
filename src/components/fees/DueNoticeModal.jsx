import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Phone
} from 'lucide-react';
import { useDojo } from '../../context/DojoContext';
import {
  formatDisplayDate,
  getStudentDueBreakdown,
  buildStudentWhatsAppUrl
} from '../../utils/whatsappHelper';
import { formatCurrencyAmount } from '../../utils/billingHelper';
import {
  generateDueNoticePngBlob,
  dispatchDocumentImageToWhatsApp,
  triggerBlobDownload
} from '../../utils/receiptImageGenerator';

export const DueNoticeModal = ({ isOpen, onClose, student, dojo = null, onSent = null }) => {
  const { feePlans, dojos, showToast } = useDojo();
  const [dispatchInfo, setDispatchInfo] = useState(null);
  const [isSendingImage, setIsSendingImage] = useState(false);

  useEffect(() => {
    setDispatchInfo(null);
    setIsSendingImage(false);
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const resolvedDojo = dojo || dojos.find(d => d.id === student.dojoId) || null;
  const dojoName = resolvedDojo?.name || 'Al Muharib Karate Center';
  const dojoPhone = resolvedDojo?.phone || '+971 50 123 4567';
  const branchSubtitle = dojoName.toLowerCase() !== 'al muharib karate center'
    ? `${dojoName} • United Arab Emirates`
    : 'United Arab Emirates';

  const breakdown = getStudentDueBreakdown(student, feePlans);
  const planName = breakdown.plan?.name || 'Karate Training Package';
  const billingCycle = breakdown.plan?.billingCycle || `${breakdown.plan?.durationMonths || 1} Month(s)`;

  const todayISO = new Date().toISOString().split('T')[0];
  const issueDateDisplay = formatDisplayDate(todayISO);
  const dueDateDisplay = student.nextDueDate ? formatDisplayDate(student.nextDueDate) : 'Immediate Payment';
  const lastPaidDisplay = student.lastPaidDate ? formatDisplayDate(student.lastPaidDate) : null;
  const isPastDue = Boolean(student.nextDueDate && todayISO > student.nextDueDate);

  const refCode = `DUE-${todayISO.replace(/-/g, '').slice(2, 6)}-${String(student.id || '001').slice(-4).toUpperCase()}`;
  const parentDisplay = student.parentName && student.parentName !== 'Self'
    ? student.parentName
    : 'Parent / Guardian';
  const phoneDisplay = student.whatsapp || student.phone || student.parentPhone || '';

  const safeSlug = String(student.fullName || 'student').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const pngFilename = `Fee-Due-Notice-${safeSlug || 'Student'}.png`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    const blob = generateDueNoticePngBlob({ student, dojo: resolvedDojo, feePlans });
    if (!blob) return;
    triggerBlobDownload(blob, pngFilename);
    if (showToast) showToast(`Saved fee due notice: ${pngFilename}`, 'success');
  };

  const handleWhatsAppImageShare = async () => {
    if (isSendingImage) return;
    setIsSendingImage(true);
    try {
      const blob = generateDueNoticePngBlob({ student, dojo: resolvedDojo, feePlans });
      const res = await dispatchDocumentImageToWhatsApp({
        blob,
        filename: pngFilename,
        phone: phoneDisplay,
        fallbackText: '',
        onToast: showToast
      });
      if (res && res.method !== 'cancelled') {
        setDispatchInfo(res);
        if (typeof onSent === 'function') onSent(student.id);
      }
    } finally {
      setIsSendingImage(false);
    }
  };

  const handleWhatsAppTextShare = () => {
    const url = buildStudentWhatsAppUrl(student, resolvedDojo, feePlans);
    if (!url) {
      if (showToast) showToast(`No valid phone number for ${student.fullName}.`, 'error');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof onSent === 'function') onSent(student.id);
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="printable-portal-root fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div className="printable-portal-card w-full max-w-xl bg-[#18181c] border border-zinc-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Official Fee Due Notice
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={isSendingImage}
              onClick={handleWhatsAppImageShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/40 cursor-pointer active:scale-95"
              title="Send Official Fee Due Notice image directly to parent on WhatsApp"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="sm:hidden">Send Image</span>
              <span className="hidden sm:inline">Send Notice Image (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer active:scale-95"
              title="Download printable fee due notice PNG image"
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
              title="Send text-only reminder via WhatsApp"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Text</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close due notice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Image Dispatch Confirmation Banner */}
        {dispatchInfo && (
          <div className="px-4 py-2.5 bg-emerald-950/80 border-b border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-2 text-emerald-200 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {dispatchInfo.method === 'clipboard'
                  ? 'Due Notice image copied! In the WhatsApp chat, press Ctrl+V (or Paste) and send.'
                  : dispatchInfo.method === 'download'
                  ? 'Due Notice image downloaded! Attach the PNG file inside WhatsApp.'
                  : 'Due Notice image ready to share!'}
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

        {/* White-Paper Printable Official Fee Due Notice */}
        <div className="p-3.5 sm:p-5 overflow-y-auto bg-zinc-950/60 print:p-0 print:bg-white">
          <div className="printable-paper bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="h-2.5 w-full bg-red-600" />

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
                  TRN: 100293847500003 • Official Fee Due Notice &amp; Renewal Statement
                </p>

                <div className="mt-3 flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                      isPastDue
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {isPastDue ? 'Payment Overdue • Renewal Required' : 'Tuition Fee Due • Friendly Reminder'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Notice Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Notice Ref &amp; Issue Date
                  </span>
                  <span className="font-mono font-extrabold text-sm text-slate-900">{refCode}</span>
                  <span className="block text-[11px] text-slate-500 font-medium">Issued: {issueDateDisplay}</span>
                </div>

                <div className="sm:text-right min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Payment Due Date
                  </span>
                  <span className="font-extrabold text-sm text-red-600">{dueDateDisplay}</span>
                </div>

                <div className="pt-2.5 border-t border-slate-200 min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Student Name
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm break-words block">
                    {student.fullName || 'Student'}
                  </span>
                  <span className="block text-[11px] text-amber-700 font-bold">
                    {student.beltRank || 'Karateka'}
                  </span>
                </div>

                <div className="sm:text-right pt-2.5 border-t border-slate-200 min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Parent / Guardian
                  </span>
                  <span className="font-bold text-slate-900 break-words block">{parentDisplay}</span>
                  <span className="block text-[11px] font-medium text-slate-600">{phoneDisplay || '—'}</span>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Fee Renewal Breakdown
                </span>
                <div className="rounded-xl border border-slate-300 overflow-hidden divide-y divide-slate-200 text-xs">
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                    <span>Fee Description</span>
                    <span>Amount (Dhs)</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 px-3.5 py-3 text-slate-900">
                    <div className="min-w-0">
                      <span className="font-extrabold block text-sm">
                        {planName} ({billingCycle})
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                        Branch: {dojoName}
                      </span>
                      {lastPaidDisplay && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Last Payment Date: {lastPaidDisplay}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm shrink-0 text-slate-900">
                      {breakdown.baseAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-3.5 py-2.5 text-slate-600 text-xs">
                    <span className="font-semibold">UAE VAT ({breakdown.vatRate}%)</span>
                    <span className="font-bold text-amber-700">+{breakdown.vatAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between px-3.5 py-3.5 bg-red-50 text-slate-900 font-bold text-sm">
                    <span className="font-extrabold">
                      Total Outstanding Due (Incl. {breakdown.vatRate}% VAT)
                    </span>
                    <span className="text-lg font-black text-red-600">
                      {formatCurrencyAmount(breakdown.totalDue)} Dhs
                    </span>
                  </div>
                </div>
              </div>

              {/* Accepted Payment Methods */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                  Accepted Payment Methods
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold text-slate-800 text-center">
                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200">Card / POS Machine</div>
                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200">Bank Transfer</div>
                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200">Apple Pay / Link</div>
                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200">Cash at Dojo</div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Inquiry Desk: {dojoPhone}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Kindly remit at your earliest convenience. Thank you!
                  </span>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1.5 border border-dashed border-slate-400 rounded-lg text-[10px] text-slate-700 font-mono text-center">
                    <span className="font-bold block">AL MUHARIB KARATE CENTER</span>
                    <span className="text-[9px] text-slate-500">Administration Desk</span>
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
