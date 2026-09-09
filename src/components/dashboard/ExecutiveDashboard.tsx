import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Bike, Calendar, Users,
  Wrench, Compass, Award, ArrowUpRight, ShieldCheck, Activity, Layers, ArrowDownRight,
  Filter, AlertTriangle, Target, Calculator, RefreshCw, Eye, ChevronRight, CheckCircle2,
  PieChart as PieIcon, BarChart3, LineChart as LineIcon
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Motorcycle, Reservation, Revenue, Expense, Investment, Tour, Client, MaintenanceRecord,
  DateFilterRange, Agency, Supplier, EquipmentItem, AuditLog
} from '../../types';
import {
  formatCurrency,
  calculateRentalDays,
  calculateDepreciation,
  calculateFleetUtilization,
  filterByDateRange,
  calculateRevenueBreakdown,
  calculateExpensesBreakdown,
  calculateMotorcycleProfitability,
  calculateInvestmentMetrics,
  calculateYoYGrowth,
  calculateTargetAchievement,
} from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { QuickActionsBar } from '../common/QuickActionsBar';
import { DrillDownModal } from './DrillDownModal';
import { InvestmentSimulatorModal } from './InvestmentSimulatorModal';
import { ManagementTargetsModal, DEFAULT_MANAGEMENT_TARGETS, ManagementTargets } from './ManagementTargetsModal';
import { supabase } from '../../services/supabase'; // <-- Import de Supabase

interface ExecutiveDashboardProps {
  searchQuery: string;
  currency: 'MAD' | 'EUR' | 'USD';
  dateRange: DateFilterRange;
  setDateRange?: (range: DateFilterRange) => void;
  customStartDate: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate: string;
  setCustomEndDate?: (date: string) => void;
  // Les props ci-dessous sont conservées pour la signature, mais nous utiliserons la DB
  motorcycles: Motorcycle[];
  reservations: Reservation[];
  revenues: Revenue[];
  expenses: Expense[];
  investments: Investment[];
  tours: Tour[];
  clients: Client[];
  maintenance: MaintenanceRecord[];
  agencies?: Agency[];
  suppliers?: Supplier[];
  equipment?: EquipmentItem[];
  onNavigate: (tab: string) => void;
  onUpdateMotorcycleMarketValue?: (motorcycleId: string, newValue: number) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  searchQuery,
  currency,
  dateRange,
  customStartDate,
  customEndDate,
  agencies = [],
  clients = [],
  maintenance = [],
  onNavigate,
  onUpdateMotorcycleMarketValue,
}) => {
  const { language } = useLanguage();

  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveMotorcycles, setLiveMotorcycles] = useState<Motorcycle[]>([]);
  const [liveReservations, setLiveReservations] = useState<Reservation[]>([]);
  const [liveExpenses, setLiveExpenses] = useState<Expense[]>([]);
  const [liveRevenues, setLiveRevenues] = useState<Revenue[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  useEffect(() => {
    const fetchLiveDb = async () => {
      try {
        setIsLoadingDb(true);
        // Appels parallèles pour optimiser le temps de chargement
        const [ { data: vehicles }, { data: resData }, { data: expData } ] = await Promise.all([
          supabase.from('vehicles').select('*'),
          supabase.from('reservations').select('*'),
          supabase.from('expenses').select('*')
        ]);

        // Mapping des motos (On utilise 'as unknown as Motorcycle[]' pour ignorer les champs non vitaux manquants)
        const mappedMotos = (vehicles || []).map((v: any) => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          purchasePrice: Number(v.purchase_price) || 0,
          purchaseDate: v.purchase_date,
          currentStatus: v.status === 'AVAILABLE' ? 'Available' : v.status === 'RENTED' ? 'Rented' : v.status === 'MAINTENANCE' ? 'Maintenance' : 'Sold',
          registrationNumber: 'N/A', 
          usefulLifeYears: 5,
          residualValue: (Number(v.purchase_price) || 0) * 0.2,
          estimatedMarketValue: (Number(v.purchase_price) || 0) * 0.8,
          category: 'Standard',
          createdAt: v.created_at || new Date().toISOString()
        })) as unknown as Motorcycle[];

        const mappedRes = (resData || []).map((r: any) => ({
          id: r.id,
          motorcycleId: r.vehicle_id,
          startDate: r.start_date,
          endDate: r.end_date,
          totalPrice: Number(r.total_price) || 0,
          amountPaid: Number(r.total_price) || 0,
          status: r.status === 'ACTIVE' ? 'Active' : r.status === 'COMPLETED' ? 'Closed' : 'Pending',
          clientName: 'Client Système',
          bookingSource: 'Direct',
          clientId: 'system-client',
          paymentStatus: 'Paid',
          createdAt: r.created_at || new Date().toISOString()
        })) as Reservation[];

        const mappedExp = (expData || []).map((e: any) => ({
          id: e.id,
          relatedMotorcycleId: e.vehicle_id,
          amount: Number(e.amount) || 0,
          category: e.category,
          date: e.expense_date,
          paymentMethod: 'Bank Transfer',
          currency: currency || 'MAD',
          description: 'Synchronisé depuis Supabase',
          createdBy: 'Système',
          createdAt: e.created_at || new Date().toISOString()
        })) as Expense[];

        const mappedRev = mappedRes.map((r: any) => ({
          id: r.id,
          amount: r.totalPrice,
          category: 'Rental',
          date: r.endDate,
          relatedMotorcycleId: r.motorcycleId,
          paymentMethod: 'Card',
          currency: currency || 'MAD',
          description: 'Revenu de location',
          createdBy: 'Système',
          createdAt: r.createdAt || new Date().toISOString()
        })) as Revenue[];

        setLiveMotorcycles(mappedMotos);
        setLiveReservations(mappedRes);
        setLiveExpenses(mappedExp);
        setLiveRevenues(mappedRev);
      } catch (error) {
        console.error("Erreur de synchronisation Supabase:", error);
      } finally {
        setIsLoadingDb(false);
      }
    };

    fetchLiveDb();
  }, [currency]);

  const selectedRange = dateRange || 'this_month';
  const [selectedMotorcycleFilter, setSelectedMotorcycleFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [targets, setTargets] = useState<ManagementTargets>(DEFAULT_MANAGEMENT_TARGETS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const [drillDownState, setDrillDownState] = useState<{
    isOpen: boolean; title: string; description: string; totalValue: number; items: any[];
  }>({ isOpen: false, title: '', description: '', totalValue: 0, items: [] });

  const [editingMarketValueId, setEditingMarketValueId] = useState<string | null>(null);
  const [tempMarketVal, setTempMarketVal] = useState<number>(0);

  // ----------------------------------------------------
  // FILTERED DATASETS (Basés sur les données LIVE)
  // ----------------------------------------------------
  const filteredRevenues = useMemo(() => {
    let filtered = filterByDateRange(liveRevenues, (r) => r.date, selectedRange, customStartDate, customEndDate);
    if (selectedMotorcycleFilter !== 'all') filtered = filtered.filter((r) => r.relatedMotorcycleId === selectedMotorcycleFilter);
    if (selectedCategoryFilter !== 'all') filtered = filtered.filter((r) => r.category === selectedCategoryFilter);
    return filtered;
  }, [liveRevenues, selectedRange, customStartDate, customEndDate, selectedMotorcycleFilter, selectedCategoryFilter]);

  const filteredExpenses = useMemo(() => {
    let filtered = filterByDateRange(liveExpenses, (e) => e.date, selectedRange, customStartDate, customEndDate);
    if (selectedMotorcycleFilter !== 'all') filtered = filtered.filter((e) => e.relatedMotorcycleId === selectedMotorcycleFilter);
    if (selectedCategoryFilter !== 'all') filtered = filtered.filter((e) => e.category === selectedCategoryFilter);
    return filtered;
  }, [liveExpenses, selectedRange, customStartDate, customEndDate, selectedMotorcycleFilter, selectedCategoryFilter]);

  const filteredReservations = useMemo(() => {
    let filtered = filterByDateRange(liveReservations, (r) => r.startDate, selectedRange, customStartDate, customEndDate);
    if (selectedMotorcycleFilter !== 'all') filtered = filtered.filter((r) => r.motorcycleId === selectedMotorcycleFilter);
    return filtered;
  }, [liveReservations, selectedRange, customStartDate, customEndDate, selectedMotorcycleFilter]);

  const revBreakdown = useMemo(() => calculateRevenueBreakdown(filteredRevenues), [filteredRevenues]);
  const expBreakdown = useMemo(() => calculateExpensesBreakdown(filteredExpenses), [filteredExpenses]);

  const totalRevenue = revBreakdown.Total;
  const totalOperatingExpenses = expBreakdown.Total;
  const grossOperatingProfit = totalRevenue - totalOperatingExpenses;

  const fleetKPIs = useMemo(() => {
    let totalInvestment = 0; let accumulatedDepreciation = 0; let currentBookValue = 0;
    let estimatedMarketValue = 0; let monthlyFleetDepreciation = 0; let annualFleetDepreciation = 0;

    (liveMotorcycles || []).forEach((m) => {
      totalInvestment += m.purchasePrice || 0;
      estimatedMarketValue += m.estimatedMarketValue || (m.purchasePrice ? m.purchasePrice * 0.8 : 0);

      const dep = calculateDepreciation(m.purchasePrice, m.residualValue, m.usefulLifeYears, m.purchaseDate);
      accumulatedDepreciation += dep.accumulatedDepreciation;
      currentBookValue += dep.currentBookValue;

      if (m.currentStatus !== 'Sold' && m.currentStatus !== 'Out of service') {
        monthlyFleetDepreciation += dep.monthlyDepreciation;
        annualFleetDepreciation += dep.annualDepreciation;
      }
    });

    return { totalInvestment, accumulatedDepreciation, currentBookValue, estimatedMarketValue, monthlyFleetDepreciation, annualFleetDepreciation };
  }, [liveMotorcycles]);

  const totalDepreciationForPeriod = fleetKPIs.monthlyFleetDepreciation;
  const netProfit = grossOperatingProfit - totalDepreciationForPeriod;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const daysInPeriod = useMemo(() => {
    if (selectedRange === 'today') return 1;
    if (selectedRange === 'this_week') return 7;
    if (selectedRange === 'this_month' || selectedRange === 'last_month') return 30;
    if (selectedRange === 'this_quarter') return 90;
    if (selectedRange === 'this_year') return 365;
    if (selectedRange === 'custom' && customStartDate && customEndDate) return calculateRentalDays(customStartDate, customEndDate);
    return 30;
  }, [selectedRange, customStartDate, customEndDate]);

  const utilizationRes = useMemo(
    () => calculateFleetUtilization(liveMotorcycles, filteredReservations, daysInPeriod),
    [liveMotorcycles, filteredReservations, daysInPeriod]
  );

  const totalRentalDays = useMemo(() => {
    return filteredReservations.reduce((sum, res) => {
      if (res.status === 'Active' || res.status === 'Confirmed' || res.status === 'Returned' || res.status === 'Closed') {
        return sum + (res.rentalDays || calculateRentalDays(res.startDate, res.endDate));
      }
      return sum;
    }, 0);
  }, [filteredReservations]);

  const avgRevenuePerRentalDay = totalRentalDays > 0 ? revBreakdown.Rental / totalRentalDays : 0;
  const investmentRecoveryPercent = fleetKPIs.totalInvestment > 0 ? (totalRevenue / fleetKPIs.totalInvestment) * 100 : 0;
  const remainingInvestmentRecovery = Math.max(0, fleetKPIs.totalInvestment - totalRevenue);

  const fleetStatusCounts = useMemo(() => {
    const counts = { Available: 0, Reserved: 0, Rented: 0, Maintenance: 0, Damaged: 0, 'Out of service': 0, Sold: 0, Total: liveMotorcycles.length };
    liveMotorcycles.forEach((m) => { if (counts[m.currentStatus] !== undefined) counts[m.currentStatus]++; });
    return counts;
  }, [liveMotorcycles]);

  const bikeProfitabilityList = useMemo(() => {
    const list = (liveMotorcycles || []).map((m) => {
      const prof = calculateMotorcycleProfitability(m, liveRevenues, liveExpenses, liveReservations, maintenance, targets.keepRoiThreshold, targets.sellRoiThreshold);
      return { motorcycle: m, ...prof };
    });

    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(({ motorcycle }) => 
      motorcycle.brand?.toLowerCase().includes(query) ||
      motorcycle.model?.toLowerCase().includes(query) ||
      motorcycle.registrationNumber?.toLowerCase().includes(query)
    );
  }, [liveMotorcycles, liveRevenues, liveExpenses, liveReservations, maintenance, targets, searchQuery]);

  // CORRECTION : Forcer des tableaux vides avec le bon typage TypeScript
  const topBikesByRevenue = useMemo(() => [...bikeProfitabilityList].sort((a, b) => b.revenue - a.revenue).slice(0, 5), [bikeProfitabilityList]);
  const topAgencies = useMemo<Agency[]>(() => [], []); 
  const topClients = useMemo<Client[]>(() => [], []); 

  const alerts = useMemo(() => {
    const list: { id: string; type: 'warning' | 'danger' | 'info'; title: string; message: string; tab?: string }[] = [];

    bikeProfitabilityList.forEach((bp) => {
      if (bp.decision === 'SELL') {
        list.push({
          id: `roi_low_${bp.motorcycle.id}`,
          type: 'danger',
          title: language === 'fr' ? `ROI Véhicule Faible : ${bp.motorcycle.brand} ${bp.motorcycle.model}` : `Low Vehicle ROI: ${bp.motorcycle.brand} ${bp.motorcycle.model}`,
          message: language === 'fr' ? `Le ROI est de ${bp.roi}% (en dessous du seuil de ${targets.sellRoiThreshold}%). Recommandation : VENDRE ou auditer la tarification.` : `ROI is ${bp.roi}% (below threshold ${targets.sellRoiThreshold}%). Recommendation: SELL or audit pricing.`,
          tab: 'fleet',
        });
      }
    });

    if (fleetStatusCounts.Maintenance > 0) {
      list.push({
        id: 'maint_active',
        type: 'warning',
        title: language === 'fr' ? `${fleetStatusCounts.Maintenance} Moto(s) en Maintenance` : `${fleetStatusCounts.Maintenance} Motorcycle(s) in Maintenance`,
        message: language === 'fr' ? 'Véhicules actuellement indisponibles pour la location. Assurez-vous de suivre le calendrier de l\'atelier.' : 'Vehicles currently unavailable for rental. Ensure workshop timeline is tracked.',
        tab: 'maintenance',
      });
    }

    const unpaid = filteredReservations.filter((r) => r.paymentStatus === 'Pending' || r.paymentStatus === 'Partial');
    if (unpaid.length > 0) {
      list.push({
        id: 'unpaid_res',
        type: 'warning',
        title: language === 'fr' ? `${unpaid.length} Réservation(s) en attente de paiement` : `${unpaid.length} Reservation(s) Pending Payment`,
        message: language === 'fr' ? 'Soldes clients en attente de règlement.' : 'Outstanding customer balances pending settlement.',
        tab: 'reservations',
      });
    }

    return list;
  }, [bikeProfitabilityList, fleetStatusCounts, filteredReservations, targets, language]);

  const periodLabelText = useMemo(() => {
    if (selectedRange === 'today') return language === 'fr' ? "Aujourd'hui" : 'Today';
    if (selectedRange === 'this_week') return language === 'fr' ? 'Cette semaine' : 'This Week';
    if (selectedRange === 'this_month') return language === 'fr' ? 'Ce mois-ci' : 'This Month';
    if (selectedRange === 'last_month') return language === 'fr' ? 'Le mois dernier' : 'Last Month';
    if (selectedRange === 'this_quarter') return language === 'fr' ? 'Ce trimestre' : 'This Quarter';
    if (selectedRange === 'this_year') return language === 'fr' ? 'Cette année' : 'This Year';
    if (selectedRange === 'custom') return `${customStartDate} → ${customEndDate}`;
    return language === 'fr' ? 'Tous les temps' : 'All Time';
  }, [selectedRange, customStartDate, customEndDate, language]);

  const summaryJSX = useMemo(() => {
    const topBike = topBikesByRevenue[0]?.motorcycle;
    const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    const revFormatted = formatCurrency(totalRevenue, currency);
    const profitFormatted = formatCurrency(netProfit, currency);
    const utilText = `${utilizationRes.utilizationRate}%`;
    const bikeCountText = fleetStatusCounts.Total === 1 ? '1 moto' : `${fleetStatusCounts.Total} motos`;

    if (language === 'fr') {
      return (
        <>
          {`Pour la période sélectionnée (${periodLabelText}), Motonomad a enregistré un chiffre d'affaires total de `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{revFormatted}</span>
          {` avec un bénéfice net de `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{profitFormatted}</span>
          {` (marge nette de `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{margin}%</span>
          {`). Le taux d'utilisation de la flotte s'élève à `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{utilText}</span>
          {` sur `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{bikeCountText}</span>
          {` actives. `}
          {topBike && `Le véhicule le plus performant est la ${topBike.brand} ${topBike.model}. `}
        </>
      );
    } else {
      return (
        <>
          {`For the selected period (${periodLabelText}), Motonomad recorded total revenue of `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{revFormatted}</span>
          {` with net profit of `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{profitFormatted}</span>
          {` (`}<span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{margin}%</span>
          {` net margin). Fleet utilization stands at `}
          <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{utilText}</span>
          {` across `}<span className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#D4A017]/12 text-[#F9D77A] font-bold border border-[#D4A017]/20">{fleetStatusCounts.Total} active motorcycles</span>{`. `}
        </>
      );
    }
  }, [totalRevenue, netProfit, utilizationRes, fleetStatusCounts, topBikesByRevenue, filteredReservations, periodLabelText, language, currency]);

  const chart1FinancialPerf = [
    { name: language === 'fr' ? 'Chiffre d’Affaires' : 'Revenue', amount: totalRevenue, fill: '#10B981' },
    { name: language === 'fr' ? 'Dépenses Expl.' : 'Operating Exp', amount: totalOperatingExpenses, fill: '#F43F5E' },
    { name: language === 'fr' ? 'Amortissement' : 'Depreciation', amount: totalDepreciationForPeriod, fill: '#F59E0B' },
    { name: language === 'fr' ? 'Bénéfice Net' : 'Net Profit', amount: netProfit, fill: '#D4A017' },
  ];

  const chart2FleetStatus = [
    { name: language === 'fr' ? 'Disponible' : 'Available', value: fleetStatusCounts.Available, color: '#10B981' },
    { name: language === 'fr' ? 'Réservée' : 'Reserved', value: fleetStatusCounts.Reserved, color: '#F59E0B' },
    { name: language === 'fr' ? 'Louée' : 'Rented', value: fleetStatusCounts.Rented, color: '#0284C7' },
    { name: language === 'fr' ? 'En maintenance' : 'Maintenance', value: fleetStatusCounts.Maintenance, color: '#F97316' },
    { name: language === 'fr' ? 'Endommagée' : 'Damaged', value: fleetStatusCounts.Damaged, color: '#EF4444' },
    { name: language === 'fr' ? 'Hors service' : 'Out of Service', value: fleetStatusCounts['Out of service'], color: '#6B7280' },
  ].filter((d) => d.value > 0);

  const chart3RevenueByBike = bikeProfitabilityList.map((bp) => ({ name: `${bp.motorcycle.brand} ${bp.motorcycle.model}`, revenue: bp.revenue })).sort((a, b) => b.revenue - a.revenue);
  const chart4ProfitByBike = bikeProfitabilityList.map((bp) => ({ name: `${bp.motorcycle.brand} ${bp.motorcycle.model}`, profit: bp.netProfit })).sort((a, b) => b.profit - a.profit);
  const chart5ROIByBike = bikeProfitabilityList.map((bp) => ({ name: `${bp.motorcycle.brand} ${bp.motorcycle.model}`, roi: bp.roi })).sort((a, b) => b.roi - a.roi);

  const chart6CapValuation = [
    { name: 'Total Investment', value: fleetKPIs.totalInvestment, fill: '#3B82F6' },
    { name: 'Book Value', value: fleetKPIs.currentBookValue, fill: '#10B981' },
    { name: 'Est Market Value', value: fleetKPIs.estimatedMarketValue, fill: '#D4A017' },
  ];

  const chart7DeprTrend = [
    { month: 'Month 0', bookValue: fleetKPIs.totalInvestment, accDepr: 0 },
    { month: 'Month 12', bookValue: fleetKPIs.totalInvestment - fleetKPIs.annualFleetDepreciation, accDepr: fleetKPIs.annualFleetDepreciation },
    { month: 'Month 24', bookValue: fleetKPIs.totalInvestment - fleetKPIs.annualFleetDepreciation * 2, accDepr: fleetKPIs.annualFleetDepreciation * 2 },
    { month: 'Month 36', bookValue: fleetKPIs.totalInvestment - fleetKPIs.annualFleetDepreciation * 3, accDepr: fleetKPIs.annualFleetDepreciation * 3 },
    { month: 'Month 48', bookValue: fleetKPIs.totalInvestment - fleetKPIs.annualFleetDepreciation * 4, accDepr: fleetKPIs.annualFleetDepreciation * 4 },
    { month: 'Month 60', bookValue: fleetKPIs.currentBookValue, accDepr: fleetKPIs.accumulatedDepreciation },
  ];

  const chart8MonthlyRevTrend = [
    { month: 'Jan', revenue: 0, exp: 0, profit: 0 },
    { month: 'Feb', revenue: 0, exp: 0, profit: 0 },
    { month: 'Mar', revenue: 0, exp: 0, profit: 0 },
    { month: 'Apr', revenue: 0, exp: 0, profit: 0 },
    { month: 'May', revenue: 0, exp: 0, profit: 0 },
    { month: 'Jun', revenue: 0, exp: 0, profit: 0 },
    { month: 'Jul', revenue: 0, exp: 0, profit: 0 },
    { month: 'Aug', revenue: totalRevenue, exp: totalOperatingExpenses, profit: netProfit },
  ];

  const openDrillDown = (title: string, description: string, totalValue: number, type: 'revenue' | 'expense' | 'motorcycles' | 'reservations' | 'depreciation' | 'investments') => {
    let items: any[] = [];
    if (type === 'revenue') {
      items = filteredRevenues.map((r) => ({ id: r.id, title: r.description || `Revenue ${r.category}`, category: r.category, date: r.date, amount: r.amount, subtitle: `Payment: ${r.paymentMethod}`, badge: r.category, badgeColor: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' }));
    } else if (type === 'expense') {
      items = filteredExpenses.map((e) => ({ id: e.id, title: e.description || `Expense ${e.category}`, category: e.category, date: e.date, amount: e.amount, subtitle: e.supplier ? `Supplier: ${e.supplier}` : `Method: ${e.paymentMethod}`, badge: e.category, badgeColor: 'bg-rose-950/40 text-rose-400 border border-rose-800/40' }));
    } else if (type === 'motorcycles') {
      items = liveMotorcycles.map((m) => {
        const dep = calculateDepreciation(m.purchasePrice, m.residualValue, m.usefulLifeYears, m.purchaseDate);
        return { id: m.id, title: `${m.brand} ${m.model} (${m.year}) - Reg: ${m.registrationNumber}`, category: m.category, date: m.purchaseDate, amount: m.purchasePrice, subtitle: `Book Value: ${formatCurrency(dep.currentBookValue, currency)} | Status: ${m.currentStatus}`, badge: m.currentStatus, badgeColor: 'bg-amber-950/40 text-amber-400 border border-amber-800/40' };
      });
    } else if (type === 'reservations') {
      items = filteredReservations.map((r) => ({ id: r.id, title: `Booking: ${r.clientName} - ${r.motorcycleName}`, category: r.bookingSource, date: r.startDate, amount: r.totalPrice, subtitle: `${r.rentalDays} Days (${r.startDate} -> ${r.endDate}) | Paid: ${formatCurrency(r.amountPaid, currency)}`, badge: r.status, badgeColor: 'bg-sky-950/40 text-sky-400 border border-sky-800/40' }));
    } else if (type === 'depreciation') {
      items = liveMotorcycles.map((m) => {
        const dep = calculateDepreciation(m.purchasePrice, m.residualValue, m.usefulLifeYears, m.purchaseDate);
        return { id: m.id, title: `${m.brand} ${m.model} (${m.registrationNumber})`, category: 'Straight-line Amortization', date: m.purchaseDate, amount: dep.accumulatedDepreciation, subtitle: `Annual: ${formatCurrency(dep.annualDepreciation, currency)} | Current Book Val: ${formatCurrency(dep.currentBookValue, currency)}`, badge: dep.status, badgeColor: 'bg-purple-950/40 text-purple-300 border border-purple-800/40' };
      });
    }
    setDrillDownState({ isOpen: true, title, description, totalValue, items });
  };

  const handleSaveMarketValue = (mId: string) => {
    if (onUpdateMotorcycleMarketValue) onUpdateMotorcycleMarketValue(mId, tempMarketVal);
    setEditingMarketValueId(null);
  };

  // ----------------------------------------------------
  // AFFICHAGE DE CHARGEMENT SUPABASE
  // ----------------------------------------------------
  if (isLoadingDb) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Synchronisation Cloud Supabase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-[#F4F4F2]">
      {/* Mobile Quick Actions Operational Bar */}
      <div className="block">
        <QuickActionsBar
          onAction={(action) => {
            if (action === 'new_reservation' || action === 'check_out' || action === 'check_in') {
              onNavigate('reservations');
            } else if (action === 'add_client') {
              onNavigate('clients');
            } else if (action === 'add_motorcycle') {
              onNavigate('fleet');
            } else if (action === 'maintenance') {
              onNavigate('maintenance');
            } else {
              onNavigate('finance');
            }
          }}
        />
      </div>

      {/* 1. TOP HEADER & FILTER CONTROL BAR */}
      <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-wide uppercase">
              {language === 'fr' ? "Centre de Contrôle de Gestion Exécutif" : "Executive Management Control Center"}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4A017]/10 text-[#D4A017] font-bold border border-[#D4A017]/30 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" /> Live DB Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr' 
              ? "Performance financière en temps réel, valorisation de la flotte, moteur d'amortissement et métriques de décision ROI."
              : "Real-time financial performance, fleet valuation, depreciation engine & ROI decision metrics."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center bg-[#111111] border border-[#333333] rounded-xl px-3 py-1.5 text-xs text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-[#D4A017] mr-2" />
            <span className="font-semibold text-white">{periodLabelText}</span>
          </div>

          <div className="flex items-center bg-[#111111] border border-[#333333] rounded-xl px-3 py-1.5 text-xs">
            <Bike className="w-3.5 h-3.5 text-zinc-400 mr-2" />
            <select
              value={selectedMotorcycleFilter}
              onChange={(e) => setSelectedMotorcycleFilter(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181818]">
                {language === 'fr' ? 'Toutes les motos' : 'All Motorcycles'}
              </option>
              {liveMotorcycles.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#181818]">
                  {m.brand} {m.model} ({m.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsTargetsOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#222222] border border-[#333333] hover:border-[#D4A017] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 text-[#D4A017]" />
            {language === 'fr' ? 'Objectifs' : 'Targets'}
          </button>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#D4A017] text-[#111111] hover:bg-[#e0ad24] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#D4A017]/20 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            {language === 'fr' ? 'Simulateur' : 'Simulator'}
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC MANAGEMENT SUMMARY BANNER */}
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-[#1C180E] via-[#1A1A1A] to-[#121212] border border-[#D4A017]/30 shadow-xl shadow-[#D4A017]/10 relative overflow-hidden ${isLoaded ? 'animate-fade-in-up animation-delay-100' : ''}`}>
        <div className="absolute top-0 right-0 w-64 h-full bg-[#D4A017]/8 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2.5 rounded-xl bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30 mt-0.5 shrink-0 shadow-inner shadow-[#D4A017]/10">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4A017]">
              {language === 'fr' ? "Résumé Exécutif de Gestion Dynamique" : "Dynamic Management Executive Summary"}
            </h4>
            <p className="text-xs text-zinc-200 mt-2 leading-relaxed font-sans">
              {summaryJSX}
            </p>
          </div>
        </div>
      </div>

      {/* 3. MANAGEMENT ALERTS */}
      {alerts.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${isLoaded ? 'animate-fade-in-up animation-delay-200' : ''}`}>
          {alerts.slice(0, 3).map((a) => {
            const severity = a.type === 'danger' 
              ? (language === 'fr' ? 'Critique' : 'Critical') 
              : a.type === 'warning' 
              ? (language === 'fr' ? 'À vérifier' : 'Review') 
              : (language === 'fr' ? 'Info' : 'Info');
            const severityClass = a.type === 'danger'
              ? 'bg-rose-950/30 border-rose-900/50 text-rose-400'
              : a.type === 'warning'
              ? 'bg-amber-950/30 border-amber-900/50 text-amber-400'
              : 'bg-sky-950/30 border-sky-900/50 text-sky-400';

            const badgeClass = a.type === 'danger'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : a.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : 'bg-sky-500/10 border-sky-500/20 text-sky-300';

            return (
              <div
                key={a.id}
                onClick={() => a.tab && onNavigate(a.tab)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:brightness-110 ${severityClass}`}
              >
                <div className="flex items-start gap-2 w-full min-w-0">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs block truncate uppercase tracking-wide">{a.title}</span>
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${badgeClass}`}>
                        {severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block mt-1 leading-relaxed">{a.message}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 shrink-0 self-center" />
              </div>
            );
          })}
        </div>
      )}

      {/* 4. PRIMARY EXECUTIVE KPI CARDS GRID */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${isLoaded ? 'animate-fade-in-up animation-delay-300' : ''}`}>
        <div
          onClick={() => openDrillDown('Total Fleet Capital Investment', 'Initial acquisition costs per motorcycle asset.', fleetKPIs.totalInvestment, 'motorcycles')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? 'Investissement Total Flotte' : 'Total Fleet Investment'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatCurrency(fleetKPIs.totalInvestment, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Actifs Actifs : ${fleetStatusCounts.Total}` : `Active Assets: ${fleetStatusCounts.Total}`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail Audit →' : 'Audit Breakdown →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Current Accounting Book Value', 'Straight-line residual value after accumulated depreciation.', fleetKPIs.currentBookValue, 'depreciation')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? 'Valeur Comptable Actuelle' : 'Current Book Value'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatCurrency(fleetKPIs.currentBookValue, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Marché Est. : ${formatCurrency(fleetKPIs.estimatedMarketValue, currency)}` : `Est Market: ${formatCurrency(fleetKPIs.estimatedMarketValue, currency)}`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail Audit →' : 'Audit Breakdown →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Accumulated Depreciation', 'Total amortized depreciation recorded across all motorcycles.', fleetKPIs.accumulatedDepreciation, 'depreciation')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? 'Amortissement Cumulé' : 'Accumulated Depreciation'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatCurrency(fleetKPIs.accumulatedDepreciation, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Taux Mensuel : -${formatCurrency(fleetKPIs.monthlyFleetDepreciation, currency)}` : `Monthly Rate: -${formatCurrency(fleetKPIs.monthlyFleetDepreciation, currency)}`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail Audit →' : 'Audit Breakdown →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Net Profit Ledger', `Net Profit for period ${periodLabelText}.`, netProfit, 'revenue')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80 shadow-[#D4A017]/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? 'Bénéfice Net' : 'Net Profit'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[1.8rem] font-black font-mono text-[#D4A017] leading-none">
            {formatCurrency(netProfit, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Marge Nette : ${profitMargin.toFixed(1)}%` : `Profit Margin: ${profitMargin.toFixed(1)}%`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail Audit →' : 'Audit Breakdown →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Total Revenue Transactions', 'Itemized breakdown of rental, tour, and equipment revenues.', totalRevenue, 'revenue')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80 shadow-[#D4A017]/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? "Chiffre d'Affaires Total" : 'Total Revenue'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[1.8rem] font-black font-mono text-[#D4A017] leading-none">
            {formatCurrency(totalRevenue, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Location : ${formatCurrency(revBreakdown.Rental, currency)}` : `Rental: ${formatCurrency(revBreakdown.Rental, currency)}`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail →' : 'Drill-Down →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Total Operating Expenses', 'Itemized breakdown of maintenance, fuel, insurance.', totalOperatingExpenses, 'expense')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? "Dépenses d'Exploitation" : 'Operating Expenses'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatCurrency(totalOperatingExpenses, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Maintenance : ${formatCurrency(expBreakdown.Maintenance, currency)}` : `Maintenance: ${formatCurrency(expBreakdown.Maintenance, currency)}`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail →' : 'Drill-Down →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Fleet Utilization Ledger', 'Actual Rental Days / Available Days in period.', utilizationRes.utilizationRate, 'reservations')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? 'Utilisation de la Flotte' : 'Fleet Utilization'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {utilizationRes.utilizationRate}%
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `${utilizationRes.totalActualDays} Louées / ${utilizationRes.totalAvailableDays} Jours Dispo` : `${utilizationRes.totalActualDays} Rented / ${utilizationRes.totalAvailableDays} Avail Days`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail →' : 'Drill-Down →'}
            </span>
          </div>
        </div>

        <div
          onClick={() => openDrillDown('Rental Day Performance', 'Total Rental Revenue divided by total active rental days.', avgRevenuePerRentalDay, 'reservations')}
          className="p-5 bg-[#1C1C1C] rounded-xl border border-zinc-800 transition-all duration-300 ease-out cursor-pointer group shadow-xl hover:scale-[1.02] hover:border-zinc-700/80 shadow-[#D4A017]/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {language === 'fr' ? 'Rev. Moy / Jour de Location' : 'Avg Rev / Rental Day'}
            </span>
            <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#D4A017]">
            {formatCurrency(avgRevenuePerRentalDay, currency)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>{language === 'fr' ? `Total Jours Location : ${totalRentalDays}` : `Total Rental Days: ${totalRentalDays}`}</span>
            <span className="font-semibold group-hover:text-zinc-400 group-hover:underline">
              {language === 'fr' ? 'Détail →' : 'Drill-Down →'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. MANAGEMENT TARGETS VS ACTUAL */}
      <div className={`p-6 bg-[#1C1C1C] rounded-xl border border-zinc-800 shadow-xl space-y-4 ${isLoaded ? 'animate-fade-in-up animation-delay-300' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4A017]" />
            <h3 className="text-base font-bold text-white">
              {language === 'fr' ? 'Repères de Gestion vs Performance Réelle' : 'Management Benchmarks vs Actual Performance'}
            </h3>
          </div>
          <button onClick={() => setIsTargetsOpen(true)} className="text-xs text-[#D4A017] hover:underline font-bold cursor-pointer">
            {language === 'fr' ? 'Modifier les Objectifs Configurés' : 'Edit Configured Targets'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#1C1C1C] rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span>{language === 'fr' ? 'Objectif Chiffre d’Affaires Mensuel' : 'Monthly Revenue Target'}</span>
              <span className="font-bold text-[#D4A017]">{calculateTargetAchievement(totalRevenue, targets.monthlyRevenueTarget)}%</span>
            </div>
            <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#D4A017]" style={{ width: `${Math.min(100, calculateTargetAchievement(totalRevenue, targets.monthlyRevenueTarget))}%` }} />
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-gray-300 font-semibold">{language === 'fr' ? `Réel : ${formatCurrency(totalRevenue, currency)}` : `Actual: ${formatCurrency(totalRevenue, currency)}`}</span>
              <span className="text-zinc-500">{language === 'fr' ? `Cible : ${formatCurrency(targets.monthlyRevenueTarget, currency)}` : `Target: ${formatCurrency(targets.monthlyRevenueTarget, currency)}`}</span>
            </div>
          </div>

          <div className="p-4 bg-[#1C1C1C] rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span>{language === 'fr' ? 'Objectif d’Utilisation' : 'Utilization Target'}</span>
              <span className="font-bold text-emerald-500">{calculateTargetAchievement(utilizationRes.utilizationRate, targets.fleetUtilizationTarget)}%</span>
            </div>
            <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${calculateTargetAchievement(utilizationRes.utilizationRate, targets.fleetUtilizationTarget) < 70 ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, calculateTargetAchievement(utilizationRes.utilizationRate, targets.fleetUtilizationTarget))}%` }} />
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-gray-300 font-semibold">{language === 'fr' ? `Réel : ${utilizationRes.utilizationRate}%` : `Actual: ${utilizationRes.utilizationRate}%`}</span>
              <span className="text-zinc-500">{language === 'fr' ? `Cible : ${targets.fleetUtilizationTarget}%` : `Target: ${targets.fleetUtilizationTarget}%`}</span>
            </div>
          </div>

          <div className="p-4 bg-[#1C1C1C] rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span>{language === 'fr' ? 'Objectif de Marge Bénéficiaire' : 'Profit Margin Target'}</span>
              <span className="font-bold text-[#D4A017]">{calculateTargetAchievement(profitMargin, targets.profitMarginTarget)}%</span>
            </div>
            <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#D4A017]" style={{ width: `${Math.min(100, calculateTargetAchievement(profitMargin, targets.profitMarginTarget))}%` }} />
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-gray-300 font-semibold">{language === 'fr' ? `Réel : ${profitMargin.toFixed(1)}%` : `Actual: ${profitMargin.toFixed(1)}%`}</span>
              <span className="text-zinc-500">{language === 'fr' ? `Cible : ${targets.profitMarginTarget}%` : `Target: ${targets.profitMarginTarget}%`}</span>
            </div>
          </div>

          <div className="p-4 bg-[#1C1C1C] rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span>{language === 'fr' ? 'Récupération Investissement Flotte' : 'Fleet Investment Recovery'}</span>
              <span className="font-bold text-emerald-500">{investmentRecoveryPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, investmentRecoveryPercent)}%` }} />
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-gray-300 font-semibold">{language === 'fr' ? `Réel : ${formatCurrency(totalRevenue, currency)}` : `Actual: ${formatCurrency(totalRevenue, currency)}`}</span>
              <span className="text-zinc-500">{language === 'fr' ? `Restant : ${formatCurrency(remainingInvestmentRecovery, currency)}` : `Remaining: ${formatCurrency(remainingInvestmentRecovery, currency)}`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MOTORCYCLE PROFITABILITY & DECISION ENGINE MATRIX */}
      <div className="p-6 bg-[#1C1C1C] rounded-xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{language === 'fr' ? 'Moteur de Décision & Matrice de Rentabilité des Véhicules' : 'Vehicle Decision Engine & Profitability Matrix'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#D4A017]/10 text-[#D4A017] border border-[#D4A017]/20 font-mono">
                {language === 'fr' ? 'CONSERVER / SURVEILLER / VENDRE' : 'KEEP / MONITOR / SELL'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {language === 'fr'
                ? `Recommandation d'actifs automatisée basée sur les règles de seuil de ROI % (> ${targets.keepRoiThreshold}% CONSERVER, < ${targets.sellRoiThreshold}% VENDRE).`
                : `Automated asset recommendation based on ROI % threshold rules (> ${targets.keepRoiThreshold}% KEEP, < ${targets.sellRoiThreshold}% SELL).`}
            </p>
          </div>
          <button onClick={() => onNavigate('fleet')} className="text-xs text-[#D4A017] hover:underline font-bold cursor-pointer">
            {language === 'fr' ? 'Gérer les Actifs de la Flotte →' : 'Manage Fleet Assets →'}
          </button>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#1A1A1A]">
              <tr className="border-b border-zinc-800">
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Moto / Actif' : 'Motorcycle Asset'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Investissement' : 'Investment'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Chiffre d’Affaires' : 'Revenue'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Coût d’Exploitation' : 'Operating Cost'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Amort. Cumulé' : 'Acc. Depreciation'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Bénéfice Net' : 'Net Profit'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">ROI %</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{language === 'fr' ? 'Val. Marché Est.' : 'Est. Market Val'}</th>
                <th className="p-4 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider text-center">{language === 'fr' ? 'Verdict de Décision' : 'Decision Verdict'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-mono text-gray-300">
              {bikeProfitabilityList.map(({ motorcycle, revenue, operatingCosts, depreciation, netProfit, roi, decision }) => (
                <tr key={motorcycle.id} className="hover:bg-white/5 transition-colors border-b border-zinc-800/50">
                  <td className="p-4 font-sans">
                    <div className="font-bold text-white text-sm">{motorcycle.brand} {motorcycle.model}</div>
                    <div className="text-[11px] text-zinc-500">Reg: {motorcycle.registrationNumber}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                      {language === 'fr' 
                        ? (motorcycle.currentStatus === 'Rented' ? 'Louée' 
                          : motorcycle.currentStatus === 'Available' ? 'Disponible' 
                          : motorcycle.currentStatus === 'Reserved' ? 'Réservée' 
                          : motorcycle.currentStatus === 'Maintenance' ? 'En maintenance' 
                          : motorcycle.currentStatus === 'Damaged' ? 'Endommagée' 
                          : motorcycle.currentStatus === 'Out of service' ? 'Hors service' 
                          : motorcycle.currentStatus === 'Sold' ? 'Vendue' : motorcycle.currentStatus)
                        : motorcycle.currentStatus}
                    </span>
                  </td>
                  <td className="p-4">{formatCurrency(motorcycle.purchasePrice, currency)}</td>
                  <td className="p-4 text-emerald-400/90 font-bold">{formatCurrency(revenue, currency)}</td>
                  <td className="p-4 text-rose-400/80">{formatCurrency(operatingCosts, currency)}</td>
                  <td className="p-4 text-amber-400/80">{formatCurrency(depreciation, currency)}</td>
                  <td className={`p-4 font-bold ${netProfit >= 0 ? 'text-[#D4A017]' : 'text-rose-400'}`}>
                    {formatCurrency(netProfit, currency)}
                  </td>
                  <td className={`p-4 font-extrabold ${roi >= 25 ? 'text-emerald-400' : roi >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {roi}%
                  </td>
                  <td className="p-4 text-sky-400/80">
                    {editingMarketValueId === motorcycle.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tempMarketVal}
                          onChange={(e) => setTempMarketVal(Number(e.target.value))}
                          className="w-20 bg-[#111111] border border-[#D4A017] px-1 py-0.5 rounded text-xs text-white"
                        />
                        <button onClick={() => handleSaveMarketValue(motorcycle.id)} className="text-xs bg-[#D4A017] text-black px-1.5 py-0.5 rounded font-sans font-bold cursor-pointer">
                          {language === 'fr' ? 'Enregistrer' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingMarketValueId(motorcycle.id);
                          setTempMarketVal(motorcycle.estimatedMarketValue || motorcycle.purchasePrice * 0.8);
                        }}
                        className="cursor-pointer hover:underline flex items-center gap-1 text-[11px]"
                      >
                        {formatCurrency(motorcycle.estimatedMarketValue || motorcycle.purchasePrice * 0.8, currency)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center font-sans">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium tracking-wider uppercase inline-block border ${
                      decision === 'KEEP' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      decision === 'MONITOR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {language === 'fr' 
                        ? (decision === 'KEEP' ? 'CONSERVER' : decision === 'MONITOR' ? 'SURVEILLER' : 'VENDRE')
                        : decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. INTERACTIVE FINANCIAL CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> {language === 'fr' ? '1. Ventilation de la Performance Financière' : '1. Financial Performance Breakdown'}
            </h4>
            <span className="text-[11px] text-zinc-400 font-mono">{periodLabelText}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart1FinancialPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 11 }} />
                <YAxis stroke="#888888" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [formatCurrency(Number(val), currency), language === 'fr' ? 'Montant' : 'Amount']} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chart1FinancialPerf.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-2">
              <PieIcon className="w-4 h-4" /> {language === 'fr' ? '2. Distribution des Statuts de la Flotte' : '2. Fleet Status Distribution'}
            </h4>
            <span className="text-[11px] text-zinc-400 font-mono">{language === 'fr' ? `Total ${fleetStatusCounts.Total} Motos` : `Total ${fleetStatusCounts.Total} Bikes`}</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chart2FleetStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                  {chart2FleetStatus.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#ccc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {language === 'fr' ? '3. Chiffre d’Affaires Généré par Moto' : '3. Revenue Generated by Motorcycle'}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart3RevenueByBike} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis type="number" stroke="#888888" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#888888" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [formatCurrency(Number(val), currency), language === 'fr' ? 'Chiffre d’Affaires' : 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {language === 'fr' ? '4. Bénéfice Net par Moto' : '4. Net Profit by Motorcycle'}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart4ProfitByBike} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis type="number" stroke="#888888" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#888888" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [formatCurrency(Number(val), currency), language === 'fr' ? 'Bénéfice Net' : 'Net Profit']} />
                <Bar dataKey="profit" fill="#D4A017" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {language === 'fr' ? '5. Classement ROI % des Véhicules' : '5. Vehicle ROI % Leaderboard'}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart5ROIByBike}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 9 }} interval={0} />
                <YAxis stroke="#888888" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [`${val}%`, 'ROI']} />
                <Bar dataKey="roi" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {language === 'fr' ? '6. Comparaison de l’Évaluation du Capital' : '6. Capital Valuation Comparison'}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart6CapValuation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 11 }} />
                <YAxis stroke="#888888" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [formatCurrency(Number(val), currency), language === 'fr' ? 'Valeur' : 'Value']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chart6CapValuation.map((entry, index) => (
                    <Cell key={`cell-cap-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {language === 'fr' ? '7. Courbe d’Amortissement & Valeur Comptable' : '7. Fleet Amortization & Book Value Curve'}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart7DeprTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="month" stroke="#888888" tick={{ fontSize: 11 }} />
                <YAxis stroke="#888888" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [formatCurrency(Number(val), currency), language === 'fr' ? 'Valeur' : 'Value']} />
                <Area type="monotone" dataKey="bookValue" stroke="#10B981" fill="#10B981" fillOpacity={0.15} name={language === 'fr' ? 'Valeur Comptable' : 'Book Value'} />
                <Area type="monotone" dataKey="accDepr" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} name={language === 'fr' ? 'Amort. Cumulé' : 'Acc. Depreciation'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {language === 'fr' ? '8 & 9. Trajectoire du Chiffre d’Affaires & du Bénéfice' : '8 & 9. Monthly Revenue & Profit Trajectory'}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart8MonthlyRevTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="month" stroke="#888888" tick={{ fontSize: 11 }} />
                <YAxis stroke="#888888" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [formatCurrency(Number(val), currency), language === 'fr' ? 'Montant' : 'Amount']} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name={language === 'fr' ? 'Chiffre d’Affaires' : 'Revenue'} />
                <Area type="monotone" dataKey="profit" stroke="#D4A017" fill="#D4A017" fillOpacity={0.2} name={language === 'fr' ? 'Bénéfice Net' : 'Net Profit'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 8. TOP PERFORMERS & LEADERBOARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
            <Award className="w-4 h-4" /> {language === 'fr' ? 'Top 5 Motos par Chiffre d’Affaires' : 'Top 5 Motorcycles by Revenue'}
          </h4>
          <div className="space-y-2 text-xs">
            {topBikesByRevenue.map(({ motorcycle, revenue, roi }, idx) => (
              <div key={motorcycle.id} className="p-2.5 rounded-xl bg-[#202020] border border-[#2D2D2D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#D4A017]/20 text-[#D4A017] font-bold text-[10px] flex items-center justify-center">#{idx + 1}</span>
                  <div>
                    <span className="font-bold text-white block">{motorcycle.brand} {motorcycle.model}</span>
                    <span className="text-[10px] text-zinc-400">ROI: {roi}%</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(revenue, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {language === 'fr' ? 'Top 5 Agences par Chiffre d’Affaires' : 'Top 5 Agencies by Revenue'}
          </h4>
          <div className="space-y-2 text-xs">
            {topAgencies.length === 0 ? (
              <div className="text-zinc-500 py-6 text-center">
                {language === 'fr' ? 'Aucune réservation d’agence enregistrée.' : 'No agency bookings recorded.'}
              </div>
            ) : (
              topAgencies.map((agency, idx) => (
                <div key={agency.id} className="p-2.5 rounded-xl bg-[#202020] border border-[#2D2D2D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center">#{idx + 1}</span>
                    <div>
                      <span className="font-bold text-white block">{agency.agencyName}</span>
                      <span className="text-[10px] text-zinc-400">{agency.country}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-blue-400">{formatCurrency(agency.totalRevenue || 0, currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
            <Compass className="w-4 h-4" /> {language === 'fr' ? 'Top 5 Clients par Dépenses' : 'Top 5 Clients by Spend'}
          </h4>
          <div className="space-y-2 text-xs">
            {topClients.length === 0 ? (
              <div className="text-zinc-500 py-6 text-center">
                {language === 'fr' ? 'Aucun client enregistré.' : 'No clients recorded.'}
              </div>
            ) : (
              topClients.map((client, idx) => (
                <div key={client.id} className="p-2.5 rounded-xl bg-[#202020] border border-[#2D2D2D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[10px] flex items-center justify-center">#{idx + 1}</span>
                    <div>
                      <span className="font-bold text-white block">{client.fullName}</span>
                      <span className="text-[10px] text-zinc-400">{client.country}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-purple-300">{formatCurrency(client.lifetimeValue || client.totalSpent || 0, currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 9. MODALS & DRILL DOWN POPUPS */}
      <DrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={() => setDrillDownState((prev) => ({ ...prev, isOpen: false }))}
        title={drillDownState.title}
        description={drillDownState.description}
        totalValue={drillDownState.totalValue}
        items={drillDownState.items}
        currency={currency}
      />

      <InvestmentSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        currency={currency}
      />

      <ManagementTargetsModal
        isOpen={isTargetsOpen}
        onClose={() => setIsTargetsOpen(false)}
        targets={targets}
        onSaveTargets={(newTargets) => setTargets(newTargets)}
      />
    </div>
  );
};

export default ExecutiveDashboard;