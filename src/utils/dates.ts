import { EstadoVigencia, VigenciaInfo } from '../types.ts';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const ALERTA_SEMANAS = 8;
export const ALERTA_DIAS = ALERTA_SEMANAS * 7; // 56 días

export function addOneYearIso(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  if (!y || !m || !d) return fechaIso;
  const date = new Date(Date.UTC(y + 1, m - 1, d));
  // Handle Feb 29 leap year gracefully
  if (date.getUTCMonth() !== m - 1) {
    date.setUTCDate(0);
  }
  return date.toISOString().slice(0, 10);
}

export function subtractDaysIso(fechaIso: string, days: number): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  if (!y || !m || !d) return fechaIso;
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function getTodayArIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calcularVigenciaHabilitacion(
  fechaHabilitacion: string,
  referenciaIso?: string
): VigenciaInfo {
  const fechaCaducidad = addOneYearIso(fechaHabilitacion);
  const fechaAlerta8Semanas = subtractDaysIso(fechaCaducidad, ALERTA_DIAS);
  const hoyIso = referenciaIso || getTodayArIso();

  const [hy, hm, hd] = hoyIso.split('-').map(Number);
  const [cy, cm, cd] = fechaCaducidad.split('-').map(Number);

  const hoyUtc = Date.UTC(hy, hm - 1, hd);
  const cadUtc = Date.UTC(cy, cm - 1, cd);

  const diasRestantes = Math.ceil((cadUtc - hoyUtc) / MS_PER_DAY);
  const semanasRestantes = Math.max(0, Math.ceil(diasRestantes / 7));

  let estado: EstadoVigencia = 'vigente';
  if (diasRestantes <= 0) {
    estado = 'vencida';
  } else if (diasRestantes <= ALERTA_DIAS) {
    estado = 'alerta_8_semanas';
  }

  return {
    fechaHabilitacion,
    fechaCaducidad,
    fechaAlerta8Semanas,
    diasRestantes,
    semanasRestantes,
    estado,
    requiereAlerta8Semanas: diasRestantes > 0 && diasRestantes <= ALERTA_DIAS,
  };
}

export function formatFechaAr(fechaIso: string): string {
  if (!fechaIso) return '—';
  const [y, m, d] = fechaIso.split('-');
  if (!y || !m || !d) return fechaIso;
  return `${d}/${m}/${y}`;
}

export function formatArs(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
}
