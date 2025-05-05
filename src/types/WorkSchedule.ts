export interface WorkShift {
  id: string;
  date: string; // ISO date string YYYY-MM-DD format
  startTime: string; // 24h format HH:MM 
  endTime: string; // 24h format HH:MM
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

// Default shift - 7am to 7pm (12-hour shift)
export const DEFAULT_SHIFT = {
  startTime: '07:00',
  endTime: '19:00'
};

// Default color
export const DEFAULT_SHIFT_COLOR = '#4F46E5'; // Indigo color