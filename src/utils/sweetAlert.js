import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Al Muharib Karate Center Crimson & Charcoal Dark Theme for SweetAlert2
export const DojoSwal = Swal.mixin({
  background: '#1a1a1e',
  color: '#f3f4f6',
  backdrop: 'rgba(0, 0, 0, 0.75)',
  customClass: {
    popup: 'border border-zinc-700/90 rounded-2xl shadow-2xl p-6 text-center',
    title: 'text-lg sm:text-xl font-black text-white tracking-tight',
    htmlContainer: 'text-zinc-300 text-xs sm:text-sm leading-relaxed mt-2',
    confirmButton: 'inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-600/30 transition-all border border-red-500/40 mx-1.5 cursor-pointer',
    cancelButton: 'inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all border border-zinc-700 mx-1.5 cursor-pointer',
    denyButton: 'inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all border border-zinc-700 mx-1.5 cursor-pointer',
    actions: 'mt-5 flex items-center justify-center gap-2',
  },
  buttonsStyling: false,
});

// Toast notification using SweetAlert2
export const ToastSwal = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#18181c',
  color: '#ffffff',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// Helper Functions
export const showSuccessAlert = (title, text) => {
  return DojoSwal.fire({
    icon: 'success',
    title,
    text,
    iconColor: '#10b981',
    confirmButtonText: 'Great, Osu! 🥋'
  });
};

export const showErrorAlert = (title, text) => {
  return DojoSwal.fire({
    icon: 'error',
    title,
    text,
    iconColor: '#ef4444',
    confirmButtonText: 'Dismiss'
  });
};

export const showWarningAlert = (title, text) => {
  return DojoSwal.fire({
    icon: 'warning',
    title,
    text,
    iconColor: '#f59e0b',
    confirmButtonText: 'Understood'
  });
};

export const showConfirmDialog = async ({
  title,
  text,
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  icon = 'warning'
}) => {
  const result = await DojoSwal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    iconColor: icon === 'warning' ? '#f59e0b' : '#ef4444',
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export const showConfirmWithReasonDialog = async ({
  title,
  text,
  inputLabel = 'Reason / Reference Note (Recorded in Activity Log)',
  inputPlaceholder = 'e.g. Wrong amount entered / Duplicate bill / Refunded',
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  icon = 'warning',
  requireReason = false
}) => {
  const result = await DojoSwal.fire({
    icon,
    title,
    text,
    input: 'text',
    inputLabel,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    iconColor: icon === 'warning' ? '#f59e0b' : '#ef4444',
    reverseButtons: true,
    inputValidator: (value) => {
      if (requireReason && (!value || !value.trim())) {
        return 'Please provide a brief reason for the activity log.';
      }
      return undefined;
    }
  });

  if (!result.isConfirmed) return null;
  return { confirmed: true, reason: (result.value || '').trim() };
};

export const showToastAlert = (message, icon = 'success') => {
  return ToastSwal.fire({
    icon,
    title: message,
    iconColor: icon === 'success' ? '#10b981' : icon === 'error' ? '#ef4444' : '#f59e0b'
  });
};
