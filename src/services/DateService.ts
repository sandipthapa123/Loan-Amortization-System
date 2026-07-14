import NepaliDate from 'nepali-date-converter';
import { differenceInDays, isValid, parse, format as formatAD } from 'date-fns';

// Use a string union type AND export the values as a const array for runtime use
export const DAY_COUNT_OPTIONS = ['Actual/365', 'Actual/360', 'Actual/Actual'] as const;
export type DayCountBasis = typeof DAY_COUNT_OPTIONS[number];

export class DateService {
  /**
   * Converts AD date string (YYYY-MM-DD) to BS date string (YYYY-MM-DD).
   * Uses local date construction to avoid UTC midnight timezone shift.
   */
  static convertADtoBS(adDateStr: string): string {
    if (!this.isValidAD(adDateStr)) return '';
    try {
      const [year, month, day] = adDateStr.split('-').map(Number);
      // Construct date in local time (not UTC) to prevent day shifting
      const adDate = new Date(year, month - 1, day);
      const bsDate = new NepaliDate(adDate);
      return bsDate.format('YYYY-MM-DD');
    } catch {
      return '';
    }
  }

  /**
   * Converts BS date string (YYYY-MM-DD) to AD date string (YYYY-MM-DD).
   */
  static convertBStoAD(bsDateStr: string): string {
    if (!this.isValidBS(bsDateStr)) return '';
    try {
      const [year, month, day] = bsDateStr.split('-').map(Number);
      const bsDate = new NepaliDate(year, month - 1, day);
      const adDate = bsDate.toJsDate();
      return formatAD(adDate, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }

  /**
   * Returns a human-readable dual label: "YYYY-MM-DD (BS) / YYYY-MM-DD (AD)"
   */
  static formatDual(adDateStr: string): string {
    if (!adDateStr) return '';
    const bs = this.convertADtoBS(adDateStr);
    return `${bs} (BS) / ${adDateStr} (AD)`;
  }

  /**
   * Validates AD date string (YYYY-MM-DD)
   */
  static isValidAD(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isValid(parsed);
  }

  /**
   * Validates BS date string (YYYY-MM-DD).
   * Verifies the round-trip: converting to NepaliDate and back must yield the same values.
   */
  static isValidBS(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year < 2000 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 32) return false;
      const bsDate = new NepaliDate(year, month - 1, day);
      return bsDate.getYear() === year && bsDate.getMonth() === month - 1 && bsDate.getDate() === day;
    } catch {
      return false;
    }
  }

  /**
   * Calculate exact calendar days between two AD date strings (YYYY-MM-DD).
   * Uses local date construction to avoid UTC timezone errors.
   */
  static getDaysDifference(startDateStr: string, endDateStr: string): number {
    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay);
    const end = new Date(eYear, eMonth - 1, eDay);
    return differenceInDays(end, start);
  }

  /**
   * Calculates the year fraction used in interest calculation based on day count basis.
   */
  static getYearFraction(days: number, basis: DayCountBasis, startYear: number = new Date().getFullYear()): number {
    switch (basis) {
      case 'Actual/360':
        return days / 360;
      case 'Actual/365':
        return days / 365;
      case 'Actual/Actual': {
        const isLeapYear = (y: number) => ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0);
        return days / (isLeapYear(startYear) ? 366 : 365);
      }
      default:
        return days / 365;
    }
  }
}
