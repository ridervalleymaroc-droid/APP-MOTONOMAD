import React, { useState, useEffect } from 'react';
import { 
  Bike, Search, Plus, Filter, LayoutGrid, List, Wrench, Shield, 
  TrendingUp, Calendar, AlertTriangle, Edit, Trash2, DollarSign, Activity, Eye, RefreshCw, Image as ImageIcon, Upload
} from 'lucide-react';
import { Motorcycle, MotorcycleStatus, Reservation, MaintenanceRecord } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, calculateDepreciation } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface FleetModuleProps {
  motorcycles: Motorcycle[];
  reservations: Reservation[];
  maintenance: MaintenanceRecord[];
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
  initialOpenAddModal?: boolean;
}

export const FleetModule: React.FC<FleetModuleProps> = ({
  reservations,
  maintenance,
  currency,
  onUpdate,
  initialOpenAddModal = false,
}) => {
  const { t, formatCurrencyVal, language } = useLanguage();
  
  const [liveMotorcycles, setLiveMotorcycles] = useState<Motorcycle[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchLiveFleet = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedBikes = (data || []).map((v: any) => {
        const bikeReservations = reservations.filter(r => r.motorcycleId === v.id);
        const totalRevenue = bikeReservations.reduce((sum, r) => sum + r.totalPrice, 0);

        const bikeMaintenance = maintenance.filter(m => m.motorcycleId === v.id);
        const totalMaintenanceCost = bikeMaintenance.reduce((sum, m: any) => sum + (m.cost || m.amount || 0), 0);

        let status = v.status;
        if (status === 'AVAILABLE') status = 'Available';
        if (status === 'RENTED') status = 'Rented';
        if (status === 'MAINTENANCE') status = 'Maintenance';
        if (status === 'RESERVED') status = 'Reserved';
        if (status === 'SOLD') status = 'Sold';

        return {
          id: v.id,
          brand: v.brand || 'N/A',
          model: v.model || 'N/A',
          version: v.version || '',
          year: new Date(v.purchase_date || Date.now()).getFullYear(),
          registrationNumber: v.registration_number || '',
          vin: v.vin || '',
          color: 'Standard',
          category: v.category || 'Adventure',
          engineSize: 1000,
          purchaseDate: v.purchase_date || new Date().toISOString().split('T')[0],
          purchasePrice: Number(v.purchase_price) || 0,
          residualValue: (Number(v.purchase_price) || 0) * 0.2,
          usefulLifeYears: 5,
          depreciationMethod: 'Straight-line',
          currentMileage: Number(v.mileage) || 0,
          currentStatus: status || 'Available',
          currentLocation: 'Marrakech HQ',
          supplier: 'Concessionnaire',
          insuranceCompany: 'AXA Assurance',
          insurancePolicyNumber: 'POL-XXX',
          insuranceExpiry: '2026-12-31',
          techInspectionExpiry: '2026-12-31',
          dailyPrice: Number(v.daily_rate) || 0,
          weeklyPrice: (Number(v.daily_rate) || 0) * 6,
          monthlyPrice: (Number(v.daily_rate) || 0) * 20,
          depositAmount: 10000,
          photos: [v.image_url || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'],
          totalRevenue,
          totalMaintenanceCost,
          currentBookValue: 0,
          estimatedMarketValue: (Number(v.purchase_price) || 0) * 0.8,
          createdAt: v.created_at || new Date().toISOString(),
        } as Motorcycle;
      });

      setLiveMotorcycles(mappedBikes);
    } catch (error) {
      console.error("Erreur de synchronisation Supabase (Flotte):", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

 const handleSyncWordPressFleet = async () => {
    setSyncing(true);
    try {
      // 1. On récupère les données de WordPress
      const response = await fetch('https://motonomad.ma/wp-json/motonomad/v1/bikes');
      const wpBikes = await response.json();

      if (!Array.isArray(wpBikes)) {
        throw new Error('Format de données invalide reçu depuis WordPress');
      }

      // 2. On récupère les motos DÉJÀ EXISTANTES dans Supabase pour comparer
      const { data: existingBikes, error: fetchError } = await supabase
        .from('vehicles')
        .select('id, registration_number');

      if (fetchError) throw fetchError;

      // 3. On boucle sur les motos WordPress
      for (const bike of wpBikes) {
        const wpRegistration = bike.registrationNumber || `WP-${bike.id}`;
        
        // On cherche si cette moto existe déjà dans Supabase via son immatriculation
        const existingBike = (existingBikes || []).find(
          (b) => b.registration_number === wpRegistration
        );

        // Les données à sauvegarder
        const bikePayload = {
          brand: bike.brand || 'Moto',
          model: bike.name || 'Modèle',
          registration_number: wpRegistration,
          category: bike.category || 'Adventure',
          daily_rate: Number(bike.price_per_day) || 500,
          purchase_price: Number(bike.purchase_price) || 0,
          image_url: bike.image || null,
          // On ne modifie pas le 'status' si la moto existe déjà (pour ne pas écraser une location en cours)
          ...( !existingBike && { status: 'AVAILABLE' } )
        };

        if (existingBike) {
          // ✅ METTRE À JOUR si elle existe déjà (évite les doublons)
          const { error } = await supabase
            .from('vehicles')
            .update(bikePayload)
            .eq('id', existingBike.id);
            
          if (error) console.error("Erreur update moto:", error.message);
        } else {
          // ✅ INSÉRER si elle est totalement nouvelle
          const { error } = await supabase
            .from('vehicles')
            .insert([bikePayload]);
            
          if (error) console.error("Erreur insert moto:", error.message);
        }
      }

      alert(
        language === 'fr'
          ? 'Flotte synchronisée avec succès ! Les doublons ont été évités.'
          : 'Fleet successfully synchronized! Duplicates prevented.'
      );
      await fetchLiveFleet();
      onUpdate();
    } catch (err: any) {
      console.error(err);
      alert((language === 'fr' ? 'Erreur de synchronisation : ' : 'Sync error: ') + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveFleet();
  }, [reservations, maintenance]);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBike, setSelectedBike] = useState<Motorcycle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAddModal);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteBikeId, setDeleteBikeId] = useState<string | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Motorcycle> & { imageUrl?: string }>({
    brand: 'BMW',
    model: 'R 1250 GS Adventure',
    version: 'Triple Black',
    registrationNumber: '',
    vin: '',
    category: 'Adventure',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 200000,
    dailyPrice: 1400,
    currentStatus: 'Available',
    currentMileage: 0,
    imageUrl: '',
  });

  const handleOpenAdd = () => {
    setSelectedImageFile(null);
    setFormData({
      brand: 'Yamaha',
      model: 'Ténéré 700',
      version: 'Rally',
      registrationNumber: '',
      vin: '',
      category: 'Adventure',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 130000,
      dailyPrice: 950,
      currentStatus: 'Available',
      currentMileage: 0,
      imageUrl: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicles')
          .upload(filePath, selectedImageFile);

        if (uploadError) {
          console.error("Erreur lors de l'upload de l'image:", uploadError);
          alert("Erreur lors du chargement de l'image.");
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('vehicles')
            .getPublicUrl(filePath);
          
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      const statusDB = formData.currentStatus === 'Available' ? 'AVAILABLE' :
                       formData.currentStatus === 'Rented' ? 'RENTED' :
                       formData.currentStatus === 'Maintenance' ? 'MAINTENANCE' :
                       formData.currentStatus === 'Reserved' ? 'RESERVED' :
                       formData.currentStatus === 'Sold' ? 'SOLD' : 'AVAILABLE';

      const payload = {
        brand: formData.brand,
        model: formData.model,
        version: formData.version,
        registration_number: formData.registrationNumber,
        vin: formData.vin,
        category: formData.category,
        daily_rate: formData.dailyPrice,
        purchase_price: formData.purchasePrice,
        status: statusDB,
        mileage: formData.currentMileage || 0,
        purchase_date: formData.purchaseDate || new Date().toISOString().split('T')[0],
        image_url: finalImageUrl || null,
      };

      if (isEditModalOpen && selectedBike) {
        await supabase.from('vehicles').update(payload).eq('id', selectedBike.id);
      } else {
        await supabase.from('vehicles').insert([payload]);
      }

      await fetchLiveFleet();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedBike(null);
      setSelectedImageFile(null);
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du véhicule :", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteBikeId) {
      setIsLoadingDb(true);
      try {
        await supabase.from('vehicles').delete().eq('id', deleteBikeId);
        await fetchLiveFleet();
        setDeleteBikeId(null);
        setSelectedBike(null);
        onUpdate();
      } catch (error) {
        console.error("Erreur lors de la suppression du véhicule :", error);
      } finally {
        setIsLoadingDb(false);
      }
    }
  };

  const filteredBikes = liveMotorcycles.filter((m) => {
    const matchesSearch = 
      `${m.brand} ${m.model} ${m.registrationNumber} ${m.vin} ${m.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFleetInvestment = liveMotorcycles.reduce((acc, m) => acc + m.purchasePrice, 0);
  const totalFleetRevenue = liveMotorcycles.reduce((acc, m) => acc + m.totalRevenue, 0);
  const totalFleetMaintenance = liveMotorcycles.reduce((acc, m) => acc + m.totalMaintenanceCost, 0);
  const netFleetProfit = totalFleetRevenue - totalFleetMaintenance;

  if (isLoadingDb && liveMotorcycles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Synchronisation de la Flotte...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#F4F4F2]">
      {/* Fleet Dashboard KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1">
            {language === 'fr' ? 'Investissement Total' : 'Total Fleet Investment'}
          </span>
          <span className="text-2xl font-black text-white">{formatCurrency(totalFleetInvestment, currency)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1">
            {language === 'fr' ? 'Revenus Locatifs' : 'Total Rental Revenue'}
          </span>
          <span className="text-2xl font-black text-emerald-400">{formatCurrency(totalFleetRevenue, currency)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1">
            {language === 'fr' ? 'Coûts de Maintenance' : 'Total Maintenance Costs'}
          </span>
          <span className="text-2xl font-black text-rose-400">{formatCurrency(totalFleetMaintenance, currency)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1">
            {language === 'fr' ? 'Bénéfice Net Flotte' : 'Net Fleet Profit'}
          </span>
          <span className="text-2xl font-black text-[#D4A017]">{formatCurrency(netFleetProfit, currency)}</span>
        </div>
      </div>

      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-wide">
              <Bike className="w-6 h-6 text-[#D4A017]" /> 
              {language === 'fr' ? 'Gestion de la Flotte' : 'Motorcycle Fleet Management'}
            </h2>
            {isLoadingDb && <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />}
          </div>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            {language === 'fr'
              ? 'Supervisez l’état en temps réel, le kilométrage et la rentabilité de chaque véhicule.'
              : 'Real-time status board, mileage logs, insurance expirations, and profitability per bike.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bouton de Synchronisation WordPress */}
          <button
            onClick={handleSyncWordPressFleet}
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

          <div className="flex items-center bg-[#1A1A1A] border border-[#333333] rounded-xl p-1 text-sm shadow-sm">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'board' ? 'bg-[#D4A017] text-[#1C1C1C] shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> {language === 'fr' ? 'Cartes' : 'Board'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#D4A017] text-[#1C1C1C] shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-4 h-4" /> {language === 'fr' ? 'Tableau' : 'List'}
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] hover:scale-[1.02] transition-all shadow-lg shadow-[#D4A017]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-3" /> {language === 'fr' ? 'Ajouter une Moto' : 'Add Vehicle'}
          </button>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl bg-[#181818] border border-[#2D2D2D] shadow-sm">
        <div className="relative flex-1 w-full flex items-center px-3">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher par marque, modèle, plaque, VIN...' : 'Search brand, model, plate, VIN...'}
            className="w-full px-3 py-2 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-px h-px sm:h-8 bg-[#333333] shrink-0" />
        <div className="flex items-center gap-2 w-full sm:w-auto px-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 py-2 pr-4 bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer appearance-none"
          >
            <option value="ALL" className="bg-[#1C1C1C]">{language === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
            <option value="Available" className="bg-[#1C1C1C]">{language === 'fr' ? 'Disponible' : 'Available'}</option>
            <option value="Reserved" className="bg-[#1C1C1C]">{language === 'fr' ? 'Réservé' : 'Reserved'}</option>
            <option value="Rented" className="bg-[#1C1C1C]">{language === 'fr' ? 'En location' : 'Rented'}</option>
            <option value="Maintenance" className="bg-[#1C1C1C]">{language === 'fr' ? 'Maintenance' : 'Maintenance'}</option>
            <option value="Damaged" className="bg-[#1C1C1C]">{language === 'fr' ? 'Endommagé' : 'Damaged'}</option>
            <option value="Out of service" className="bg-[#1C1C1C]">{language === 'fr' ? 'Hors service' : 'Out of Service'}</option>
          </select>
        </div>
      </div>

      {/* Visual Board View */}
      {viewMode === 'board' ? (
        filteredBikes.length === 0 ? (
          <EmptyState
            title={language === 'fr' ? 'Aucune moto trouvée' : 'No motorcycles found'}
            description={language === 'fr' ? 'Aucune moto ne correspond au filtre ou à la recherche.' : 'No bikes match the current filter or search criteria.'}
            actionLabel={language === 'fr' ? 'Ajouter une Moto' : 'Add Motorcycle'}
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBikes.map((bike) => {
              const bikePhoto = bike.photos?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80';
              const bikeProfit = bike.totalRevenue - bike.totalMaintenanceCost;

              return (
                <div
                  key={bike.id}
                  onClick={() => setSelectedBike(bike)}
                  className="group relative rounded-2xl bg-[#181818] border border-[#2D2D2D] hover:border-[#D4A017]/40 transition-colors shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="relative h-48 w-full bg-[#121212] overflow-hidden">
                    <img
                      src={bikePhoto}
                      alt={`${bike.brand} ${bike.model}`}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-transparent to-transparent opacity-80"></div>
                    
                    <div className="absolute top-3 left-3">
                      <Badge status={bike.currentStatus} size="sm" />
                    </div>
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-[#121212]/90 backdrop-blur-md text-xs font-mono font-bold text-white border border-white/10 shadow-sm">
                      {bike.registrationNumber}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4A017] block mb-1">
                        {bike.brand} · {bike.category}
                      </span>
                      <h3 className="text-lg font-black text-white leading-tight">
                        {bike.model} {bike.version} <span className="text-zinc-500 font-medium text-sm">({bike.year})</span>
                      </h3>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-[#2A2A2A] pt-4">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-bold mb-0.5">
                          {language === 'fr' ? 'Tarif Jour' : 'Daily Rate'}
                        </span>
                        <span className="font-black text-white">
                          {formatCurrency(bike.dailyPrice, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-bold mb-0.5">
                          {language === 'fr' ? 'Kilométrage' : 'Mileage'}
                        </span>
                        <span className="font-semibold text-zinc-300">{bike.currentMileage.toLocaleString()} km</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-bold mb-0.5">
                          {language === 'fr' ? 'Emplacement' : 'Location'}
                        </span>
                        <span className="font-semibold text-zinc-300 truncate block">{bike.currentLocation}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-bold mb-0.5">
                          {language === 'fr' ? 'Rentabilité' : 'Net Profit'}
                        </span>
                        <span className="font-bold text-emerald-400">{formatCurrency(bikeProfit, currency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-[#121212] flex items-center justify-between text-xs border-t border-[#2A2A2A]">
                     <span className="text-zinc-500 font-medium group-hover:text-white transition-colors">
                      {language === 'fr' ? 'Inspecter la moto' : 'Inspect bike'} →
                    </span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedBike(bike);
                          setSelectedImageFile(null);
                          setFormData({
                            ...bike,
                            imageUrl: bike.photos?.[0] || '',
                            purchaseDate: bike.purchaseDate || new Date().toISOString().split('T')[0]
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-[#262626] hover:bg-[#333] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteBikeId(bike.id)}
                        className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* List View */
        <div className="rounded-2xl border border-[#2D2D2D] bg-[#181818] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121212] border-b border-[#2D2D2D] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">{language === 'fr' ? 'MODÈLE' : 'MOTORCYCLE'}</th>
                  <th className="px-6 py-4">{language === 'fr' ? 'STATUT' : 'STATUS'}</th>
                  <th className="px-6 py-4">{language === 'fr' ? 'IMMATRICULATION / VIN' : 'PLATE / VIN'}</th>
                  <th className="px-6 py-4">{language === 'fr' ? 'TARIF JOUR' : 'DAILY RATE'}</th>
                  <th className="px-6 py-4">{language === 'fr' ? 'KILOMÉTRAGE' : 'MILEAGE'}</th>
                  <th className="px-6 py-4">{language === 'fr' ? 'RENTABILITÉ' : 'NET PROFIT'}</th>
                  <th className="px-6 py-4 text-right">{language === 'fr' ? 'ACTIONS' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {filteredBikes.map((bike) => {
                  const bikePhoto = bike.photos?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80';
                  const bikeProfit = bike.totalRevenue - bike.totalMaintenanceCost;

                  return (
                    <tr
                      key={bike.id}
                      className="hover:bg-white/2 transition-colors cursor-pointer group"
                      onClick={() => setSelectedBike(bike)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={bikePhoto} alt="bike" className="w-16 h-10 rounded-md object-cover border border-[#333]" />
                          <div>
                            <span className="font-bold text-white block">{bike.brand} {bike.model}</span>
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{bike.category} · {bike.year}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge status={bike.currentStatus} size="sm" /></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded bg-[#222] border border-[#333] font-mono text-xs text-white w-fit">{bike.registrationNumber}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">VIN: {bike.vin}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-[#D4A017]">{formatCurrency(bike.dailyPrice, currency)}</td>
                      <td className="px-6 py-4 text-zinc-300 font-medium">{bike.currentMileage.toLocaleString()} km</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{formatCurrency(bikeProfit, currency)}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedBike(bike);
                              setSelectedImageFile(null);
                              setFormData({
                                ...bike,
                                imageUrl: bike.photos?.[0] || '',
                                purchaseDate: bike.purchaseDate || new Date().toISOString().split('T')[0]
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteBikeId(bike.id)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Motorcycle Detailed Inspection Profile Modal */}
      {selectedBike && !isEditModalOpen && (
        <Modal
          isOpen={!!selectedBike}
          onClose={() => setSelectedBike(null)}
          title={`${selectedBike.brand} ${selectedBike.model} ${selectedBike.version}`}
          subtitle={`Reg: ${selectedBike.registrationNumber} | VIN: ${selectedBike.vin}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#2D2D2D] gap-4">
              <div className="flex items-center gap-3">
                <Badge status={selectedBike.currentStatus} size="md" />
                <span className="font-bold text-zinc-300">{selectedBike.currentLocation}</span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-0.5">{language === 'fr' ? 'Tarif Journalier' : 'Daily Rental'}</span>
                  <span className="font-black text-base text-[#D4A017]">{formatCurrency(selectedBike.dailyPrice, currency)}</span>
                </div>
                <div className="w-px h-8 bg-[#333]"></div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-0.5">{language === 'fr' ? 'Revenu Total' : 'Total Revenue'}</span>
                  <span className="font-black text-base text-emerald-400">{formatCurrency(selectedBike.totalRevenue, currency)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2D2D2D] space-y-3">
                <h4 className="font-bold text-sm text-[#D4A017] border-b border-[#2D2D2D] pb-2 mb-3">
                  {language === 'fr' ? 'Spécifications Techniques' : 'Technical Specifications'}
                </h4>
                <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Catégorie / Moteur :' : 'Category / Engine:'}</span> <span className="font-bold text-[#F4F4F2]">{selectedBike.category} ({selectedBike.engineSize} cc)</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Couleur :' : 'Color:'}</span> <span className="font-semibold text-[#F4F4F2]">{selectedBike.color}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Kilométrage :' : 'Mileage:'}</span> <span className="font-bold text-white bg-[#222] px-2 py-0.5 rounded border border-[#333]">{selectedBike.currentMileage.toLocaleString()} km</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Expiration Assurance :' : 'Insurance Expiry:'}</span> <span className="font-bold text-emerald-400">{selectedBike.insuranceExpiry}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Contrôle Technique :' : 'Tech Inspection:'}</span> <span className="font-bold text-emerald-400">{selectedBike.techInspectionExpiry}</span></div>
              </div>

              <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2D2D2D] space-y-3">
                <h4 className="font-bold text-sm text-[#D4A017] border-b border-[#2D2D2D] pb-2 mb-3">
                  {language === 'fr' ? 'Amortissement & Valeur' : 'Depreciation & Book Value'}
                </h4>
                {(() => {
                  const dep = calculateDepreciation(selectedBike.purchasePrice, selectedBike.residualValue, selectedBike.usefulLifeYears, selectedBike.purchaseDate);
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Prix d’Achat :' : 'Purchase Price:'}</span> <span className="font-bold text-[#F4F4F2]">{formatCurrency(selectedBike.purchasePrice, currency)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Amortissement cumulé :' : 'Accumulated Depr.:'}</span> <span className="font-bold text-rose-400">-{formatCurrency(dep.accumulatedDepreciation, currency)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Valeur Comptable Actuelle :' : 'Current Book Value:'}</span> <span className="font-bold text-[#D4A017] bg-[#D4A017]/10 px-2 py-0.5 rounded border border-[#D4A017]/20">{formatCurrency(dep.currentBookValue, currency)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">{language === 'fr' ? 'Valeur Marchande Estimée :' : 'Est. Market Value:'}</span> <span className="font-bold text-emerald-400">{formatCurrency(selectedBike.estimatedMarketValue, currency)}</span></div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Motorcycle Modal avec fonctionnalité Upload */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
          title={isEditModalOpen ? (language === 'fr' ? 'Modifier la Moto' : 'Edit Motorcycle') : (language === 'fr' ? 'Ajouter une Nouvelle Moto' : 'Add New Fleet Motorcycle')}
          maxWidth="4xl"
        >
          <form onSubmit={handleSave} className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Marque *' : 'Brand *'}</label>
                <input
                  type="text"
                  required
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Modèle *' : 'Model *'}</label>
                <input
                  type="text"
                  required
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Version / Spéc.' : 'Version / Spec'}</label>
                <input
                  type="text"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#2D2D2D] pt-4 mt-2">
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Immatriculation *' : 'Plate *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 67890-A-26"
                  value={formData.registrationNumber || ''}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none font-mono transition-colors"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Numéro VIN *' : 'VIN Number *'}</label>
                <input
                  type="text"
                  required
                  value={formData.vin || ''}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none font-mono transition-colors"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Catégorie' : 'Category'}</label>
                <select
                  value={formData.category || 'Adventure'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none cursor-pointer transition-colors appearance-none"
                >
                  <option value="Adventure">Adventure</option>
                  <option value="Enduro">Enduro</option>
                  <option value="Touring">Touring</option>
                  <option value="Scrambler">Scrambler</option>
                  <option value="Trail">Trail</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#2D2D2D] pt-4 mt-2">
              <div>
                <label className="font-bold text-[#D4A017] block mb-1.5">{language === 'fr' ? 'Tarif Jour (MAD) *' : 'Daily Price (MAD) *'}</label>
                <input
                  type="number"
                  required
                  value={formData.dailyPrice || ''}
                  onChange={(e) => setFormData({ ...formData, dailyPrice: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#D4A017]/30 text-white focus:border-[#D4A017] outline-none transition-colors font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Prix d’Achat (MAD) *' : 'Purchase Price (MAD) *'}</label>
                <input
                  type="number"
                  required
                  value={formData.purchasePrice || ''}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5">{language === 'fr' ? 'Statut Actuel' : 'Current Status'}</label>
                <select
                  value={formData.currentStatus || 'Available'}
                  onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none cursor-pointer transition-colors appearance-none"
                >
                  <option value="Available">{language === 'fr' ? 'Disponible' : 'Available'}</option>
                  <option value="Reserved">{language === 'fr' ? 'Réservé' : 'Reserved'}</option>
                  <option value="Rented">{language === 'fr' ? 'Loué' : 'Rented'}</option>
                  <option value="Maintenance">{language === 'fr' ? 'En maintenance' : 'Maintenance'}</option>
                  <option value="Damaged">{language === 'fr' ? 'Endommagé' : 'Damaged'}</option>
                  <option value="Out of service">{language === 'fr' ? 'Hors service' : 'Out of Service'}</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#2D2D2D] pt-4 mt-2">
              <label className="font-bold text-zinc-300 block mb-1.5 items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#D4A017]" /> {language === 'fr' ? 'Photo de la Moto' : 'Motorcycle Photo'}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 rounded-xl bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4A017] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#D4A017] file:text-[#1C1C1C] hover:file:bg-[#b88a10] cursor-pointer"
                />
                {(formData.imageUrl || selectedImageFile) && (
                  <div className="shrink-0">
                    <img 
                      src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : formData.imageUrl} 
                      alt="Preview" 
                      className="w-16 h-12 object-cover rounded-md border border-[#333]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#2D2D2D] mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedImageFile(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold bg-[#1A1A1A] border border-[#333] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
                disabled={isUploading}
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                  isUploading ? 'bg-zinc-600 text-zinc-300 cursor-not-allowed' : 'bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] hover:scale-[1.02] shadow-[#D4A017]/20 cursor-pointer'
                }`}
              >
                {isUploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> {language === 'fr' ? 'Upload en cours...' : 'Uploading...'}</>
                ) : (
                  <>{language === 'fr' ? 'Enregistrer le Véhicule' : 'Save Motorcycle'}</>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteBikeId}
        onClose={() => setDeleteBikeId(null)}
        onConfirm={handleDelete}
        title={language === 'fr' ? 'Supprimer la Moto ?' : 'Delete Motorcycle?'}
        message={language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet enregistrement de moto de la flotte Motonomad ?' : 'Are you sure you want to delete this motorcycle record from the Motonomad fleet?'}
        isDestructive
      />
    </div>
  );
};

export default FleetModule;