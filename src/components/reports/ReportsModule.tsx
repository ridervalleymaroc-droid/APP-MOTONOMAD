import React, { useState } from 'react';
import { BarChart3, Download, FileText, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface ReportsModuleProps {
  currency: 'MAD' | 'EUR' | 'USD';
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ currency }) => {
  const { language } = useLanguage();
  const [isExportingPnl, setIsExportingPnl] = useState(false);
  const [isExportingFleet, setIsExportingFleet] = useState(false);

  const downloadReport = (title: string, dataStr: string) => {
    const blob = new Blob([dataStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motonomad_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export P&L connecté en direct à Supabase
  const exportFinancials = async () => {
    try {
      setIsExportingPnl(true);
      const [revRes, expRes] = await Promise.all([
        supabase.from('revenues').select('*'),
        supabase.from('expenses').select('*')
      ]);

      const revenues = revRes.data || [];
      const expenses = expRes.data || [];

      let csv = 'Type,ID,Date,Category,Description,Amount\n';
      
      revenues.forEach((r: any) => {
        csv += `Revenue,${r.id},${r.date},${r.category},"${r.description || ''}",${r.amount}\n`;
      });

      expenses.forEach((e: any) => {
        csv += `Expense,${e.id},${e.date},${e.category},"${e.description || ''}",${e.amount}\n`;
      });

      downloadReport('financial_statement', csv);
    } catch (error) {
      console.error("Erreur export financier:", error);
    } finally {
      setIsExportingPnl(false);
    }
  };

  // Export Flotte connecté en direct à Supabase
  const exportFleet = async () => {
    try {
      setIsExportingFleet(true);
      const { data: vehicles, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;

      let csv = 'Plate,Brand,Model,Year,Status,Mileage,PurchasePrice\n';
      
      (vehicles || []).forEach((m: any) => {
        csv += `${m.registration_number || m.registrationNumber || ''},"${m.brand}","${m.model}",${m.year || 2024},${m.current_status || m.currentStatus || 'Available'},${m.mileage || 0},${m.purchase_price || m.purchasePrice || 0}\n`;
      });

      downloadReport('fleet_utilization_depreciation', csv);
    } catch (error) {
      console.error("Erreur export flotte:", error);
    } finally {
      setIsExportingFleet(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#D4A017]" /> 
          {language === 'fr' ? 'Rapports d’Activité de la Direction' : 'Executive Business Reports'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {language === 'fr'
            ? 'Exportez les comptes de résultat financiers complets, les journaux d’amortissement de la flotte, la LTV client et les performances des circuits au format CSV/PDF.'
            : 'Export full financial P&L, fleet depreciation logs, client LTV, and tour performance CSV/PDF records.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <FileText className="w-8 h-8 text-[#D4A017] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-base text-[#F4F4F2]">
                {language === 'fr' ? 'Compte de Résultat Financier (P&L)' : 'Financial P&L Statement'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {language === 'fr'
                  ? 'Audit détaillé et ventilé des revenus de location, des recettes de circuits et des dépenses opérationnelles.'
                  : 'Complete itemized audit of rental revenues, tour income, and operational expenses.'}
              </p>
            </div>
          </div>
          <button
            onClick={exportFinancials}
            disabled={isExportingPnl}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer"
          >
            {isExportingPnl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 stroke-[3]" />} 
            {language === 'fr' ? 'Télécharger le CSV Financier' : 'Download Financial CSV'}
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <FileText className="w-8 h-8 text-[#D4A017] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-base text-[#F4F4F2]">
                {language === 'fr' ? 'Rapport d’Amortissement & ROI de la Flotte' : 'Fleet Depreciation & ROI Report'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {language === 'fr'
                  ? 'Valeurs d’achat des motos, amortissement linéaire cumulé et revenu net.'
                  : 'Motorcycle purchase values, accumulated straight-line depreciation, and net revenue.'}
              </p>
            </div>
          </div>
          <button
            onClick={exportFleet}
            disabled={isExportingFleet}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors cursor-pointer"
          >
            {isExportingFleet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 stroke-[3]" />} 
            {language === 'fr' ? 'Télécharger le CSV de la Flotte' : 'Download Fleet CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;