import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatBytes(bytes: number | bigint): string {
  const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n);
}

export const statusColors: Record<string, string> = {
  ONLINE: 'text-status-online bg-status-online/10 border-status-online/20',
  OFFLINE: 'text-status-offline bg-status-offline/10 border-status-offline/20',
  DEGRADED: 'text-status-warning bg-status-warning/10 border-status-warning/20',
  ACTIVE: 'text-status-success bg-status-success/10 border-status-success/20',
  INACTIVE: 'text-status-offline bg-status-offline/10 border-status-offline/20',
  SUSPENDED: 'text-status-error bg-status-error/10 border-status-error/20',
  COMPLETED: 'text-status-success bg-status-success/10 border-status-success/20',
  FAILED: 'text-status-error bg-status-error/10 border-status-error/20',
  PENDING: 'text-status-info bg-status-info/10 border-status-info/20',
  RUNNING: 'text-status-warning bg-status-warning/10 border-status-warning/20',
  EXPORTED: 'text-status-success bg-status-success/10 border-status-success/20',
  RECEIVED: 'text-status-info bg-status-info/10 border-status-info/20',
};

export const modalityLabels: Record<string, string> = {
  US: 'Ultrassom', CT: 'Tomografia', MR: 'Ressonância',
  XR: 'Raio-X', CR: 'CR', DR: 'DR', NM: 'Med. Nuclear',
  PET: 'PET', MG: 'Mamografia', RF: 'Fluoroscopia', OT: 'Outro',
};
