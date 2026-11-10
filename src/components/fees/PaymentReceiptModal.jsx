import React from 'react';
import { X, Printer, MessageSquare, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { getCleanWhatsAppPhone } from '../../utils/whatsappHelper';

export const PaymentReceiptModal = ({ isOpen, onClose, receiptData }) => {
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
    dojoName = 'Al Wasl Sports Complex, Dubai',
    amount = 250,
    paymentMethod = 'Card / POS',
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

  const totalNum = Number(amount) || 0;
  const baseAmount = (totalNum / 1.05).toFixed(2);
  const vatAmount = (totalNum - Number(baseAmount)).toFixed(2);

  const renewalLabel = renewalType === 'restart'
    ? 'Resumed After Break'
    : renewalType === 'initial'
    ? 'Initial Admission'
    : 'Regular Renewal';

  const periodText = subscriptionStartDate && nextDueDate
    ? `${subscriptionStartDate} to ${nextDueDate}`
    : '';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = getCleanWhatsAppPhone(phone);
    let periodInfo = '';
    if (periodText) {
      periodInfo = `• Subscription Period: *${periodText}* (${renewalLabel})\n`;
    }

    const message = `🥋 *SENSEIBOOK MARTIAL ARTS ACADEMY - OFFICIAL RECEIPT*\n\n` +
      `Bill / Receipt No: *${displayBillNumber}*${isReset ? ' (VOID / RESET)' : ''}\n` +
      `Date: ${date} ${time}\n` +
      `Student: *${studentName}* (${beltRank})\n` +
      `Branch: ${dojoName}\n\n` +
      `📌 *Payment Breakdown:*\n` +
      periodInfo +
      `• Base Amount: ${baseAmount} Dhs\n` +
      `• 5% UAE VAT: ${vatAmount} Dhs\n` +
      `• *Total Paid: ${totalNum.toLocaleString()} Dhs*\n` +
      `• Payment Mode: ${paymentMethod}\n` +
      `• Remaining Balance: ${remainingDue} Dhs\n\n` +
      `Status: *${isReset ? 'RESET / VOIDED' : 'PAID & CONFIRMED ✅'}*\n\n` +
      `Thank you for training with us!\n` +
      `_Sensei Administration_ 🥋`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="w-full max-w-lg bg-[#18181c] border border-zinc-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:border-none print:shadow-none print:max-h-full print:bg-white print:text-black">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">Official Receipt</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Share WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="sm:hidden">Print</span>
              <span className="hidden sm:inline">Print / PDF</span>
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

        {/* Printable Receipt Paper Card */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#141417] print:bg-white print:p-8 print:text-black">
          {/* Academy Brand Header */}
          <div className="text-center pb-4 border-b border-zinc-800 print:border-zinc-300">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center font-black text-xl mb-2 print:border-black print:text-black">
              🥋
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight print:text-black">
              SenseiBook Martial Arts Academy
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 print:text-zinc-600">
              {dojoName} • United Arab Emirates
            </p>
            <p className="text-[11px] text-zinc-500 print:text-zinc-500 mt-0.5">
              TRN: 100293847500003 • Official Tax Invoice & Receipt
            </p>
          </div>

          {/* Receipt Meta */}
          {isReset && (
            <div className="p-3 bg-orange-950/50 border border-orange-500/50 rounded-xl text-xs text-orange-200 font-semibold text-center print:border-black print:text-black">
              ⚠️ THIS TRANSACTION WAS RESET / VOIDED {resetReason ? `— Reason: ${resetReason}` : ''}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800/80 print:bg-zinc-50 print:border-zinc-200">
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold print:text-zinc-600">
                Bill / Receipt Number
              </span>
              <span className="font-mono font-bold text-amber-400 break-all print:text-black">{displayBillNumber}</span>
              {isEdited && (
                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 print:border-zinc-400 print:text-black">
                  Corrected
                </span>
              )}
            </div>

            <div className="sm:text-right min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold print:text-zinc-600">
                Date & Time
              </span>
              <span className="font-semibold text-zinc-200 print:text-black">{date} • {time}</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 print:border-zinc-200 min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold print:text-zinc-600">
                Student Name
              </span>
              <span className="font-bold text-white text-sm break-words block print:text-black">{studentName}</span>
              <span className="block text-[11px] text-amber-400 font-medium print:text-zinc-700">{beltRank}</span>
            </div>

            <div className="sm:text-right pt-2 border-t border-zinc-800/60 print:border-zinc-200 min-w-0">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold print:text-zinc-600">
                Parent / Contact
              </span>
              <span className="font-semibold text-zinc-200 break-words block print:text-black">{parentName || 'Self'}</span>
              <span className="block text-[11px] text-zinc-400 print:text-zinc-600">{phone || '—'}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block print:text-zinc-700">
              Payment Breakdown
            </span>
            <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 text-xs print:border-zinc-300 print:divide-zinc-300">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 print:bg-zinc-100 font-semibold text-zinc-400 print:text-zinc-700 text-[11px]">
                <span>Description</span>
                <span>Amount (Dhs)</span>
              </div>

              <div className="flex items-center justify-between p-3 text-zinc-200 print:text-black">
                <div>
                  <span className="font-bold block">Karate Training Subscription</span>
                  {periodText && (
                    <span className="text-[11px] text-amber-400 font-semibold block print:text-zinc-800">
                      Period: {periodText} ({renewalLabel})
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-500 print:text-zinc-600 block">{notes || 'Karate training sessions'}</span>
                </div>
                <span className="font-semibold">{baseAmount}</span>
              </div>

              <div className="flex items-center justify-between p-3 text-zinc-400 print:text-zinc-700 text-[11px]">
                <span>UAE VAT (5%)</span>
                <span>+{vatAmount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900/80 font-bold text-white text-sm print:bg-zinc-100 print:text-black">
                <span>Total Amount Paid</span>
                <span className="text-emerald-400 text-base font-black print:text-black">
                  {totalNum.toLocaleString()} Dhs
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Remaining Balance */}
          <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-xs print:bg-zinc-50 print:border-zinc-200">
            <div>
              <span className="text-zinc-400 block text-[11px] print:text-zinc-600">Payment Method:</span>
              <span className="font-bold text-white print:text-black">{paymentMethod}</span>
            </div>

            <div className="text-right">
              <span className="text-zinc-400 block text-[11px] print:text-zinc-600">Remaining Due:</span>
              <span className={`font-bold ${remainingDue > 0 ? 'text-red-400' : 'text-emerald-400 print:text-black'}`}>
                {remainingDue} Dhs
              </span>
            </div>
          </div>

          {/* Verification Stamp & Footer */}
          <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs print:border-zinc-300">
            <div className="flex items-center gap-1.5 text-emerald-400 print:text-black">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wider">Payment Verified & Authorized</span>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 border border-dashed border-zinc-700 rounded-lg text-[10px] text-zinc-500 font-mono print:border-zinc-400 print:text-zinc-700">
                Sensei Desk Stamp
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
