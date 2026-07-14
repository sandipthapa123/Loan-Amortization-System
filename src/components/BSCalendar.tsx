import React, { useState, useEffect } from 'react';
import NepaliDate from 'nepali-date-converter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BSCalendarProps {
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
}

const nepaliMonths = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export function BSCalendar({ value, onChange }: BSCalendarProps) {
  const initialDate = value ? new NepaliDate(value) : new NepaliDate();
  const [currentYear, setCurrentYear] = useState(initialDate.getYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11

  // Update internal state if value prop changes significantly (optional)
  useEffect(() => {
    if (value) {
      try {
        const d = new NepaliDate(value);
        setCurrentYear(d.getYear());
        setCurrentMonth(d.getMonth());
      } catch (e) {
        // ignore
      }
    }
  }, [value]);

  // @ts-ignore: getDaysInMonth exists at runtime but missing in type definitions
  const daysInMonth = new NepaliDate(currentYear, currentMonth, 1).getDaysInMonth();
  // Get day of week for the 1st of the month (0 = Sunday, 1 = Monday)
  const firstDayJsDate = new NepaliDate(currentYear, currentMonth, 1).toJsDate();
  const startDayOfWeek = firstDayJsDate.getDay();

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
      const selected = new NepaliDate(currentYear, currentMonth, day);
      onChange(selected.format('YYYY-MM-DD'));
    }
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: startDayOfWeek }, (_, i) => i);

  return (
    <div className="p-3 w-[280px]">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">
          {nepaliMonths[currentMonth]} {currentYear}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
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
          const isSelected = value && new NepaliDate(value).getYear() === currentYear && new NepaliDate(value).getMonth() === currentMonth && new NepaliDate(value).getDate() === day;
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
