import React from 'react';
import { X, ExternalLink, Calendar, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

interface DrillDownItem {
  id: string;
  title: string;
  category?: string;
  date?: string;
  amount: number;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  totalValue: number;
  items: DrillDownItem[];
  currency?: 'MAD' | 'EUR' | 'USD';
  onNavigateToRecord?: (module: string, id: string) => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  totalValue,
  items,
  currency = 'MAD',
  onNavigateToRecord,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#181818] border border-[#2D2D2D] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A] bg-[#141414]">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4A017]/20 text-[#D4A017] font-mono border border-[#D4A017]/30">
                {items.length} Records
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                Total Value
              </span>
              <span className="text-xl font-black text-[#D4A017] font-mono">
                {formatCurrency(totalValue, currency || 'MAD')}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {items.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No detailed transactions found for this metric in the selected period.
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#222222] border border-[#2D2D2D] hover:border-[#D4A017]/40 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100 truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            item.badgeColor || 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      {item.category && <span>Category: {item.category}</span>}
                      {item.subtitle && <span>• {item.subtitle}</span>}
                      {item.date && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#F4F4F2]">
                      {formatCurrency(item.amount, currency || 'MAD')}
                    </span>
                    {onNavigateToRecord && (
                      <button
                        onClick={() => onNavigateToRecord(item.category || 'general', item.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-[#D4A017] hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100"
                        title="View Record Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#141414] flex justify-between items-center text-xs text-zinc-400">
          <span>Click any item to inspect transaction data. All values synced in real-time.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2A2A2A] text-white hover:bg-[#333333] font-semibold transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
