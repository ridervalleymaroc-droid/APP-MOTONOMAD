import React from 'react';
import {
  CalendarPlus, UserPlus, Bike, ArrowUpRight, ArrowDownLeft,
  Wrench, Receipt, CreditCard
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface QuickActionsBarProps {
  onAction: (actionKey: string) => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ onAction }) => {
  const { t } = useLanguage();

  const actions = [
    { key: 'new_reservation', label: t('quick_actions.new_res'), icon: CalendarPlus, iconColor: 'text-[#D4A017]' },
    { key: 'add_client', label: t('quick_actions.new_client'), icon: UserPlus, iconColor: 'text-blue-400' },
    { key: 'add_motorcycle', label: t('quick_actions.new_bike'), icon: Bike, iconColor: 'text-emerald-400' },
    { key: 'check_out', label: t('quick_actions.checkout'), icon: ArrowUpRight, iconColor: 'text-purple-400' },
    { key: 'check_in', label: t('quick_actions.checkin'), icon: ArrowDownLeft, iconColor: 'text-indigo-400' },
    { key: 'maintenance', label: t('quick_actions.maint'), icon: Wrench, iconColor: 'text-rose-400' },
    { key: 'record_payment', label: t('quick_actions.record_pay'), icon: CreditCard, iconColor: 'text-teal-400' },
    { key: 'log_expense', label: t('quick_actions.expense'), icon: Receipt, iconColor: 'text-orange-400' },
  ];

  return (
    <div className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl p-3 shadow-lg">
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
        <span>{t('quick_actions.title')}</span>
        <span className="text-[10px] text-zinc-500">1-Tap Shortcuts</span>
      </div>
      
      {/* Grille responsive : 2 colonnes compactes sur mobile, flex wrap fluide sur tablette/desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          const isPrimary = act.key === 'new_reservation';
          
          return (
            <button
              key={act.key}
              onClick={() => onAction(act.key)}
              className={`
                flex items-center justify-start sm:justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all duration-200 active:scale-95
                ${isPrimary 
                  ? 'bg-[#D4A017] text-black border-[#D4A017] font-semibold hover:brightness-110 col-span-2 sm:col-span-1' 
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isPrimary ? 'text-black' : act.iconColor}`} />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};