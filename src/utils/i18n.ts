import { IdiomaCodigo, IdiomaOption } from '../types.ts';

export const IDIOMAS_DISPONIBLES: IdiomaOption[] = [
  { code: 'es-AR', shortCode: 'ES', label: 'Español (Argentina)', nativeName: 'Español (AR)' },
  { code: 'en-US', shortCode: 'EN', label: 'Inglés', nativeName: 'English' },
  { code: 'pt-BR', shortCode: 'PT', label: 'Portugués', nativeName: 'Português' },
  { code: 'fr-FR', shortCode: 'FR', label: 'Francés', nativeName: 'Français' },
  { code: 'it-IT', shortCode: 'IT', label: 'Italiano', nativeName: 'Italiano' },
  { code: 'de-DE', shortCode: 'DE', label: 'Alemán', nativeName: 'Deutsch' },
];

export interface UiStrings {
  digitalMenuTitle: string;
  listenFullMenu: string;
  stopAudio: string;
  listenDish: string;
  ingredientsLabel: string;
  glutenFreeLabel: string;
  allCategories: string;
  onlyGlutenFree: string;
  highContrast: string;
  largeText: string;
  speechSpeed: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  priceInArs: string;
  noItemsMatch: string;
  inclusiveSeal: string;
}

export const UI_STRINGS: Record<IdiomaCodigo, UiStrings> = {
  'es-AR': {
    digitalMenuTitle: 'Carta Digital Inclusiva',
    listenFullMenu: 'Escuchar toda la carta',
    stopAudio: 'Detener lectura',
    listenDish: 'Escuchar plato',
    ingredientsLabel: 'Ingredientes en pictogramas',
    glutenFreeLabel: 'Libre de TACC',
    allCategories: 'Todas',
    onlyGlutenFree: 'Solo Libre de TACC',
    highContrast: 'Alto contraste',
    largeText: 'Texto grande',
    speechSpeed: 'Velocidad',
    speedSlow: 'Lento',
    speedNormal: 'Normal',
    speedFast: 'Rápido',
    priceInArs: 'pesos argentinos',
    noItemsMatch: 'No hay platos disponibles con este filtro.',
    inclusiveSeal: 'Carta accesible adherida a la Ordenanza Municipal de Vicuña Mackenna',
  },
  'en-US': {
    digitalMenuTitle: 'Inclusive Digital Menu',
    listenFullMenu: 'Listen to full menu',
    stopAudio: 'Stop reading',
    listenDish: 'Listen to dish',
    ingredientsLabel: 'Ingredients in pictograms',
    glutenFreeLabel: 'Gluten-Free (Sin TACC)',
    allCategories: 'All',
    onlyGlutenFree: 'Gluten-Free only',
    highContrast: 'High contrast',
    largeText: 'Large text',
    speechSpeed: 'Speed',
    speedSlow: 'Slow',
    speedNormal: 'Normal',
    speedFast: 'Fast',
    priceInArs: 'Argentine pesos',
    noItemsMatch: 'No dishes match this filter.',
    inclusiveSeal: 'Accessible menu certified by Vicuña Mackenna Municipality',
  },
  'pt-BR': {
    digitalMenuTitle: 'Cardápio Digital Inclusivo',
    listenFullMenu: 'Ouvir todo o cardápio',
    stopAudio: 'Parar leitura',
    listenDish: 'Ouvir prato',
    ingredientsLabel: 'Ingredientes em pictogramas',
    glutenFreeLabel: 'Sem Glúten (Libre de TACC)',
    allCategories: 'Todas',
    onlyGlutenFree: 'Apenas Sem Glúten',
    highContrast: 'Alto contraste',
    largeText: 'Texto grande',
    speechSpeed: 'Velocidade',
    speedSlow: 'Lento',
    speedNormal: 'Normal',
    speedFast: 'Rápido',
    priceInArs: 'pesos argentinos',
    noItemsMatch: 'Nenhum prato disponível com este filtro.',
    inclusiveSeal: 'Cardápio acessível certificado pelo Município de Vicuña Mackenna',
  },
  'fr-FR': {
    digitalMenuTitle: 'Menu Numérique Inclusif',
    listenFullMenu: 'Écouter tout le menu',
    stopAudio: 'Arrêter la lecture',
    listenDish: 'Écouter le plat',
    ingredientsLabel: 'Ingrédients en pictogrammes',
    glutenFreeLabel: 'Sans Gluten (Libre de TACC)',
    allCategories: 'Toutes',
    onlyGlutenFree: 'Sans gluten uniquement',
    highContrast: 'Contraste élevé',
    largeText: 'Grand texte',
    speechSpeed: 'Vitesse',
    speedSlow: 'Lent',
    speedNormal: 'Normal',
    speedFast: 'Rapide',
    priceInArs: 'pesos argentins',
    noItemsMatch: 'Aucun plat disponible pour ce filtre.',
    inclusiveSeal: 'Menu accessible certifié par la municipalité de Vicuña Mackenna',
  },
  'it-IT': {
    digitalMenuTitle: 'Menù Digitale Inclusivo',
    listenFullMenu: 'Ascolta tutto il menù',
    stopAudio: 'Ferma lettura',
    listenDish: 'Ascolta piatto',
    ingredientsLabel: 'Ingredienti in pittogrammi',
    glutenFreeLabel: 'Senza Glutine (Libre de TACC)',
    allCategories: 'Tutte',
    onlyGlutenFree: 'Solo Senza Glutine',
    highContrast: 'Alto contrasto',
    largeText: 'Testo grande',
    speechSpeed: 'Velocità',
    speedSlow: 'Lento',
    speedNormal: 'Normale',
    speedFast: 'Veloce',
    priceInArs: 'pesi argentini',
    noItemsMatch: 'Nessun piatto disponibile con questo filtro.',
    inclusiveSeal: 'Menù accessibile certificato dal Comune di Vicuña Mackenna',
  },
  'de-DE': {
    digitalMenuTitle: 'Inklusive Digitale Speisekarte',
    listenFullMenu: 'Ganze Speisekarte anhören',
    stopAudio: 'Vorlesen stoppen',
    listenDish: 'Gericht anhören',
    ingredientsLabel: 'Zutaten als Piktogramme',
    glutenFreeLabel: 'Glutenfrei (Libre de TACC)',
    allCategories: 'Alle',
    onlyGlutenFree: 'Nur Glutenfrei',
    highContrast: 'Hoher Kontrast',
    largeText: 'Große Schrift',
    speechSpeed: 'Tempo',
    speedSlow: 'Langsam',
    speedNormal: 'Normal',
    speedFast: 'Schnell',
    priceInArs: 'Argentinische Pesos',
    noItemsMatch: 'Keine Gerichte für diesen Filter verfügbar.',
    inclusiveSeal: 'Barrierefreie Speisekarte der Gemeinde Vicuña Mackenna',
  },
};

export const CATEGORY_TRANSLATIONS: Record<string, Record<IdiomaCodigo, string>> = {
  Desayunos: {
    'es-AR': 'Desayunos',
    'en-US': 'Breakfasts',
    'pt-BR': 'Cafés da Manhã',
    'fr-FR': 'Petits-déjeuners',
    'it-IT': 'Colazioni',
    'de-DE': 'Frühstück',
  },
  Meriendas: {
    'es-AR': 'Meriendas',
    'en-US': 'Afternoon Snacks & Tea',
    'pt-BR': 'Lanches da Tarde',
    'fr-FR': 'Goûters',
    'it-IT': 'Merende',
    'de-DE': 'Nachmittagssnacks',
  },
  'Desayunos y Meriendas': {
    'es-AR': 'Desayunos y Meriendas',
    'en-US': 'Breakfast & Afternoon Tea',
    'pt-BR': 'Cafés da Manhã e Lanches',
    'fr-FR': 'Petits-déjeuners et Goûters',
    'it-IT': 'Colazioni e Merende',
    'de-DE': 'Frühstück & Nachmittag',
  },
  Entradas: {
    'es-AR': 'Entradas',
    'en-US': 'Starters',
    'pt-BR': 'Entradas',
    'fr-FR': 'Entrées',
    'it-IT': 'Antipasti',
    'de-DE': 'Vorspeisen',
  },
  'Platos Principales': {
    'es-AR': 'Platos Principales',
    'en-US': 'Main Courses',
    'pt-BR': 'Pratos Principais',
    'fr-FR': 'Plats Principaux',
    'it-IT': 'Piatti Principali',
    'de-DE': 'Hauptgerichte',
  },
  Minutas: {
    'es-AR': 'Minutas',
    'en-US': 'Quick Grill & Plates',
    'pt-BR': 'Pratos Rápidos',
    'fr-FR': 'Plats Rapides',
    'it-IT': 'Piatti Express',
    'de-DE': 'Schnelle Gerichte',
  },
  Parrilla: {
    'es-AR': 'Parrilla',
    'en-US': 'Argentine Grill',
    'pt-BR': 'Churrasco',
    'fr-FR': 'Grillades',
    'it-IT': 'Griglia',
    'de-DE': 'Grillgerichte',
  },
  Pastas: {
    'es-AR': 'Pastas',
    'en-US': 'Pasta',
    'pt-BR': 'Massas',
    'fr-FR': 'Pâtes',
    'it-IT': 'Pasta',
    'de-DE': 'Pasta',
  },
  'Pizzas y Empanadas': {
    'es-AR': 'Pizzas y Empanadas',
    'en-US': 'Pizzas & Empanadas',
    'pt-BR': 'Pizzas e Empanadas',
    'fr-FR': 'Pizzas et Empanadas',
    'it-IT': 'Pizze ed Empanadas',
    'de-DE': 'Pizza & Empanadas',
  },
  'Sándwiches y Hamburguesas': {
    'es-AR': 'Sándwiches y Hamburguesas',
    'en-US': 'Sandwiches & Burgers',
    'pt-BR': 'Sanduíches e Hambúrgueres',
    'fr-FR': 'Sandwichs et Burgers',
    'it-IT': 'Panini e Hamburger',
    'de-DE': 'Sandwiches & Burger',
  },
  Ensaladas: {
    'es-AR': 'Ensaladas',
    'en-US': 'Salads',
    'pt-BR': 'Saladas',
    'fr-FR': 'Salades',
    'it-IT': 'Insalate',
    'de-DE': 'Salate',
  },
  Guarniciones: {
    'es-AR': 'Guarniciones',
    'en-US': 'Side Dishes',
    'pt-BR': 'Acompanhamentos',
    'fr-FR': 'Accompagnements',
    'it-IT': 'Contorni',
    'de-DE': 'Beilagen',
  },
  'Cafetería y Panadería': {
    'es-AR': 'Cafetería y Panadería',
    'en-US': 'Coffee & Bakery',
    'pt-BR': 'Cafeteria e Padaria',
    'fr-FR': 'Café et Boulangerie',
    'it-IT': 'Caffetteria e Pasticceria',
    'de-DE': 'Kaffee & Bäckerei',
  },
  Heladería: {
    'es-AR': 'Heladería',
    'en-US': 'Ice Cream',
    'pt-BR': 'Sorveteria',
    'fr-FR': 'Glacier',
    'it-IT': 'Gelateria',
    'de-DE': 'Eisdiele',
  },
  Postres: {
    'es-AR': 'Postres',
    'en-US': 'Desserts',
    'pt-BR': 'Sobremesas',
    'fr-FR': 'Desserts',
    'it-IT': 'Dolci',
    'de-DE': 'Desserts',
  },
  Bebidas: {
    'es-AR': 'Bebidas',
    'en-US': 'Drinks',
    'pt-BR': 'Bebidas',
    'fr-FR': 'Boissons',
    'it-IT': 'Bevande',
    'de-DE': 'Getränke',
  },
  'Menú Infantil': {
    'es-AR': 'Menú Infantil',
    'en-US': 'Kids Menu',
    'pt-BR': 'Menu Infantil',
    'fr-FR': 'Menu Enfant',
    'it-IT': 'Menù Bambini',
    'de-DE': 'Kindermenü',
  },
  Promociones: {
    'es-AR': 'Promociones',
    'en-US': 'Specials & Combos',
    'pt-BR': 'Promoções',
    'fr-FR': 'Promotions',
    'it-IT': 'Promozioni',
    'de-DE': 'Angebote',
  },
};

export function speakText(
  text: string,
  lang: IdiomaCodigo,
  rate = 1.0,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const prefix = lang.split('-')[0].toLowerCase();
  const exactVoice = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
  const prefixVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (exactVoice) {
    utterance.voice = exactVoice;
  } else if (prefixVoice) {
    utterance.voice = prefixVoice;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
