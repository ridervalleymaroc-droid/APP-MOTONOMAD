import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { EquipmentItem } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface EquipmentModuleProps {
  equipment: EquipmentItem[]; // Conservé pour la signature React
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const EquipmentModule: React.FC<EquipmentModuleProps> = ({
  currency,
  onUpdate,
}) => {
  const { language } = useLanguage();

  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveEquipment, setLiveEquipment] = useState<EquipmentItem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Formulaire d'ajout
  const [form, setForm] = useState({
    name: '',
    type: 'Helmet',
    brand: '',
    model: '',
    serialNumber: '',
    dailyPrice: 100,
    condition: 'Good',
    status: 'Available',
  });

  const fetchEquipmentData = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        nameFr: item.name,
        type: item.category || 'Helmet',
        brand: item.brand || '',
        model: item.model || '',
        serialNumber: item.serial_number || '',
        dailyPrice: Number(item.daily_rate) || 0,
        condition: item.condition || 'Good',
        status: item.status || 'Available',
      })) as unknown as EquipmentItem[];

      setLiveEquipment(mapped);
    } catch (error) {
      console.error("Erreur de synchronisation des équipements:", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, []);

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);
    try {
      const payload = {
        name: form.name,
        category: form.type,
        brand: form.brand,
        model: form.model,
        serial_number: form.serialNumber,
        daily_rate: Number(form.dailyPrice),
        condition: form.condition,
        status: form.status,
      };

      const { error } = await supabase.from('equipment').insert([payload]);
      if (error) throw error;

      await fetchEquipmentData();
      setIsAddOpen(false);
      // Reset form
      setForm({
        name: '',
        type: 'Helmet',
        brand: '',
        model: '',
        serialNumber: '',
        dailyPrice: 100,
        condition: 'Good',
        status: 'Available',
      });
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'équipement:", error);
      setIsLoadingDb(false);
    }
  };

  if (isLoadingDb && liveEquipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Chargement des équipements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#D4A017]" /> 
            {language === 'fr' ? 'Équipements & Casques' : 'Riding Gear & Bike Accessories'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr'
              ? 'Suivez les casques Arai, GPS Garmin, combinaisons Klim Gore-Tex, valises latérales et intercoms.'
              : 'Track Arai helmets, Garmin GPS units, Klim Gore-Tex suits, side cases, and intercoms.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 
          {language === 'fr' ? 'Ajouter un Équipement' : 'Add Equipment'}
        </button>
      </div>

      {/* Equipment Grid */}
      {liveEquipment.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-[#1C1C1C] rounded-2xl border border-[#2D2D2D]">
          {language === 'fr' ? 'Aucun équipement enregistré dans le cloud.' : 'No equipment registered in the cloud.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveEquipment.map((item) => {
            let typeLabel: string = item.type;
            if (language === 'fr') {
              if (typeLabel === 'Helmet') typeLabel = 'Casque';
              if (typeLabel === 'GPS') typeLabel = 'GPS';
              if (typeLabel === 'Riding Jacket') typeLabel = 'Veste de Moto';
              if (typeLabel === 'Side Cases') typeLabel = 'Valises Latérales';
              if (typeLabel === 'Intercom') typeLabel = 'Intercom';
            }

            let conditionLabel: string = item.condition;
            if (language === 'fr') {
              if (conditionLabel === 'New') conditionLabel = 'Neuf';
              if (conditionLabel === 'Good') conditionLabel = 'Bon État';
              if (conditionLabel === 'Fair') conditionLabel = 'Passable';
              if (conditionLabel === 'Damaged') conditionLabel = 'Endommagé';
            }

            return (
              <div key={item.id} className="p-5 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] space-y-3 shadow-xl hover:border-[#D4A017]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#D4A017]">{typeLabel}</span>
                  <Badge status={item.status} />
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#F4F4F2]">
                    {language === 'fr' ? (item as any).nameFr || item.name : item.name}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {language === 'fr' ? 'Marque :' : 'Brand:'} {item.brand} {item.model}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{language === 'fr' ? 'État :' : 'Condition:'}</span> 
                    <span className="font-bold text-emerald-400">{conditionLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{language === 'fr' ? 'Location Journalière :' : 'Daily Rental:'}</span> 
                    <span className="font-bold text-[#D4A017]">{formatCurrency(item.dailyPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{language === 'fr' ? 'Numéro de Série :' : 'Serial Number:'}</span> 
                    <span className="font-mono text-zinc-300">{item.serialNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Equipment Modal */}
      {isAddOpen && (
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={language === 'fr' ? 'Ajouter un Nouvel Équipement' : 'Add New Equipment'}>
          <form onSubmit={handleSaveEquipment} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Nom de l\'Équipement *' : 'Equipment Name *'}</label>
              <input
                type="text"
                required
                placeholder="Ex: Arai Tour-X4 Vision"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Catégorie *' : 'Category *'}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Helmet">{language === 'fr' ? 'Casque' : 'Helmet'}</option>
                  <option value="GPS">{language === 'fr' ? 'GPS' : 'GPS'}</option>
                  <option value="Riding Jacket">{language === 'fr' ? 'Veste de Moto' : 'Riding Jacket'}</option>
                  <option value="Side Cases">{language === 'fr' ? 'Valises Latérales' : 'Side Cases'}</option>
                  <option value="Intercom">{language === 'fr' ? 'Intercom' : 'Intercom'}</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#D4A017] block mb-1">{language === 'fr' ? 'Prix Journalier *' : 'Daily Rate *'} ({currency})</label>
                <input
                  type="number"
                  required
                  value={form.dailyPrice}
                  onChange={(e) => setForm({ ...form, dailyPrice: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#D4A017]/30 text-[#F4F4F2] font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Marque' : 'Brand'}</label>
                <input
                  type="text"
                  placeholder="Ex: Arai, Garmin, Klim"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Modèle' : 'Model'}</label>
                <input
                  type="text"
                  placeholder="Ex: Tour-X4"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Numéro de Série' : 'Serial Number'}</label>
                <input
                  type="text"
                  placeholder="Ex: AR-771289-L"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'État' : 'Condition'}</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="New">{language === 'fr' ? 'Neuf' : 'New'}</option>
                  <option value="Good">{language === 'fr' ? 'Bon État' : 'Good'}</option>
                  <option value="Fair">{language === 'fr' ? 'Passable' : 'Fair'}</option>
                  <option value="Damaged">{language === 'fr' ? 'Endommagé' : 'Damaged'}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D] mt-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button type="submit" disabled={isLoadingDb} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer">
                {isLoadingDb && <RefreshCw className="w-4 h-4 animate-spin" />}
                {language === 'fr' ? 'Enregistrer l\'Équipement' : 'Save Equipment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EquipmentModule;