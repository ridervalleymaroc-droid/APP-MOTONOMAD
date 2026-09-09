import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Filter, AlertTriangle, CheckCircle, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { MaintenanceRecord, Motorcycle } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface MaintenanceModuleProps {
  maintenance: MaintenanceRecord[];
  motorcycles: Motorcycle[];
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const MaintenanceModule: React.FC<MaintenanceModuleProps> = ({
  motorcycles,
  currency,
  onUpdate,
}) => {
  const { t, formatCurrencyVal, language } = useLanguage();
  
  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveMaintenance, setLiveMaintenance] = useState<MaintenanceRecord[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const fetchLiveMaintenance = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapping Supabase vers l'interface React MaintenanceRecord
      const mappedMaintenance = (data || []).map((m: any) => {
        const bike = motorcycles.find(b => b.id === m.vehicle_id);
        
        // Sécurisation du statut pour TypeScript ("In Progress", "Completed", "Scheduled")
        let dbStatus = m.status || 'Completed';
        if (dbStatus === 'Terminé') dbStatus = 'Completed';
        if (dbStatus === 'En cours') dbStatus = 'In Progress';

        return {
          id: m.id,
          motorcycleId: m.vehicle_id,
          motorcycleName: bike ? `${bike.brand} ${bike.model}` : 'Moto Inconnue/Supprimée',
          regNumber: bike ? bike.registrationNumber : 'N/A',
          serviceDate: m.date || new Date().toISOString().split('T')[0],
          mileage: Number(m.mileage) || 0,
          serviceType: m.service_type || 'Service',
          description: m.description || '',
          partsCost: Number(m.cost) || 0,
          laborCost: 0,
          totalCost: Number(m.cost) || 0,
          workshopSupplier: m.workshop_name || 'Atelier',
          nextServiceDate: '',
          nextServiceMileage: (Number(m.mileage) || 0) + 5000,
          status: dbStatus as 'Scheduled' | 'In Progress' | 'Completed',
          createdAt: m.created_at || new Date().toISOString(),
        } as MaintenanceRecord;
      });

      setLiveMaintenance(mappedMaintenance);
    } catch (error) {
      console.error("Erreur de synchronisation Supabase (Maintenance):", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    if (motorcycles.length > 0) {
      fetchLiveMaintenance();
    }
  }, [motorcycles]);

  // UI States
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [form, setForm] = useState<Partial<MaintenanceRecord>>({
    motorcycleId: motorcycles[0]?.id || '',
    serviceDate: new Date().toISOString().split('T')[0],
    mileage: 0,
    serviceType: 'Oil Service',
    description: '',
    partsCost: 1000,
    workshopSupplier: 'Atelier Officiel',
    status: 'In Progress', // Utilisation de la valeur TS stricte
  });

  const handleOpenAdd = () => {
    const defaultBike = motorcycles[0];
    setForm({
      motorcycleId: defaultBike?.id || '',
      serviceDate: new Date().toISOString().split('T')[0],
      mileage: defaultBike?.currentMileage || 0,
      serviceType: 'Oil Service',
      description: '',
      partsCost: 1000,
      workshopSupplier: 'Atelier Officiel',
      status: 'In Progress', // Utilisation de la valeur TS stricte
    });
    setIsOpenAdd(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const bike = motorcycles.find((m) => m.id === form.motorcycleId);
    if (!bike) return;

    setIsLoadingDb(true);
    try {
      const cost = Number(form.partsCost) || 0;

      // 1. Sauvegarder la facture/maintenance dans Supabase
      const payload = {
        vehicle_id: bike.id,
        service_type: form.serviceType || 'Oil Service',
        cost: cost,
        date: form.serviceDate || new Date().toISOString().split('T')[0],
        mileage: Number(form.mileage) || bike.currentMileage || 0,
        description: form.description || '',
        workshop_name: form.workshopSupplier || 'Atelier Interne',
        status: form.status || 'In Progress'
      };

      const { error } = await supabase.from('maintenance_records').insert([payload]);
      if (error) throw error;

      // 2. Mettre à jour automatiquement le statut de la moto dans la Flotte
      if (form.status === 'In Progress') {
        await supabase.from('vehicles').update({ status: 'MAINTENANCE' }).eq('id', bike.id);
      } else if (form.status === 'Completed') {
        await supabase.from('vehicles').update({ status: 'AVAILABLE' }).eq('id', bike.id);
      }

      await fetchLiveMaintenance();
      setIsOpenAdd(false);
      onUpdate(); // Rafraîchit les autres composants pour recalculer les coûts
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la maintenance :", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  if (isLoadingDb && liveMaintenance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Synchronisation de l'Atelier...</p>
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
              <Wrench className="w-6 h-6 text-[#D4A017]" /> 
              {language === 'fr' ? 'Maintenance de l’Atelier & Réparations' : 'Workshop Maintenance & Repairs'}
            </h2>
            {isLoadingDb && <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr'
              ? 'Planning des services, vidanges, usure des pneus, réparations suite à accidents et factures fournisseurs.'
              : 'Service schedules, oil changes, tire wear, accident repairs, and supplier invoices.'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] cursor-pointer transition-colors shadow-lg shadow-[#D4A017]/10"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 
          {language === 'fr' ? 'Enregistrer une Maintenance' : 'Log Maintenance'}
        </button>
      </div>

      {/* Maintenance Table */}
      <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden shadow-xl">
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left text-xs text-[#F4F4F2] min-w-[900px]">
            <thead className="bg-[#222222] border-b border-[#2D2D2D] text-zinc-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">{language === 'fr' ? 'MOTO' : 'MOTORCYCLE'}</th>
                <th className="p-4">{language === 'fr' ? 'TYPE DE SERVICE' : 'SERVICE TYPE'}</th>
                <th className="p-4">{language === 'fr' ? 'DATE / KILOMÉTRAGE' : 'DATE / ODOMETER'}</th>
                <th className="p-4">{language === 'fr' ? 'ATELIER & DÉTAILS' : 'WORKSHOP & DETAILS'}</th>
                <th className="p-4">{language === 'fr' ? 'COÛT TOTAL' : 'TOTAL COST'}</th>
                <th className="p-4">{language === 'fr' ? 'STATUT' : 'STATUS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {liveMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    {language === 'fr' ? 'Aucun historique de maintenance.' : 'No maintenance records found.'}
                  </td>
                </tr>
              ) : (
                liveMaintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-[#252525] transition-colors">
                    <td className="p-4 font-bold text-sm text-[#F4F4F2]">
                      {m.motorcycleName}
                      <span className="text-[10px] text-zinc-500 block font-mono font-normal mt-0.5">Reg: {m.regNumber}</span>
                    </td>
                    <td className="p-4 font-bold text-[#D4A017]">{m.serviceType}</td>
                    <td className="p-4">
                      <span className="font-mono block">{m.serviceDate}</span>
                      <span className="text-[10px] text-zinc-400">{m.mileage.toLocaleString()} km</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold block max-w-xs truncate" title={m.description}>{m.description || '-'}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {language === 'fr' ? 'Atelier : ' : 'Workshop: '}{m.workshopSupplier}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-rose-400">{formatCurrency(m.totalCost, currency)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {m.status === 'Completed' ? (language === 'fr' ? 'Terminé' : 'Completed') : (language === 'fr' ? 'En cours' : 'In Progress')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isOpenAdd && (
        <Modal 
          isOpen={isOpenAdd} 
          onClose={() => setIsOpenAdd(false)} 
          title={language === 'fr' ? 'Enregistrer un Service d’Atelier' : 'Log Workshop Service Record'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">
                {language === 'fr' ? 'Sélectionner une Moto *' : 'Select Motorcycle *'}
              </label>
              <select
                required
                value={form.motorcycleId}
                onChange={(e) => {
                  const bike = motorcycles.find(m => m.id === e.target.value);
                  setForm({ ...form, motorcycleId: e.target.value, mileage: bike?.currentMileage || 0 });
                }}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
              >
                {motorcycles.map((bike) => (
                  <option key={bike.id} value={bike.id}>{bike.brand} {bike.model} ({bike.registrationNumber})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Type de Service *' : 'Service Type *'}
                </label>
                <select
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Oil Service">{language === 'fr' ? 'Vidange / Huile' : 'Oil Service'}</option>
                  <option value="Tires">{language === 'fr' ? 'Remplacement Pneus' : 'Tires Replacement'}</option>
                  <option value="Brakes">{language === 'fr' ? 'Freins & Disques' : 'Brakes & Discs'}</option>
                  <option value="Chain">{language === 'fr' ? 'Chaîne & Pignons' : 'Chain & Sprockets'}</option>
                  <option value="Major Service">{language === 'fr' ? 'Révision Majeure' : 'Major Service'}</option>
                  <option value="Repair">{language === 'fr' ? 'Accident / Réparation' : 'Accident / Repair'}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Coût Total (MAD) *' : 'Total Cost (MAD) *'}
                </label>
                <input
                  type="number"
                  required
                  value={form.partsCost || ''}
                  onChange={(e) => setForm({ ...form, partsCost: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Date *' : 'Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={form.serviceDate || ''}
                  onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Kilométrage Actuel *' : 'Current Mileage *'}
                </label>
                <input
                  type="number"
                  required
                  value={form.mileage || ''}
                  onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {language === 'fr' ? 'Statut *' : 'Status *'}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="In Progress">{language === 'fr' ? 'En cours (Bloque la moto)' : 'In Progress (Blocks bike)'}</option>
                  <option value="Completed">{language === 'fr' ? 'Terminé (Moto dispo)' : 'Completed (Bike available)'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">
                {language === 'fr' ? 'Description des travaux / Notes' : 'Description / Notes'}
              </label>
              <textarea
                required
                rows={2}
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#2D2D2D]">
              <button 
                type="button" 
                onClick={() => setIsOpenAdd(false)} 
                className="px-4 py-2 rounded-xl font-bold bg-zinc-800 text-zinc-300 cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] cursor-pointer hover:bg-[#b88a10] transition-colors shadow-lg shadow-[#D4A017]/20"
              >
                {language === 'fr' ? 'Enregistrer la Maintenance' : 'Save Maintenance Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceModule;