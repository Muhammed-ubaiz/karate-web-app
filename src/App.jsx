import React from 'react';
import { DojoProvider, useDojo } from './context/DojoContext';
import { Navbar } from './components/layout/Navbar';
import { DesktopTabs } from './components/layout/DesktopTabs';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/layout/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { DojoListView } from './components/dojos/DojoListView';
import { BatchListView } from './components/batches/BatchListView';
import { FeePlansView } from './components/fees/FeePlansView';
import { StudentListView } from './components/students/StudentListView';
import { AttendanceView } from './components/attendance/AttendanceView';

// Modals
import { AddDojoModal } from './components/dojos/AddDojoModal';
import { AddBatchModal } from './components/batches/AddBatchModal';
import { AddFeePlanModal } from './components/fees/AddFeePlanModal';
import { StudentRegistrationModal } from './components/students/StudentRegistrationModal';
import { RecordPaymentModal } from './components/fees/RecordPaymentModal';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { Building, CalendarDays, CreditCard, ChevronRight, Sun, Moon } from 'lucide-react';

const MainContent = () => {
  const {
    activeTab,
    setActiveTab,
    modalState,
    setModalState,
    isAdminLoginOpen,
    closeAdminLoginModal,
    pendingAdminAction,
    theme,
    toggleTheme
  } = useDojo();

  const isLight = theme === 'light';

  return (
    <div className="min-h-screen w-full bg-dojo-bg text-slate-900 dark:text-white pb-24 md:pb-12 overflow-x-hidden transition-colors duration-200">
      {/* Toast Notifications */}
      <Toast />

      {/* Top Navigation */}
      <Navbar />

      {/* Tablet & Desktop Navigation Tabs */}
      <DesktopTabs />

      {/* Main View Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'students' && <StudentListView />}
        {activeTab === 'fees' && <FeePlansView />}
        {activeTab === 'dojos' && <DojoListView />}
        {activeTab === 'batches' && <BatchListView />}
        
        {/* Mobile 'More' screen */}
        {activeTab === 'more' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Management & Settings</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">Dojo branches, training batches, and tuition structures</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('dojos')}
                className="flex items-center justify-between p-4 bg-dojo-card border border-dojo-border rounded-2xl hover:border-zinc-700 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Dojo Branches</h4>
                    <p className="text-xs text-zinc-400">Locations & instructors</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => setActiveTab('batches')}
                className="flex items-center justify-between p-4 bg-dojo-card border border-dojo-border rounded-2xl hover:border-zinc-700 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-500 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Batches & Schedules</h4>
                    <p className="text-xs text-zinc-400">Timings & capacity</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => setActiveTab('fees')}
                className="flex items-center justify-between p-4 bg-dojo-card border border-dojo-border rounded-2xl hover:border-zinc-700 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Fee Plans & Dues</h4>
                    <p className="text-xs text-zinc-400">Subscriptions & billing</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="sm:col-span-3 flex items-center justify-between p-4 bg-dojo-card border border-dojo-border rounded-2xl hover:border-zinc-700 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    {isLight ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">
                      Appearance: {isLight ? 'Light Mode' : 'Dark Mode'}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Tap to switch to {isLight ? 'Dark' : 'Light'} theme
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0">
                  {isLight ? 'Dark 🌙' : 'Light ☀️'}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Modals triggered from quick action buttons */}
      <AddDojoModal
        isOpen={modalState.addDojo}
        onClose={() => setModalState(prev => ({ ...prev, addDojo: false }))}
      />
      <AddBatchModal
        isOpen={modalState.addBatch}
        onClose={() => setModalState(prev => ({ ...prev, addBatch: false }))}
      />
      <AddFeePlanModal
        isOpen={modalState.addFeePlan}
        onClose={() => setModalState(prev => ({ ...prev, addFeePlan: false }))}
      />
      <StudentRegistrationModal
        isOpen={modalState.addStudent}
        onClose={() => setModalState(prev => ({ ...prev, addStudent: false }))}
      />
      <RecordPaymentModal
        isOpen={modalState.recordPayment}
        onClose={() => setModalState(prev => ({
          ...prev,
          recordPayment: false,
          recordPaymentStudentId: null,
          recordPaymentRenewalType: null
        }))}
        defaultStudentId={modalState.recordPaymentStudentId}
        defaultRenewalType={modalState.recordPaymentRenewalType}
      />
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={closeAdminLoginModal}
        pendingAction={pendingAdminAction}
      />

      {/* Mobile-Friendly Pinned Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <DojoProvider>
      <MainContent />
    </DojoProvider>
  );
}
