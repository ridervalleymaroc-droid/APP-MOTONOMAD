import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calculator, Plus, ArrowUpRight, DollarSign, Bike, ShieldCheck, PieChart, RefreshCw 
} from 'lucide-react';
import { Investment } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency, calculateInvestmentMetrics } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface InvestmentsModuleProps {
  investments: Investment[]; // Conservé pour la signature React
  currency: 'MAD' | 'EUR' | 'USD';
  onUpdate: () => void;
}

export const InvestmentsModule: React.FC<InvestmentsModuleProps> = ({
  currency,
  onUpdate,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'simulator'>('portfolio');

  // ----------------------------------------------------
  // ÉTATS DE LA BASE DE DONNÉES EN DIRECT (Supabase)
  // ----------------------------------------------------
  const [liveInvestments, setLiveInvestments] = useState<Investment[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const fetchInvestmentsData = async () => {
    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('investment_date', { ascending: false });

      if (error) throw error;

      const mappedInvestments = (data || []).map((inv: any) => ({
        id: inv.id,
        title: inv.title,
        titleFr: inv.title,
        investmentType: inv.category || 'Motorcycle',
        date: inv.investment_date,
        totalInvestment: Number(inv.total_capital) || 0,
        actualRevenue: Number(inv.real_revenue) || 0,
        netProfit: Number(inv.net_profit) || 0,
      })) as unknown as Investment[]; // Double cast pour résoudre l'erreur TypeScript

      setLiveInvestments(mappedInvestments);
    } catch (error) {
      console.error("Erreur de synchronisation des investissements:", error);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchInvestmentsData();
  }, []);

  // Investment Simulator State
  const [simPrice1, setSimPrice1] = useState(110000); // V-Strom 650
  const [simRate1, setSimRate1] = useState(800);
  const [simUtil1, setSimUtil1] = useState(55); // %

  const [simPrice2, setSimPrice2] = useState(125000); // V-Strom 800 DE
  const [simRate2, setSimRate2] = useState(850);
  const [simUtil2, setSimUtil2] = useState(60); // %

  const [simPrice3, setSimPrice3] = useState(135000); // Ténéré 700
  const [simRate3, setSimRate3] = useState(950);
  const [simUtil3, setSimUtil3] = useState(65); // %

  const calcSim = (purchasePrice: number, dailyRate: number, utilPercent: number) => {
    const daysPerMonth = (30 * utilPercent) / 100;
    const monthlyRev = daysPerMonth * dailyRate;
    const annualRev = monthlyRev * 12;
    const monthlyMaint = 800;
    const annualMaint = monthlyMaint * 12;
    const annualInsurance = 12000;
    const annualDepreciation = (purchasePrice - purchasePrice * 0.4) / 5;
    const annualNetProfit = annualRev - annualMaint - annualInsurance - annualDepreciation;
    const roi = (annualNetProfit / purchasePrice) * 100;
    const paybackMonths = annualNetProfit > 0 ? (purchasePrice / (annualNetProfit / 12)) : 0;

    return {
      monthlyRev,
      annualRev,
      annualNetProfit,
      roi: Math.round(roi * 10) / 10,
      paybackMonths: Math.round(paybackMonths * 10) / 10,
    };
  };

  const model1 = calcSim(simPrice1, simRate1, simUtil1);
  const model2 = calcSim(simPrice2, simRate2, simUtil2);
  const model3 = calcSim(simPrice3, simRate3, simUtil3);

  if (isLoadingDb && liveInvestments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">Chargement des investissements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#D4A017]" /> 
            {language === 'fr' ? 'Analyse des Investissements et ROI de la Flotte' : 'Capital Investment & Fleet ROI Analysis'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'fr' 
              ? 'Suivez les performances des actifs, les périodes de récupération et comparez les investissements prédictifs.' 
              : 'Track asset performance, payback periods, and run predictive investment comparisons.'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#262626] border border-[#333333] p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'portfolio' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Investissements Actifs' : 'Active Investments'} ({liveInvestments.length})
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'simulator' ? 'bg-[#D4A017] text-[#1C1C1C]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 inline mr-1" /> 
            {language === 'fr' ? 'Simulateur d\'Investissement' : 'Investment Simulator'}
          </button>
        </div>
      </div>

      {/* Active Investments */}
      {activeTab === 'portfolio' && (
        liveInvestments.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 bg-[#1C1C1C] rounded-2xl border border-[#2D2D2D]">
            {language === 'fr' ? 'Aucun investissement actif enregistré dans le cloud.' : 'No active investments registered in the cloud.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveInvestments.map((inv) => {
              const metrics = calculateInvestmentMetrics(inv);
              
              let typeLabel: string = inv.investmentType;
              if (language === 'fr') {
                if (typeLabel === 'Motorcycle') typeLabel = 'Moto';
                if (typeLabel === 'Infrastructure') typeLabel = 'Infrastructure';
                if (typeLabel === 'Equipment') typeLabel = 'Équipement';
              }

              return (
                <div key={inv.id} className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D4A017] block">{typeLabel}</span>
                    <h3 className="font-bold text-base text-[#F4F4F2] mt-0.5">
                      {language === 'fr' ? (inv as any).titleFr || inv.title : inv.title}
                    </h3>
                    <span className="text-xs text-zinc-400">
                      {language === 'fr' ? 'Date :' : 'Date:'} {inv.date}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{language === 'fr' ? 'Capital Total :' : 'Total Capital:'}</span>
                      <span className="font-bold text-[#F4F4F2]">{formatCurrency(inv.totalInvestment, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{language === 'fr' ? 'Revenu Réel :' : 'Actual Revenue:'}</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(inv.actualRevenue, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{language === 'fr' ? 'Bénéfice Net :' : 'Net Profit:'}</span>
                      <span className="font-bold text-[#D4A017]">{formatCurrency(metrics.netProfit, currency)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-[#252525] border border-[#333333]">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">ROI</span>
                      <span className="font-black text-emerald-400 text-sm">+{metrics.roi}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#252525] border border-[#333333]">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                        {language === 'fr' ? 'Amortissement' : 'Payback'}
                      </span>
                      <span className="font-black text-[#D4A017] text-sm">
                        {metrics.paybackPeriodMonths} {language === 'fr' ? 'Mois' : 'Months'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Predictive Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#222222] border border-[#333333] text-xs leading-relaxed text-zinc-300">
            <span className="font-bold text-[#D4A017] block mb-1">
              {language === 'fr' ? 'Moteur de Comparaison d\'Investissements Motonomad' : 'Motonomad Investment Comparison Engine'}
            </span>
            {language === 'fr' 
              ? 'Comparez le ROI attendu et les délais de rentabilité de 3 modèles de motos potentiels avant de passer commande.'
              : 'Compare expected ROI and payback periods across 3 potential motorcycle models before making purchase orders.'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Model 1 */}
            <div className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4">
              <h3 className="font-black text-lg text-[#F4F4F2] border-b border-[#2D2D2D] pb-2">
                {language === 'fr' ? 'Option A :' : 'Option A:'} Suzuki V-Strom 650
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Prix d\'Achat' : 'Purchase Price'} ({currency})</label>
                  <input
                    type="number"
                    value={simPrice1}
                    onChange={(e) => setSimPrice1(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Prix de Location Journalier' : 'Daily Rental Price'} ({currency})</label>
                  <input
                    type="number"
                    value={simRate1}
                    onChange={(e) => setSimRate1(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Taux d\'Utilisation Prévu' : 'Expected Utilization'} % ({simUtil1}%)</label>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={simUtil1}
                    onChange={(e) => setSimUtil1(Number(e.target.value))}
                    className="w-full accent-[#D4A017] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333] space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'Bénéfice Net Annuel Est. :' : 'Est. Annual Net Profit:'}</span> <span className="font-bold text-emerald-400">{formatCurrency(model1.annualNetProfit, currency)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'ROI Annuel Est. :' : 'Est. Annual ROI:'}</span> <span className="font-bold text-[#D4A017]">+{model1.roi}%</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'Période d\'Amortissement Est. :' : 'Est. Payback Period:'}</span> <span className="font-bold text-[#F4F4F2]">{model1.paybackMonths} {language === 'fr' ? 'mois' : 'months'}</span></div>
              </div>
            </div>

            {/* Model 2 */}
            <div className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4">
              <h3 className="font-black text-lg text-[#F4F4F2] border-b border-[#2D2D2D] pb-2">
                {language === 'fr' ? 'Option B :' : 'Option B:'} Suzuki V-Strom 800 DE
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Prix d\'Achat' : 'Purchase Price'} ({currency})</label>
                  <input
                    type="number"
                    value={simPrice2}
                    onChange={(e) => setSimPrice2(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Prix de Location Journalier' : 'Daily Rental Price'} ({currency})</label>
                  <input
                    type="number"
                    value={simRate2}
                    onChange={(e) => setSimRate2(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Taux d\'Utilisation Prévu' : 'Expected Utilization'} % ({simUtil2}%)</label>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={simUtil2}
                    onChange={(e) => setSimUtil2(Number(e.target.value))}
                    className="w-full accent-[#D4A017] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333] space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'Bénéfice Net Annuel Est. :' : 'Est. Annual Net Profit:'}</span> <span className="font-bold text-emerald-400">{formatCurrency(model2.annualNetProfit, currency)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'ROI Annuel Est. :' : 'Est. Annual ROI:'}</span> <span className="font-bold text-[#D4A017]">+{model2.roi}%</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'Période d\'Amortissement Est. :' : 'Est. Payback Period:'}</span> <span className="font-bold text-[#F4F4F2]">{model2.paybackMonths} {language === 'fr' ? 'mois' : 'months'}</span></div>
              </div>
            </div>

            {/* Model 3 */}
            <div className="p-6 rounded-2xl bg-[#1C1C1C] border border-[#2D2D2D] shadow-xl space-y-4">
              <h3 className="font-black text-lg text-[#F4F4F2] border-b border-[#2D2D2D] pb-2">
                {language === 'fr' ? 'Option C :' : 'Option C:'} Yamaha Ténéré 700
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Prix d\'Achat' : 'Purchase Price'} ({currency})</label>
                  <input
                    type="number"
                    value={simPrice3}
                    onChange={(e) => setSimPrice3(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Prix de Location Journalier' : 'Daily Rental Price'} ({currency})</label>
                  <input
                    type="number"
                    value={simRate3}
                    onChange={(e) => setSimRate3(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">{language === 'fr' ? 'Taux d\'Utilisation Prévu' : 'Expected Utilization'} % ({simUtil3}%)</label>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={simUtil3}
                    onChange={(e) => setSimUtil3(Number(e.target.value))}
                    className="w-full accent-[#D4A017] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#252525] border border-[#333333] space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'Bénéfice Net Annuel Est. :' : 'Est. Annual Net Profit:'}</span> <span className="font-bold text-emerald-400">{formatCurrency(model3.annualNetProfit, currency)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'ROI Annuel Est. :' : 'Est. Annual ROI:'}</span> <span className="font-bold text-[#D4A017]">+{model3.roi}%</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{language === 'fr' ? 'Période d\'Amortissement Est. :' : 'Est. Payback Period:'}</span> <span className="font-bold text-[#F4F4F2]">{model3.paybackMonths} {language === 'fr' ? 'mois' : 'months'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsModule;