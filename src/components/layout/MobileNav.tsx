import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Bike, Users, Menu, X,
  Wrench, Compass, DollarSign, TrendingUp, ShieldCheck,
  Building2, Truck, BarChart3, FileCode, Settings, LogOut, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { t, language, setLanguage } = useLanguage();
  const { user, login, logout, hasPermission } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isAccounting = user?.role?.toLowerCase() === 'accounting';

  // Filtrer les onglets principaux : on exclut le dashboard pour ACCOUNTING
  const mainTabs = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, module: 'dashboard' },
    { id: 'reservations', label: t('nav.reservations'), icon: Calendar, module: 'reservations' },
    { id: 'fleet', label: t('nav.fleet'), icon: Bike, module: 'fleet' },
    { id: 'clients', label: t('nav.clients'), icon: Users, module: 'clients' },
  ].filter(tab => !(isAccounting && tab.id === 'dashboard'));

  const moreItems = [
    { id: 'tours', label: t('nav.tours'), icon: Compass, module: 'tours' },
    { id: 'maintenance', label: t('nav.maintenance'), icon: Wrench, module: 'maintenance' },
    { id: 'finance', label: t('nav.finance'), icon: DollarSign, module: 'finance' },
    { id: 'investments', label: t('nav.investments'), icon: TrendingUp, module: 'investments' },
    { id: 'equipment', label: t('nav.equipment'), icon: ShieldCheck, module: 'equipment' },
    { id: 'agencies', label: t('nav.agencies'), icon: Building2, module: 'agencies' },
    { id: 'suppliers', label: t('nav.suppliers'), icon: Truck, module: 'suppliers' },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3, module: 'reports' },
    { id: 'audit', label: t('nav.audit'), icon: FileCode, module: 'audit' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, module: 'settings' },
  ];

  const isMoreTabActive = moreItems.some((item) => item.id === activeTab);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Mobile Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161616]/95 border-t border-[#2D2D2D] backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {mainTabs.map((tab) => {
          if (!hasPermission(tab.module)) return null;
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !isMoreOpen;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-[#D4A017] font-bold scale-105'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4A017]' : 'text-zinc-400'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            isMoreTabActive || isMoreOpen
              ? 'text-[#D4A017] font-bold scale-105'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {isMoreOpen ? <X className="w-5 h-5 text-[#D4A017]" /> : <Menu className="w-5 h-5" />}
          <span className="text-[10px] mt-0.5 tracking-tight truncate">
            {t('nav.more')}
          </span>
        </button>
      </nav>

      {/* Slide-Up Mobile Sheet Modal for "More" */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div
            className="bg-[#1C1C1C] border-t border-[#333333] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white uppercase tracking-wider">
                  MOTONOMAD {t('nav.more')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                  className="px-2.5 py-1 rounded-lg bg-[#282828] border border-[#3A3A3A] text-xs font-bold text-[#D4A017] flex items-center gap-1"
                >
                  {language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
                </button>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-full bg-[#262626] text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid of More Navigation Items */}
            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                if (!hasPermission(item.module)) return null;
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-[#D4A017] text-[#111111] font-bold border-[#D4A017]'
                        : 'bg-[#242424] text-zinc-200 border-[#2F2F2F] hover:bg-[#2C2C2C]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#111111]' : 'text-[#D4A017]'}`} />
                    <span className="text-xs font-semibold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Role Switcher & User Profile */}
            {user && (
              <div className="pt-3 border-t border-[#2D2D2D] space-y-3">
                <div className="bg-[#242424] rounded-xl p-3 border border-[#333333]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#D4A017]" /> {t('nav.role_switcher')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/40">
                      {user.role}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {(['ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTING'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => login(r)}
                        className={`py-1.5 rounded font-bold text-center transition-colors ${
                          user.role === r
                            ? 'bg-[#D4A017] text-[#1C1C1C]'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {r.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-[#D4A017]"
                    />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold text-white truncate">{user?.displayName}</span>
                      <span className="text-[10px] text-zinc-400 truncate">{user?.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMoreOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 text-xs font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;