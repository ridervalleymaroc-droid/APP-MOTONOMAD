import React, { useState, useRef } from 'react';
import { Key, CheckCircle2, Camera, Fuel, Gauge, PenTool, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Reservation, HandoverDetails, Motorcycle } from '../../types';
import { Modal } from '../common/Modal';
import { dbStore } from '../../services/db';
import { useLanguage } from '../../context/LanguageContext';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  mode: 'checkout' | 'checkin';
  onComplete: () => void;
}

export const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  isOpen,
  onClose,
  reservation,
  mode,
  onComplete,
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [mileage, setMileage] = useState<number>(() => reservation.motorcycleName ? 14200 : 12000);
  const [fuel, setFuel] = useState<number>(100);
  const [conditionNotes, setConditionNotes] = useState('');
  const [tiresOk, setTiresOk] = useState(true);
  const [brakesOk, setBrakesOk] = useState(true);
  const [lightsOk, setLightsOk] = useState(true);
  const [chainOk, setChainOk] = useState(true);
  const [bodyworkOk, setBodyworkOk] = useState(true);
  const [scratchesDamage, setScratchesDamage] = useState('');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&auto=format&fit=crop&q=80'
  ]);
  const [additionalCharges, setAdditionalCharges] = useState(0);

  // Digital Canvas Signature Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const handleAddPhoto = () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=300&auto=format&fit=crop&q=80'
    ];
    const nextPhoto = mockPhotos[photos.length % mockPhotos.length];
    setPhotos([...photos, nextPhoto]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let sigData = `${reservation.clientName} (Signed Digital)`;
    if (canvasRef.current && hasSignature) {
      try {
        sigData = canvasRef.current.toDataURL();
      } catch {
        // Fallback
      }
    }

    const handoverData: HandoverDetails = {
      date: new Date().toISOString(),
      mileage,
      fuelLevelPercentage: fuel,
      conditionNotes: conditionNotes || (mode === 'checkout' ? 'Check-out OK' : 'Check-in OK'),
      tiresOk,
      brakesOk,
      lightsOk,
      chainOk,
      scratchesDamage: scratchesDamage || 'None',
      equipmentIncluded: ['Helmet', 'Side Panniers', 'GPS Lock'],
      customerSignature: sigData,
      employeeSignature: 'Staff Agent Motonomad',
      additionalCharges,
    };

    if (mode === 'checkout') {
      dbStore.updateItem<Reservation>('reservations', reservation.id, {
        checkoutInfo: handoverData,
        status: 'Active',
      });
      dbStore.updateItem<Motorcycle>('motorcycles', reservation.motorcycleId, {
        currentStatus: 'Rented',
        currentMileage: mileage,
      });
    } else {
      dbStore.updateItem<Reservation>('reservations', reservation.id, {
        checkinInfo: handoverData,
        status: 'Returned',
      });
      dbStore.updateItem<Motorcycle>('motorcycles', reservation.motorcycleId, {
        currentStatus: 'Available',
        currentMileage: mileage,
      });
    }

    onComplete();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'checkout' ? t('handover.checkout_title') : t('handover.checkin_title')}
      subtitle={`${reservation.clientName} | ${reservation.motorcycleName} (${reservation.regNumber})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Header summary badge */}
        <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] flex items-center justify-between">
          <span className="font-bold text-[#D4A017] flex items-center gap-2">
            {mode === 'checkout' ? <Key className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {mode === 'checkout' ? t('handover.checkout_title') : t('handover.checkin_title')}
          </span>
          <span className="text-zinc-400 font-mono font-bold">N° {reservation.id}</span>
        </div>

        {/* Mileage & Fuel level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-zinc-300 block mb-1 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-[#D4A017]" /> {t('handover.mileage')} *
            </label>
            <input
              type="number"
              required
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2] font-bold text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-300 block mb-1 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-[#D4A017]" /> {t('handover.fuel_level')}
            </label>
            {/* Touch Radio Pills */}
            <div className="grid grid-cols-5 gap-1 bg-[#262626] p-1 rounded-xl border border-[#333333]">
              {[
                { val: 10, label: t('handover.fuel_empty') },
                { val: 25, label: t('handover.fuel_quarter') },
                { val: 50, label: t('handover.fuel_half') },
                { val: 75, label: t('handover.fuel_three_quarter') },
                { val: 100, label: t('handover.fuel_full') },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => setFuel(f.val)}
                  className={`py-1.5 rounded-lg font-bold text-[10px] text-center transition-colors ${
                    fuel === f.val
                      ? 'bg-[#D4A017] text-[#1C1C1C]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Condition Checklist */}
        <div className="p-3.5 rounded-xl bg-[#222222] border border-[#333333] space-y-2">
          <span className="font-bold text-xs text-[#D4A017] block">
            {t('handover.condition_checklist')}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-[#2A2A2A] p-2 rounded-lg border border-[#383838]">
              <input type="checkbox" checked={tiresOk} onChange={(e) => setTiresOk(e.target.checked)} className="accent-[#D4A017]" />
              <span className="font-semibold">{t('handover.tires')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[#2A2A2A] p-2 rounded-lg border border-[#383838]">
              <input type="checkbox" checked={brakesOk} onChange={(e) => setBrakesOk(e.target.checked)} className="accent-[#D4A017]" />
              <span className="font-semibold">{t('handover.brakes')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[#2A2A2A] p-2 rounded-lg border border-[#383838]">
              <input type="checkbox" checked={lightsOk} onChange={(e) => setLightsOk(e.target.checked)} className="accent-[#D4A017]" />
              <span className="font-semibold">{t('handover.lights')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[#2A2A2A] p-2 rounded-lg border border-[#383838]">
              <input type="checkbox" checked={chainOk} onChange={(e) => setChainOk(e.target.checked)} className="accent-[#D4A017]" />
              <span className="font-semibold">{t('handover.chain')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-[#2A2A2A] p-2 rounded-lg border border-[#383838]">
              <input type="checkbox" checked={bodyworkOk} onChange={(e) => setBodyworkOk(e.target.checked)} className="accent-[#D4A017]" />
              <span className="font-semibold">{t('handover.bodywork')}</span>
            </label>
          </div>
        </div>

        {/* Photos Attachment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#D4A017]" /> {t('handover.photos_title')}
            </label>
            <button
              type="button"
              onClick={handleAddPhoto}
              className="text-xs text-[#D4A017] hover:underline font-bold flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {t('handover.add_photo')}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {photos.map((p, idx) => (
              <img
                key={idx}
                src={p}
                alt="Inspection"
                className="w-16 h-16 rounded-xl object-cover border border-[#3A3A3A] shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Remarks / Scratches */}
        <div>
          <label className="font-bold text-zinc-300 block mb-1">
            {t('handover.notes_comments')}
          </label>
          <input
            type="text"
            value={scratchesDamage}
            onChange={(e) => setScratchesDamage(e.target.value)}
            placeholder="Ex: Micro-rayures carénage droit, aucun dommage majeur..."
            className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
          />
        </div>

        {mode === 'checkin' && (
          <div>
            <label className="font-bold text-rose-400 block mb-1">
              Frais de Nettoyage / Rayures Supplémentaires (MAD)
            </label>
            <input
              type="number"
              value={additionalCharges}
              onChange={(e) => setAdditionalCharges(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#333333] text-[#F4F4F2]"
            />
          </div>
        )}

        {/* Digital Signature Canvas Pad */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-[#D4A017]" /> {t('handover.signature_title')} *
            </label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {t('handover.clear_signature')}
            </button>
          </div>
          <div className="bg-[#181818] border border-[#333333] rounded-xl p-1 relative touch-none">
            <canvas
              ref={canvasRef}
              width={500}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-24 bg-[#141414] rounded-lg cursor-crosshair"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 text-xs italic">
                Signer ici à l'écran tactile / Touch screen signature
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#2D2D2D]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors shadow-lg shadow-[#D4A017]/10"
          >
            {mode === 'checkout' ? t('handover.complete_checkout') : t('handover.complete_checkin')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
