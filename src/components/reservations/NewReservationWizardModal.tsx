import React, { useState } from 'react';
import {
  User, Bike, Calendar, DollarSign, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Plus
} from 'lucide-react';
import { Client, Motorcycle, Reservation } from '../../types';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { calculateRentalDays, calculateRentalPrice, isMotorcycleAvailable } from '../../utils/calculations';
import { supabase } from '../../services/supabase';

interface NewReservationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  motorcycles: Motorcycle[];
  reservations: Reservation[];
  currency: string;
  onComplete: () => void;
}

export const NewReservationWizardModal: React.FC<NewReservationWizardModalProps> = ({
  isOpen,
  onClose,
  clients,
  motorcycles,
  reservations,
  currency,
  onComplete,
}) => {
  const { t, formatCurrencyVal } = useLanguage();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPassport, setNewClientPassport] = useState('');
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);

  const [selectedBikeId, setSelectedBikeId] = useState<string>(motorcycles[0]?.id || '');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partially Paid' | 'Unpaid'>('Partially Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer'>('Card');
  const [amountPaid, setAmountPaid] = useState<number>(1500);
  const [depositAmount, setDepositAmount] = useState<number>(15000);

  const selectedBike = motorcycles.find((m) => m.id === selectedBikeId) as any;
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const isBikeAvailable = selectedBikeId && startDate && endDate
    ? isMotorcycleAvailable(selectedBikeId, startDate, endDate, reservations)
    : true;

  const rentalDays = calculateRentalDays(startDate, endDate);
  const dailyRate = selectedBike ? (selectedBike.dailyRate || selectedBike.dailyPrice || 500) : 500;
  const totalPrice = selectedBike ? calculateRentalPrice(selectedBike, rentalDays) : rentalDays * dailyRate;

  const handleNextStep = async () => {
    if (step === 1 && isCreatingNewClient && newClientName) {
      try {
        const nameParts = newClientName.trim().split(' ');
        const firstName = nameParts[0] || newClientName;
        const lastName = nameParts.slice(1).join(' ') || 'N/A';

        const { data, error } = await supabase.from('clients').insert([{
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}@client.com`,
          phone: newClientPhone || '+212600000000',
          nationality: 'Moroccan',
          country_of_residence: 'Morocco',
          passport_number: newClientPassport || 'PASS00000'
        }]).select().single();

        if (error) throw error;
        if (data) {
          setSelectedClientId(data.id);
        }
      } catch (err) {
        console.error("Erreur création client wizard:", err);
      }
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        client_id: selectedClientId,
        vehicle_id: selectedBikeId,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        amount_paid: amountPaid,
        status: 'Confirmed'
      };

      const { error } = await supabase.from('reservations').insert([payload]);
      if (error) throw error;

      await supabase.from('vehicles').update({ status: 'RESERVED' }).eq('id', selectedBikeId);

      onComplete();
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement réservation wizard:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('wizard.step_' + step + '_title')}
      subtitle={`Étape ${step} sur 6 | Mobile Booking Wizard`}
      maxWidth="xl"
    >
      {/* Progress Bar */}
      <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className="bg-[#D4A017] h-full transition-all duration-300"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* STEP 1: CLIENT */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D2D2D]">
              <span className="font-bold text-sm text-[#F4F4F2] flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4A017]" /> {t('wizard.step_1_title')}
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                className="text-xs text-[#D4A017] hover:underline font-bold cursor-pointer"
              >
                {isCreatingNewClient ? t('wizard.select_existing_client') : t('wizard.or_create_new')}
              </button>
            </div>

            {!isCreatingNewClient ? (
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  {t('wizard.select_existing_client')}
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-semibold text-sm cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Nom Complet *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+212 600-000000"
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Passeport / CINE</label>
                  <input
                    type="text"
                    value={newClientPassport}
                    onChange={(e) => setNewClientPassport(e.target.value)}
                    placeholder="E12345678"
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: MOTORCYCLE */}
        {step === 2 && (
          <div className="space-y-3">
            <span className="font-bold text-sm text-[#F4F4F2] flex items-center gap-2 pb-2 border-b border-[#2D2D2D]">
              <Bike className="w-4 h-4 text-[#D4A017]" /> {t('wizard.step_2_title')}
            </span>

            {!isBikeAvailable && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{t('wizard.availability_warning')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {motorcycles.map((bikeItem: any) => {
                const isSelected = bikeItem.id === selectedBikeId;
                return (
                  <button
                    key={bikeItem.id}
                    type="button"
                    onClick={() => setSelectedBikeId(bikeItem.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4A017]/15 border-[#D4A017] text-white'
                        : 'bg-[#242424] border-[#2F2F2F] text-zinc-300 hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <img
                      src={bikeItem.imageUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&auto=format&fit=crop&q=80'}
                      alt={bikeItem.model}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#3D3D3D]"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs truncate">{bikeItem.brand} {bikeItem.model}</span>
                      <span className="text-[10px] text-zinc-400">{bikeItem.category} • {bikeItem.registrationNumber || bikeItem.regNumber || 'N/A'}</span>
                      <span className="text-xs font-extrabold text-[#D4A017] mt-0.5">
                        {formatCurrencyVal(bikeItem.dailyRate || bikeItem.dailyPrice || 1400, currency)} / jour
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: DATES */}
        {step === 3 && (
          <div className="space-y-3">
            <span className="font-bold text-sm text-[#F4F4F2] flex items-center gap-2 pb-2 border-b border-[#2D2D2D]">
              <Calendar className="w-4 h-4 text-[#D4A017]" /> {t('wizard.step_3_title')}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{t('wizard.start_date')} *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-300 block mb-1">{t('wizard.end_date')} *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-semibold"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] flex items-center justify-between">
              <span className="text-zinc-400">{t('wizard.rental_days')} :</span>
              <span className="font-extrabold text-sm text-[#D4A017]">{rentalDays} jours</span>
            </div>
          </div>
        )}

        {/* STEP 4: PRICING */}
        {step === 4 && (
          <div className="space-y-3">
            <span className="font-bold text-sm text-[#F4F4F2] flex items-center gap-2 pb-2 border-b border-[#2D2D2D]">
              <DollarSign className="w-4 h-4 text-[#D4A017]" /> {t('wizard.step_4_title')}
            </span>

            <div className="bg-[#222222] p-3.5 rounded-xl border border-[#333333] space-y-2">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Moto ({selectedBike?.brand} {selectedBike?.model})</span>
                <span>{formatCurrencyVal(dailyRate, currency)} / j</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Durée</span>
                <span>{rentalDays} jours</span>
              </div>
              <div className="border-t border-[#333333] pt-2 flex items-center justify-between font-extrabold text-sm text-white">
                <span>Tarif Total Location</span>
                <span className="text-[#D4A017]">{formatCurrencyVal(totalPrice, currency)}</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{t('wizard.deposit_amount')} (MAD)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-bold"
              />
            </div>
          </div>
        )}

        {/* STEP 5: PAYMENT */}
        {step === 5 && (
          <div className="space-y-3">
            <span className="font-bold text-sm text-[#F4F4F2] flex items-center gap-2 pb-2 border-b border-[#2D2D2D]">
              <DollarSign className="w-4 h-4 text-[#D4A017]" /> {t('wizard.step_5_title')}
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Statut Règlement</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Paid">Payé (Paid)</option>
                  <option value="Partially Paid">Acompte (Partially Paid)</option>
                  <option value="Unpaid">Non payé (Unpaid)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">{t('wizard.payment_method')}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] cursor-pointer"
                >
                  <option value="Card">Carte Bancaire</option>
                  <option value="Cash">Espèces (MAD / EUR)</option>
                  <option value="Transfer">Virement / Transfert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">{t('wizard.amount_paid')} (MAD)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-bold"
              />
            </div>
          </div>
        )}

        {/* STEP 6: CONFIRMATION */}
        {step === 6 && (
          <div className="space-y-3">
            <span className="font-bold text-sm text-[#F4F4F2] flex items-center gap-2 pb-2 border-b border-[#2D2D2D]">
              <CheckCircle2 className="w-4 h-4 text-[#D4A017]" /> Récapitulatif Final
            </span>

            <div className="bg-[#222222] p-4 rounded-xl border border-[#333333] space-y-2 text-xs leading-relaxed">
              <div className="flex justify-between border-b border-[#333] pb-1.5">
                <span className="text-zinc-400">Client :</span>
                <span className="font-bold text-white">{isCreatingNewClient ? newClientName : selectedClient?.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-1.5">
                <span className="text-zinc-400">Moto :</span>
                <span className="font-bold text-white">{selectedBike?.brand} {selectedBike?.model}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-1.5">
                <span className="text-zinc-400">Période :</span>
                <span className="font-bold text-white">{startDate} au {endDate} ({rentalDays} j)</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-1.5">
                <span className="text-zinc-400">Montant Total :</span>
                <span className="font-extrabold text-[#D4A017]">{formatCurrencyVal(totalPrice, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Caution Requis :</span>
                <span className="font-bold text-zinc-200">{formatCurrencyVal(depositAmount, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2D2D2D]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> {t('common.back')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] flex items-center gap-1 hover:bg-[#b88a10] cursor-pointer"
            >
              {t('common.next')} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-black bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] shadow-lg shadow-[#D4A017]/15 cursor-pointer"
            >
              {t('wizard.confirm_booking')}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};