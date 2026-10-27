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
import { Building, CalendarDays } from 'lucide-react';

const MainContent = () => {
  const { activeTab, setActiveTab, modalState, setModalState } = useDojo();

  return (
    <div className="min-h-screen bg-dojo-bg text-white pb-24 sm:pb-12">
      {/* Toast Notifications */}
      <Toast />

      {/* Top Navigation */}
      <Navbar />

      {/* Desktop Navigation Tabs */}
      <DesktopTabs />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'students' && <StudentListView />}
        {activeTab === 'fees' && <FeePlansView />}
        {activeTab === 'dojos' && <DojoListView />}
        {activeTab === 'batches' && <BatchListView />}
        
        {/* Mobile 'More' screen */}
        {activeTab === 'more' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white">Management & Settings</h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setActiveTab('dojos')}
                className="flex items-center justify-between p-4 bg-dojo-card border border-dojo-border rounded-2xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Dojo Branches</h4>
                    <p className="text-xs text-zinc-400">Manage locations and chief instructors</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-dojo-red">Manage →</span>
              </button>

              <button
                onClick={() => setActiveTab('batches')}
                className="flex items-center justify-between p-4 bg-dojo-card border border-dojo-border rounded-2xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-500 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Class Batches & Schedules</h4>
                    <p className="text-xs text-zinc-400">Timings, days of week, and capacity limits</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500">Manage →</span>
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
        onClose={() => setModalState(prev => ({ ...prev, recordPayment: false }))}
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
