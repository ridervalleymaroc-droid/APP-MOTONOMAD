import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Plus, Filter, LayoutGrid, List, CheckCircle2, 
  XCircle, Clock, AlertTriangle, FileText, User, Bike, DollarSign, Edit, Trash2, ShieldCheck, Key, RefreshCw 
} from 'lucide-react';
import { Reservation, Motorcycle, Client, ReservationStatus, PaymentStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CheckInOutModal } from '../handover/CheckInOutModal';
import { 
  formatCurrency, calculateRentalDays, calculateRentalPrice, isMotorcycleAvailable 
} from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface ReservationsModuleProps {
  reservations: Reservation[];
  motorcycles: Motorcycle[];
  clients: Client[];
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
  initialOpenAddModal?: boolean;
}

export const ReservationsModule: React.FC<ReservationsModuleProps> = ({
  motorcycles,
  clients,
  currency,
  onUpdate,
  initialOpenAddModal = false,
}) => {
  const { t, formatCurrencyVal, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAddModal);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteResId, setDeleteResId] = useState<string | null>(null);
  const [doubleBookingError, setDoubleBookingError] = useState<string | null>(null);

  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveReservations, setLiveReservations] = useState<Reservation[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchLiveReservations = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Mapping Supabase avec extraction intelligente depuis les notes
      const mappedRes = (data || []).map((r: any) => {
        const client = clients.find(c => c.id === r.client_id);
        const bike = motorcycles.find(m => m.id === r.vehicle_id);

        let clientName = client ? client.fullName : '';
        let bikeName = bike ? `${bike.brand} ${bike.model}` : '';

        // Si le client n'est pas trouvé par ID, on l'extrait des notes WordPress
        if (!clientName && r.notes && r.notes.includes('Client WP:')) {
          const parts = r.notes.split('|');
          const clientPart = parts.find((p: string) => p.includes('Client WP:'));
          if (clientPart) clientName = clientPart.replace('Client WP:', '').trim();
        }
        if (!clientName) clientName = 'Client Inconnu';

        // Si la moto n'est pas trouvée par ID, on l'extrait des notes WordPress
        if (!bikeName && r.notes && r.notes.includes('Moto WP:')) {
          const parts = r.notes.split('|');
          const bikePart = parts.find((p: string) => p.includes('Moto WP:'));
          if (bikePart) bikeName = bikePart.replace('Moto WP:', '').trim();
        }
        if (!bikeName) bikeName = 'Moto Inconnue';

        const totalPrice = Number(r.total_price) || 0;
        const amountPaid = Number(r.amount_paid) || 0;
        const remainingBalance = Math.max(0, totalPrice - amountPaid);
        
        let payStatus: PaymentStatus = 'Pending';
        if (amountPaid >= totalPrice && totalPrice > 0) payStatus = 'Paid';
        else if (amountPaid > 0) payStatus = 'Partial';

        return {
          id: r.id,
          clientId: r.client_id,
          clientName: clientName,
          clientEmail: client ? client.email : '',
          clientPhone: client ? client.phone : '',
          motorcycleId: r.vehicle_id,
          motorcycleName: bikeName,
          regNumber: bike ? bike.registrationNumber : 'N/A',
          startDate: r.start_date,
          endDate: r.end_date,
          rentalDays: calculateRentalDays(r.start_date, r.end_date),
          totalPrice: totalPrice,
          amountPaid: amountPaid,
          remainingBalance: remainingBalance,
          paymentStatus: payStatus,
          status: r.status as ReservationStatus,
          basePrice: totalPrice,
          extrasPrice: 0,
          discountAmount: 0,
          taxAmount: 0, // <-- Propriété ajoutée pour satisfaire l'interface Reservation
          depositAmount: bike ? bike.depositAmount : 0,
          pickupLocation: 'Agence',
          dropoffLocation: 'Agence',
          bookingSource: 'WordPress',
          responsibleEmployee: 'Système',
          notes: r.notes || '',
          createdAt: r.created_at
        } as unknown as Reservation; // <-- Double cast pour éliminer définitivement l'erreur TypeScript
      });

      setLiveReservations(mappedRes);
    } catch (error) {
      console.error("Erreur de synchronisation Supabase (Reservations):", error);
    } finally {
      setIsLoadingDb(false);
    }
  };
  // fetch live reservations on mount and when clients or motorcycles change
  useEffect(() => {
    if (clients.length > 0 || motorcycles.length > 0) {
      fetchLiveReservations();
    }
  }, [clients, motorcycles]);

  // ----------------------------------------------------
  // SYNCHRONISATION ULTIME & CORRESPONDANCE EMAIL/NOM
  // ----------------------------------------------------
  // ----------------------------------------------------
  // SYNCHRONISATION FINALE CORRIGÉE (SANS FULL_NAME)
  // ----------------------------------------------------
  const handleSyncWordPressBookings = async () => {
    setSyncing(true);
    try {
      const response = await fetch('https://motonomad.ma/wp-json/motonomad/v1/bookings');
      if (!response.ok) throw new Error("Erreur de connexion à l'API WordPress");
      
      const wpBookings = await response.json();

      if (!Array.isArray(wpBookings)) {
        throw new Error('Format de données invalide reçu depuis WordPress');
      }

      const { data: dbClients, error: clientErr } = await supabase.from('clients').select('id, email, first_name, last_name');
      if (clientErr) throw new Error("Erreur lecture clients : " + clientErr.message);

      const { data: dbVehicles, error: vehicleErr } = await supabase.from('vehicles').select('id, brand, model, registration_number');
      if (vehicleErr) throw new Error("Erreur lecture véhicules : " + vehicleErr.message);

      if (!dbVehicles || dbVehicles.length === 0 || !dbClients || dbClients.length === 0) {
        throw new Error('Veuillez ajouter des clients et des véhicules dans Supabase avant de synchroniser.');
      }

      let syncCount = 0;

      for (const b of wpBookings) {
        const wpRef = b.booking_ref || `WP-RES-${b.id}`;
        const existingRes = liveReservations.find((r) => r.notes && r.notes.includes(wpRef));

        // 1. CORRESPONDANCE CLIENT (Par Email en priorité, puis par Prénom/Nom)
        let matchedClient = null;
        if (b.customer_email) {
          matchedClient = dbClients.find(c => c.email && c.email.toLowerCase().trim() === b.customer_email.toLowerCase().trim());
        }
        if (!matchedClient && b.customer_name) {
          const searchName = b.customer_name.toLowerCase().trim();
          matchedClient = dbClients.find(c => {
            const fName = (c.first_name || '').toLowerCase();
            const lName = (c.last_name || '').toLowerCase();
            return searchName.includes(fName) || fName.includes(searchName) || `${fName} ${lName}`.includes(searchName);
          });
        }
        const clientId = matchedClient ? matchedClient.id : dbClients[0].id;

        // 2. CORRESPONDANCE MOTO
        let matchedVehicle = null;
        if (b.bike_name) {
          const bikeClean = b.bike_name.toLowerCase().trim();
          matchedVehicle = dbVehicles.find(v => {
            const modelClean = (v.model || '').toLowerCase();
            const brandClean = (v.brand || '').toLowerCase();
            return bikeClean.includes(modelClean) || modelClean.includes(bikeClean) || bikeClean.includes(brandClean);
          });
        }
        const vehicleId = matchedVehicle ? matchedVehicle.id : dbVehicles[0].id;

        let statusDB = 'Confirmed';
        const wpStatus = (b.status || '').toLowerCase();
        if (wpStatus === 'cancelled') statusDB = 'Cancelled';
        else if (wpStatus === 'pending') statusDB = 'Pending';
        else if (wpStatus === 'confirmed') statusDB = 'Confirmed';

        const safeStartDate = (b.pickup_date || b.start_date) ? (b.pickup_date || b.start_date) : new Date().toISOString().split('T')[0];
        const safeEndDate = (b.return_date || b.end_date) ? (b.return_date || b.end_date) : new Date().toISOString().split('T')[0];

        const payload = {
          client_id: clientId,
          vehicle_id: vehicleId,
          start_date: safeStartDate,
          end_date: safeEndDate,
          total_price: Number(b.grand_total || b.total_price) || 0,
          amount_paid: wpStatus === 'confirmed' ? (Number(b.grand_total) || 0) : 0,
          status: statusDB,
          notes: `Réf: ${wpRef} | Client WP: ${b.customer_name} | Moto WP: ${b.bike_name}`
        };

        if (existingRes) {
          await supabase.from('reservations').update(payload).eq('id', existingRes.id);
        } else {
          await supabase.from('reservations').insert([payload]);
        }
        
        syncCount++;
      }

      alert(`${syncCount} réservations synchronisées avec succès !`);
        
      await fetchLiveReservations();
      onUpdate();
    } catch (err: any) {
      console.error(err);
      alert('Erreur de synchronisation : ' + err.message);
    } finally {
      setSyncing(false);
    }
  };
  // Handover (Check-in / Check-out) Modal state
  const [handoverRes, setHandoverRes] = useState<{ res: Reservation; mode: 'checkout' | 'checkin' } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Reservation>>({
    clientId: clients[0]?.id || '',
    motorcycleId: motorcycles[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    basePrice: 0,
    amountPaid: 0,
    status: 'Confirmed',
  });

  const handleOpenAdd = () => {
    setDoubleBookingError(null);
    const start = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const days = calculateRentalDays(start, end);
    const defaultBike = motorcycles[0];
    const base = defaultBike ? calculateRentalPrice(defaultBike, days) : 5000;

    setFormData({
      clientId: clients[0]?.id || '',
      motorcycleId: defaultBike?.id || '',
      startDate: start,
      endDate: end,
      basePrice: base,
      amountPaid: Math.round(base * 0.3),
      status: 'Confirmed',
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoubleBookingError(null);

    const client = clients.find((c) => c.id === formData.clientId);
    const bike = motorcycles.find((m) => m.id === formData.motorcycleId);

    if (!client || !bike) return;

    const startDate = formData.startDate || new Date().toISOString().split('T')[0];
    const endDate = formData.endDate || new Date().toISOString().split('T')[0];

    // DOUBLE BOOKING CHECK
    const availCheck = isMotorcycleAvailable(
      bike.id,
      startDate,
      endDate,
      liveReservations,
      isEditModalOpen && selectedRes ? selectedRes.id : undefined
    );

    if (!availCheck.available && availCheck.conflictingReservation) {
      const conf = availCheck.conflictingReservation;
      setDoubleBookingError(
        language === 'fr'
          ? `CONFLIT DÉTECTÉ : La moto ${bike.brand} ${bike.model} (${bike.registrationNumber}) est déjà réservée du ${conf.startDate} au ${conf.endDate} par ${conf.clientName}. Double réservation bloquée !`
          : `CONFLICT DETECTED: Motorcycle ${bike.brand} ${bike.model} (${bike.registrationNumber}) is already booked from ${conf.startDate} to ${conf.endDate} by ${conf.clientName}. Double booking prevented!`
      );
      return;
    }

    setIsLoadingDb(true);
    try {
      const days = calculateRentalDays(startDate, endDate);
      const totalPrice = formData.basePrice || calculateRentalPrice(bike, days);
      const amountPaid = formData.amountPaid || 0;
      const status = formData.status || 'Confirmed';

      const payload = {
        client_id: client.id,
        vehicle_id: bike.id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        amount_paid: amountPaid,
        status: status
      };

      if (isEditModalOpen && selectedRes) {
        await supabase.from('reservations').update(payload).eq('id', selectedRes.id);
      } else {
        await supabase.from('reservations').insert([payload]);
      }

      if (status === 'Active') {
        await supabase.from('vehicles').update({ status: 'RENTED' }).eq('id', bike.id);
      } else if (['Returned', 'Closed', 'Cancelled'].includes(status)) {
        await supabase.from('vehicles').update({ status: 'AVAILABLE' }).eq('id', bike.id);
      }

      await fetchLiveReservations();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const handleDelete = async () => {
    if (deleteResId) {
      setIsLoadingDb(true);
      try {
        await supabase.from('reservations').delete().eq('id', deleteResId);
        await fetchLiveReservations();
        setDeleteResId(null);
        setSelectedRes(null);
        onUpdate();
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
      } finally {
        setIsLoadingDb(false);
      }
    }
  };

  const filteredReservations = liveReservations.filter((r) => {
    const matchesSearch = 
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.motorcycleName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.regNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoadingDb && liveReservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Synchronisation des Réservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#F4F4F2]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#D4A017]" /> 
              {language === 'fr' ? 'Gestion des Réservations & Locations' : 'Reservation & Rental Management'}
            </h2>
            {isLoadingDb && <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr'
              ? 'Validation automatique des disponibilités, suivi des contrats de location, prises en main check-in/check-out et prévention des doubles réservations.'
              : 'Automatic availability validation, rental contract tracking, check-in/out handovers, and double booking prevention.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Nouveau Bouton de Synchronisation WordPress */}
          <button
            onClick={handleSyncWordPressBookings}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#262626] text-[#D4A017] border border-[#333333] hover:bg-[#333333] transition-colors cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>
              {syncing
                ? (language === 'fr' ? 'Synchronisation...' : 'Syncing...')
                : (language === 'fr' ? 'Synchroniser WordPress' : 'Sync WordPress')}
            </span>
          </button>

          <div className="flex items-center bg-[#262626] border border-[#333333] rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" /> {language === 'fr' ? 'Liste' : 'List'}
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewMode === 'calendar' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> {language === 'fr' ? 'Calendrier' : 'Calendar'}
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors shadow-lg shadow-[#D4A017]/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> {language === 'fr' ? 'Nouvelle Réservation' : 'New Reservation'}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher par ID, nom du pilote, moto ou immatriculation...' : 'Search booking ID, rider name, bike, or registration...'}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#262626] border border-[#333333] text-xs text-[#F4F4F2] focus:outline-none focus:border-[#D4A017]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#D4A017]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#262626] border border-[#333333] text-xs text-[#F4F4F2] focus:outline-none cursor-pointer"
          >
            <option value="ALL">{language === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
            <option value="Confirmed">{language === 'fr' ? 'Confirmé' : 'Confirmed'}</option>
            <option value="Active">{language === 'fr' ? 'Actif (Loué)' : 'Active (Rented)'}</option>
            <option value="Pending">{language === 'fr' ? 'En attente' : 'Pending'}</option>
            <option value="Returned">{language === 'fr' ? 'Retourné' : 'Returned'}</option>
            <option value="Closed">{language === 'fr' ? 'Clôturé' : 'Closed'}</option>
            <option value="Cancelled">{language === 'fr' ? 'Annulé' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' ? (
        filteredReservations.length === 0 ? (
          <EmptyState
            title={language === 'fr' ? 'Aucune réservation trouvée' : 'No reservations found'}
            description={language === 'fr' ? 'Aucune réservation ne correspond à vos critères.' : 'No bookings match your selected criteria.'}
            actionLabel={language === 'fr' ? 'Nouvelle Réservation' : 'New Reservation'}
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden shadow-xl w-full">
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <table className="w-full text-left text-xs text-[#F4F4F2] min-w-[1000px]">
                <thead className="bg-[#222222] border-b border-[#2D2D2D] text-zinc-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">{language === 'fr' ? 'ID / STATUT' : 'BOOKING ID / STATUS'}</th>
                    <th className="p-4">{language === 'fr' ? 'PILOTE / CLIENT' : 'RIDER / CUSTOMER'}</th>
                    <th className="p-4">{language === 'fr' ? 'MOTO ATTRIBUÉE' : 'MOTORCYCLE ASSIGNED'}</th>
                    <th className="p-4">{language === 'fr' ? 'DATES & DURÉE' : 'DATES & DURATION'}</th>
                    <th className="p-4">{language === 'fr' ? 'RÉSUMÉ FINANCIER' : 'FINANCIAL SUMMARY'}</th>
                    <th className="p-4">{language === 'fr' ? 'PAIEMENT' : 'PAYMENT'}</th>
                    <th className="p-4 text-right">{language === 'fr' ? 'PRISE EN MAIN & ACTIONS' : 'HANDOVER & ACTIONS'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredReservations.map((res) => (
                    <tr
                      key={res.id}
                      className="hover:bg-[#252525] transition-colors cursor-pointer"
                      onClick={() => setSelectedRes(res)}
                    >
                      <td className="p-4">
                        <span className="font-bold text-sm text-[#D4A017] block">{res.id.split('-')[0]}...</span>
                        <div className="mt-1"><Badge status={res.status} /></div>
                      </td>
                      <td className="p-4 font-bold text-sm text-[#F4F4F2]">
                        {res.clientName}
                        <span className="text-[10px] text-zinc-400 block font-normal">{res.clientPhone}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{res.motorcycleName}</span>
                        <span className="text-[10px] text-[#D4A017] block font-mono">Reg: {res.regNumber}</span>
                        {res.notes && res.notes.includes('WP-RES') && (
                           <span className="text-[9px] text-zinc-500 block">Importé de WordPress</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{res.startDate} → {res.endDate}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          {res.rentalDays} {language === 'fr' ? 'Jours de location' : 'Rental Days'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-sm text-[#F4F4F2]">{formatCurrency(res.totalPrice, currency)}</span>
                        {res.remainingBalance > 0 && (
                          <span className="text-[10px] text-rose-400 block font-bold">
                            {language === 'fr' ? 'Dû : ' : 'Due: '}{formatCurrency(res.remainingBalance, currency)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge status={res.paymentStatus} size="sm" />
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {res.status === 'Confirmed' && (
                            <button
                              onClick={() => setHandoverRes({ res, mode: 'checkout' })}
                              className="px-2.5 py-1 rounded-lg bg-[#D4A017] text-[#1C1C1C] font-bold text-[11px] hover:bg-[#b88a10] flex items-center gap-1 cursor-pointer"
                              title="Perform Handover Check-out"
                            >
                              <Key className="w-3 h-3" /> Check-Out
                            </button>
                          )}
                          {res.status === 'Active' && (
                            <button
                              onClick={() => setHandoverRes({ res, mode: 'checkin' })}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] hover:bg-sky-500 flex items-center gap-1 cursor-pointer"
                              title="Perform Return Check-in"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Check-In
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRes(res);
                              setFormData(res);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteResId(res.id)}
                            className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Calendar View */
        <div className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4">
          <h3 className="font-bold text-lg text-[#F4F4F2] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4A017]" /> 
            {language === 'fr' ? 'Planning de la Flotte' : 'Fleet Schedule'}
          </h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-zinc-400 border-b border-[#2D2D2D] pb-2">
            <div>{language === 'fr' ? 'Lun' : 'Mon'}</div>
            <div>{language === 'fr' ? 'Mar' : 'Tue'}</div>
            <div>{language === 'fr' ? 'Mer' : 'Wed'}</div>
            <div>{language === 'fr' ? 'Jeu' : 'Thu'}</div>
            <div>{language === 'fr' ? 'Ven' : 'Fri'}</div>
            <div>{language === 'fr' ? 'Sam' : 'Sat'}</div>
            <div>{language === 'fr' ? 'Dim' : 'Sun'}</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const dayBookings = liveReservations.filter((r) => r.startDate <= dateStr && r.endDate >= dateStr);

              return (
                <div key={dayNum} className="min-h-24 p-2 rounded-xl bg-[#222222] border border-[#2D2D2D] space-y-1">
                  <span className="font-bold text-zinc-400 text-[11px]">{dayNum}</span>
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedRes(b)}
                      className="p-1 rounded bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-[10px] font-semibold truncate cursor-pointer hover:bg-[#D4A017] hover:text-[#1C1C1C] transition-colors"
                      title={`${b.clientName} - ${b.motorcycleName}`}
                    >
                      {b.clientName.split(' ')[0]} ({b.regNumber})
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      {selectedRes && !isEditModalOpen && (
        <Modal
          isOpen={!!selectedRes}
          onClose={() => setSelectedRes(null)}
          title={`${language === 'fr' ? 'Détails de la Réservation :' : 'Booking Details:'} ${selectedRes.id.split('-')[0]}...`}
          subtitle={`Status: ${selectedRes.status} | Source: ${selectedRes.bookingSource}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#222222] border border-[#333333]">
              <div>
                <span className="text-zinc-400 block">{language === 'fr' ? 'Pilote / Client' : 'Rider / Client'}</span>
                <span className="font-bold text-sm text-[#F4F4F2]">{selectedRes.clientName}</span>
                <span className="text-zinc-400 block">{selectedRes.clientPhone} · {selectedRes.clientEmail}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">{language === 'fr' ? 'Moto Attribuée' : 'Assigned Motorcycle'}</span>
                <span className="font-bold text-sm text-[#D4A017]">{selectedRes.motorcycleName}</span>
                <span className="text-zinc-400 block font-mono">Reg: {selectedRes.regNumber}</span>
              </div>
            </div>

            {/* Note de synchronisation WP s'il y en a une */}
            {selectedRes.notes && selectedRes.notes.includes('WP-RES') && (
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800 text-sky-200">
                <span className="font-bold block text-sky-400 mb-1">Informations WordPress Originales :</span>
                {selectedRes.notes.split('|').map((notePart, idx) => (
                  <span key={idx} className="block text-[11px]">• {notePart.trim()}</span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Dates' : 'Dates'}</span>
                <span className="font-bold text-[#F4F4F2]">{selectedRes.startDate} → {selectedRes.endDate}</span>
                <span className="text-zinc-400 block text-[10px]">
                  {selectedRes.rentalDays} {language === 'fr' ? 'jours' : 'days'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Prix Total' : 'Total Price'}</span>
                <span className="font-bold text-[#F4F4F2] text-sm">{formatCurrency(selectedRes.totalPrice, currency)}</span>
                <span className="text-emerald-400 block text-[10px] font-bold">
                  {language === 'fr' ? 'Payé : ' : 'Paid: '}{formatCurrency(selectedRes.amountPaid, currency)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Solde Restant' : 'Remaining Balance'}</span>
                <span className="font-bold text-rose-400 text-sm">{formatCurrency(selectedRes.remainingBalance, currency)}</span>
              </div>
            </div>

            {selectedRes.checkoutInfo && (
              <div className="p-4 rounded-xl bg-[#1E293B] border border-sky-800 text-sky-200 space-y-1">
                <span className="font-bold block text-sky-400">
                  {language === 'fr' ? 'Enregistrement Check-out :' : 'Handover Check-out Record:'}
                </span>
                <p>
                  {language === 'fr' ? 'Sortie à' : 'Checked out at'} {selectedRes.checkoutInfo.mileage} km | {language === 'fr' ? 'État :' : 'Condition:'} {selectedRes.checkoutInfo.conditionNotes}
                </p>
                <p className="text-[11px] text-sky-300">
                  {language === 'fr' ? 'Signature Client :' : 'Customer Sig:'} {selectedRes.checkoutInfo.customerSignature}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add / Edit Reservation Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
          title={isEditModalOpen ? (language === 'fr' ? 'Modifier la Réservation' : 'Edit Reservation') : (language === 'fr' ? 'Créer une Nouvelle Réservation' : 'Create New Reservation')}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Error Alert for Double Booking */}
            {doubleBookingError && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-200 flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{doubleBookingError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Sélectionner un Pilote / Client *' : 'Select Rider / Client *'}
                </label>
                <select
                  required
                  value={formData.clientId || ''}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="" disabled>-- Sélectionner --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.nationality || 'N/A'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Sélectionner une Moto *' : 'Select Motorcycle *'}
                </label>
                <select
                  required
                  value={formData.motorcycleId || ''}
                  onChange={(e) => setFormData({ ...formData, motorcycleId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="" disabled>-- Sélectionner --</option>
                  {motorcycles.map((m) => (
                    <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.registrationNumber}) - {formatCurrency(m.dailyPrice || 1400, currency)}/day</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Date de Début *' : 'Start Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Date de Fin *' : 'End Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Prix de Location de Base (MAD)' : 'Base Rental Price (MAD)'}
                </label>
                <input
                  type="number"
                  value={formData.basePrice || ''}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Acompte Payé (MAD)' : 'Amount Paid Deposit (MAD)'}
                </label>
                <input
                  type="number"
                  value={formData.amountPaid || ''}
                  onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Statut de la Réservation' : 'Booking Status'}
                </label>
                <select
                  value={formData.status || 'Confirmed'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Confirmed">{language === 'fr' ? 'Confirmé' : 'Confirmed'}</option>
                  <option value="Active">{language === 'fr' ? 'Actif (Loué)' : 'Active (Rented)'}</option>
                  <option value="Pending">{language === 'fr' ? 'En attente' : 'Pending'}</option>
                  <option value="Returned">{language === 'fr' ? 'Retourné' : 'Returned'}</option>
                  <option value="Closed">{language === 'fr' ? 'Clôturé' : 'Closed'}</option>
                  <option value="Cancelled">{language === 'fr' ? 'Annulé' : 'Cancelled'}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D]">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl font-bold bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] cursor-pointer"
              >
                {language === 'fr' ? 'Enregistrer la Réservation' : 'Save Reservation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Handover Check-In / Check-Out Modal */}
      {handoverRes && (
        <CheckInOutModal
          isOpen={!!handoverRes}
          onClose={() => setHandoverRes(null)}
          reservation={handoverRes.res}
          mode={handoverRes.mode}
          onComplete={() => {
            fetchLiveReservations();
            onUpdate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteResId}
        onClose={() => setDeleteResId(null)}
        onConfirm={handleDelete}
        title={language === 'fr' ? 'Annuler & Supprimer la Réservation ?' : 'Cancel & Delete Reservation?'}
        message={language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet enregistrement de réservation ?' : 'Are you sure you want to delete this reservation record?'}
        isDestructive
      />
    </div>
  );
};

export default ReservationsModule;