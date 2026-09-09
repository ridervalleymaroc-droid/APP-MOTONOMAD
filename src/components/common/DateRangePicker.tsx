import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DateFilterRange } from '../../types';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  className?: string;
}

const toISO = (d: Date) => d.toISOString().split('T')[0];
const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const isBetween = (day: Date, start: Date, end: Date) => day > start && day < end;

const getMonthAnchorFromDate = (dateValue: string) => {
  const base = dateValue ? parseISO(dateValue) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), 1);
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = '',
}) => {
  const { language } = useLanguage();

  const weekdaysShort = useMemo(
    () =>
      language === 'fr'
        ? ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI']
        : ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    [language]
  );

  const monthNames = useMemo(
    () =>
      language === 'fr'
        ? [
            'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
            'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
          ]
        : [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
          ],
    [language]
  );

  const [leftAnchor, setLeftAnchor] = useState<Date>(() => getMonthAnchorFromDate(startDate));

  useEffect(() => {
    const nextAnchor = getMonthAnchorFromDate(startDate);
    setLeftAnchor((prev) => {
      const prevKey = prev.getFullYear() * 12 + prev.getMonth();
      const nextKey = nextAnchor.getFullYear() * 12 + nextAnchor.getMonth();
      return prevKey === nextKey ? prev : nextAnchor;
    });
  }, [startDate]);

  const [selectionPhase, setSelectionPhase] = useState<'start' | 'end'>('start');

  const rightAnchor = useMemo(
    () => new Date(leftAnchor.getFullYear(), leftAnchor.getMonth() + 1, 1),
    [leftAnchor]
  );

  const shiftMonths = (delta: number) => {
    setLeftAnchor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  const startD = startDate ? parseISO(startDate) : null;
  const endD = endDate ? parseISO(endDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePresetSelect = (type: 'today' | 'this_month' | 'last_30_days' | 'this_year') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      start = now;
      end = now;
    } else if (type === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'last_30_days') {
      start = new Date();
      start.setDate(now.getDate() - 30);
      end = now;
    } else if (type === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    onChange({ startDate: toISO(start), endDate: toISO(end) });
  };

  const handleDayClick = (day: Date) => {
    if (selectionPhase === 'start' || !startD) {
      const iso = toISO(day);
      onChange({ startDate: iso, endDate: iso });
      setSelectionPhase('end');
    } else {
      const startISO = toISO(startD);
      const clickedISO = toISO(day);
      if (day < startD) {
        onChange({ startDate: clickedISO, endDate: startISO });
      } else {
        onChange({ startDate: startISO, endDate: clickedISO });
      }
      setSelectionPhase('start');
    }
  };

  const generateMonthCells = (anchor: Date): Date[] => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;

    const cells: Date[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push(new Date(year, month, 1 - (startWeekday - i)));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month, d));
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1];
      cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
    }
    return cells;
  };

  const renderMonth = (anchor: Date) => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const cells = generateMonthCells(anchor);

    return (
      <div className="w-full sm:w-[232px] shrink-0 flex flex-col">
        <div className="flex items-center justify-center mb-3 h-5">
          <h3 className="text-gray-100 font-semibold text-xs tracking-wide">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="grid mb-1 grid-cols-7 gap-1 text-center">
          {weekdaysShort.map((w) => (
            <div key={w} className="w-8 h-8 text-zinc-500 uppercase font-medium flex items-center justify-center text-[10px]">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            const inMonth = day.getMonth() === month;
            const isStart = startD && sameDay(day, startD);
            const isEnd = endD && sameDay(day, endD);
            const isRange = startD && endD && isBetween(day, startD, endD);
            const isToday = sameDay(day, today);

            const baseStyle = "w-8 h-8 text-xs rounded-lg flex items-center justify-center border-none cursor-pointer select-none p-0 transition-all";

            if (isStart || isEnd) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`${baseStyle} bg-[#D4A017] text-black font-semibold hover:brightness-110 ${!inMonth ? 'opacity-80' : ''}`}
                >
                  {day.getDate()}
                </button>
              );
            }

            if (isRange) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`${baseStyle} bg-[#D4A017]/15 text-[#D4A017] hover:bg-[#D4A017]/25 ${!inMonth ? 'opacity-60' : ''}`}
                >
                  {day.getDate()}
                </button>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDayClick(day)}
                className={`${baseStyle} bg-transparent ${inMonth ? 'text-zinc-300 hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'} ${isToday ? 'ring-1 ring-white/20' : ''}`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl p-4 w-[92vw] max-w-[580px] sm:w-max ${className}`}
    >
      {/* Raccourcis rapides */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-white/10 text-xs">
        <button
          type="button"
          onClick={() => handlePresetSelect('today')}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium text-center"
        >
          {language === 'fr' ? "Aujourd'hui" : "Today"}
        </button>
        <button
          type="button"
          onClick={() => handlePresetSelect('this_month')}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium text-center"
        >
          {language === 'fr' ? "Ce mois-ci" : "This Month"}
        </button>
        <button
          type="button"
          onClick={() => handlePresetSelect('last_30_days')}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium text-center"
        >
          {language === 'fr' ? "30 derniers jours" : "Last 30 Days"}
        </button>
        <button
          type="button"
          onClick={() => handlePresetSelect('this_year')}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium text-center"
        >
          {language === 'fr' ? "Cette année" : "This Year"}
        </button>
      </div>

      <div className="flex items-start justify-between w-full">
        <button
          type="button"
          onClick={() => shiftMonths(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer p-0 bg-transparent text-zinc-400 hover:text-[#D4A017] hover:bg-white/5 transition-colors mt-4 shrink-0"
          aria-label="Previous months"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Sur mobile, un seul mois affiché ; sur écran large, les deux mois côte à côte */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start shrink-0 gap-5 sm:gap-5 w-full justify-center px-1">
          {renderMonth(leftAnchor)}
          <div className="hidden sm:block w-[1px] self-stretch bg-white/10 my-1 shrink-0" />
          <div className="hidden sm:block">
            {renderMonth(rightAnchor)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => shiftMonths(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer p-0 bg-transparent text-zinc-400 hover:text-[#D4A017] hover:bg-white/5 transition-colors mt-4 shrink-0"
          aria-label="Next months"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};