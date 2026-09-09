import React from 'react';
import { 
  LayoutDashboard, Users, Calendar, Bike, Wrench, Compass, 
  DollarSign, TrendingUp, ShieldCheck, Building2, Truck, 
  BarChart3, FileCode, Settings, ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MountainLogoSVG } from '../common/Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Définition centralisée des accès par rôle pour sécuriser l'affichage
  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { id: 'clients', label: t('nav.clients'), icon: Users, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'reservations', label: t('nav.reservations'), icon: Calendar, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'fleet', label: t('nav.fleet'), icon: Bike, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'maintenance', label: t('nav.maintenance'), icon: Wrench, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'tours', label: t('nav.tours'), icon: Compass, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'finance', label: t('nav.finance'), icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'ACCOUNTING'] },
    { id: 'investments', label: t('nav.investments'), icon: TrendingUp, roles: ['ADMIN'] },
    { id: 'equipment', label: t('nav.equipment'), icon: ShieldCheck, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'agencies', label: t('nav.agencies'), icon: Building2, roles: ['ADMIN', 'MANAGER'] },
    { id: 'suppliers', label: t('nav.suppliers'), icon: Truck, roles: ['ADMIN', 'MANAGER', 'ACCOUNTING'] },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'ACCOUNTING'] },
    { id: 'audit', label: t('nav.audit'), icon: FileCode, roles: ['ADMIN'] },
    { id: 'settings', label: t('nav.settings'), icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <aside
      className={`hidden md:flex relative z-30 flex-col bg-[#1C1C1C] border-r border-[#2D2D2D] text-[#F4F4F2] transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between min-h-[5.5rem] px-4 py-3 border-b border-[#2D2D2D] bg-[#141414]">
        <div className="flex items-center gap-2.5 overflow-hidden w-full">
          {collapsed ? (
            <div className="w-full flex justify-center py-1">
              <MountainLogoSVG className="w-10 h-8 text-[#D4A017]" />
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <MountainLogoSVG className="w-11 h-9 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-black text-lg tracking-wider text-white leading-tight">
                  MOTO<span className="text-[#D4A017]">NOMAD</span>
                </span>
                <span className="text-[8.5px] font-bold text-zinc-400 tracking-[0.18em] uppercase truncate">
                  PREMIUM MOTORCYCLE RENTAL
                </span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors shrink-0 ml-1"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List - Filtrée dynamiquement par rôle */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          // On vérifie si l'utilisateur actuel a le droit de voir cet onglet
          const isAllowed = user && item.roles.includes(user.role);
          if (!isAllowed) return null;

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
                isActive
                  ? 'bg-[#D4A017] text-[#1C1C1C] font-bold shadow-md shadow-[#D4A017]/15'
                  : 'text-[#C5C6C7] hover:text-white hover:bg-[#282828]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1C1C1C]' : 'text-zinc-400 group-hover:text-[#D4A017]'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* User Profile & Logout (Role Switcher retiré) */}
      <div className="p-3 border-t border-[#2D2D2D] bg-[#161616]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#2D2D2D] shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">{user?.displayName || 'Utilisateur'}</span>
                <span className="text-[10px] font-black text-[#D4A017] tracking-wider uppercase mt-0.5">
                  {user?.role || 'STAFF'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-2.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};