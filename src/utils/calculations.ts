import {
  Motorcycle,
  Reservation,
  Revenue,
  Expense,
  Investment,
  Tour,
  Client,
  MaintenanceRecord,
  DateFilterRange,
  BusinessSettings,
  MotorcycleStatus,
} from '../types';

/**
 * Currency Formatting
 */
export function formatCurrency(
  amountInMAD: number,
  currency: 'MAD' | 'EUR' | 'USD' | string = 'MAD',
  rates: { EURToMADRate: number; USDToMADRate: number } = { EURToMADRate: 10.8, USDToMADRate: 9.8 }
): string {
  const val = isNaN(amountInMAD) ? 0 : amountInMAD;
  let finalAmount = val;
  let symbol = 'MAD';

  if (currency === 'EUR') {
    finalAmount = val / (rates.EURToMADRate || 10.8);
    symbol = '€';
  } else if (currency === 'USD') {
    finalAmount = val / (rates.USDToMADRate || 9.8);
    symbol = '$';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(finalAmount)) + ' ' + symbol;
}

/**
 * Calculate rental days between start and end dates
 * Minimum 1 day, prevents negative numbers.
 */
export function calculateRentalDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Calculate recommended base price for a rental
 */
export function calculateRentalPrice(
  motorcycle: Motorcycle,
  rentalDays: number
): number {
  if (!motorcycle) return 0;
  if (rentalDays >= 30) {
    const months = rentalDays / 30;
    return months * (motorcycle.monthlyPrice || motorcycle.dailyPrice * 22);
  } else if (rentalDays >= 7) {
    const weeks = rentalDays / 7;
    return weeks * (motorcycle.weeklyPrice || motorcycle.dailyPrice * 6);
  }
  return rentalDays * (motorcycle.dailyPrice || 0);
}

/**
 * Check if a motorcycle is available during a given date range
 */
export function isMotorcycleAvailable(
  motorcycleId: string,
  startDateStr: string,
  endDateStr: string,
  reservations: Reservation[],
  excludeReservationId?: string
): { available: boolean; conflictingReservation?: Reservation } {
  const reqStart = new Date(startDateStr).getTime();
  const reqEnd = new Date(endDateStr).getTime();

  for (const res of reservations || []) {
    if (res.motorcycleId !== motorcycleId) continue;
    if (res.status === 'Cancelled' || res.status === 'Returned' || res.status === 'Closed') continue;
    if (excludeReservationId && res.id === excludeReservationId) continue;

    const resStart = new Date(res.startDate).getTime();
    const resEnd = new Date(res.endDate).getTime();

    if (reqStart < resEnd && reqEnd > resStart) {
      return { available: false, conflictingReservation: res };
    }
  }

  return { available: true };
}

/**
 * Straight-line depreciation calculation engine
 */
export function calculateDepreciation(
  purchasePrice: number,
  residualValue: number,
  usefulLifeYears: number,
  purchaseDateStr: string,
  targetDateStr?: string
) {
  const safePrice = purchasePrice || 0;
  const safeResidual = Math.min(residualValue || 0, safePrice);
  const safeLife = usefulLifeYears > 0 ? usefulLifeYears : 5;

  const annualDepreciation = (safePrice - safeResidual) / safeLife;
  const monthlyDepreciation = annualDepreciation / 12;

  const pDate = new Date(purchaseDateStr || '2024-01-01');
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

  let monthsPassed = 0;
  if (!isNaN(pDate.getTime()) && !isNaN(targetDate.getTime())) {
    monthsPassed = Math.max(
      0,
      (targetDate.getFullYear() - pDate.getFullYear()) * 12 + (targetDate.getMonth() - pDate.getMonth())
    );
  }

  const depreciableBase = safePrice - safeResidual;
  const accumulatedDepreciation = Math.min(
    depreciableBase,
    Math.max(0, monthsPassed * monthlyDepreciation)
  );

  const currentBookValue = Math.max(safeResidual, safePrice - accumulatedDepreciation);

  let status: 'Active' | 'Near Fully Depreciated' | 'Fully Depreciated' = 'Active';
  if (depreciableBase > 0) {
    if (accumulatedDepreciation >= depreciableBase) {
      status = 'Fully Depreciated';
    } else if (accumulatedDepreciation >= 0.8 * depreciableBase) {
      status = 'Near Fully Depreciated';
    }
  }

  return {
    annualDepreciation,
    monthlyDepreciation,
    monthsPassed,
    accumulatedDepreciation,
    currentBookValue,
    depreciableBase,
    status,
  };
}

/**
 * Date filtering helper for all collections
 */
export function filterByDateRange<T>(
  items: T[],
  getDateField: (item: T) => string,
  range: DateFilterRange | string,
  customStart?: string,
  customEnd?: string
): T[] {
  if (!items || !Array.isArray(items)) return [];
  if (range === 'all') return items;

  const now = new Date('2026-08-09T00:00:00'); // Standard reference time for demo or system time
  const todayStr = '2026-08-09';

  return items.filter((item) => {
    const dStr = getDateField(item);
    if (!dStr) return false;
    const itemDate = new Date(dStr);
    if (isNaN(itemDate.getTime())) return false;

    if (range === 'today') {
      return dStr.startsWith(todayStr);
    }

    if (range === 'this_week') {
      const dayOfWeek = now.getDay();
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - dayOfWeek);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      return itemDate >= firstDayOfWeek;
    }

    if (range === 'this_month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    if (range === 'last_month') {
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      return itemDate.getFullYear() === lastMonthYear && itemDate.getMonth() === lastMonth;
    }

    if (range === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(itemDate.getMonth() / 3);
      return itemDate.getFullYear() === now.getFullYear() && itemQuarter === currentQuarter;
    }

    if (range === 'this_year') {
      return itemDate.getFullYear() === now.getFullYear();
    }

    if (range === 'custom' && customStart && customEnd) {
      const cStart = new Date(customStart);
      const cEnd = new Date(customEnd);
      cEnd.setHours(23, 59, 59, 999);
      return itemDate >= cStart && itemDate <= cEnd;
    }

    return true;
  });
}

/**
 * Calculate Revenue Breakdown by Category
 */
export function calculateRevenueBreakdown(revenues: Revenue[]) {
  const breakdown = {
    Rental: 0,
    Tour: 0,
    Equipment: 0,
    Delivery: 0,
    Damage: 0,
    Other: 0,
    Total: 0,
  };

  (revenues || []).forEach((r) => {
    const amt = r.amount || 0;
    breakdown.Total += amt;
    if (r.category && breakdown[r.category] !== undefined) {
      breakdown[r.category] += amt;
    } else {
      breakdown.Other += amt;
    }
  });

  return breakdown;
}

/**
 * Calculate Operating Expenses Breakdown by Category
 */
export function calculateExpensesBreakdown(expenses: Expense[]) {
  const breakdown = {
    Maintenance: 0,
    Fuel: 0,
    Insurance: 0,
    Salaries: 0,
    Marketing: 0,
    Office: 0,
    Transportation: 0,
    Hotels: 0,
    Guides: 0,
    Suppliers: 0,
    Equipment: 0,
    Other: 0,
    Total: 0,
  };

  (expenses || []).forEach((e) => {
    const amt = e.amount || 0;
    breakdown.Total += amt;
    if (e.category && breakdown[e.category] !== undefined) {
      breakdown[e.category] += amt;
    } else {
      breakdown.Other += amt;
    }
  });

  return breakdown;
}

/**
 * Fleet Utilization Calculation
 * Available Rental Days = (Active bikes) * (Number of days in selected period)
 * Actual Rental Days = SUM of motorcycle rental days during period
 */
export function calculateFleetUtilization(
  motorcycles: Motorcycle[],
  reservations: Reservation[],
  daysInPeriod: number = 30
): { utilizationRate: number; totalAvailableDays: number; totalActualDays: number } {
  // Exclude motorcycles that were permanently out of service, sold, or not yet acquired
  const activeFleet = (motorcycles || []).filter(
    (m) => m.currentStatus !== 'Sold' && m.currentStatus !== 'Out of service'
  );

  const totalAvailableDays = activeFleet.length * daysInPeriod;
  if (totalAvailableDays === 0) {
    return { utilizationRate: 0, totalAvailableDays: 0, totalActualDays: 0 };
  }

  let totalActualDays = 0;
  (reservations || []).forEach((res) => {
    if (res.status === 'Active' || res.status === 'Confirmed' || res.status === 'Returned' || res.status === 'Closed') {
      totalActualDays += res.rentalDays || calculateRentalDays(res.startDate, res.endDate);
    }
  });

  const utilizationRate = Math.min(100, Math.round((totalActualDays / totalAvailableDays) * 1000) / 10);

  return {
    utilizationRate,
    totalAvailableDays,
    totalActualDays,
  };
}

/**
 * Per Motorcycle Profitability Engine
 */
export function calculateMotorcycleProfitability(
  motorcycle: Motorcycle,
  revenues: Revenue[],
  expenses: Expense[],
  reservations: Reservation[],
  maintenance: MaintenanceRecord[],
  keepThreshold: number = 25,
  sellThreshold: number = 0
) {
  const mId = motorcycle.id;

  // Direct Revenue
  const bikeRevenues = (revenues || []).filter((r) => r.relatedMotorcycleId === mId);
  const revenueFromRevenues = bikeRevenues.reduce((sum, r) => sum + (r.amount || 0), 0);

  const bikeReservations = (reservations || []).filter((res) => res.motorcycleId === mId);
  const revenueFromReservations = bikeReservations.reduce(
    (sum, res) => sum + (res.amountPaid || res.totalPrice || 0),
    0
  );

  const totalRevenue = Math.max(revenueFromRevenues, revenueFromReservations);

  // Direct Operating Expenses (Maintenance, Fuel, Insurance, etc.)
  const bikeExpenses = (expenses || []).filter((e) => e.relatedMotorcycleId === mId);
  const directExpenses = bikeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const bikeMaintenance = (maintenance || []).filter((m) => m.motorcycleId === mId);
  const maintenanceCost = bikeMaintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);

  const totalOperatingCosts = Math.max(directExpenses, maintenanceCost);

  // Depreciation
  const dep = calculateDepreciation(
    motorcycle.purchasePrice,
    motorcycle.residualValue,
    motorcycle.usefulLifeYears,
    motorcycle.purchaseDate
  );

  const netProfit = totalRevenue - totalOperatingCosts - dep.accumulatedDepreciation;
  const totalInvestment = motorcycle.purchasePrice || 1;
  const roi = (netProfit / totalInvestment) * 100;

  let decision: 'KEEP' | 'MONITOR' | 'SELL' = 'MONITOR';
  if (roi > keepThreshold) {
    decision = 'KEEP';
  } else if (roi < sellThreshold || netProfit < 0) {
    decision = 'SELL';
  }

  return {
    revenue: totalRevenue,
    operatingCosts: totalOperatingCosts,
    depreciation: dep.accumulatedDepreciation,
    currentBookValue: dep.currentBookValue,
    depreciationStatus: dep.status,
    netProfit,
    roi: Math.round(roi * 10) / 10,
    decision,
    rentalCount: bikeReservations.length,
  };
}

/**
 * Investment Metrics & Recovery
 */
export function calculateInvestmentMetrics(investment: Investment) {
  const totalInvestment = (investment.purchasePrice || 0) + (investment.additionalCosts || 0);
  const netProfit = (investment.actualRevenue || 0) - (investment.operatingCosts || 0);
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

  const invDate = new Date(investment.date || '2025-01-01');
  const now = new Date('2026-08-09');
  const monthsActive = Math.max(
    1,
    (now.getFullYear() - invDate.getFullYear()) * 12 + (now.getMonth() - invDate.getMonth())
  );

  const avgMonthlyProfit = netProfit / monthsActive;
  const paybackPeriodMonths =
    avgMonthlyProfit > 0 ? totalInvestment / avgMonthlyProfit : null;

  return {
    totalInvestment,
    netProfit,
    roi: Math.round(roi * 10) / 10,
    avgMonthlyProfit,
    paybackPeriodMonths: paybackPeriodMonths ? Math.round(paybackPeriodMonths * 10) / 10 : 'Not Recovering',
  };
}

/**
 * Investment Simulator Calculation
 */
export function calculateInvestmentSimulation(input: {
  purchasePrice: number;
  additionalCosts: number;
  dailyPrice: number;
  expectedRentalDaysPerMonth: number;
  monthlyMaintenanceCost: number;
  annualInsuranceCost: number;
  otherAnnualCosts: number;
  usefulLifeYears: number;
  residualValue: number;
  estimatedResaleValue: number;
}) {
  const totalInvestment = (input.purchasePrice || 0) + (input.additionalCosts || 0);
  const monthlyRevenue = (input.dailyPrice || 0) * (input.expectedRentalDaysPerMonth || 0);
  const annualRevenue = monthlyRevenue * 12;

  const annualOperatingCosts =
    (input.monthlyMaintenanceCost || 0) * 12 +
    (input.annualInsuranceCost || 0) +
    (input.otherAnnualCosts || 0);

  const depreciableValue = Math.max(0, (input.purchasePrice || 0) - (input.residualValue || 0));
  const annualDepreciation = depreciableValue / (input.usefulLifeYears || 5);

  const annualNetProfit = annualRevenue - annualOperatingCosts - annualDepreciation;
  const monthlyNetProfit = annualNetProfit / 12;

  const roi = totalInvestment > 0 ? (annualNetProfit / totalInvestment) * 100 : 0;
  const paybackPeriodMonths =
    monthlyNetProfit > 0 ? totalInvestment / monthlyNetProfit : null;

  return {
    totalInvestment,
    monthlyRevenue,
    annualRevenue,
    annualOperatingCosts,
    annualDepreciation,
    annualNetProfit,
    monthlyNetProfit,
    roi: Math.round(roi * 10) / 10,
    paybackPeriodMonths: paybackPeriodMonths ? Math.round(paybackPeriodMonths * 10) / 10 : 'Not Recovering',
    estimatedResaleValue: input.estimatedResaleValue || input.residualValue,
  };
}

/**
 * Year-Over-Year Growth Percentage Formula
 */
export function calculateYoYGrowth(currentVal: number, previousVal: number): { percent: number | null; label: string } {
  if (previousVal === 0) {
    if (currentVal === 0) return { percent: 0, label: '0%' };
    return { percent: null, label: 'N/A' };
  }
  const growth = ((currentVal - previousVal) / previousVal) * 100;
  const formatted = Math.round(growth * 10) / 10;
  return {
    percent: formatted,
    label: `${formatted >= 0 ? '+' : ''}${formatted}%`,
  };
}

/**
 * Target Achievement Calculator
 */
export function calculateTargetAchievement(actual: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(200, Math.round((actual / target) * 100));
}

/**
 * Generate Dynamic Executive Summary text from real DB calculations
 */
export function generateManagementSummary(
  data: {
    totalRevenue: number;
    netProfit: number;
    fleetUtilization: number;
    totalBikes: number;
    topMotorcycleName: string;
    maintenanceCount: number;
    unpaidReservationsCount: number;
    periodLabel: string;
  },
  lang: 'fr' | 'en' = 'fr'
): string {
  const utilText = `${data.fleetUtilization}%`;
  const profitMargin = data.totalRevenue > 0 ? Math.round((data.netProfit / data.totalRevenue) * 100) : 0;

  if (lang === 'fr') {
    let summary = `Pour la période sélectionnée (${data.periodLabel}), Motonomad a enregistré un chiffre d'affaires total de ${formatCurrency(data.totalRevenue)} avec un bénéfice net de ${formatCurrency(data.netProfit)} (marge nette de ${profitMargin}%). `;
    summary += `Le taux d'utilisation de la flotte s'élève à ${utilText} sur ${data.totalBikes} motos actives. `;
    if (data.topMotorcycleName) {
      summary += `Le véhicule le plus performant de la flotte est la ${data.topMotorcycleName}. `;
    }
    if (data.maintenanceCount > 0) {
      summary += `${data.maintenanceCount} véhicule(s) sont actuellement en cours de maintenance ou révision. `;
    }
    if (data.unpaidReservationsCount > 0) {
      summary += `${data.unpaidReservationsCount} réservation(s) nécessitent un suivi de paiement. `;
    }
    return summary;
  } else {
    let summary = `For the selected period (${data.periodLabel}), Motonomad recorded a total revenue of ${formatCurrency(data.totalRevenue)} with a net profit of ${formatCurrency(data.netProfit)} (${profitMargin}% net margin). `;
    summary += `Fleet utilization stands at ${utilText} across ${data.totalBikes} active motorcycles. `;
    if (data.topMotorcycleName) {
      summary += `The top-performing asset is the ${data.topMotorcycleName}. `;
    }
    if (data.maintenanceCount > 0) {
      summary += `${data.maintenanceCount} vehicle(s) are currently undergoing maintenance or inspection. `;
    }
    if (data.unpaidReservationsCount > 0) {
      summary += `${data.unpaidReservationsCount} reservation(s) require payment follow-up. `;
    }
    return summary;
  }
}
