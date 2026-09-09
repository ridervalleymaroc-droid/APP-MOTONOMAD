import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { dbStore } from './services/db';

// Auth Modules
import { Login } from './components/auth/Login';

// Domain Modules
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ClientsModule } from './components/clients/ClientsModule';
import { FleetModule } from './components/fleet/FleetModule';
import { ReservationsModule } from './components/reservations/ReservationsModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { InvestmentsModule } from './components/investments/InvestmentsModule';
import { ToursModule } from './components/tours/ToursModule';
import { MaintenanceModule } from './components/maintenance/MaintenanceModule';
import { EquipmentModule } from './components/equipment/EquipmentModule';
import { AgenciesModule } from './components/agencies/AgenciesModule';
import { SuppliersModule } from './components/suppliers/SuppliersModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { AuditLogModule } from './components/audit/AuditLogModule';
import { SettingsModule } from './components/settings/SettingsModule';

// Types
import { 
  Client, Motorcycle, Reservation, Revenue, Expense, 
  MaintenanceRecord, Investment, Tour, EquipmentItem, Agency, Supplier, AuditLog, DateFilterRange, UserRole 
} from './types';

const MainAppContent: React.FC = () => {
  const { user, login, hasPermission } = useAuth();
  
  // Initialisation dynamique de l'onglet actif selon le rôle de l'utilisateur connecté
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (!user) return 'dashboard';
    if (user.role === 'STAFF') return 'clients';
    if (user.role === 'ACCOUNTING') return 'finance';
    return 'dashboard';
  });

  const [currency, setCurrency] = useState<'MAD' | 'EUR' | 'USD'>('MAD');
  const [dateRange, setDateRange] = useState<DateFilterRange>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Action Modal states
  const [quickActionModal, setQuickActionModal] = useState<string | null>(null);

  // App Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load All Data from DB Store
  const loadData = () => {
    setClients(dbStore.getItems<Client>('clients') || []);
    setMotorcycles(dbStore.getItems<Motorcycle>('motorcycles') || []);
    setReservations(dbStore.getItems<Reservation>('reservations') || []);
    setRevenues(dbStore.getItems<Revenue>('revenues') || []);
    setExpenses(dbStore.getItems<Expense>('expenses') || []);
    setMaintenance(dbStore.getItems<MaintenanceRecord>('maintenance') || []);
    setInvestments(dbStore.getItems<Investment>('investments') || []);
    setTours(dbStore.getItems<Tour>('tours') || []);
    setEquipment(dbStore.getItems<EquipmentItem>('equipment') || []);
    setAgencies(dbStore.getItems<Agency>('agencies') || []);
    setSuppliers(dbStore.getItems<Supplier>('suppliers') || []);
    setAuditLogs(dbStore.getItems<AuditLog>('audit_logs') || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetData = () => {
    dbStore.resetToInitialData();
    loadData();
  };

  const handleQuickAction = (action: 'reservation' | 'client' | 'motorcycle') => {
    if (action === 'reservation' && hasPermission('reservations')) {
      setActiveTab('reservations');
      setQuickActionModal('add_res');
    } else if (action === 'client' && hasPermission('clients')) {
      setActiveTab('clients');
      setQuickActionModal('add_client');
    } else if (action === 'motorcycle' && hasPermission('fleet')) {
      setActiveTab('fleet');
      setQuickActionModal('add_bike');
    }
  };

  // --- GESTION DE LA CONNEXION ---
  if (!user) {
    return (
      <Login 
        onLoginSuccess={(roleStr) => {
          const role = roleStr as UserRole;
          login(role); // Enregistre l'utilisateur dans le AuthContext global

          // Redirection intelligente selon le profil pour éviter l'écran noir
          if (role === 'STAFF') {
            setActiveTab('clients');
          } else if (role === 'ACCOUNTING') {
            setActiveTab('finance');
          } else {
            setActiveTab('dashboard');
          }
        }} 
      />
    );
  }

  // --- ESPACE DE TRAVAIL PRINCIPAL SÉCURISÉ ---
  return (
    <div className="flex h-screen bg-[#141414] text-[#F4F4F2] font-sans overflow-hidden select-none pb-16 md:pb-0">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setQuickActionModal(null);
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currency={currency}
          setCurrency={setCurrency}
          dateRange={dateRange}
          setDateRange={setDateRange}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          setActiveTab={setActiveTab}
          onQuickAction={handleQuickAction}
          userRole={user?.role}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 space-y-6 custom-scrollbar">
          {activeTab === 'dashboard' && hasPermission('dashboard') && (
            <ExecutiveDashboard
              searchQuery={searchQuery}
              currency={currency}
              dateRange={dateRange}
              setDateRange={setDateRange}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              motorcycles={motorcycles}
              reservations={reservations}
              revenues={revenues}
              expenses={expenses}
              investments={investments}
              tours={tours}
              clients={clients}
              maintenance={maintenance}
              agencies={agencies}
              suppliers={suppliers}
              equipment={equipment}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'clients' && hasPermission('clients') && (
            <ClientsModule
              clients={clients}
              reservations={reservations}
              currency={currency}
              onUpdate={loadData}
              initialOpenAddModal={quickActionModal === 'add_client'}
            />
          )}

          {activeTab === 'fleet' && hasPermission('fleet') && (
            <FleetModule
              motorcycles={motorcycles}
              reservations={reservations}
              maintenance={maintenance}
              currency={currency}
              onUpdate={loadData}
              initialOpenAddModal={quickActionModal === 'add_bike'}
            />
          )}

          {activeTab === 'reservations' && hasPermission('reservations') && (
            <ReservationsModule
              reservations={reservations}
              motorcycles={motorcycles}
              clients={clients}
              currency={currency}
              onUpdate={loadData}
              initialOpenAddModal={quickActionModal === 'add_res'}
            />
          )}

          {activeTab === 'finance' && hasPermission('finance') && (
            <FinanceModule
              revenues={revenues}
              expenses={expenses}
              motorcycles={motorcycles}
              tours={tours}
              currency={currency}
              onUpdate={loadData}
            />
          )}

          {activeTab === 'investments' && hasPermission('investments') && (
            <InvestmentsModule investments={investments} currency={currency} onUpdate={loadData} />
          )}

          {activeTab === 'tours' && hasPermission('tours') && (
            <ToursModule tours={tours} currency={currency} onUpdate={loadData} />
          )}

          {activeTab === 'maintenance' && hasPermission('maintenance') && (
            <MaintenanceModule maintenance={maintenance} motorcycles={motorcycles} currency={currency} onUpdate={loadData} />
          )}

          {activeTab === 'equipment' && hasPermission('equipment') && (
            <EquipmentModule equipment={equipment} currency={currency} onUpdate={loadData} />
          )}

          {activeTab === 'agencies' && hasPermission('agencies') && (
            <AgenciesModule agencies={agencies} currency={currency} onUpdate={loadData} />
          )}

          {activeTab === 'suppliers' && hasPermission('suppliers') && (
            <SuppliersModule suppliers={suppliers} currency={currency} onUpdate={loadData} />
          )}

          {activeTab === 'reports' && hasPermission('reports') && (
            <ReportsModule
              motorcycles={motorcycles}
              reservations={reservations}
              revenues={revenues}
              expenses={expenses}
              clients={clients}
              currency={currency}
            />
          )}

          {activeTab === 'audit' && hasPermission('audit') && (
            <AuditLogModule auditLogs={auditLogs} />
          )}

          {activeTab === 'settings' && hasPermission('settings') && (
            <SettingsModule currency={currency} onCurrencyChange={setCurrency} onResetDemoData={handleResetData} />
          )}
        </main>
      </div>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.body.style.setProperty('--mouse-x', `${x}%`);
      document.body.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}