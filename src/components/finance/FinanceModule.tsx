import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Filter, Search, 
  ArrowUpRight, Calendar, FileText, PieChart, Tag, Building, RefreshCw 
} from 'lucide-react';
import { Revenue, Expense, Motorcycle, Tour } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface FinanceModuleProps {
  revenues: Revenue[]; 
  expenses: Expense[]; 
  motorcycles: Motorcycle[]; // Reste ici pour la compatibilité React, mais on ne l'utilisera plus pour l'affichage
  tours: Tour[];
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  currency,
  onUpdate,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses' | 'profitability'>('revenues');
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveRevenues, setLiveRevenues] = useState<Revenue[]>([]);
  const [liveExpenses, setLiveExpenses] = useState<Expense[]>([]);
  const [liveMotorcycles, setLiveMotorcycles] = useState<any[]>([]); // Nouvel état pour les vraies motos
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const fetchFinanceData = async () => {
    try {
      setIsLoadingDb(true);
      
      // On va chercher TOUT ce qui impacte les finances directement sur le cloud
      const [revResponse, expResponse, vehResponse, resResponse, maintResponse] = await Promise.all([
        supabase.from('revenues').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('vehicles').select('*'), // Les vraies motos
        supabase.from('reservations').select('*'), // Les vraies locations
        supabase.from('maintenance_records').select('*') // Les vraies réparations
      ]);

      if (revResponse.error) throw revResponse.error;
      if (expResponse.error) throw expResponse.error;

      // 1. Mapping des Revenus Manuels
      const mappedRevenues = (revResponse.data || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        category: r.category,
        amount: Number(r.amount),
        currency: 'MAD',
        description: r.description || '',
        paymentMethod: r.payment_method,
        createdAt: r.created_at,
      })) as Revenue[];

      // 2. Mapping des Dépenses Manuelles
      const mappedExpenses = (expResponse.data || []).map((e: any) => ({
        id: e.id,
        date: e.date,
        category: e.category,
        amount: Number(e.amount),
        currency: 'MAD',
        description: e.description || '',
        paymentMethod: e.payment_method,
        createdAt: e.created_at,
      })) as Expense[];

      // 3. Mapping des Vraies Motos avec calcul de rentabilité dynamique
      const mappedBikes = (vehResponse.data || []).map((v: any) => {
        // Trouver toutes les réservations de cette moto spécifique
        const bikeReservations = (resResponse.data || []).filter((r: any) => r.motorcycle_id === v.id || r.vehicle_id === v.id);
        const totalRev = bikeReservations.reduce((sum, r) => sum + (Number(r.total_price) || Number(r.totalPrice) || 0), 0);

        // Trouver toutes les réparations de cette moto spécifique
        const bikeMaintenance = (maintResponse.data || []).filter((m: any) => m.vehicle_id === v.id || m.motorcycle_id === v.id);
        const totalMaint = bikeMaintenance.reduce((sum, m) => sum + (Number(m.cost) || Number(m.amount) || 0), 0);

        return {
          id: v.id,
          brand: v.brand || 'N/A',
          model: v.model || 'N/A',
          registrationNumber: v.registration_number || v.registrationNumber || '',
          totalRevenue: totalRev,
          totalMaintenanceCost: totalMaint
        };
      });

      setLiveRevenues(mappedRevenues);
      setLiveExpenses(mappedExpenses);
      setLiveMotorcycles(mappedBikes); // On stocke les vraies motos

    } catch (error) {
      console.error("Erreur de synchronisation financière:", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const [revForm, setRevForm] = useState<Partial<Revenue>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Rental',
    amount: 5000,
    description: '',
    paymentMethod: 'Card',
  });

  const [expForm, setExpForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Maintenance',
    amount: 1500,
    description: '',
    paymentMethod: 'Company Card',
  });

  const handleSaveRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);
    try {
      const payload = {
        date: revForm.date || new Date().toISOString().split('T')[0],
        category: revForm.category || 'Rental',
        amount: Number(revForm.amount) || 0,
        description: revForm.description || '',
        payment_method: revForm.paymentMethod || 'Card',
      };

      const { error } = await supabase.from('revenues').insert([payload]);
      if (error) throw error;

      await fetchFinanceData();
      setIsAddRevenueOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Erreur ajout revenu:", error);
      setIsLoadingDb(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);
    try {
      const payload = {
        date: expForm.date || new Date().toISOString().split('T')[0],
        category: expForm.category || 'Maintenance',
        amount: Number(expForm.amount) || 0,
        description: expForm.description || '',
        payment_method: expForm.paymentMethod || 'Company Card',
      };

      const { error } = await supabase.from('expenses').insert([payload]);
      if (error) throw error;

      await fetchFinanceData();
      setIsAddExpenseOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Erreur ajout dépense:", error);
      setIsLoadingDb(false);
    }
  };

  // ----------------------------------------------------
  // CALCUL DES TOTAUX UNIFIÉS (Automatique + Manuel)
  // ----------------------------------------------------
  // 1. Somme des entrées manuelles (Supabase)
  const manualTotalRev = liveRevenues.reduce((a, b) => a + b.amount, 0);
  const manualTotalExp = liveExpenses.reduce((a, b) => a + b.amount, 0);

  // 2. Somme des opérations automatiques des VRAIES motos (Réservations & Ateliers)
  const fleetOperationalRev = liveMotorcycles.reduce((acc, m) => acc + (m.totalRevenue || 0), 0);
  const fleetOperationalExp = liveMotorcycles.reduce((acc, m) => acc + (m.totalMaintenanceCost || 0), 0);

  // 3. Totaux globaux de l'entreprise
  const totalRev = manualTotalRev + fleetOperationalRev;
  const totalExp = manualTotalExp + fleetOperationalExp;
  const netProfit = totalRev - totalExp;

  if (isLoadingDb && liveRevenues.length === 0 && liveExpenses.length === 0 && liveMotorcycles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Calcul des finances en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Financial Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block relative z-10">
            {language === 'fr' ? 'REVENUS TOTAUX ENREGISTRÉS' : 'Total Revenue Recorded'}
          </span>
          <span className="text-2xl font-black text-emerald-400 relative z-10">{formatCurrency(totalRev, currency)}</span>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            {language === 'fr' ? 'Inclut Réservations & Manuels' : 'Includes Rentals & Manual'}
          </span>
          {isLoadingDb && <RefreshCw className="w-4 h-4 text-emerald-400/20 animate-spin absolute right-4 top-4" />}
        </div>
        <div className="p-5 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block relative z-10">
            {language === 'fr' ? 'DÉPENSES TOTALES ENREGISTRÉES' : 'Total Expenses Recorded'}
          </span>
          <span className="text-2xl font-black text-rose-400 relative z-10">{formatCurrency(totalExp, currency)}</span>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            {language === 'fr' ? 'Inclut Ateliers & Manuels' : 'Includes Workshop & Manual'}
          </span>
          {isLoadingDb && <RefreshCw className="w-4 h-4 text-rose-400/20 animate-spin absolute right-4 top-4" />}
        </div>
        <div className="p-5 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block relative z-10">
            {language === 'fr' ? 'BÉNÉFICE NET DE L’ENTREPRISE' : 'Net Company Profit'}
          </span>
          <span className={`text-2xl font-black relative z-10 ${netProfit >= 0 ? 'text-[#D4A017]' : 'text-rose-500'}`}>
            {formatCurrency(netProfit, currency)}
          </span>
          <span className="text-[10px] text-zinc-500 mt-1 block">CA global - Charges globales</span>
          {isLoadingDb && <RefreshCw className="w-4 h-4 text-[#D4A017]/20 animate-spin absolute right-4 top-4" />}
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#262626] border border-[#333333] p-1 rounded-xl text-xs font-bold overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('revenues')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'revenues' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Revenus Manuels' : 'Manual Revenues'} ({liveRevenues.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'expenses' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Dépenses Manuelles' : 'Manual Expenses'} ({liveExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('profitability')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'profitability' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Rentabilité par Moto' : 'Per-Bike Profitability'} ({liveMotorcycles.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'revenues' && (
            <button
              onClick={() => setIsAddRevenueOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> {language === 'fr' ? 'Ajouter un Revenu' : 'Add Revenue'}
            </button>
          )}
          {activeTab === 'expenses' && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> {language === 'fr' ? 'Ajouter une Dépense' : 'Add Expense'}
            </button>
          )}
        </div>
      </div>

      {/* Revenues List */}
      {activeTab === 'revenues' && (
        <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-left text-xs text-[#F4F4F2] min-w-[800px]">
              <thead className="bg-[#222222] border-b border-[#2D2D2D] text-zinc-400 font-bold uppercase">
                <tr>
                  <th className="p-4">{language === 'fr' ? 'Date' : 'Date'}</th>
                  <th className="p-4">{language === 'fr' ? 'Catégorie' : 'Category'}</th>
                  <th className="p-4">{language === 'fr' ? 'Description' : 'Description'}</th>
                  <th className="p-4">{language === 'fr' ? 'Mode de Paiement' : 'Payment Method'}</th>
                  <th className="p-4 font-bold">{language === 'fr' ? 'Montant' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {liveRevenues.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-zinc-500">Aucun revenu manuel enregistré. (Les locations s'ajoutent automatiquement aux KPI globaux).</td></tr>
                ) : (
                  liveRevenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-[#252525]">
                      <td className="p-4 font-mono text-zinc-400">{rev.date}</td>
                      <td className="p-4 font-bold text-[#D4A017]">
                        {language === 'fr' && rev.category === 'Rental' ? 'Location' : rev.category}
                      </td>
                      <td className="p-4 font-semibold">{rev.description}</td>
                      <td className="p-4 text-zinc-300">
                        {language === 'fr' && rev.paymentMethod === 'Card' ? 'Carte' : 
                         language === 'fr' && rev.paymentMethod === 'Bank Transfer' ? 'Virement' : 
                         language === 'fr' && rev.paymentMethod === 'Cash' ? 'Espèces' : rev.paymentMethod}
                      </td>
                      <td className="p-4 font-bold text-emerald-400">{formatCurrency(rev.amount, currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {activeTab === 'expenses' && (
        <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-left text-xs text-[#F4F4F2] min-w-[800px]">
              <thead className="bg-[#222222] border-b border-[#2D2D2D] text-zinc-400 font-bold uppercase">
                <tr>
                  <th className="p-4">{language === 'fr' ? 'Date' : 'Date'}</th>
                  <th className="p-4">{language === 'fr' ? 'Catégorie' : 'Category'}</th>
                  <th className="p-4">{language === 'fr' ? 'Description' : 'Description'}</th>
                  <th className="p-4">{language === 'fr' ? 'Mode de Paiement' : 'Payment Method'}</th>
                  <th className="p-4 font-bold">{language === 'fr' ? 'Montant' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {liveExpenses.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-zinc-500">Aucune dépense manuelle enregistrée. (L'entretien s'ajoute automatiquement aux KPI globaux).</td></tr>
                ) : (
                  liveExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#252525]">
                      <td className="p-4 font-mono text-zinc-400">{exp.date}</td>
                      <td className="p-4 font-bold text-rose-400">
                        {language === 'fr' && exp.category === 'Maintenance' ? 'Entretien' : 
                         language === 'fr' && exp.category === 'Fuel' ? 'Carburant' : 
                         language === 'fr' && exp.category === 'Insurance' ? 'Assurance' : exp.category}
                      </td>
                      <td className="p-4 font-semibold">{exp.description}</td>
                      <td className="p-4 text-zinc-300">
                        {language === 'fr' && exp.paymentMethod === 'Company Card' ? 'Carte Pro' : 
                         language === 'fr' && exp.paymentMethod === 'Bank Transfer' ? 'Virement' : 
                         language === 'fr' && exp.paymentMethod === 'Cash' ? 'Espèces' : exp.paymentMethod}
                      </td>
                      <td className="p-4 font-bold text-rose-400">-{formatCurrency(exp.amount, currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Bike Profitability - NOW USING REAL SUPABASE DATA */}
      {activeTab === 'profitability' && (
        <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-lg text-[#F4F4F2]">
            {language === 'fr' ? 'Répartition du Bénéfice Net de la Flotte de Motos' : 'Motorcycle Fleet Net Profit Breakdown'}
          </h3>
          
          {liveMotorcycles.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 border border-[#333] rounded-xl bg-[#222]">
              {language === 'fr' ? 'Aucune moto enregistrée dans la flotte.' : 'No motorcycles registered in fleet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMotorcycles.map((m) => {
                const netBikeProfit = (m.totalRevenue || 0) - (m.totalMaintenanceCost || 0);
                return (
                  <div key={m.id} className="p-4 rounded-xl bg-[#222222] border border-[#333333] space-y-2 text-xs hover:border-[#D4A017]/30 transition-colors">
                    <div className="flex justify-between font-bold text-sm text-[#F4F4F2]">
                      <span>{m.brand} {m.model} ({m.registrationNumber})</span>
                      <span className={netBikeProfit >= 0 ? "text-[#D4A017]" : "text-rose-400"}>
                        {formatCurrency(netBikeProfit, currency)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#333333]">
                      <div><span className="text-zinc-400">{language === 'fr' ? 'Revenus Locatifs :' : 'Total Rev:'}</span> <span className="font-bold text-emerald-400 block">{formatCurrency(m.totalRevenue || 0, currency)}</span></div>
                      <div><span className="text-zinc-400">{language === 'fr' ? 'Coûts Atelier :' : 'Total Costs:'}</span> <span className="font-bold text-rose-400 block">{formatCurrency(m.totalMaintenanceCost || 0, currency)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Revenue Modal */}
      {isAddRevenueOpen && (
        <Modal isOpen={isAddRevenueOpen} onClose={() => setIsAddRevenueOpen(false)} title={language === 'fr' ? 'Enregistrer une Entrée de Revenu' : 'Record Revenue Entry'}>
          <form onSubmit={handleSaveRevenue} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Catégorie *' : 'Category *'}</label>
              <select
                value={revForm.category}
                onChange={(e) => setRevForm({ ...revForm, category: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
              >
                <option value="Rental">{language === 'fr' ? 'Location' : 'Rental'}</option>
                <option value="Tour">{language === 'fr' ? 'Circuit / Raid' : 'Tour'}</option>
                <option value="Equipment">{language === 'fr' ? 'Équipement' : 'Equipment'}</option>
                <option value="Delivery">{language === 'fr' ? 'Livraison' : 'Delivery'}</option>
                <option value="Damage">{language === 'fr' ? 'Frais de Dommages' : 'Damage Charge'}</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#D4A017] block mb-1">{language === 'fr' ? 'Montant *' : 'Amount *'} ({currency})</label>
                <input
                  type="number"
                  required
                  value={revForm.amount || ''}
                  onChange={(e) => setRevForm({ ...revForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#D4A017]/30 text-[#F4F4F2] font-bold focus:border-[#D4A017] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Date *' : 'Date *'}</label>
                <input
                  type="date"
                  required
                  value={revForm.date || ''}
                  onChange={(e) => setRevForm({ ...revForm, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Mode de Paiement *' : 'Payment Method *'}</label>
                <select
                  value={revForm.paymentMethod}
                  onChange={(e) => setRevForm({ ...revForm, paymentMethod: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Card">{language === 'fr' ? 'Carte' : 'Card'}</option>
                  <option value="Bank Transfer">{language === 'fr' ? 'Virement' : 'Bank Transfer'}</option>
                  <option value="Cash">{language === 'fr' ? 'Espèces' : 'Cash'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Description *' : 'Description *'}</label>
              <input
                type="text"
                required
                placeholder={language === 'fr' ? 'Ex: Paiement Réservation RES-101' : 'Ex: Payment for Reservation RES-101'}
                value={revForm.description || ''}
                onChange={(e) => setRevForm({ ...revForm, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D] mt-2">
              <button type="button" onClick={() => setIsAddRevenueOpen(false)} className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button type="submit" disabled={isLoadingDb} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer">
                {isLoadingDb && <RefreshCw className="w-4 h-4 animate-spin" />}
                {language === 'fr' ? 'Enregistrer le Revenu' : 'Save Revenue'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title={language === 'fr' ? 'Enregistrer une Dépense' : 'Record Expense Entry'}>
          <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Catégorie *' : 'Category *'}</label>
              <select
                value={expForm.category}
                onChange={(e) => setExpForm({ ...expForm, category: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
              >
                <option value="Maintenance">{language === 'fr' ? 'Entretien' : 'Maintenance'}</option>
                <option value="Fuel">{language === 'fr' ? 'Carburant' : 'Fuel'}</option>
                <option value="Insurance">{language === 'fr' ? 'Assurance' : 'Insurance'}</option>
                <option value="Hotels">{language === 'fr' ? 'Hôtels' : 'Hotels'}</option>
                <option value="Guides">{language === 'fr' ? 'Guides' : 'Guides'}</option>
                <option value="Marketing">{language === 'fr' ? 'Marketing' : 'Marketing'}</option>
                <option value="Office">{language === 'fr' ? 'Bureau / Loyer' : 'Office / Rent'}</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-rose-400 block mb-1">{language === 'fr' ? 'Montant *' : 'Amount *'} ({currency})</label>
                <input
                  type="number"
                  required
                  value={expForm.amount || ''}
                  onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-rose-900/50 text-[#F4F4F2] font-bold focus:border-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Date *' : 'Date *'}</label>
                <input
                  type="date"
                  required
                  value={expForm.date || ''}
                  onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Mode de Paiement *' : 'Payment Method *'}</label>
                <select
                  value={expForm.paymentMethod}
                  onChange={(e) => setExpForm({ ...expForm, paymentMethod: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Company Card">{language === 'fr' ? 'Carte Pro' : 'Company Card'}</option>
                  <option value="Bank Transfer">{language === 'fr' ? 'Virement' : 'Bank Transfer'}</option>
                  <option value="Cash">{language === 'fr' ? 'Espèces' : 'Cash'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Description & Fournisseur *' : 'Description & Supplier *'}</label>
              <input
                type="text"
                required
                placeholder={language === 'fr' ? 'Ex: Facture Garage KTM Marrakech' : 'Ex: Invoice from KTM Workshop'}
                value={expForm.description || ''}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D] mt-2">
              <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button type="submit" disabled={isLoadingDb} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer">
                {isLoadingDb && <RefreshCw className="w-4 h-4 animate-spin" />}
                {language === 'fr' ? 'Enregistrer la Dépense' : 'Save Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FinanceModule;