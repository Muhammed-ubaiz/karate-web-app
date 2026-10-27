import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { X, CreditCard, CheckCircle2, User, DollarSign, MessageSquare, Receipt } from 'lucide-react';

export const RecordPaymentModal = ({ isOpen, onClose }) => {
  const { students, recordPayment, showToast } = useDojo();
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState('3000');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [notes, setNotes] = useState('');
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState(true);

  if (!isOpen) return null;

  const currentStudent = students.find(s => s.id === selectedStudentId);

  const handleStudentChange = (id) => {
    setSelectedStudentId(id);
    const s = students.find(item => item.id === id);
    if (s && s.dueAmount > 0) {
      setAmount(s.dueAmount.toString());
    } else {
      setAmount('3000');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudentId || !amount || Number(amount) <= 0) return;

    recordPayment({
      studentId: selectedStudentId,
      amount: Number(amount),
      paymentMethod,
      notes
    });

    if (sendWhatsAppReceipt && currentStudent?.whatsapp) {
      showToast(`WhatsApp receipt sent to ${currentStudent.fullName}!`, 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Record Student Fee</h2>
              <p className="text-[11px] text-zinc-400">Collect dues, update balances & issue receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Select Student */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Select Student *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.beltRank}) - Due: ₹{s.dueAmount || 0}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Dues Banner */}
          {currentStudent && (
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Current Outstanding Due:</span>
                <span className={`font-extrabold text-sm ${currentStudent.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  ₹{currentStudent.dueAmount?.toLocaleString() || 0}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStudent.feeStatus === 'Overdue' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400'
              }`}>
                {currentStudent.feeStatus}
              </span>
            </div>
          )}

          {/* Amount Collected */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Payment Amount Received (₹) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-lg font-bold text-emerald-400 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Payment Method Pills */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['UPI / GPay', 'Cash at Dojo', 'Card POS', 'Bank Transfer'].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                    paymentMethod === mode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks / Reference ID */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Transaction Ref / Receipt Note
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #90231 or Month of Oct"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* WhatsApp Receipt Toggle */}
          <label className="flex items-center gap-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsAppReceipt}
              onChange={(e) => setSendWhatsAppReceipt(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
            />
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                Send instant WhatsApp payment receipt to parent
              </span>
            </div>
          </label>

          {/* Submit Action */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-700/30 transition-all"
            >
              Confirm & Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
