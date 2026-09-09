import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const { language } = useLanguage();

  const translateStatus = (st: string) => {
    if (language !== 'fr') return st;

    switch (st.toLowerCase()) {
      // Paiements & Statuts généraux
      case 'paid': return 'Payé';
      case 'partial': return 'Partiel';
      case 'pending': return 'En attente';
      case 'quote': return 'Devis';
      case 'inquiry': return 'Demande';
      case 'draft': return 'Brouillon';
      case 'scheduled': return 'Planifié';
      case 'completed': return 'Terminé';
      case 'open': return 'Ouvert';
      
      // Réservations & Véhicules
      case 'confirmed': return 'Confirmé';
      case 'active': return 'Actif';
      case 'rented': return 'Loué';
      case 'available': return 'Disponible';
      case 'reserved': return 'Réservé';
      case 'ready': return 'Prêt';
      case 'in progress': return 'En cours';
      case 'under review': return 'En révision';
      case 'maintenance': return 'En maintenance';
      case 'damaged': return 'Endommagé';
      case 'refunded': return 'Remboursé';
      case 'overdue': return 'En retard';
      case 'needs repair': return 'Réparation nécessaire';
      case 'out of service': return 'Hors service';
      case 'cancelled': return 'Annulé';
      case 'retired': return 'Retiré';
      case 'lost': return 'Perdu';
      case 'sold': return 'Vendu';
      case 'returned': return 'Retourné';
      case 'closed': return 'Clôturé';
      
      default: return st;
    }
  };

  let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';

  const normalized = status.toLowerCase();

  if (['available', 'active', 'paid', 'confirmed', 'completed', 'open'].includes(normalized)) {
    colorClass = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
  } else if (['reserved', 'pending', 'quote', 'inquiry', 'partial', 'draft', 'scheduled'].includes(normalized)) {
    colorClass = 'bg-amber-950/40 text-amber-400 border-amber-800/60';
  } else if (['rented', 'ready', 'in progress', 'under review'].includes(normalized)) {
    colorClass = 'bg-sky-950/40 text-sky-400 border-sky-800/60';
  } else if (['maintenance', 'damaged', 'refunded', 'overdue', 'needs repair'].includes(normalized)) {
    colorClass = 'bg-rose-950/40 text-rose-400 border-rose-800/60';
  } else if (['out of service', 'cancelled', 'retired', 'lost', 'sold'].includes(normalized)) {
    colorClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }

  const sizeClass = size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-medium' 
    : size === 'lg' 
    ? 'px-3 py-1 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClass} ${sizeClass} tracking-wide whitespace-nowrap`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {translateStatus(status)}
    </span>
  );
};

export default Badge;