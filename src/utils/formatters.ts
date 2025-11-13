import { format, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Timestamp } from 'firebase/firestore';

export const formatDate = (date: Date | Timestamp, formatStr = 'PPpp'): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, formatStr);
};

export const formatDateInTimezone = (
  date: Date | Timestamp,
  timezone: string,
  formatStr = 'PPpp'
): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return formatInTimeZone(dateObj, timezone, formatStr);
};

export const formatRelativeTime = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};