export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type DateFilterPreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom'
  | 'all';

export const parseDateRange = (
  preset?: string,
  customStart?: string | Date,
  customEnd?: string | Date
): DateRange | null => {
  const now = new Date();

  if (!preset || preset === 'all') {
    return null;
  }

  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (preset === 'this_week') {
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000 + (23 * 3600 + 59 * 60 + 59) * 1000 + 999);
    return { startDate: start, endDate: end };
  }

  if (preset === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (preset === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (preset === 'this_year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (preset === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  return null;
};

