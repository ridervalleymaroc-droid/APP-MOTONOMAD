import React, { useState } from 'react';
import { X, Calculator, ArrowRight, Award, Plus, Trash2, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { calculateInvestmentSimulation, formatCurrency } from '../../utils/calculations';
import { useLanguage } from '../../context/LanguageContext';

interface CompareModel {
  id: string;
  name: string;
  purchasePrice: number;
  additionalCosts: number;
  dailyPrice: number;
  expectedRentalDaysPerMonth: number;
  monthlyMaintenanceCost: number;
  annualInsuranceCost: number;
  otherAnnualCosts: number;
  usefulLifeYears: number;
  residualValue: number;
  estimatedResaleValue: number;
}

const DEFAULT_PRESETS: CompareModel[] = [
  {
    id: '1',
    name: 'Suzuki V-Strom 650 XT',
    purchasePrice: 95000,
    additionalCosts: 8000,
    dailyPrice: 750,
    expectedRentalDaysPerMonth: 18,
    monthlyMaintenanceCost: 800,
    annualInsuranceCost: 4500,
    otherAnnualCosts: 2000,
    usefulLifeYears: 5,
    residualValue: 30000,
    estimatedResaleValue: 45000,
  },
  {
    id: '2',
    name: 'Yamaha Ténéré 700',
    purchasePrice: 125000,
    additionalCosts: 10000,
    dailyPrice: 950,
    expectedRentalDaysPerMonth: 20,
    monthlyMaintenanceCost: 900,
    annualInsuranceCost: 5500,
    otherAnnualCosts: 2500,
    usefulLifeYears: 5,
    residualValue: 40000,
    estimatedResaleValue: 60000,
  },
  {
    id: '3',
    name: 'BMW F 850 GS Adventure',
    purchasePrice: 165000,
    additionalCosts: 15000,
    dailyPrice: 1200,
    expectedRentalDaysPerMonth: 16,
    monthlyMaintenanceCost: 1400,
    annualInsuranceCost: 7500,
    otherAnnualCosts: 3500,
    usefulLifeYears: 5,
    residualValue: 55000,
    estimatedResaleValue: 80000,
  },
];

interface InvestmentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: 'MAD' | 'EUR' | 'USD';
}

export const InvestmentSimulatorModal: React.FC<InvestmentSimulatorModalProps> = ({
  isOpen,
  onClose,
  currency = 'MAD',
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'simulator' | 'compare'>('simulator');
  const [models, setModels] = useState<CompareModel[]>(DEFAULT_PRESETS);

  // Single Simulator State
  const [simData, setSimData] = useState<CompareModel>({
    id: 'sim_active',
    name: 'New Fleet Addition Simulation',
    purchasePrice: 110000,
    additionalCosts: 9000,
    dailyPrice: 850,
    expectedRentalDaysPerMonth: 18,
    monthlyMaintenanceCost: 850,
    annualInsuranceCost: 5000,
    otherAnnualCosts: 2000,
    usefulLifeYears: 5,
    residualValue: 35000,
    estimatedResaleValue: 50000,
  });

  if (!isOpen) return null;

  const simResult = calculateInvestmentSimulation(simData);

  const handleUpdateSim = (field: keyof CompareModel, val: any) => {
    setSimData((prev) => ({ ...prev, [field]: Number(val) || 0 }));
  };

  const handleUpdateModel = (id: string, field: keyof CompareModel, val: any) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: field === 'name' ? val : Number(val) || 0 } : m))
    );
  };

  const handleAddModel = () => {
    const newId = Date.now().toString();
    setModels((prev) => [
      ...prev,
      {
        id: newId,
        name: `Option ${prev.length + 1}`,
        purchasePrice: 100000,
        additionalCosts: 5000,
        dailyPrice: 800,
        expectedRentalDaysPerMonth: 15,
        monthlyMaintenanceCost: 800,
        annualInsuranceCost: 5000,
        otherAnnualCosts: 2000,
        usefulLifeYears: 5,
        residualValue: 30000,
        estimatedResaleValue: 40000,
      },
    ]);
  };

  const handleRemoveModel = (id: string) => {
    if (models.length <= 1) return;
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  // Find best performing model by ROI in compare tab
  const computedModels = models.map((m) => ({
    model: m,
    res: calculateInvestmentSimulation(m),
  }));

  let bestModelId = '';
  let highestROI = -999;
  computedModels.forEach(({ model, res }) => {
    if (res.roi > highestROI) {
      highestROI = res.roi;
      bestModelId = model.id;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#161616] border border-[#2D2D2D] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A] bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4A017]/10 text-[#D4A017] border border-[#D4A017]/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {language === 'fr' ? 'Simulateur d’Investissement & Comparaison de Flotte' : 'Investment Simulator & Fleet Comparison'}
              </h3>
              <p className="text-xs text-zinc-400">
                {language === 'fr' 
                  ? 'Modélisez les rendements financiers, le ROI %, les délais de récupération et comparez les options d’investissement moto.'
                  : 'Model financial returns, ROI %, payback periods & compare motorcycle investment options.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#222222] p-1 rounded-xl border border-[#333333]">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'simulator'
                    ? 'bg-[#D4A017] text-[#111111]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'fr' ? 'Simulateur' : 'Simulator'}
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'compare'
                    ? 'bg-[#D4A017] text-[#111111]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'fr' ? 'Comparatif Côte à Côte' : 'Side-by-Side Comparison'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {activeTab === 'simulator' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inputs Column */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-2">
                  <span>{language === 'fr' ? 'Paramètres d’Entrée d’Investissement' : 'Investment Input Parameters'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D]">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Prix d’Achat (MAD)' : 'Purchase Price (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.purchasePrice}
                      onChange={(e) => handleUpdateSim('purchasePrice', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Frais d’Acquisition (MAD)' : 'Capitalized Acquisition Costs (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.additionalCosts}
                      onChange={(e) => handleUpdateSim('additionalCosts', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Tarif de Location Journalier (MAD)' : 'Daily Rental Rate (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.dailyPrice}
                      onChange={(e) => handleUpdateSim('dailyPrice', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Jours de Location Prévus / Mois' : 'Expected Rental Days / Month'}
                    </label>
                    <input
                      type="number"
                      max={30}
                      value={simData.expectedRentalDaysPerMonth}
                      onChange={(e) => handleUpdateSim('expectedRentalDaysPerMonth', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Coût de Maintenance / Mois (MAD)' : 'Maintenance Cost / Month (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.monthlyMaintenanceCost}
                      onChange={(e) => handleUpdateSim('monthlyMaintenanceCost', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Coût d’Assurance Annuel (MAD)' : 'Annual Insurance Cost (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.annualInsuranceCost}
                      onChange={(e) => handleUpdateSim('annualInsuranceCost', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Durée de Vie Utile (Années)' : 'Useful Life (Years)'}
                    </label>
                    <input
                      type="number"
                      value={simData.usefulLifeYears}
                      onChange={(e) => handleUpdateSim('usefulLifeYears', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Valeur Résiduelle Comptable (MAD)' : 'Accounting Residual Value (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.residualValue}
                      onChange={(e) => handleUpdateSim('residualValue', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Valeur de Revente Marché Est. (MAD)' : 'Estimated Market Resale Value (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.estimatedResaleValue}
                      onChange={(e) => handleUpdateSim('estimatedResaleValue', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      {language === 'fr' ? 'Autres Coûts Directs Annuels (MAD)' : 'Other Annual Direct Costs (MAD)'}
                    </label>
                    <input
                      type="number"
                      value={simData.otherAnnualCosts}
                      onChange={(e) => handleUpdateSim('otherAnnualCosts', e.target.value)}
                      className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-[#D4A017] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Outputs Column */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                  {language === 'fr' ? 'Rendements Financiers Calculés' : 'Calculated Financial Returns'}
                </h4>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1C1C] to-[#222222] border border-[#333333] space-y-4 shadow-xl">
                  {/* Top Highlight ROI */}
                  <div className="p-4 rounded-xl bg-black/40 border border-[#D4A017]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block font-semibold">
                        {language === 'fr' ? 'ROI Annuel Attendu' : 'Expected Annual ROI'}
                      </span>
                      <span
                        className={`text-3xl font-black font-mono ${
                          simResult.roi >= 25
                            ? 'text-emerald-400'
                            : simResult.roi >= 0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {simResult.roi}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-400 block font-semibold">
                        {language === 'fr' ? 'Délai de Récupération' : 'Payback Period'}
                      </span>
                      <span className="text-lg font-bold font-mono text-white">
                        {typeof simResult.paybackPeriodMonths === 'number'
                          ? language === 'fr' ? `${simResult.paybackPeriodMonths} Mois` : `${simResult.paybackPeriodMonths} Months`
                          : language === 'fr' ? 'Non récupéré' : 'Not Recovering'}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-400">{language === 'fr' ? 'Investissement Capital Total :' : 'Total Capital Investment:'}</span>
                      <span className="text-white font-bold">
                        {formatCurrency(simResult.totalInvestment, currency || 'MAD')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-400">{language === 'fr' ? 'Chiffre d’Affaires Mensuel Attendu :' : 'Expected Monthly Revenue:'}</span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(simResult.monthlyRevenue, currency || 'MAD')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-400">{language === 'fr' ? 'Chiffre d’Affaires Annuel Attendu :' : 'Expected Annual Revenue:'}</span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(simResult.annualRevenue, currency || 'MAD')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-400">{language === 'fr' ? 'Coûts d’Exploitation Annuels :' : 'Annual Operating Costs:'}</span>
                      <span className="text-rose-400 font-bold">
                        -{formatCurrency(simResult.annualOperatingCosts, currency || 'MAD')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-400">{language === 'fr' ? 'Amortissement Linéaire Annuel :' : 'Annual Straight-line Depreciation:'}</span>
                      <span className="text-amber-400 font-bold">
                        -{formatCurrency(simResult.annualDepreciation, currency || 'MAD')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-300 font-bold">{language === 'fr' ? 'Bénéfice Net Annuel :' : 'Annual Net Profit:'}</span>
                      <span className="text-[#D4A017] font-extrabold text-sm">
                        {formatCurrency(simResult.annualNetProfit, currency || 'MAD')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#2D2D2D]">
                      <span className="text-zinc-400">{language === 'fr' ? 'Valeur de Revente Marché Est. :' : 'Estimated Market Resale Value:'}</span>
                      <span className="text-sky-400 font-bold">
                        {formatCurrency(simResult.estimatedResaleValue, currency || 'MAD')}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation pill */}
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-[#333333] text-xs text-zinc-300">
                    <span className="font-bold text-[#D4A017]">{language === 'fr' ? 'Verdict Moteur de Décision : ' : 'Decision Engine Verdict: '}</span>
                    {simResult.roi >= 25 ? (
                      <span className="text-emerald-400 font-bold">
                        {language === 'fr' ? 'RECOMMANDÉ (ROI solide supérieur à l’objectif de 25%)' : 'RECOMMENDED (Strong ROI above 25% target)'}
                      </span>
                    ) : simResult.roi >= 0 ? (
                      <span className="text-amber-400 font-bold">
                        {language === 'fr' ? 'MODÉRÉ (Rendement positif, surveiller l’utilisation)' : 'MODERATE (Positive yield, monitor utilization)'}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        {language === 'fr' ? 'NON RECOMMANDÉ (Rendement de bénéfice net négatif)' : 'NOT RECOMMENDED (Negative net profit yield)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SIDE BY SIDE COMPARISON TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'fr' ? 'Matrice de Comparaison des Investissements Moto' : 'Motorcycle Investment Comparison Matrix'}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {language === 'fr' 
                      ? 'Comparez les prévisions de performance entre les modèles pour prendre des décisions d’acquisition de flotte fondées sur les données.'
                      : 'Compare performance forecasts across models to make data-driven fleet acquisition decisions.'}
                  </p>
                </div>
                <button
                  onClick={handleAddModel}
                  className="px-3.5 py-2 rounded-xl bg-[#D4A017] text-[#111111] font-bold text-xs hover:bg-[#e0ad24] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'fr' ? 'Ajouter un Modèle' : 'Add Model Option'}
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#111111] text-zinc-300 border-b border-[#2A2A2A]">
                      <th className="p-3 font-bold w-48">{language === 'fr' ? 'Métrique / Paramètre' : 'Metric / Parameter'}</th>
                      {computedModels.map(({ model }) => (
                        <th key={model.id} className="p-3 font-bold min-w-[200px]">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={model.name}
                              onChange={(e) => handleUpdateModel(model.id, 'name', e.target.value)}
                              className="bg-[#222222] text-white px-2 py-1 rounded border border-[#333333] font-bold text-xs w-full focus:border-[#D4A017] outline-none"
                            />
                            {models.length > 1 && (
                              <button
                                onClick={() => handleRemoveModel(model.id)}
                                className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-zinc-300 font-mono">
                    <tr>
                      <td className="p-3 font-sans font-semibold text-zinc-400">{language === 'fr' ? 'Prix d’Achat' : 'Purchase Price'}</td>
                      {computedModels.map(({ model }) => (
                        <td key={model.id} className="p-3">
                          <input
                            type="number"
                            value={model.purchasePrice}
                            onChange={(e) => handleUpdateModel(model.id, 'purchasePrice', e.target.value)}
                            className="bg-[#1A1A1A] text-white px-2 py-1 rounded border border-[#333333] text-xs w-full"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-sans font-semibold text-zinc-400">{language === 'fr' ? 'Prix de Location / Jour' : 'Daily Rental Price'}</td>
                      {computedModels.map(({ model }) => (
                        <td key={model.id} className="p-3">
                          <input
                            type="number"
                            value={model.dailyPrice}
                            onChange={(e) => handleUpdateModel(model.id, 'dailyPrice', e.target.value)}
                            className="bg-[#1A1A1A] text-white px-2 py-1 rounded border border-[#333333] text-xs w-full"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-sans font-semibold text-zinc-400">{language === 'fr' ? 'Jours Loc. / Mois' : 'Exp. Days/Month'}</td>
                      {computedModels.map(({ model }) => (
                        <td key={model.id} className="p-3">
                          <input
                            type="number"
                            value={model.expectedRentalDaysPerMonth}
                            onChange={(e) => handleUpdateModel(model.id, 'expectedRentalDaysPerMonth', e.target.value)}
                            className="bg-[#1A1A1A] text-white px-2 py-1 rounded border border-[#333333] text-xs w-full"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-[#181818]">
                      <td className="p-3 font-sans font-bold text-white">{language === 'fr' ? 'Investissement Total' : 'Total Investment'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td key={model.id} className="p-3 font-bold text-white">
                          {formatCurrency(res.totalInvestment, currency || 'MAD')}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-[#181818]">
                      <td className="p-3 font-sans font-bold text-white">{language === 'fr' ? 'Chiffre d’Affaires Annuel' : 'Annual Revenue'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td key={model.id} className="p-3 font-bold text-emerald-400">
                          {formatCurrency(res.annualRevenue, currency || 'MAD')}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-[#181818]">
                      <td className="p-3 font-sans font-bold text-white">{language === 'fr' ? 'Coûts d’Exploitation Annuels' : 'Annual Operating Cost'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td key={model.id} className="p-3 font-bold text-rose-400">
                          {formatCurrency(res.annualOperatingCosts, currency || 'MAD')}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-[#181818]">
                      <td className="p-3 font-sans font-bold text-white">{language === 'fr' ? 'Amortissement Annuel' : 'Annual Depreciation'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td key={model.id} className="p-3 font-bold text-amber-400">
                          {formatCurrency(res.annualDepreciation, currency || 'MAD')}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-[#202020]">
                      <td className="p-3 font-sans font-extrabold text-[#D4A017]">{language === 'fr' ? 'Bénéfice Net Annuel' : 'Annual Net Profit'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td key={model.id} className="p-3 font-extrabold text-[#D4A017]">
                          {formatCurrency(res.annualNetProfit, currency || 'MAD')}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-[#222222]">
                      <td className="p-3 font-sans font-extrabold text-white">{language === 'fr' ? 'ROI % Prévisionnel' : 'Forecasted ROI %'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td
                          key={model.id}
                          className={`p-3 font-extrabold text-sm ${
                            model.id === bestModelId ? 'text-emerald-400 bg-emerald-950/30' : 'text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{res.roi}%</span>
                            {model.id === bestModelId && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans font-bold">
                                {language === 'fr' ? 'MEILLEUR CHOIX' : 'BEST CHOICE'}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-sans font-semibold text-zinc-400">{language === 'fr' ? 'Délai de Récupération' : 'Payback Period'}</td>
                      {computedModels.map(({ model, res }) => (
                        <td key={model.id} className="p-3 font-bold text-white">
                          {typeof res.paybackPeriodMonths === 'number'
                            ? language === 'fr' ? `${res.paybackPeriodMonths} Mois` : `${res.paybackPeriodMonths} Months`
                            : language === 'fr' ? 'Non récupéré' : 'Not Recovering'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#111111] flex justify-between items-center text-xs text-zinc-400">
          <span>
            {language === 'fr' 
              ? 'La modélisation des investissements utilise l’amortissement comptable linéaire et les répartitions de charges.'
              : 'Investment modeling uses straight-line accounting depreciation and operating allocations.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#D4A017] text-[#111111] hover:bg-[#e0ad24] font-bold transition-colors cursor-pointer"
          >
            {language === 'fr' ? 'Fermer le Simulateur' : 'Close Simulator'}
          </button>
        </div>
      </div>
    </div>
  );
};