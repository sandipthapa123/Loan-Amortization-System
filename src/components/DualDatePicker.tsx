import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { BSCalendar } from './BSCalendar';
import { DateCalculationService } from '@/services/DateCalculationService';

interface DualDatePickerProps {
  value?: string; // AD string YYYY-MM-DD
  onChange?: (date: string) => void;
  label?: string;
  className?: string;
}

export function DualDatePicker({ value, onChange, label, className }: DualDatePickerProps) {
  const [adText, setAdText] = useState(value || '');
  const [bsText, setBsText] = useState(value ? DateCalculationService.convertADtoBS(value) : '');

  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isBsOpen, setIsBsOpen] = useState(false);

  useEffect(() => {
    if (value && value !== adText) {
      setAdText(value);
      setBsText(DateCalculationService.convertADtoBS(value));
    }
  }, [value]);

  const handleAdTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setAdText(text);
    if (DateCalculationService.isValidAD(text)) {
      const bs = DateCalculationService.convertADtoBS(text);
      setBsText(bs);
      onChange?.(text);
    }
  };

  const handleBsTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setBsText(text);
    if (DateCalculationService.isValidBS(text)) {
      const ad = DateCalculationService.convertBStoAD(text);
      setAdText(ad);
      onChange?.(ad);
    }
  };

  const handleAdSelect = (date: Date | undefined) => {
    if (date) {
      const adStr = DateCalculationService.formatADDate(date);
      setAdText(adStr);
      setBsText(DateCalculationService.convertADtoBS(adStr));
      onChange?.(adStr);
      setIsAdOpen(false);
    }
  };

  const handleBsSelect = (bsStr: string) => {
    setBsText(bsStr);
    const adStr = DateCalculationService.convertBStoAD(bsStr);
    setAdText(adStr);
    onChange?.(adStr);
    setIsBsOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex gap-2 w-full">
        {/* AD Picker */}
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">AD Date</label>
          <div className="flex items-center gap-1">
            <Input
              value={adText}
              onChange={handleAdTextChange}
              placeholder="YYYY-MM-DD"
              className="flex-1"
            />
            <Popover open={isAdOpen} onOpenChange={setIsAdOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0" aria-label="Open AD calendar">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={adText && DateCalculationService.isValidAD(adText) ? DateCalculationService.parseAD(adText) : undefined}
                  onSelect={handleAdSelect}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* BS Picker */}
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">BS Date</label>
          <div className="flex items-center gap-1">
            <Input
              value={bsText}
              onChange={handleBsTextChange}
              placeholder="YYYY-MM-DD"
              className="flex-1"
            />
            <Popover open={isBsOpen} onOpenChange={setIsBsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0" aria-label="Open BS calendar">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <BSCalendar
                  value={DateCalculationService.isValidBS(bsText) ? bsText : undefined}
                  onChange={handleBsSelect}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
