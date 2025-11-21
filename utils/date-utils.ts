/**
 * Utility functions for handling dates in the catering application
 * Implements the business logic for available order dates
 */

/**
 * Check if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  // 0 is Sunday, 6 is Saturday
  return day === 0 || day === 6;
}

/**
 * Check if today's cutoff time (05:00 AM) has passed
 * If it has, today is no longer available for ordering
 */
export function isTodayCutoffPassed(): boolean {
  const now = new Date();
  const cutoffTime = new Date(now);
  cutoffTime.setHours(5, 0, 0, 0); // 5:00 AM today
  
  return now >= cutoffTime;
}

/**
 * Get all available dates for ordering based on business rules:
 * - From today up to 14 days ahead
 * - Exclude weekends (Saturday and Sunday)
 * - Exclude today if the cutoff time (05:00 AM) has passed
 */
export function getAvailableDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  // Check if today's cutoff has passed
  const startFromToday = !isTodayCutoffPassed();
  
  // Determine the starting date
  let currentDate = startFromToday ? new Date(today) : new Date(today);
  if (!startFromToday) {
    // If cutoff has passed, start from tomorrow
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Generate dates for the next 14 days, skipping weekends and applying rules
  for (let i = 0; i < 14; i++) {
    if (i > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Skip weekends
    if (!isWeekend(currentDate)) {
      dates.push(currentDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
  }
  
  return dates;
}

/**
 * Format a date to a readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Check if a date string is in the past
 */
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}