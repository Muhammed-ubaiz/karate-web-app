import React, { useState, useRef, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  ChevronDown,
  Check,
  Building,
  Plus,
  Sparkles,
  Users
} from 'lucide-react';

export const DojoBranchDropdown = () => {
  const {
    dojos,
    selectedDojoId,
    setSelectedDojoId,
    setModalState,
    showToast
  } = useDojo();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeDojo = dojos.find(d => d.id === selectedDojoId);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id, name) => {
    setSelectedDojoId(id);
    setIsOpen(false);
    showToast(`Switched active branch to: ${name}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select Dojo Branch"
        className={`flex items-center gap-1.5 sm:gap-2 bg-[#1a1a1e] hover:bg-zinc-800/90 active:scale-95 text-xs sm:text-sm font-semibold text-zinc-200 border transition-all rounded-xl pl-2 pr-2 sm:pl-2.5 sm:pr-3 py-1.5 sm:py-2 cursor-pointer shadow-sm ${
          isOpen
            ? 'border-red-500 ring-2 ring-red-500/20 text-white'
            : 'border-zinc-700/80 hover:border-zinc-600'
        }`}
      >
        <span className="text-xs sm:text-sm select-none shrink-0">
          {activeDojo ? (activeDojo.logo || '🥋') : '🏢'}
        </span>
        <span className="truncate max-w-[100px] sm:max-w-[130px] md:max-w-[150px] lg:max-w-[200px] text-left">
          {activeDojo ? activeDojo.name : 'All Branches'}
        </span>
        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-red-500' : ''
          }`}
        />
      </button>

      {/* Custom Styled Popover Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-dojo-card border border-zinc-700 rounded-2xl shadow-2xl dark:shadow-black z-50 overflow-hidden divide-y divide-zinc-800"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#131316]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-red-500" />
                <span>Select Dojo Branch</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {dojos.length} Branches
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Filter rosters, batches and metrics</p>
          </div>

          {/* Options List */}
          <div className="p-1.5 max-h-64 overflow-y-auto space-y-1 bg-[#18181c]">
            {/* All Branches Option */}
            <button
              type="button"
              onClick={() => handleSelect('all', 'All Dojo Branches')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                selectedDojoId === 'all'
                  ? 'bg-red-600/20 border border-red-500/40 text-white'
                  : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm shrink-0">
                  🏢
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">All Branches</h4>
                  <p className="text-[10px] text-zinc-400">Aggregate view across all academies</p>
                </div>
              </div>
              {selectedDojoId === 'all' && (
                <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Individual Dojo Branches */}
            {dojos.map((dojo) => {
              const isSelected = selectedDojoId === dojo.id;
              const isInactive = dojo.status === 'Inactive';

              return (
                <button
                  key={dojo.id}
                  type="button"
                  onClick={() => handleSelect(dojo.id, dojo.name)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-red-600/20 border border-red-500/40 text-white'
                      : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm shrink-0">
                      {dojo.logo || '🥋'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-[180px]">
                          {dojo.name}
                        </h4>
                        {isInactive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {dojo.instructor || 'Chief Sensei'}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with Add Dojo Button */}
          <div className="p-2 bg-[#131316]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalState(prev => ({ ...prev, addDojo: true }));
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-colors border border-zinc-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-red-500" />
              <span>Add New Dojo Branch</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
