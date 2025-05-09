export type ShiftType = 'full' | 'morning' | 'afternoon';

export interface WorkShift {
  id: string;
  date: string; // ISO date string YYYY-MM-DD format
  startTime: string; // 24h format HH:MM 
  endTime: string; // 24h format HH:MM
  shiftType?: ShiftType; // Type of shift (full day, morning, afternoon)
  color?: string; // Custom color for the shift
  notes?: string; // Any additional notes
}

export interface WorkSchedule {
  id: string;
  name: string;
  shifts: WorkShift[];
  createdAt: string;
  updatedAt: string;
}

// Default shift configurations
export const DEFAULT_SHIFTS = {
  full: {
    startTime: '07:00',
    endTime: '19:00',
    shiftType: 'full' as ShiftType
  },
  morning: {
    startTime: '07:00',
    endTime: '13:00',
    shiftType: 'morning' as ShiftType
  },
  afternoon: {
    startTime: '13:00',
    endTime: '19:00',
    shiftType: 'afternoon' as ShiftType
  }
};

// Default shift - 7am to 7pm (12-hour shift) - kept for backward compatibility
export const DEFAULT_SHIFT = DEFAULT_SHIFTS.full;

// Default color
export const DEFAULT_SHIFT_COLOR = '#4F46E5'; // Indigo color