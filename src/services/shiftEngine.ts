/**
 * Shift Management & Exact Boundary Engine
 * Adheres strictly to Specifications 2, 16, 17, 18:
 * - Morning Shift: 08:00 AM - 02:00 PM (cutoff 01:45 PM / 13:45:00)
 * - Evening Shift: 02:00 PM - 08:00 PM (cutoff 07:45 PM / 19:45:00)
 * - Exact boundary rule:
 *     13:44:59 -> eligible for morning
 *     13:45:00 -> not eligible for morning
 *     19:44:59 -> eligible for evening
 *     19:45:00 -> not eligible for evening
 * - Timezone-aware: Asia/Kolkata
 * - Uses Complaint Reported Date/Time for eligibility, NOT discovery time!
 */

import { ShiftType } from '../types';

export interface ShiftEligibilityResult {
  isEligible: boolean;
  shiftType: ShiftType | null;
  shiftDate: string; // DD/MM/YYYY
  reason: string;
  timeString: string;
  secondsSinceMidnight: number;
}

/**
 * Formats current Date in Asia/Kolkata timezone
 */
export function getKolkataTime(date: Date = new Date()): {
  dateStr: string; // DD/MM/YYYY
  timeStr: string; // HH:MM:SS
  fullStr: string; // DD/MM/YYYY HH:MM:SS
  isoStr: string;
  hour: number;
  minute: number;
  second: number;
  totalSeconds: number;
} {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(date);

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = parseInt(getPart('hour'), 10);
  const minute = parseInt(getPart('minute'), 10);
  const second = parseInt(getPart('second'), 10);

  const totalSeconds = hour * 3600 + minute * 60 + second;
  const dateStr = `${day}/${month}/${year}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  return {
    dateStr,
    timeStr,
    fullStr: `${dateStr} ${timeStr}`,
    isoStr: date.toISOString(),
    hour,
    minute,
    second,
    totalSeconds,
  };
}

/**
 * Parses reported date time string from portal into hours, minutes, seconds, and date.
 * Handles formats like:
 * - "18/09/2026 13:21:42"
 * - "18/09/2026 01:21:42 PM"
 * - "2026-09-18 13:21:42"
 * - "2026-09-18T13:21:42"
 */
export function parseReportedDateTime(dateTimeStr: string): {
  dateStr: string;
  hour: number;
  minute: number;
  second: number;
  totalSeconds: number;
  valid: boolean;
} {
  if (!dateTimeStr) {
    const now = getKolkataTime();
    return {
      dateStr: now.dateStr,
      hour: now.hour,
      minute: now.minute,
      second: now.second,
      totalSeconds: now.totalSeconds,
      valid: false,
    };
  }

  const str = dateTimeStr.trim();

  // Try matching standard "DD/MM/YYYY HH:mm:ss" or with AM/PM
  const ddmmyyyyRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i;
  const match1 = str.match(ddmmyyyyRegex);

  if (match1) {
    const day = match1[1].padStart(2, '0');
    const month = match1[2].padStart(2, '0');
    const year = match1[3];
    let hour = parseInt(match1[4], 10);
    const minute = parseInt(match1[5], 10);
    const second = match1[6] ? parseInt(match1[6], 10) : 0;
    const ampm = match1[7]?.toUpperCase();

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    return {
      dateStr: `${day}/${month}/${year}`,
      hour,
      minute,
      second,
      totalSeconds: hour * 3600 + minute * 60 + second,
      valid: true,
    };
  }

  // Try standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const kol = getKolkataTime(parsed);
    return {
      dateStr: kol.dateStr,
      hour: kol.hour,
      minute: kol.minute,
      second: kol.second,
      totalSeconds: kol.totalSeconds,
      valid: true,
    };
  }

  // Fallback to today's date and current time
  const now = getKolkataTime();
  return {
    dateStr: now.dateStr,
    hour: now.hour,
    minute: now.minute,
    second: now.second,
    totalSeconds: now.totalSeconds,
    valid: false,
  };
}

/**
 * Exact Shift Boundaries (in seconds since midnight):
 * - Morning Shift: 08:00:00 (28,800s) to 14:00:00 (50,400s)
 *   - Morning Assignment Window: 08:00:00 to 13:44:59 (49,499s)
 *   - Morning Cutoff: 13:45:00 (49,500s) -> 13:45:00 and onwards is NOT eligible!
 * - Evening Shift: 14:00:00 (50,400s) to 20:00:00 (72,000s)
 *   - Evening Assignment Window: 14:00:00 to 19:44:59 (71,099s)
 *   - Evening Cutoff: 19:45:00 (71,100s) -> 19:45:00 and onwards is NOT eligible!
 */
export const MORNING_START_SEC = 8 * 3600; // 08:00:00 = 28,800
export const MORNING_CUTOFF_SEC = 13 * 3600 + 45 * 60; // 13:45:00 = 49,500
export const MORNING_END_SEC = 14 * 3600; // 14:00:00 = 50,400

export const EVENING_START_SEC = 14 * 3600; // 14:00:00 = 50,400
export const EVENING_CUTOFF_SEC = 19 * 3600 + 45 * 60; // 19:45:00 = 71,100
export const EVENING_END_SEC = 20 * 3600; // 20:00:00 = 72,000

/**
 * Checks shift eligibility for a complaint according to Section 16 & 17.
 * Uses Complaint Reported Date/Time.
 */
export function evaluateShiftEligibility(reportedDateTimeStr: string): ShiftEligibilityResult {
  const parsed = parseReportedDateTime(reportedDateTimeStr);
  const sec = parsed.totalSeconds;
  const timeFormatted = `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}:${String(parsed.second).padStart(2, '0')}`;

  // Check Morning Shift
  if (sec >= MORNING_START_SEC && sec < MORNING_END_SEC) {
    if (sec < MORNING_CUTOFF_SEC) {
      // 08:00:00 up to 13:44:59 -> Eligible
      return {
        isEligible: true,
        shiftType: 'MORNING',
        shiftDate: parsed.dateStr,
        reason: 'Reported during active Morning Shift assignment window (08:00 - 13:44:59).',
        timeString: timeFormatted,
        secondsSinceMidnight: sec,
      };
    } else {
      // 13:45:00 to 13:59:59 -> Past cutoff
      return {
        isEligible: false,
        shiftType: 'MORNING',
        shiftDate: parsed.dateStr,
        reason: 'Reported at or after Morning assignment cutoff (13:45:00). New morning assignments halted.',
        timeString: timeFormatted,
        secondsSinceMidnight: sec,
      };
    }
  }

  // Check Evening Shift
  if (sec >= EVENING_START_SEC && sec < EVENING_END_SEC) {
    if (sec < EVENING_CUTOFF_SEC) {
      // 14:00:00 up to 19:44:59 -> Eligible
      return {
        isEligible: true,
        shiftType: 'EVENING',
        shiftDate: parsed.dateStr,
        reason: 'Reported during active Evening Shift assignment window (14:00 - 19:44:59).',
        timeString: timeFormatted,
        secondsSinceMidnight: sec,
      };
    } else {
      // 19:45:00 to 19:59:59 -> Past cutoff
      return {
        isEligible: false,
        shiftType: 'EVENING',
        shiftDate: parsed.dateStr,
        reason: 'Reported at or after Evening assignment cutoff (19:45:00). New evening assignments halted.',
        timeString: timeFormatted,
        secondsSinceMidnight: sec,
      };
    }
  }

  // Outside both shifts (e.g. night 20:00 to 08:00)
  return {
    isEligible: false,
    shiftType: null,
    shiftDate: parsed.dateStr,
    reason: 'Reported outside scheduled operational shifts (08:00 - 20:00).',
    timeString: timeFormatted,
    secondsSinceMidnight: sec,
  };
}

/**
 * Returns currently active shift based on live Asia/Kolkata clock
 */
export function getCurrentShiftType(): ShiftType {
  const { totalSeconds } = getKolkataTime();
  if (totalSeconds >= EVENING_START_SEC && totalSeconds < EVENING_END_SEC) {
    return 'EVENING';
  }
  return 'MORNING';
}

export function isComplaintInShiftBoundary(dateTimeStr: string): boolean {
  return evaluateShiftEligibility(dateTimeStr).isEligible;
}

