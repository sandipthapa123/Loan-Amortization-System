import { describe, it, expect } from 'vitest';
import { DateCalculationService } from '../services/DateCalculationService';

describe('DateCalculationService', () => {
  describe('Boundary Engine [Start, End)', () => {
    it('calculates exactly 1 calendar day between consecutive dates', () => {
      const days = DateCalculationService.getDaysDifference('2024-01-01', '2024-01-02');
      expect(days).toBe(1);
    });

    it('calculates exactly 0 days for same day (meaning end date is excluded from accrual)', () => {
      const days = DateCalculationService.getDaysDifference('2024-01-01', '2024-01-01');
      expect(days).toBe(0);
    });
    
    it('handles leap years correctly across Feb 29', () => {
      const days = DateCalculationService.getDaysDifference('2024-02-28', '2024-03-01');
      expect(days).toBe(2);
    });

    it('handles non-leap years across Feb 28', () => {
      const days = DateCalculationService.getDaysDifference('2023-02-28', '2023-03-01');
      expect(days).toBe(1);
    });
  });

  describe('BS to AD Conversions (Zero Day-Shift Guarantee)', () => {
    it('converts known AD date to precise BS date', () => {
      const bsDate = DateCalculationService.convertADtoBS('2024-04-13'); // Nepali New Year 2081 Baisakh 1
      expect(bsDate).toBe('2081-01-01');
    });

    it('converts known BS date back to exact same AD date without timezone shifting', () => {
      const adDate = DateCalculationService.convertBStoAD('2081-01-01');
      expect(adDate).toBe('2024-04-13');
    });

    it('validates legitimate BS date correctly', () => {
      expect(DateCalculationService.isValidBS('2081-01-01')).toBe(true);
      expect(DateCalculationService.isValidBS('2081-13-01')).toBe(false); // Invalid month
      expect(DateCalculationService.isValidBS('2081-01-33')).toBe(false); // Invalid day (usually max 32)
    });
  });

  describe('Year Fraction Logic', () => {
    it('calculates Actual/365 exactly', () => {
      const frac = DateCalculationService.getYearFraction(73, 'Actual/365');
      expect(frac).toBeCloseTo(0.2, 5); // 73 / 365 = 1/5 = 0.2
    });

    it('calculates Actual/360 exactly', () => {
      const frac = DateCalculationService.getYearFraction(72, 'Actual/360');
      expect(frac).toBeCloseTo(0.2, 5); // 72 / 360 = 1/5 = 0.2
    });

    it('calculates Actual/Actual dynamically using start year', () => {
      // 2024 is a leap year (366 days)
      const fracLeap = DateCalculationService.getYearFraction(183, 'Actual/Actual', 2024);
      expect(fracLeap).toBeCloseTo(0.5, 5); // 183 / 366 = 0.5
      
      // 2023 is not a leap year (365 days)
      const fracNonLeap = DateCalculationService.getYearFraction(73, 'Actual/Actual', 2023);
      expect(fracNonLeap).toBeCloseTo(0.2, 5);
    });
  });
});
