import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateCalculationService } from '@/services/DateCalculationService';

interface BSCalendarProps {
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
}

const nepaliMonths = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export function BSCalendar({ value, onChange }: BSCalendarProps) {
  const initialDateParts = DateCalculationService.getBSDateParts(value);
  const [currentYear, setCurrentYear] = useState(initialDateParts.year);
  const [currentMonth, setCurrentMonth] = useState(initialDateParts.month); // 0-11

  // Update internal state if value prop changes significantly (optional)
  useEffect(() => {
    if (value && DateCalculationService.isValidBS(value)) {
      const parts = DateCalculationService.getBSDateParts(value);
      setCurrentYear(parts.year);
      setCurrentMonth(parts.month);
    }
  }, [value]);

  const { daysInMonth, startDayOfWeek } = DateCalculationService.getBSMonthMetadata(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    if (onChange) {
      const selected = DateCalculationService.createBSDateStr(currentYear, currentMonth, day);
      onChange(selected);
    }
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: startDayOfWeek }, (_, i) => i);

  return (
    <div className="p-3 w-[280px]">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">
          {nepaliMonths[currentMonth]} {currentYear}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted-foreground">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {blanksArray.map((_, i) => (
          <div key={`blank-${i}`} className="h-8 w-8" />
        ))}
        {daysArray.map((day) => {
          let isSelected = false;
          if (value && DateCalculationService.isValidBS(value)) {
            const parts = DateCalculationService.getBSDateParts(value);
            isSelected = parts.year === currentYear && parts.month === currentMonth && parts.day === day;
          }
          return (
            <Button
              key={day}
              variant={isSelected ? 'default' : 'ghost'}
              className={cn('h-8 w-8 p-0 font-normal', isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground')}
              onClick={() => handleSelect(day)}
            >
              {day}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
