export type RubroComercio =
  | 'Restaurante'
  | 'Bar'
  | 'Café'
  | 'Heladería'
  | 'Confitería'
  | 'Casa de Comidas';

export type CategoriaPlato =
  | 'Desayunos'
  | 'Meriendas'
  | 'Desayunos y Meriendas'
  | 'Cafetería y Panadería'
  | 'Entradas'
  | 'Platos Principales'
  | 'Minutas'
  | 'Parrilla'
  | 'Pastas'
  | 'Pizzas y Empanadas'
  | 'Sándwiches y Hamburguesas'
  | 'Ensaladas'
  | 'Guarniciones'
  | 'Heladería'
  | 'Postres'
  | 'Bebidas'
  | 'Menú Infantil'
  | 'Promociones';

export type EstadoVigencia = 'vigente' | 'alerta_8_semanas' | 'vencida';

export interface PictogramaItem {
  id: string;
  label: string;
  imageUrl: string;
  source: 'arasaac' | 'custom' | 'catalogo';
}

export interface PlatoMenu {
  id: string;
  comercioId: string;
  categoria: CategoriaPlato;
  nombre: string;
  descripcion: string;
  precioArs: number;
  fotoUrl: string;
  libreDeTacc: boolean;
  disponible: boolean;
  pictogramas: PictogramaItem[];
  orden: number;
}

export interface VigenciaInfo {
  fechaHabilitacion: string;
  fechaCaducidad: string;
  fechaAlerta8Semanas: string;
  diasRestantes: number;
  semanasRestantes: number;
  estado: EstadoVigencia;
  requiereAlerta8Semanas: boolean;
}

export interface ComercioPublico {
  id: string;
  slug: string;
  nombre: string;
  rubro: RubroComercio;
  direccion: string;
  telefono: string;
  fechaHabilitacion: string;
  activa: boolean;
  obleaNumero: string;
  vigencia: VigenciaInfo;
}

export interface ComercioAdmin extends ComercioPublico {
  password: string;
  cantidadPlatos: number;
}

export type IdiomaCodigo = 'es-AR' | 'en-US' | 'pt-BR' | 'fr-FR' | 'it-IT' | 'de-DE';

export interface IdiomaOption {
  code: IdiomaCodigo;
  shortCode: string;
  label: string;
  nativeName: string;
}

export interface TranslatedPlatoFields {
  nombre: string;
  descripcion: string;
  categoria: string;
  pictogramasLabels: string[];
}
