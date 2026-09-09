import React, { useState, useEffect } from 'react';
import { Truck, Mail, Phone, DollarSign, Plus, RefreshCw } from 'lucide-react';
import { Supplier } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface SuppliersModuleProps {
  suppliers: Supplier[]; // Conservé pour la signature React
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const SuppliersModule: React.FC<SuppliersModuleProps> = ({ currency, onUpdate }) => {
  const { language } = useLanguage();

  const [liveSuppliers, setLiveSuppliers] = useState<Supplier[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Formulaire d'ajout
  const [form, setForm] = useState({
    supplierName: '',
    supplierNameFr: '',
    category: 'Parts & Workshop',
    contactPerson: '',
    productsServices: '',
    productsServicesFr: '',
    totalPurchases: 0,
  });

  const fetchSuppliersData = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((sup: any) => ({
        id: sup.id,
        supplierName: sup.name,
        supplierNameFr: sup.name,
        category: sup.category || 'Parts & Workshop',
        contactPerson: sup.contact_person || '',
        productsServices: sup.services || '',
        productsServicesFr: sup.services || '',
        totalPurchases: Number(sup.total_purchases) || 0,
      })) as unknown as Supplier[];

      setLiveSuppliers(mapped);
    } catch (error) {
      console.error("Erreur de synchronisation des fournisseurs:", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchSuppliersData();
  }, []);

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);
    try {
      const payload = {
        name: form.supplierName,
        category: form.category,
        contact_person: form.contactPerson,
        services: form.productsServices,
        total_purchases: Number(form.totalPurchases),
      };

      const { error } = await supabase.from('suppliers').insert([payload]);
      if (error) throw error;

      await fetchSuppliersData();
      setIsAddOpen(false);
      setForm({
        supplierName: '',
        supplierNameFr: '',
        category: 'Parts & Workshop',
        contactPerson: '',
        productsServices: '',
        productsServicesFr: '',
        totalPurchases: 0,
      });
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de l'ajout du fournisseur:", error);
      setIsLoadingDb(false);
    }
  };

  if (isLoadingDb && liveSuppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Chargement des fournisseurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#D4A017]" /> 
            {language === 'fr' ? 'Répertoire des Fournisseurs & Vendeurs' : 'Suppliers & Vendor Directory'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr'
              ? 'Comptes des importateurs officiels BMW, Yamaha & KTM, partenaires hôteliers (Kasbah Xaluca) et fournisseurs de pneus.'
              : 'Official BMW, Yamaha & KTM importer accounts, hotel partners (Kasbah Xaluca), and tire suppliers.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 
          {language === 'fr' ? 'Ajouter un Fournisseur' : 'Add Supplier'}
        </button>
      </div>

      {/* Grid */}
      {liveSuppliers.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-[#1C1C1C] rounded-2xl border border-[#2D2D2D]">
          {language === 'fr' ? 'Aucun fournisseur enregistré dans le cloud.' : 'No suppliers registered in the cloud.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveSuppliers.map((sup) => {
            let categoryLabel: string = sup.category;
            if (language === 'fr') {
              if (categoryLabel === 'Parts & Workshop') categoryLabel = 'Pièces & Atelier';
              if (categoryLabel === 'Hotels & Lodging') categoryLabel = 'Hôtels & Hébergement';
              if (categoryLabel === 'Tires & Consumables') categoryLabel = 'Pneus & Consommables';
            }

            return (
              <div key={sup.id} className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4 hover:border-[#D4A017]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-[#F4F4F2]">
                    {language === 'fr' ? (sup as any).supplierNameFr || sup.supplierName : sup.supplierName}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-sky-950 text-sky-400 font-bold text-xs border border-sky-800">
                    {categoryLabel}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-400">{language === 'fr' ? 'Personne de contact :' : 'Contact Person:'}</span> 
                    <span className="font-semibold text-[#F4F4F2] ml-1">{sup.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">{language === 'fr' ? 'Produits / Services :' : 'Products / Services:'}</span> 
                    <span className="font-semibold text-[#F4F4F2] ml-1">
                      {language === 'fr' ? (sup as any).productsServicesFr || sup.productsServices : sup.productsServices}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">{language === 'fr' ? 'Total des Achats :' : 'Total Purchases:'}</span> 
                    <span className="font-bold text-emerald-400 ml-1">{formatCurrency(sup.totalPurchases, currency)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout */}
      {isAddOpen && (
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={language === 'fr' ? 'Ajouter un Fournisseur' : 'Add Supplier'}>
          <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Nom du Fournisseur *' : 'Supplier Name *'}</label>
              <input
                type="text"
                required
                placeholder="Ex: SMEIA BMW Morocco"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Catégorie *' : 'Category *'}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Parts & Workshop">Parts & Workshop (Pièces & Atelier)</option>
                  <option value="Hotels & Lodging">Hotels & Lodging (Hôtels & Hébergement)</option>
                  <option value="Tires & Consumables">Tires & Consumables (Pneus & Consommables)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Personne de Contact *' : 'Contact Person *'}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hicham Benjelloun"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Produits / Services *' : 'Products / Services *'}</label>
              <input
                type="text"
                required
                placeholder="Ex: Official BMW Motorrad parts, diagnostic..."
                value={form.productsServices}
                onChange={(e) => setForm({ ...form, productsServices: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#D4A017] block mb-1">{language === 'fr' ? 'Total des Achats' : 'Total Purchases'} ({currency})</label>
              <input
                type="number"
                required
                value={form.totalPurchases}
                onChange={(e) => setForm({ ...form, totalPurchases: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#D4A017]/30 text-[#F4F4F2] font-bold outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D] mt-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button type="submit" disabled={isLoadingDb} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer">
                {isLoadingDb && <RefreshCw className="w-4 h-4 animate-spin" />}
                {language === 'fr' ? 'Enregistrer le Fournisseur' : 'Save Supplier'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SuppliersModule;