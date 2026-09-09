import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Filter, Download, Mail, Phone, MapPin, 
  FileText, Shield, Calendar, DollarSign, Edit, Trash2, ExternalLink, MessageSquare, CreditCard, IdCard, RefreshCw
} from 'lucide-react';
import { Client, Reservation } from '../../types';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase'; // <-- Import de Supabase

interface ClientsModuleProps {
  // On garde les props pour la compatibilité avec le reste de l'app
  clients: Client[];
  reservations: Reservation[];
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
  initialOpenAddModal?: boolean;
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  reservations,
  currency,
  onUpdate,
  initialOpenAddModal = false,
}) => {
  const { t, formatCurrencyVal, language } = useLanguage();
  
  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveClients, setLiveClients] = useState<Client[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const fetchLiveClients = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapping des données Supabase vers l'interface Client React
      const mappedClients = (data || []).map((c: any) => {
        // Optionnel : Calculer dynamiquement les dépenses si on a les réservations
        const clientReservations = reservations.filter(r => r.clientId === c.id);
        const bookingsCount = clientReservations.length;
        const totalSpent = clientReservations.reduce((sum, r) => sum + r.totalPrice, 0);

        return {
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name,
          fullName: `${c.first_name} ${c.last_name}`,
          email: c.email,
          phone: c.phone,
          whatsapp: c.whatsapp || c.phone,
          nationality: c.nationality,
          country: c.country_of_residence,
          passportNumber: c.passport_number,
          passportExpiry: c.passport_expiry,
          licenseNumber: c.license_number,
          licenseCategory: c.license_category || 'A',
          licenseExpiry: c.license_expiry,
          emergencyContact: c.emergency_contact,
          notes: c.notes,
          createdAt: c.created_at,
          totalSpent: totalSpent,
          bookingsCount: bookingsCount,
          avgBookingValue: bookingsCount > 0 ? totalSpent / bookingsCount : 0,
          lifetimeValue: totalSpent,
          // Attributs requis par l'interface mais non vitaux
          dateOfBirth: '1990-01-01',
          address: '',
          createdBy: 'Admin',
        } as Client;
      });

      setLiveClients(mappedClients);
    } catch (error) {
      console.error("Erreur de synchronisation Supabase (Clients):", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchLiveClients();
  }, [reservations]); // Se met à jour si les réservations changent pour recalculer les dépenses

  // UI States
  const [search, setSearch] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAddModal);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    nationality: 'French',
    country: 'France',
    passportNumber: '',
    passportExpiry: '',
    licenseNumber: '',
    licenseCategory: 'A',
    licenseExpiry: '',
    emergencyContact: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsapp: '',
      nationality: 'French',
      country: 'France',
      passportNumber: '',
      passportExpiry: '',
      licenseNumber: '',
      licenseCategory: 'A',
      licenseExpiry: '',
      emergencyContact: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);

    try {
      // Préparation du Payload pour Supabase
      const payload = {
        first_name: formData.firstName || '',
        last_name: formData.lastName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        whatsapp: formData.whatsapp || null,
        nationality: formData.nationality || null,
        country_of_residence: formData.country || null,
        passport_number: formData.passportNumber || null,
        passport_expiry: formData.passportExpiry || null,
        license_number: formData.licenseNumber || null,
        license_category: formData.licenseCategory || 'A',
        license_expiry: formData.licenseExpiry || null,
        emergency_contact: formData.emergencyContact || null,
        notes: formData.notes || null,
      };

      if (isEditModalOpen && selectedClient) {
        // Mise à jour Cloud
        await supabase.from('clients').update(payload).eq('id', selectedClient.id);
      } else {
        // Insertion Cloud
        await supabase.from('clients').insert([payload]);
      }

      await fetchLiveClients(); // Rafraîchir la liste avec les nouvelles données
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedClient(null);
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      alert(language === 'fr' ? "Erreur lors de l'enregistrement." : "Error saving record.");
    } finally {
      setIsLoadingDb(false);
    }
  };

  const handleDelete = async () => {
    if (deleteClientId) {
      setIsLoadingDb(true);
      try {
        await supabase.from('clients').delete().eq('id', deleteClientId);
        await fetchLiveClients();
        setDeleteClientId(null);
        setSelectedClient(null);
        onUpdate();
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
      } finally {
        setIsLoadingDb(false);
      }
    }
  };

  // Filter clients on the live data
  const filteredClients = liveClients.filter((c) => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.passportNumber && c.passportNumber.toLowerCase().includes(search.toLowerCase())) ||
      (c.licenseNumber && c.licenseNumber.toLowerCase().includes(search.toLowerCase()));
    
    const matchesNat = nationalityFilter === 'ALL' || c.nationality === nationalityFilter;
    return matchesSearch && matchesNat;
  });

  const exportCSV = () => {
    const headers = 'ID,Name,Email,Phone,Nationality,Passport,License,TotalSpent\n';
    const rows = filteredClients.map(c => `"${c.id}","${c.fullName}","${c.email}","${c.phone}","${c.nationality}","${c.passportNumber}","${c.licenseNumber}",${c.totalSpent}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motonomad_clients_${Date.now()}.csv`;
    a.click();
  };

  const nationalities = Array.from(new Set(liveClients.map((c) => c.nationality).filter(Boolean)));

  if (isLoadingDb && liveClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Synchronisation des Clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#F4F4F2]">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-wide">
              <Users className="w-6 h-6 text-[#D4A017]" /> 
              {language === 'fr' ? 'Répertoire des Clients' : 'Client Directory'}
            </h2>
            {isLoadingDb && <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />}
          </div>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            {language === 'fr' 
              ? 'Gérez les profils, les pièces d’identité et l’historique des réservations.'
              : 'Manage rider profiles, identity documents, and booking histories.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1A1A1A] border border-[#333333] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D4A017]" /> {language === 'fr' ? 'Exporter CSV' : 'Export CSV'}
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] hover:scale-[1.02] transition-all shadow-lg shadow-[#D4A017]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> {language === 'fr' ? 'Nouveau Client' : 'New Client'}
          </button>
        </div>
      </div>

      {/* Filter Bar (Modern sleek design) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-sm">
        <div className="relative flex-1 w-full flex items-center px-3">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher par nom, email, téléphone, passeport...' : 'Search by name, email, phone, passport...'}
            className="w-full px-3 py-2 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-[1px] h-[1px] sm:h-8 bg-[#333333] shrink-0" />
        <div className="flex items-center gap-2 w-full sm:w-auto px-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value)}
            className="w-full sm:w-48 py-2 pr-4 bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer appearance-none"
          >
            <option value="ALL" className="bg-[#1C1C1C]">{language === 'fr' ? 'Toutes les nationalités' : 'All Nationalities'}</option>
            {nationalities.map((n) => (
              <option key={n} value={n} className="bg-[#1C1C1C]">{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients List / Cards */}
      {filteredClients.length === 0 ? (
        <EmptyState
          title={t('no_clients_found')}
          description={t('no_clients_desc')}
          actionLabel={language === 'fr' ? 'Ajouter un Client' : t('add_client')}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card Layout (Rich Information Data) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-4 rounded-2xl bg-[#181818] border border-[#2D2D2D] hover:border-[#D4A017]/40 transition-colors shadow-xl space-y-3 cursor-pointer"
              >
                {/* Header: Avatar, Name, Spend, ID */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] text-[#D4A017] font-bold border border-[#383838] shadow-sm">
                      {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{client.fullName}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono block">ID: {client.id.split('-')[0]}...</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-400 block">
                      {formatCurrencyVal(client.totalSpent || 0, currency)}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-zinc-400">
                      <Calendar className="w-3 h-3 text-[#D4A017]/70" />
                      <span className="text-[10px] font-bold">{client.bookingsCount} {language === 'fr' ? 'Résa' : 'Bookings'}</span>
                    </div>
                  </div>
                </div>

                {/* Info Grid: Contact & Identity */}
                <div className="grid grid-cols-1 gap-2 text-xs pt-2 border-t border-[#2A2A2A]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{client.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{client.phone || 'N/A'}</span>
                      <span className="text-zinc-600 mx-1">•</span>
                      <span className="truncate text-zinc-400">{client.nationality || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#222222] border border-[#333333] w-fit">
                      <IdCard className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] font-mono text-zinc-300">{client.passportNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-950/10 border border-amber-900/20 w-fit">
                      <CreditCard className="w-3 h-3 text-amber-500/70" />
                      <span className="text-[10px] font-mono text-amber-400">
                        {client.licenseCategory ? `[${client.licenseCategory}] ` : ''}{client.licenseNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Touch Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#2A2A2A]" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/40 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {(client.whatsapp || client.phone) && (
                      <a
                        href={`https://wa.me/${(client.whatsapp || client.phone).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setFormData(client);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-[#262626] text-zinc-300 hover:text-white border border-[#333333] transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteClientId(client.id)}
                      className="p-2 rounded-xl bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 border border-rose-900/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (Premium Clean Design) */}
          <div className="hidden md:block rounded-2xl border border-[#2D2D2D] bg-[#181818] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#121212] border-b border-[#2D2D2D] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">{language === 'fr' ? 'Client' : t('client')}</th>
                    <th className="px-6 py-4">{language === 'fr' ? 'Contact' : t('contact_details')}</th>
                    <th className="px-6 py-4">{language === 'fr' ? 'Nationalité' : t('nationality_country')}</th>
                    <th className="px-6 py-4">{language === 'fr' ? 'Identifiants' : t('passport_license')}</th>
                    <th className="px-6 py-4">{language === 'fr' ? 'Réservations' : t('bookings')}</th>
                    <th className="px-6 py-4">{language === 'fr' ? 'Dépenses' : t('total_spent')}</th>
                    <th className="px-6 py-4 text-right">{language === 'fr' ? 'Actions' : t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/50">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Avatar & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] text-[#D4A017] font-bold border border-[#383838] shadow-sm">
                            {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{client.fullName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {client.id.split('-')[0]}...</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-zinc-300 text-xs">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" /> 
                            <span className="truncate max-w-[150px]" title={client.email}>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300 text-xs">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" /> 
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Nationality */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-200 block">{client.nationality || '-'}</span>
                        <span className="text-zinc-500 text-xs">{client.country || '-'}</span>
                      </td>

                      {/* IDs (Pass & License) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#222222] border border-[#333333] w-fit">
                            <IdCard className="w-3 h-3 text-zinc-500" />
                            <span className="text-[10px] font-mono text-zinc-300">{client.passportNumber || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-950/10 border border-amber-900/20 w-fit">
                            <CreditCard className="w-3 h-3 text-amber-500/70" />
                            <span className="text-[10px] font-mono text-amber-400">
                              {client.licenseCategory ? `[${client.licenseCategory}] ` : ''}{client.licenseNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Bookings */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#D4A017]/70" />
                          <span className="font-bold text-white">{client.bookingsCount}</span>
                        </div>
                      </td>

                      {/* Spend */}
                      <td className="px-6 py-4 font-black text-emerald-400">
                        {formatCurrencyVal(client.totalSpent, currency)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setFormData(client);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                            title={language === 'fr' ? 'Modifier' : 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteClientId(client.id)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title={language === 'fr' ? 'Supprimer' : 'Delete'}
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
        </div>
      )}

      {/* View Client Profile Modal */}
      {selectedClient && !isEditModalOpen && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={`${language === 'fr' ? 'Profil du Pilote :' : 'Rider Profile:'} ${selectedClient.fullName}`}
          subtitle={`Client ID: ${selectedClient.id}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Total Dépensé' : 'Total Spent'}</span>
                <span className="text-lg font-black text-emerald-400">{formatCurrency(selectedClient.totalSpent, currency)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Total Réservations' : 'Total Bookings'}</span>
                <span className="text-lg font-black text-[#D4A017]">{selectedClient.bookingsCount} {language === 'fr' ? 'locations' : 'rentals'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Valeur Moy. Réservation' : 'Avg Booking Value'}</span>
                <span className="text-lg font-black text-[#F4F4F2]">{formatCurrency(selectedClient.avgBookingValue, currency)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333]">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{language === 'fr' ? 'Valeur à Vie (LTV)' : 'Lifetime Value (LTV)'}</span>
                <span className="text-lg font-black text-[#F4F4F2]">{formatCurrency(selectedClient.lifetimeValue, currency)}</span>
              </div>
            </div>

            {/* Client Personal & Legal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#222222] border border-[#333333] space-y-3 text-sm">
                <h4 className="font-bold text-sm text-[#D4A017] border-b border-[#333333] pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> {language === 'fr' ? 'Contact Personnel & Urgence' : 'Personal & Emergency Contact'}
                </h4>
                <div><span className="text-zinc-400 w-24 inline-block">Email:</span> <span className="font-semibold text-[#F4F4F2]">{selectedClient.email}</span></div>
                <div><span className="text-zinc-400 w-24 inline-block">{language === 'fr' ? 'Téléphone :' : 'Phone:'}</span> <span className="font-semibold text-[#F4F4F2]">{selectedClient.phone}</span></div>
                <div><span className="text-zinc-400 w-24 inline-block">WhatsApp:</span> <span className="font-semibold text-[#F4F4F2]">{selectedClient.whatsapp}</span></div>
                <div><span className="text-zinc-400 w-24 inline-block">{language === 'fr' ? 'Nationalité :' : 'Nationality:'}</span> <span className="font-semibold text-[#F4F4F2]">{selectedClient.nationality || '-'} ({selectedClient.country || '-'})</span></div>
                <div className="pt-2"><span className="text-zinc-400 block mb-1">{language === 'fr' ? 'Contact d’Urgence :' : 'Emergency Contact:'}</span> <span className="font-bold text-rose-400">{selectedClient.emergencyContact || (language === 'fr' ? 'Aucun renseigné' : 'None listed')}</span></div>
              </div>

              <div className="p-5 rounded-2xl bg-[#222222] border border-[#333333] space-y-3 text-sm">
                <h4 className="font-bold text-sm text-[#D4A017] border-b border-[#333333] pb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {language === 'fr' ? 'Identifiants Passeport & Permis' : 'Passport & License Credentials'}
                </h4>
                <div><span className="text-zinc-400 block mb-0.5">{language === 'fr' ? 'N° Passeport :' : 'Passport Number:'}</span> <span className="font-mono font-bold text-[#F4F4F2] bg-[#1A1A1A] px-2 py-1 rounded border border-[#333]">{selectedClient.passportNumber || '-'}</span></div>
                <div><span className="text-zinc-400 inline-block w-32">{language === 'fr' ? 'Expiration Pass. :' : 'Passport Expiry:'}</span> <span className="font-semibold text-emerald-400">{selectedClient.passportExpiry || '-'}</span></div>
                
                <div className="pt-2"><span className="text-zinc-400 block mb-0.5">{language === 'fr' ? 'N° Permis :' : 'License Number:'}</span> <span className="font-mono font-bold text-amber-400 bg-amber-950/20 px-2 py-1 rounded border border-amber-900/30">{selectedClient.licenseNumber || '-'} (Cat: {selectedClient.licenseCategory || 'A'})</span></div>
                <div><span className="text-zinc-400 inline-block w-32">{language === 'fr' ? 'Expiration Permis :' : 'License Expiry:'}</span> <span className="font-semibold text-emerald-400">{selectedClient.licenseExpiry || '-'}</span></div>
              </div>
            </div>

            {/* Notes */}
            {selectedClient.notes && (
              <div className="p-4 rounded-xl bg-[#222222] border border-[#333333] text-sm">
                <span className="font-bold text-[#D4A017] block mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> {language === 'fr' ? 'Notes du Pilote :' : 'Rider Notes:'}</span>
                <p className="text-zinc-300 leading-relaxed bg-[#1A1A1A] p-3 rounded-lg border border-[#2D2D2D]">{selectedClient.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add / Edit Client Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
          title={isEditModalOpen ? (language === 'fr' ? 'Modifier le Profil du Pilote' : 'Edit Rider Profile') : (language === 'fr' ? 'Ajouter un Nouveau Client' : 'Add New Client Profile')}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Prénom *' : 'First Name *'}</label>
                <input
                  type="text"
                  required
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Nom *' : 'Last Name *'}</label>
                <input
                  type="text"
                  required
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Téléphone *' : 'Phone Number *'}</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Nationalité' : 'Nationality'}</label>
                <input
                  type="text"
                  value={formData.nationality || ''}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Pays de Résidence' : 'Country of Residence'}</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#2D2D2D] pt-4 mt-2">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Numéro de Passeport' : 'Passport Number'}</label>
                <input
                  type="text"
                  value={formData.passportNumber || ''}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Expiration du Passeport' : 'Passport Expiry'}</label>
                <input
                  type="date"
                  value={formData.passportExpiry || ''}
                  onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Numéro de Permis' : 'License Number'}</label>
                <input
                  type="text"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none font-mono text-amber-500"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Catégorie' : 'Category'}</label>
                <input
                  type="text"
                  value={formData.licenseCategory || 'A'}
                  onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Expiration du Permis' : 'License Expiry'}</label>
                <input
                  type="date"
                  value={formData.licenseExpiry || ''}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
                />
              </div>
            </div>

            <div className="border-t border-[#2D2D2D] pt-4 mt-2">
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Détails du Contact d’Urgence' : 'Emergency Contact Details'}</label>
              <input
                type="text"
                placeholder={language === 'fr' ? 'Nom, relation et numéro de téléphone...' : 'Name, relationship and phone number...'}
                value={formData.emergencyContact || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Notes / Préférences' : 'Notes / Preferences'}</label>
              <textarea
                rows={2}
                placeholder={language === 'fr' ? 'Expérience de conduite, préférence de hauteur de moto, tailles d’équipement...' : 'Riding experience, bike height preference, equipment sizes...'}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F4F4F2] focus:border-[#D4A017] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl font-bold bg-[#1A1A1A] border border-[#333] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] hover:scale-[1.02] transition-all shadow-lg shadow-[#D4A017]/20 cursor-pointer"
              >
                {language === 'fr' ? 'Enregistrer le Profil' : 'Save Client Profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteClientId}
        onClose={() => setDeleteClientId(null)}
        onConfirm={handleDelete}
        title={language === 'fr' ? 'Supprimer le Profil du Client ?' : 'Delete Client Profile?'}
        message={language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet enregistrement client ? Cette action supprimera son profil et son historique.' : 'Are you sure you want to delete this client record? This action will remove their profile and history.'}
        isDestructive
      />
    </div>
  );
};

export default ClientsModule;