import React, { useState, useEffect } from 'react';
import { Building2, Plus, Mail, Phone, DollarSign, RefreshCw, UserCheck, Percent } from 'lucide-react';
import { Agency } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface AgenciesModuleProps {
  agencies: Agency[]; // Conservé pour la signature React
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const AgenciesModule: React.FC<AgenciesModuleProps> = ({ currency, onUpdate }) => {
  const { language } = useLanguage();

  const [liveAgencies, setLiveAgencies] = useState<Agency[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Formulaire d'ajout
  const [form, setForm] = useState({
    agencyName: '',
    agencyNameFr: '',
    contactPerson: '',
    country: 'France',
    email: '',
    phone: '',
    commissionPercentage: 15,
  });

  const fetchAgenciesData = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((ag: any) => ({
        id: ag.id,
        agencyName: ag.name,
        agencyNameFr: ag.name,
        contactPerson: ag.contact_person || '',
        country: ag.country || 'Maroc',
        email: ag.email || '',
        phone: ag.phone || '',
        commissionPercentage: Number(ag.commission_rate) || 15,
        totalRevenue: Number(ag.total_generated) || 0,
        totalBookings: Number(ag.circuits_count) || 0,
      })) as unknown as Agency[];

      setLiveAgencies(mapped);
    } catch (error) {
      console.error("Erreur de synchronisation des agences:", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchAgenciesData();
  }, []);

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);
    try {
      const payload = {
        name: form.agencyName,
        contact_person: form.contactPerson,
        country: form.country,
        email: form.email,
        phone: form.phone,
        commission_rate: Number(form.commissionPercentage),
        total_generated: 0,
        circuits_count: 0,
      };

      const { error } = await supabase.from('agencies').insert([payload]);
      if (error) throw error;

      await fetchAgenciesData();
      setIsAddOpen(false);
      setForm({
        agencyName: '',
        agencyNameFr: '',
        contactPerson: '',
        country: 'France',
        email: '',
        phone: '',
        commissionPercentage: 15,
      });
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'agence:", error);
      setIsLoadingDb(false);
    }
  };

  if (isLoadingDb && liveAgencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Chargement des agences partenaires...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#D4A017]" /> 
            {language === 'fr' ? 'Agences Partenaires de Circuits & Réservations' : 'Tour & Booking Partner Agencies'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr'
              ? 'Gérez les contrats de référence des agences, les taux de commission (12-15%) et les paiements de réservations.'
              : 'Manage agency referral contracts, commission rates (12-15%), and booking payouts.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 
          {language === 'fr' ? 'Ajouter une Agence' : 'Add Agency'}
        </button>
      </div>

      {/* Grid */}
      {liveAgencies.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-[#1C1C1C] rounded-2xl border border-[#2D2D2D]">
          {language === 'fr' ? 'Aucune agence partenaire enregistrée dans le cloud.' : 'No partner agencies registered in the cloud.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveAgencies.map((ag) => (
            <div key={ag.id} className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4 hover:border-[#D4A017]/30 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#F4F4F2]">
                  {language === 'fr' ? (ag as any).agencyNameFr || ag.agencyName : ag.agencyName}
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-[#D4A017]/20 text-[#D4A017] font-bold text-xs border border-[#D4A017]/40 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> {ag.commissionPercentage}% {language === 'fr' ? 'Commission' : 'Commission'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#222222] border border-[#333333] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">{language === 'fr' ? 'Personne de contact :' : 'Contact Person:'}</span> 
                  <span className="font-semibold text-[#F4F4F2]">{ag.contactPerson} ({ag.country})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">{language === 'fr' ? 'E-mail :' : 'Email:'}</span> 
                  <span className="font-semibold text-[#F4F4F2] font-mono">{ag.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">{language === 'fr' ? 'Téléphone / WhatsApp :' : 'Phone / WhatsApp:'}</span> 
                  <span className="font-semibold text-[#F4F4F2] font-mono">{ag.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-[#252525] border border-[#333333]">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                    {language === 'fr' ? 'Total Généré' : 'Total Generated'}
                  </span>
                  <span className="font-black text-emerald-400 text-sm mt-0.5 block">{formatCurrency(ag.totalRevenue, currency)}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#252525] border border-[#333333]">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                    {language === 'fr' ? 'Nombre de Réservations' : 'Bookings Count'}
                  </span>
                  <span className="font-black text-[#D4A017] text-sm mt-0.5 block">
                    {ag.totalBookings} {language === 'fr' ? 'Circuits' : 'Tours'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout */}
      {isAddOpen && (
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={language === 'fr' ? 'Ajouter une Agence Partenaire' : 'Add Partner Agency'}>
          <form onSubmit={handleSaveAgency} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Nom de l\'Agence *' : 'Agency Name *'}</label>
              <input
                type="text"
                required
                placeholder="Ex: Vintage Rides Europe"
                value={form.agencyName}
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Personne de Contact *' : 'Contact Person *'}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Antoine Mercier"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-[#D4A017] block mb-1">{language === 'fr' ? 'Commission (%) *' : 'Commission (%) *'}</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={form.commissionPercentage}
                  onChange={(e) => setForm({ ...form, commissionPercentage: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#D4A017]/30 text-[#F4F4F2] font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Pays / Origine' : 'Country'}</label>
                <input
                  type="text"
                  placeholder="Ex: France"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: partners@vintagerides.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Téléphone / WhatsApp *' : 'Phone / WhatsApp *'}</label>
              <input
                type="text"
                required
                placeholder="Ex: +33 1 42 68 55 00"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D] mt-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button type="submit" disabled={isLoadingDb} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer">
                {isLoadingDb && <RefreshCw className="w-4 h-4 animate-spin" />}
                {language === 'fr' ? 'Enregistrer l\'Agence' : 'Save Agency'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AgenciesModule;