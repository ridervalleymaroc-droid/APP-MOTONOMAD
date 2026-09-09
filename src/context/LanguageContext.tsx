import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (dateStr?: string) => string;
  formatCurrencyVal: (amount: number, currency?: string) => string;
}

const translations: Record<Language, Record<string, any>> = {
  fr: {
    // Navigation
    nav: {
      dashboard: "Tableau de bord",
      clients: "Clients",
      reservations: "Réservations",
      fleet: "Flotte Motos",
      maintenance: "Maintenance",
      tours: "Circuits & Raids",
      finance: "Finance & Profit",
      investments: "Investissements",
      equipment: "Équipements & Casques",
      agencies: "Agences",
      suppliers: "Fournisseurs",
      reports: "Rapports & Stats",
      audit: "Journal d'audit",
      settings: "Paramètres",
      more: "Plus",
      role_switcher: "Changer de rôle",
      logout: "Déconnexion",
    },

    // Actions & Common
    common: {
      search_placeholder: "Recherche globale (Clients, motos, réservations, immatriculation...)",
      quick_add: "Action Rapide",
      new_reservation: "Nouvelle Réservation",
      add_client: "Ajouter Client",
      add_motorcycle: "Ajouter Moto",
      record_payment: "Enregistrer Paiement",
      log_expense: "Saisir Dépense",
      check_out: "Check-out (Remise)",
      check_in: "Check-in (Retour)",
      save: "Enregistrer",
      cancel: "Annuler",
      close: "Fermer",
      edit: "Modifier",
      delete: "Supprimer",
      confirm: "Confirmer",
      back: "Retour",
      next: "Suivant",
      view: "Consulter",
      call: "Appeler",
      whatsapp: "WhatsApp",
      email: "E-mail",
      status: "Statut",
      actions: "Actions",
      all: "Tous",
      date: "Date",
      amount: "Montant",
      total: "Total",
      category: "Catégorie",
      description: "Description",
      notes: "Notes",
      export: "Exporter",
      filter: "Filtrer",
      offline_notice: "Vous êtes hors ligne — Les données seront synchronisées lors du rétablissement de la connexion.",
      live_db_sync: "Synchro DB En Direct",
      custom_range: "Période Personnalisée",
      today: "Aujourd'hui",
      this_week: "Cette semaine",
      this_month: "Ce mois-ci",
      last_month: "Mois dernier",
      this_quarter: "Ce trimestre",
      this_year: "Cette année (2026)",
      all_time: "Tout l'historique",
    },

    // Statuses
    status: {
      AVAILABLE: "Disponible",
      RESERVED: "Réservée",
      RENTED: "En location",
      MAINTENANCE: "En maintenance",
      DAMAGED: "Endommagée",
      OUT_OF_SERVICE: "Hors service",
      SOLD: "Vendue",
      CONFIRMED: "Confirmée",
      CANCELLED: "Annulée",
      RETURNED: "Restituée",
      CLOSED: "Clôturée",
      PENDING: "En attente",
      ACTIVE: "En cours",
      PAID: "Payée",
      PARTIALLY_PAID: "Partiellement payée",
      UNPAID: "Impayée",
      KEEP: "CONSERVER",
      MONITOR: "SURVEILLER",
      SELL: "VENDRE",
    },

    // Executive Dashboard
    dashboard: {
      title: "Centre de Contrôle Exécutif Motonomad",
      subtitle: "Performance financière en temps réel, valorisation de la flotte, moteur d'amortissement et indicateurs de décision ROI.",
      exec_summary_title: "Synthèse Exécutive de Gestion",
      total_fleet_investment: "Investissement Flotte Total",
      current_book_value: "Valeur Comptable Actuelle",
      accumulated_depreciation: "Amortissement Cumulé",
      net_profit: "Bénéfice Net",
      total_revenue: "Chiffre d'Affaires",
      operating_expenses: "Charges d'Exploitation",
      fleet_utilization: "Taux d'Utilisation Flotte",
      avg_rev_per_day: "Revenu Moyen / Jour de Location",
      profit_margin: "Marge Bénéficiaire",
      benchmarks_vs_actual: "Objectifs de Gestion vs Performance Réelle",
      monthly_rev_target: "Objectif C.A. Mensuel",
      utilization_target: "Objectif Taux d'Utilisation",
      margin_target: "Objectif Marge Bénéficiaire",
      investment_recovery: "Recouvrement de l'Investissement",
      decision_matrix_title: "Matrice de Décision & Profitabilité des Véhicules",
      decision_matrix_sub: "Recommandations automatiques basées sur les seuils ROI (ROI > % threshold KEEP, ROI < % threshold SELL).",
      vehicle: "Moto / Véhicule",
      investment: "Investissement",
      revenue: "Recettes",
      operating_cost: "Coûts Exploitation",
      net_profit_col: "Bénéfice Net",
      roi: "ROI %",
      est_market_val: "Valeur Marchande Est.",
      decision_verdict: "Verdict Décision",
      top_revenue_bikes: "Top Motos par Chiffre d'Affaires",
      top_profit_bikes: "Top Motos par Bénéfice Net",
      fleet_distribution: "Répartition par Statut de Flotte",
      financial_overview_chart: "Aperçu Financier Globale",
      monthly_trend_chart: "Tendance Mensuelle Recettes vs Dépenses",
      simulator_button: "Simulateur Investissement",
      targets_button: "Objectifs",
      audit_breakdown: "Détails & Audit",
    },

    // Handover Check-in / Check-out
    handover: {
      checkout_title: "Remise du Véhicule (Check-out)",
      checkin_title: "Retour du Véhicule (Check-in)",
      subtitle: "Procédure d'inspection mobile numérique et signature client",
      mileage: "Kilométrage Actuel (km)",
      fuel_level: "Niveau de Carburant",
      fuel_empty: "Vide",
      fuel_quarter: "1/4",
      fuel_half: "1/2",
      fuel_three_quarter: "3/4",
      fuel_full: "Plein",
      condition_checklist: "Liste de Contrôle d'État",
      tires: "Pneus & Pression",
      brakes: "Freins & Plaquettes",
      lights: "Feux & Clignotants",
      chain: "Chaîne & Transmission",
      bodywork: "Carrosserie & Peinture",
      helmet_gear: "Casques & Équipements fournis",
      photos_title: "Photos de l'État du Véhicule",
      add_photo: "+ Prendre / Ajouter Photo",
      signature_title: "Signature Numérique du Client",
      clear_signature: "Effacer la signature",
      employee_confirmation: "Agent de Confirmation / Inspecteur",
      notes_comments: "Remarques & Dommages Éventuels",
      complete_checkout: "VALIDER LE CHECK-OUT",
      complete_checkin: "VALIDER LE CHECK-IN",
      success_checkout: "Check-out validé avec succès !",
      success_checkin: "Check-in enregistré avec succès !",
    },

    // Quick Actions Bar
    quick_actions: {
      title: "Actions Rapides Métier",
      new_res: "Nouvelle Résa",
      new_client: "Nouveau Client",
      new_bike: "Ajouter Moto",
      record_pay: "Saisir Paiement",
      checkout: "Check-out (Remise)",
      checkin: "Check-in (Retour)",
      maint: "Maintenance",
      expense: "Dépense",
    },

    // Reservations Multi-step Wizard
    wizard: {
      step_1_title: "Étape 1 : Client",
      step_2_title: "Étape 2 : Moto",
      step_3_title: "Étape 3 : Dates",
      step_4_title: "Étape 4 : Tarification",
      step_5_title: "Étape 5 : Règlement",
      step_6_title: "Étape 6 : Confirmation",
      select_existing_client: "Sélectionner un Client Existant",
      or_create_new: "+ Créer un Nouveau Client",
      select_motorcycle: "Sélectionner une Moto Disponible",
      rental_period: "Période de Location",
      start_date: "Date de Début",
      end_date: "Date de Fin",
      rental_days: "Nombre de Jours",
      price_per_day: "Tarif Journalier",
      total_price: "Tarif Total HT",
      deposit_amount: "Caution Requise",
      payment_method: "Mode de Paiement",
      amount_paid: "Acompte / Montant Versé",
      confirm_booking: "CONFIRMER LA RÉSERVATION",
      availability_warning: "Attention : Cette moto n'est pas disponible sur ces dates !",
    },

    // Clients Module
    clients_mod: {
      title: "Gestion de la Clientèle",
      add_button: "+ Nouveau Client",
      search_placeholder: "Rechercher par nom, téléphone, passeport...",
      total_clients: "Total Clients",
      active_rentals: "En Location",
      total_spent: "Dépenses Totales",
      phone: "Téléphone",
      whatsapp_action: "Envoyer WhatsApp",
      call_action: "Appeler le Client",
      email_action: "Envoyer Email",
      new_res_for_client: "Créer Réservation",
      passport_no: "N° Passeport / CINE",
      license_no: "N° Permis de Conduire",
      nationality: "Nationalité",
    },

    // Fleet Module
    fleet_mod: {
      title: "Parc & Flotte Motos",
      add_button: "+ Nouvelle Moto",
      total_bikes: "Motos au total",
      avg_roi: "ROI Moyen Flotte",
      purchase_price: "Prix d'Achat",
      reg_number: "Immatriculation",
      vin_number: "Numéro de Châssis (VIN)",
      current_mileage: "Kilométrage",
      daily_rate: "Tarif / Jour",
      weekly_rate: "Tarif / Semaine",
      monthly_rate: "Tarif / Mois",
      status_filter: "Filtrer par Statut",
      tab_overview: "Aperçu",
      tab_reservations: "Réservations",
      tab_revenue: "Recettes & Rentabilité",
      tab_maintenance: "Historique Entretien",
      tab_depreciation: "Amortissement",
      tab_photos: "Photos & Papiers",
    },

    // Tours
    tours_mod: {
      title: "Circuits & Expeditions Adventure",
      add_button: "+ Nouveau Raid / Tour",
      duration: "Durée (Jours)",
      participants: "Participants",
      guide: "Guide Officiel",
      route: "Itinéraire & Étapes",
      hotels: "Hébergements",
      quick_contacts: "Contacts Urgence & Participants",
    },

    // Maintenance
    maint_mod: {
      title: "Gestion Atelier & Entretien Flotte",
      add_button: "+ Saisir Entretien",
      service_type: "Type de Service",
      mechanic: "Garagiste / Prestataire",
      cost: "Coût TTC",
      next_service_km: "Prochaine Vidange (km)",
    },

    // Finance & Investments
    finance_mod: {
      title: "Comptabilité, Recettes & Charges",
      revenues_tab: "Recettes",
      expenses_tab: "Dépenses",
      add_revenue: "+ Enregistrer Recette",
      add_expense: "+ Saisir Dépense",
    },

    investments_mod: {
      title: "Analyse des Investissements & Amortissement",
      payback_period: "Délai de Récupération (Mois)",
    },

    // Settings
    settings_mod: {
      title: "Paramètres de la Plateforme Motonomad",
      currency: "Devise d'affichage",
      language: "Langue de l'interface",
      demo_reset: "Réinitialiser les données démo",
    }
  },

  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      clients: "Clients",
      reservations: "Reservations",
      fleet: "Fleet",
      maintenance: "Maintenance",
      tours: "Tours & Raids",
      finance: "Finance & Profit",
      investments: "Investments",
      equipment: "Gear & Helmets",
      agencies: "Agencies",
      suppliers: "Suppliers",
      reports: "Reports & Stats",
      audit: "Audit Log",
      settings: "Settings",
      more: "More",
      role_switcher: "Role Switcher",
      logout: "Logout",
    },

    // Actions & Common
    common: {
      search_placeholder: "Global Search (Clients, motorcycles, bookings, registration...)",
      quick_add: "Quick Action",
      new_reservation: "New Reservation",
      add_client: "Add Client",
      add_motorcycle: "Add Motorcycle",
      record_payment: "Record Payment",
      log_expense: "Log Expense",
      check_out: "Check-out (Handover)",
      check_in: "Check-in (Return)",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      view: "View",
      call: "Call",
      whatsapp: "WhatsApp",
      email: "Email",
      status: "Status",
      actions: "Actions",
      all: "All",
      date: "Date",
      amount: "Amount",
      total: "Total",
      category: "Category",
      description: "Description",
      notes: "Notes",
      export: "Export",
      filter: "Filter",
      offline_notice: "You're offline — changes will sync when connection is restored.",
      live_db_sync: "Live DB Sync",
      custom_range: "Custom Date Range",
      today: "Today",
      this_week: "This Week",
      this_month: "This Month",
      last_month: "Last Month",
      this_quarter: "This Quarter",
      this_year: "This Year (2026)",
      all_time: "All Time",
    },

    // Statuses
    status: {
      AVAILABLE: "Available",
      RESERVED: "Reserved",
      RENTED: "Rented",
      MAINTENANCE: "In Maintenance",
      DAMAGED: "Damaged",
      OUT_OF_SERVICE: "Out of Service",
      SOLD: "Sold",
      CONFIRMED: "Confirmed",
      CANCELLED: "Cancelled",
      RETURNED: "Returned",
      CLOSED: "Closed",
      PENDING: "Pending",
      ACTIVE: "Active",
      PAID: "Paid",
      PARTIALLY_PAID: "Partially Paid",
      UNPAID: "Unpaid",
      KEEP: "KEEP",
      MONITOR: "MONITOR",
      SELL: "SELL",
    },

    // Executive Dashboard
    dashboard: {
      title: "Motonomad Executive Control Center",
      subtitle: "Real-time financial performance, fleet valuation, depreciation engine & ROI decision metrics.",
      exec_summary_title: "Management Executive Summary",
      total_fleet_investment: "Total Fleet Investment",
      current_book_value: "Current Book Value",
      accumulated_depreciation: "Accumulated Depreciation",
      net_profit: "Net Profit",
      total_revenue: "Total Revenue",
      operating_expenses: "Operating Expenses",
      fleet_utilization: "Fleet Utilization",
      avg_rev_per_day: "Avg Rev / Rental Day",
      profit_margin: "Profit Margin",
      benchmarks_vs_actual: "Management Benchmarks vs Actual Performance",
      monthly_rev_target: "Monthly Revenue Target",
      utilization_target: "Utilization Target",
      margin_target: "Profit Margin Target",
      investment_recovery: "Investment Recovery",
      decision_matrix_title: "Vehicle Decision Engine & Profitability Matrix",
      decision_matrix_sub: "Automated asset recommendation based on ROI % threshold rules.",
      vehicle: "Vehicle / Motorcycle",
      investment: "Investment",
      revenue: "Revenue",
      operating_cost: "Operating Cost",
      net_profit_col: "Net Profit",
      roi: "ROI %",
      est_market_val: "Est. Market Value",
      decision_verdict: "Decision Verdict",
      top_revenue_bikes: "Top Bikes by Revenue",
      top_profit_bikes: "Top Bikes by Net Profit",
      fleet_distribution: "Fleet Status Distribution",
      financial_overview_chart: "Global Financial Overview",
      monthly_trend_chart: "Monthly Revenue vs Expenses Trend",
      simulator_button: "Investment Simulator",
      targets_button: "Targets",
      audit_breakdown: "Audit & Breakdown",
    },

    // Handover Check-in / Check-out
    handover: {
      checkout_title: "Motorcycle Handover (Check-out)",
      checkin_title: "Motorcycle Return (Check-in)",
      subtitle: "Mobile digital inspection procedure & client signature",
      mileage: "Current Odometer Mileage (km)",
      fuel_level: "Fuel Gauge Level",
      fuel_empty: "Empty",
      fuel_quarter: "1/4",
      fuel_half: "1/2",
      fuel_three_quarter: "3/4",
      fuel_full: "Full",
      condition_checklist: "Vehicle Condition Checklist",
      tires: "Tires & Air Pressure",
      brakes: "Brakes & Brake Pads",
      lights: "Lights & Signals",
      chain: "Chain & Drive",
      bodywork: "Bodywork & Paint",
      helmet_gear: "Provided Helmets & Gear",
      photos_title: "Vehicle Condition Photos",
      add_photo: "+ Take / Add Photo",
      signature_title: "Client Digital Signature",
      clear_signature: "Clear Signature",
      employee_confirmation: "Confirming Agent / Inspector",
      notes_comments: "Inspection Notes & Existing Damage",
      complete_checkout: "COMPLETE CHECK-OUT",
      complete_checkin: "COMPLETE CHECK-IN",
      success_checkout: "Check-out completed successfully!",
      success_checkin: "Check-in recorded successfully!",
    },

    // Quick Actions Bar
    quick_actions: {
      title: "Operational Quick Actions",
      new_res: "New Booking",
      new_client: "New Client",
      new_bike: "Add Bike",
      record_pay: "Record Payment",
      checkout: "Check-out",
      checkin: "Check-in",
      maint: "Maintenance",
      expense: "Expense",
    },

    // Wizard
    wizard: {
      step_1_title: "Step 1: Client",
      step_2_title: "Step 2: Motorcycle",
      step_3_title: "Step 3: Dates",
      step_4_title: "Step 4: Pricing",
      step_5_title: "Step 5: Payment",
      step_6_title: "Step 6: Confirmation",
      select_existing_client: "Select Existing Client",
      or_create_new: "+ Create New Client",
      select_motorcycle: "Select Available Motorcycle",
      rental_period: "Rental Period",
      start_date: "Start Date",
      end_date: "End Date",
      rental_days: "Rental Days",
      price_per_day: "Daily Rate",
      total_price: "Total Price",
      deposit_amount: "Required Security Deposit",
      payment_method: "Payment Method",
      amount_paid: "Amount Paid / Deposit",
      confirm_booking: "CONFIRM RESERVATION",
      availability_warning: "Warning: Selected motorcycle is unavailable for these dates!",
    },

    // Clients Module
    clients_mod: {
      title: "Client Management",
      add_button: "+ New Client",
      search_placeholder: "Search by name, phone, passport...",
      total_clients: "Total Clients",
      active_rentals: "Active Rentals",
      total_spent: "Total Spent",
      phone: "Phone",
      whatsapp_action: "Send WhatsApp",
      call_action: "Call Client",
      email_action: "Send Email",
      new_res_for_client: "New Booking",
      passport_no: "Passport / ID No.",
      license_no: "Driver License No.",
      nationality: "Nationality",
    },

    // Fleet Module
    fleet_mod: {
      title: "Motorcycle Fleet",
      add_button: "+ New Motorcycle",
      total_bikes: "Total Motorcycles",
      avg_roi: "Fleet Avg ROI",
      purchase_price: "Purchase Price",
      reg_number: "License Plate",
      vin_number: "VIN Chassis Number",
      current_mileage: "Odometer",
      daily_rate: "Daily Rate",
      weekly_rate: "Weekly Rate",
      monthly_rate: "Monthly Rate",
      status_filter: "Filter by Status",
      tab_overview: "Overview",
      tab_reservations: "Reservations",
      tab_revenue: "Revenue & ROI",
      tab_maintenance: "Service History",
      tab_depreciation: "Depreciation",
      tab_photos: "Photos & Papers",
    },

    // Tours
    tours_mod: {
      title: "Adventure Tours & Raids",
      add_button: "+ New Tour Raid",
      duration: "Duration (Days)",
      participants: "Participants",
      guide: "Official Tour Guide",
      route: "Route & Itinerary",
      hotels: "Accommodations",
      quick_contacts: "Emergency & Participant Contacts",
    },

    // Maintenance
    maint_mod: {
      title: "Workshop & Fleet Service",
      add_button: "+ Record Service",
      service_type: "Service Type",
      mechanic: "Garage / Mechanic",
      cost: "Cost",
      next_service_km: "Next Oil Change (km)",
    },

    // Finance & Investments
    finance_mod: {
      title: "Accounting, Revenue & Expenses",
      revenues_tab: "Revenues",
      expenses_tab: "Expenses",
      add_revenue: "+ Record Revenue",
      add_expense: "+ Log Expense",
    },

    investments_mod: {
      title: "Investment Analysis & Depreciation",
      payback_period: "Payback Period (Months)",
    },

    // Settings
    settings_mod: {
      title: "Motonomad System Settings",
      currency: "Display Currency",
      language: "Interface Language",
      demo_reset: "Reset Demo Data",
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('motonomad_lang');
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('motonomad_lang', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: any = translations[language] || translations.fr;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to FR or key name
        let fallback: any = translations.fr;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            fallback = undefined;
            break;
          }
        }
        current = fallback || key;
        break;
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        result = result.replace(new RegExp(`{\\s*${pKey}\\s*}`, 'g'), String(pVal));
      });
    }

    return result;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrencyVal = (amount: number, currency: string = 'MAD'): string => {
    const val = isNaN(amount) ? 0 : amount;
    const formattedNum = val.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${formattedNum} ${currency}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatCurrencyVal }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
