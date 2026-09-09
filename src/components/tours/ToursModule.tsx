import React, { useState, useEffect } from 'react';
import { 
  Compass, Plus, Users, Calendar, MapPin, DollarSign, Award, CheckCircle, Clock, RefreshCw 
} from 'lucide-react';
import { Tour } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface ToursModuleProps {
  tours: Tour[];
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const ToursModule: React.FC<ToursModuleProps> = ({
  currency,
  onUpdate,
}) => {
  const { t, formatCurrencyVal, language } = useLanguage();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveTours, setLiveTours] = useState<Tour[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  // Formulaire d'ajout
  const [formData, setFormData] = useState({
    title: '',
    route: '',
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 5,
    pricePerPilot: 15000,
    minPilots: 2,
    maxPilots: 10,
    assignedGuide: 'Yassine El Majdoubi',
    status: 'Ouvert',
  });

  const fetchLiveTours = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('start_date', { ascending: true }); // Trie par date de départ

      if (error) throw error;

      // Mapping Supabase vers l'interface React Tour
      const mappedTours = (data || []).map((t: any) => ({
        id: t.id,
        name: t.title || 'Expédition sans nom',
        nameFr: t.title || 'Expédition sans nom',
        route: t.route || 'Itinéraire non défini',
        routeFr: t.route || 'Itinéraire non défini',
        startDate: t.start_date || 'TBD',
        endDate: '', 
        durationDays: Number(t.duration_days) || 1,
        pricePerRider: Number(t.price_per_pilot) || 0,
        minRiders: Number(t.min_pilots) || 1,
        maxRiders: Number(t.max_pilots) || 10,
        guideName: t.assigned_guide || 'Non assigné',
        guideNameFr: t.assigned_guide || 'Non assigné',
        status: t.status || 'Ouvert',
        itinerary: typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : (t.itinerary || []),
        participants: [],
        createdAt: t.created_at || new Date().toISOString(),
      })) as unknown as Tour[];

      setLiveTours(mappedTours);
    } catch (error) {
      console.error("Erreur de synchronisation Supabase (Circuits):", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchLiveTours();
  }, []);

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDb(true);

    try {
      const payload = {
        title: formData.title,
        route: formData.route,
        start_date: formData.startDate,
        duration_days: formData.durationDays,
        price_per_pilot: formData.pricePerPilot,
        min_pilots: formData.minPilots,
        max_pilots: formData.maxPilots,
        assigned_guide: formData.assignedGuide,
        status: formData.status,
        itinerary: [] // Itinéraire vide par défaut pour l'instant
      };

      const { error } = await supabase.from('tours').insert([payload]);
      if (error) throw error;

      await fetchLiveTours(); // Rafraîchit la liste avec le nouveau circuit
      setIsOpenAdd(false); // Ferme le modal
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de l'ajout du circuit :", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  if (isLoadingDb && liveTours.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Synchronisation des Circuits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#F4F4F2]">
      {/* Header avec Bouton d'ajout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#D4A017]" /> 
              {language === 'fr' ? 'Système de Circuits & Raides Guidés' : 'Guided Adventure Tours System'}
            </h2>
            {isLoadingDb && <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr'
              ? 'Gérez les listes d’expéditions dans le désert du Sahara, le Haut Atlas et le Rif, la capacité des pilotes et les guides.'
              : 'Manage Sahara Desert, High Atlas, and Rif mountain expedition rosters, rider capacities, and guides.'}
          </p>
        </div>
        
        {/* Bouton Nouveau Circuit */}
        <button
          onClick={() => setIsOpenAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors shadow-lg shadow-[#D4A017]/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 
          {language === 'fr' ? 'Nouveau Circuit' : 'New Tour'}
        </button>
      </div>

      {/* Tour Cards Grid */}
      {liveTours.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 bg-[#1C1C1C] rounded-2xl border border-[#2D2D2D]">
          {language === 'fr' ? 'Aucune expédition programmée.' : 'No expeditions scheduled.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveTours.map((tour) => {
            return (
              <div key={tour.id} className="rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] overflow-hidden shadow-xl space-y-4 p-6 hover:border-[#D4A017]/40 transition-colors cursor-pointer" onClick={() => setSelectedTour(tour)}>
                <div className="flex items-center justify-between">
                  <Badge status={tour.status} />
                  <span className="font-bold text-lg text-[#D4A017]">
                    {formatCurrency(tour.pricePerRider, currency)} / {language === 'fr' ? 'pilote' : 'rider'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#F4F4F2]">
                    {language === 'fr' ? (tour as any).nameFr || tour.name : tour.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A017]" /> 
                    {language === 'fr' ? (tour as any).routeFr || tour.route : tour.route}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#222222] border border-[#333333] text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">{language === 'fr' ? 'Dates' : 'Dates'}</span>
                    <span className="font-bold text-[#F4F4F2]">{tour.startDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">{language === 'fr' ? 'Durée' : 'Duration'}</span>
                    <span className="font-bold text-[#F4F4F2]">
                      {tour.durationDays} {language === 'fr' ? 'Jours' : 'Days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">{language === 'fr' ? 'Capacité Pilotes' : 'Rider Capacity'}</span>
                    <span className="font-bold text-emerald-400">
                      {language === 'fr' ? 'Min' : 'Min'} {tour.minRiders} / {language === 'fr' ? 'Max' : 'Max'} {tour.maxRiders}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] text-xs">
                  <span className="text-zinc-400 block mb-1 font-bold">
                    {language === 'fr' ? 'Guide Principal Assigné :' : 'Lead Guide Assigned:'}
                  </span>
                  <span className="font-semibold text-[#D4A017]">
                    {language === 'fr' ? (tour as any).guideNameFr || tour.guideName : tour.guideName}
                  </span>
                </div>

                {tour.itinerary && tour.itinerary.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#2A2A2A] text-xs">
                    <span className="font-bold text-zinc-300 block">
                      {language === 'fr' ? 'Points Forts de l’Itinéraire :' : 'Itinerary Highlights:'}
                    </span>
                    {(tour.itinerary || []).slice(0, 3).map((item) => (
                      <div key={item.day} className="flex items-start justify-between text-[11px] text-zinc-400">
                        <span>
                          {language === 'fr' ? 'Jour' : 'Day'} {item.day}: 
                          {language === 'fr' ? (item as any).titleFr || item.title : item.title}
                        </span>
                        <span className="text-zinc-500 font-mono">{item.distanceKm} km</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout de circuit */}
      {isOpenAdd && (
        <Modal 
          isOpen={isOpenAdd} 
          onClose={() => setIsOpenAdd(false)} 
          title={language === 'fr' ? 'Créer un Nouveau Circuit' : 'Create New Tour'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveTour} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Titre de l\'Expédition *' : 'Tour Title *'}</label>
              <input
                type="text"
                required
                placeholder={language === 'fr' ? 'Ex: Grand Tour Aventure Sahara & Atlas' : 'Ex: Sahara & Atlas Adventure Grand Tour'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Itinéraire / Villes traversées *' : 'Route / Cities *'}</label>
              <input
                type="text"
                required
                placeholder={language === 'fr' ? 'Ex: Marrakech - Ouarzazate - Merzouga' : 'Ex: Marrakech - Ouarzazate - Merzouga'}
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Date de Départ *' : 'Start Date *'}</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Durée (Jours) *' : 'Duration (Days) *'}</label>
                <input
                  type="number"
                  required
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-[#D4A017] block mb-1">{language === 'fr' ? 'Prix par Pilote (MAD) *' : 'Price Per Rider (MAD) *'}</label>
                <input
                  type="number"
                  required
                  value={formData.pricePerPilot}
                  onChange={(e) => setFormData({ ...formData, pricePerPilot: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#D4A017]/30 text-[#F4F4F2] font-bold focus:border-[#D4A017]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Min Pilotes' : 'Min Riders'}</label>
                <input
                  type="number"
                  value={formData.minPilots}
                  onChange={(e) => setFormData({ ...formData, minPilots: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Max Pilotes' : 'Max Riders'}</label>
                <input
                  type="number"
                  value={formData.maxPilots}
                  onChange={(e) => setFormData({ ...formData, maxPilots: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Guide Principal Assigné' : 'Assigned Lead Guide'}</label>
                <input
                  type="text"
                  value={formData.assignedGuide}
                  onChange={(e) => setFormData({ ...formData, assignedGuide: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{language === 'fr' ? 'Statut Actuel' : 'Current Status'}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Ouvert">{language === 'fr' ? 'Ouvert' : 'Open'}</option>
                  <option value="Confirmé">{language === 'fr' ? 'Confirmé' : 'Confirmed'}</option>
                  <option value="Terminé">{language === 'fr' ? 'Terminé' : 'Completed'}</option>
                  <option value="Annulé">{language === 'fr' ? 'Annulé' : 'Cancelled'}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D] mt-2">
              <button 
                type="button" 
                onClick={() => setIsOpenAdd(false)} 
                className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] cursor-pointer hover:bg-[#b88a10] transition-colors shadow-lg shadow-[#D4A017]/20"
              >
                {language === 'fr' ? 'Enregistrer le Circuit' : 'Save Tour'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ToursModule;