// src/lib/utils/dateUtils.ts
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns'
import { enUS } from 'date-fns/locale'

export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  return format(new Date(date), formatStr, { locale: enUS })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm', { locale: enUS })
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: enUS })
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: enUS })
}

export function calculateHoursWorked(clockIn: string, clockOut: string): number {
  const start = new Date(clockIn)
  const end = new Date(clockOut)
  return differenceInMinutes(end, start) / 60
}

export function formatHoursWorked(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return `${wholeHours}h ${minutes}m`
}