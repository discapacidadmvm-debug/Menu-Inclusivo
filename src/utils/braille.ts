import type { ComercioPublico, PlatoMenu } from '../types.ts';
import { formatArs } from './dates.ts';

// Alfabeto Braille Español (ONCE / Argentina - celdas Unicode de 6 puntos U+2800..U+283F)
const BRAILLE_MAP: Record<string, string> = {
  a: '⠁',
  b: '⠃',
  c: '⠉',
  d: '⠙',
  e: '⠑',
  f: '⠋',
  g: '⠛',
  h: '⠓',
  i: '⠊',
  j: '⠚',
  k: '⠅',
  l: '⠇',
  m: '⠍',
  n: '⠝',
  ñ: '⠻',
  o: '⠕',
  p: '⠏',
  q: '⠟',
  r: '⠗',
  s: '⠎',
  t: '⠞',
  u: '⠥',
  v: '⠧',
  w: '⠺',
  x: '⠭',
  y: '⠽',
  z: '⠵',
  á: '⠷',
  é: '⠮',
  í: '⠌',
  ó: '⠬',
  ú: '⠾',
  ü: '⠳',
  ' ': '⠀',
  ',': '⠂',
  ';': '⠆',
  ':': '⠒',
  '.': '⠄',
  '-': '⠤',
  '(': '⠣',
  ')': '⠜',
  '/': '⠸⠌',
  '?': '⠢',
  '¿': '⠢',
  '!': '⠖',
  '¡': '⠖',
  '+': '⠖',
  '%': '⠸⠴',
  $: '⠸⠎',
};

const DIGIT_MAP: Record<string, string> = {
  '1': '⠁',
  '2': '⠃',
  '3': '⠉',
  '4': '⠙',
  '5': '⠑',
  '6': '⠋',
  '7': '⠛',
  '8': '⠓',
  '9': '⠊',
  '0': '⠚',
};

const NUMBER_PREFIX = '⠼';
const UPPERCASE_PREFIX = '⠨';

export function textToBraille(input: string): string {
  let out = '';
  let inNumberMode = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '\n') {
      out += '\n';
      inNumberMode = false;
      continue;
    }

    if (DIGIT_MAP[ch]) {
      if (!inNumberMode) {
        out += NUMBER_PREFIX;
        inNumberMode = true;
      }
      out += DIGIT_MAP[ch];
      continue;
    }

    // Separadores numéricos en precios argentinos (ej. 12.500 o 12,50)
    if (inNumberMode && (ch === '.' || ch === ',')) {
      const next = input[i + 1];
      if (next && DIGIT_MAP[next]) {
        out += ch === '.' ? '⠄' : '⠂';
        continue;
      }
    }

    inNumberMode = false;
    const lower = ch.toLowerCase();
    const isUpper = ch !== lower && ch.toUpperCase() === ch;

    if (BRAILLE_MAP[lower]) {
      if (isUpper) {
        out += UPPERCASE_PREFIX;
      }
      out += BRAILLE_MAP[lower];
    } else if (ch === '\t') {
      out += '⠀⠀';
    } else {
      out += '⠀';
    }
  }

  return out;
}

export interface BrailleLine {
  plain: string;
  braille: string;
  kind: 'title' | 'category' | 'item' | 'detail' | 'separator';
}

export function buildMenuBrailleLines(
  comercio: ComercioPublico,
  platos: PlatoMenu[]
): BrailleLine[] {
  const lines: BrailleLine[] = [];

  const push = (plain: string, kind: BrailleLine['kind']) => {
    lines.push({
      plain,
      braille: kind === 'separator' ? '⠒'.repeat(28) : textToBraille(plain),
      kind,
    });
  };

  push(`${comercio.nombre} (${comercio.rubro})`, 'title');
  push('CARTA INCLUSIVA - SISTEMA BRAILLE', 'detail');
  push(`${comercio.direccion}`, 'detail');
  push('', 'separator');

  const activos = platos.filter((p) => p.disponible);
  const categorias = Array.from(new Set(activos.map((p) => p.categoria)));

  for (const cat of categorias) {
    push(cat.toUpperCase(), 'category');
    const items = activos.filter((p) => p.categoria === cat);
    for (const item of items) {
      const precioTxt = formatArs(item.precioArs).replace(/\s+/g, ' ').trim();
      const taccTxt = item.libreDeTacc ? ' - LIBRE DE TACC (SIN TACC)' : '';
      push(`${item.nombre}${taccTxt} - ${precioTxt}`, 'item');

      if (item.descripcion.trim()) {
        push(`Detalle: ${item.descripcion.trim()}`, 'detail');
      }
      if (item.pictogramas.length > 0) {
        const ings = item.pictogramas.map((pg) => pg.label).join(', ');
        push(`Ingredientes: ${ings}`, 'detail');
      }
    }
    push('', 'separator');
  }

  return lines;
}

export function formatDishPriceBraille(
  nombre: string,
  precioArs: number,
  libreDeTacc?: boolean
): { plain: string; braille: string } {
  const cleanName = nombre.trim() || 'Plato sin nombre';
  const precioTxt = formatArs(Number(precioArs) || 0)
    .replace(/\s+/g, ' ')
    .trim();
  const taccTxt = libreDeTacc ? ' (Libre de TACC)' : '';
  const plain = `${cleanName}${taccTxt} - ${precioTxt}`;
  return {
    plain,
    braille: textToBraille(plain),
  };
}

export function buildBraillePlainTextExport(
  comercio: ComercioPublico,
  platos: PlatoMenu[],
  includeReference: boolean
): string {
  const lines = buildMenuBrailleLines(comercio, platos);
  return lines
    .map((line) => {
      if (line.kind === 'separator') return line.braille;
      if (!includeReference) return line.braille;
      return `${line.braille}\n[${line.plain}]`;
    })
    .join('\n');
}

/**
 * Especificaciones físicas estándar de escritura Braille (en milímetros)
 * solicitadas para impresión táctil / A4:
 * - Alto de celda (6 puntos): 6,5 mm
 * - Ancho de celda: 4,0 mm
 * - Distancia entre puntos (H y V, centro a centro): 2,5 mm
 * - Distancia entre celdas contiguas (centro a centro): 6,0 mm
 * - Interlineado entre renglones (centro a centro): 10,0 mm
 * Con diámetro de punto 1,5 mm (radio 0,75 mm):
 *   Ancho externo = 2,5 + 2 * 0,75 = 4,0 mm
 *   Alto externo  = 5,0 + 2 * 0,75 = 6,5 mm
 */
export const BRAILLE_SPECS_MM = {
  cellHeightMm: 6.5,
  cellWidthMm: 4.0,
  dotSpacingMm: 2.5,
  cellPitchMm: 6.0,
  lineSpacingMm: 10.0,
  dotRadiusMm: 0.75,
  pictogramMaxHeightMm: 15.0,
} as const;

export type BrailleSixDots = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

/**
 * Decodifica una celda Braille Unicode (U+2800..U+283F) en sus 6 puntos [1..6].
 * Orden estándar: puntos 1,2,3 columna izquierda (arriba->abajo); 4,5,6 columna derecha.
 */
export function brailleCharToDots(ch: string): BrailleSixDots {
  const code = ch.codePointAt(0) ?? 0x2800;
  if (code < 0x2800 || code > 0x28ff) {
    return [false, false, false, false, false, false];
  }
  const mask = code - 0x2800;
  return [
    Boolean(mask & 0x01),
    Boolean(mask & 0x02),
    Boolean(mask & 0x04),
    Boolean(mask & 0x08),
    Boolean(mask & 0x10),
    Boolean(mask & 0x20),
  ];
}

export interface WrappedBrailleRow {
  braille: string;
  plain: string;
}

/**
 * Envuelve texto plano en renglones respetando un máximo de celdas Braille por línea
 * (evitando cortar prefijos numéricos/mayúsculas o palabras por la mitad).
 */
export function wrapBrailleLineWithPlain(
  plainInput: string,
  maxCellsPerLine: number,
  precomputedBraille?: string
): WrappedBrailleRow[] {
  const limit = Math.max(4, maxCellsPerLine);
  const trimmed = plainInput.trim();

  if (!trimmed) {
    if (precomputedBraille) {
      const cells = Array.from(precomputedBraille);
      return [
        {
          braille: cells.slice(0, limit).join(''),
          plain: '',
        },
      ];
    }
    return [{ braille: '', plain: '' }];
  }

  const words = trimmed.split(/\s+/);
  const rows: WrappedBrailleRow[] = [];
  let currentPlain = '';

  const pushPlainChunk = (chunk: string) => {
    const br = textToBraille(chunk);
    const cells = Array.from(br);
    if (cells.length <= limit) {
      rows.push({ braille: br, plain: chunk });
      return;
    }
    // Palabra excepcionalmente larga: partir respetando el límite de celdas
    let sub = '';
    for (const ch of chunk) {
      const next = sub + ch;
      if (Array.from(textToBraille(next)).length > limit && sub) {
        rows.push({ braille: textToBraille(sub), plain: sub });
        sub = ch;
      } else {
        sub = next;
      }
    }
    if (sub) {
      rows.push({ braille: textToBraille(sub), plain: sub });
    }
  };

  for (const word of words) {
    const candidate = currentPlain ? `${currentPlain} ${word}` : word;
    const candidateCells = Array.from(textToBraille(candidate)).length;

    if (candidateCells <= limit) {
      currentPlain = candidate;
    } else {
      if (currentPlain) {
        pushPlainChunk(currentPlain);
      }
      if (Array.from(textToBraille(word)).length <= limit) {
        currentPlain = word;
      } else {
        pushPlainChunk(word);
        currentPlain = '';
      }
    }
  }

  if (currentPlain) {
    pushPlainChunk(currentPlain);
  }

  return rows.length > 0 ? rows : [{ braille: '', plain: '' }];
}

