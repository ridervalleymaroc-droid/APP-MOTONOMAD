import React, { useState } from 'react';
import { X, Target, Save } from 'lucide-react';

export interface ManagementTargets {
  monthlyRevenueTarget: number;
  annualRevenueTarget: number;
  fleetUtilizationTarget: number;
  profitMarginTarget: number;
  roiTarget: number;
  monthlyReservationTarget: number;
  keepRoiThreshold: number;
  sellRoiThreshold: number;
}

export const DEFAULT_MANAGEMENT_TARGETS: ManagementTargets = {
  monthlyRevenueTarget: 120000,
  annualRevenueTarget: 1400000,
  fleetUtilizationTarget: 75,
  profitMarginTarget: 35,
  roiTarget: 25,
  monthlyReservationTarget: 25,
  keepRoiThreshold: 25,
  sellRoiThreshold: 0,
};

interface ManagementTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: ManagementTargets;
  onSaveTargets: (newTargets: ManagementTargets) => void;
}

export const ManagementTargetsModal: React.FC<ManagementTargetsModalProps> = ({
  isOpen,
  onClose,
  targets,
  onSaveTargets,
}) => {
  const [formData, setFormData] = useState<ManagementTargets>(targets || DEFAULT_MANAGEMENT_TARGETS);

  if (!isOpen) return null;

  const handleChange = (field: keyof ManagementTargets, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTargets(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#181818] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A] bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4A017]/10 text-[#D4A017] border border-[#D4A017]/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Management Targets & Decision Engine</h3>
              <p className="text-xs text-zinc-400">Configure operational benchmarks and ROI threshold rules.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-[#D4A017] uppercase tracking-wider text-[11px]">
              Business Performance Benchmarks
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Monthly Revenue Target (MAD)</label>
                <input
                  type="number"
                  value={formData.monthlyRevenueTarget}
                  onChange={(e) => handleChange('monthlyRevenueTarget', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Annual Revenue Target (MAD)</label>
                <input
                  type="number"
                  value={formData.annualRevenueTarget}
                  onChange={(e) => handleChange('annualRevenueTarget', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Fleet Utilization Target (%)</label>
                <input
                  type="number"
                  max={100}
                  value={formData.fleetUtilizationTarget}
                  onChange={(e) => handleChange('fleetUtilizationTarget', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Profit Margin Target (%)</label>
                <input
                  type="number"
                  max={100}
                  value={formData.profitMarginTarget}
                  onChange={(e) => handleChange('profitMarginTarget', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Vehicle ROI Target (%)</label>
                <input
                  type="number"
                  value={formData.roiTarget}
                  onChange={(e) => handleChange('roiTarget', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Monthly Bookings Target</label>
                <input
                  type="number"
                  value={formData.monthlyReservationTarget}
                  onChange={(e) => handleChange('monthlyReservationTarget', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#2A2A2A] space-y-3">
            <h4 className="font-bold text-[#D4A017] uppercase tracking-wider text-[11px]">
              Vehicle Decision Engine Thresholds
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">
                  KEEP Threshold (ROI &gt; %)
                </label>
                <input
                  type="number"
                  value={formData.keepRoiThreshold}
                  onChange={(e) => handleChange('keepRoiThreshold', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">
                  SELL Threshold (ROI &lt; %)
                </label>
                <input
                  type="number"
                  value={formData.sellRoiThreshold}
                  onChange={(e) => handleChange('sellRoiThreshold', e.target.value)}
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#2A2A2A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#2A2A2A] text-white hover:bg-[#333333] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#D4A017] text-[#111111] hover:bg-[#e0ad24] font-bold transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
