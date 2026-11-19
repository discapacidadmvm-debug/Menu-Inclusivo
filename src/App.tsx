import { useEffect, useState } from 'react';
import { LandingPortal } from './components/LandingPortal.tsx';
import { MerchantPanel } from './components/MerchantPanel.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { PublicDigitalMenu } from './components/PublicDigitalMenu.tsx';

type AppView = 'home' | 'merchant' | 'admin' | 'carta';

function getInitialRoute(): { view: AppView; slug: string; platoId: string } {
  if (typeof window === 'undefined') return { view: 'home', slug: '', platoId: '' };
  const params = new URLSearchParams(window.location.search);
  const cartaSlug = params.get('carta');
  const platoId = params.get('plato') || '';
  if (cartaSlug) {
    return { view: 'carta', slug: cartaSlug, platoId };
  }
  return { view: 'home', slug: '', platoId: '' };
}

export default function App() {
  const initial = getInitialRoute();
  const [view, setView] = useState<AppView>(initial.view);
  const [cartaSlug, setCartaSlug] = useState<string>(initial.slug);
  const [focusedPlatoId, setFocusedPlatoId] = useState<string>(initial.platoId);

  useEffect(() => {
    const onPopState = () => {
      const next = getInitialRoute();
      setView(next.view);
      setCartaSlug(next.slug);
      setFocusedPlatoId(next.platoId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (nextView: 'home' | 'merchant' | 'admin') => {
    const url = new URL(window.location.href);
    url.searchParams.delete('carta');
    url.searchParams.delete('plato');
    window.history.pushState({}, '', url.toString());
    setCartaSlug('');
    setFocusedPlatoId('');
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDigitalMenu = (slug: string, platoId = '') => {
    const url = new URL(window.location.href);
    url.searchParams.set('carta', slug);
    if (platoId) {
      url.searchParams.set('plato', platoId);
    } else {
      url.searchParams.delete('plato');
    }
    window.history.pushState({}, '', url.toString());
    setCartaSlug(slug);
    setFocusedPlatoId(platoId);
    setView('carta');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    if (view !== 'home') {
      navigateTo('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (view === 'carta' && cartaSlug) {
    return (
      <PublicDigitalMenu
        slug={cartaSlug}
        focusedPlatoId={focusedPlatoId}
        onClearFocus={() => openDigitalMenu(cartaSlug, '')}
        onExit={() => navigateTo('home')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Barra superior: Contrato de 3 zonas (oculta en impresión A4) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zona 1: Marca en una línea */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Carta Inclusiva
          </button>

          {/* Zona 2: Enlaces de navegación en una línea */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'home' ? 'text-slate-950 underline underline-offset-4' : ''
              }`}
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('comercios')}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Comercios
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ordenanza')}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ordenanza
            </button>
            <button
              type="button"
              onClick={() => navigateTo('merchant')}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'merchant' ? 'text-slate-950 underline underline-offset-4' : ''
              }`}
            >
              Comercio
            </button>
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'admin' ? 'text-slate-950 underline underline-offset-4' : ''
              }`}
            >
              Municipio
            </button>
          </nav>

          {/* Zona 3: 1 acción principal */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('merchant')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cargar Mi Carta
            </button>
          </div>
        </div>

        {/* Navegación móvil compacta */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inicio
          </button>
          <button
            type="button"
            onClick={() => navigateTo('merchant')}
            className="whitespace-nowrap shrink-0 cursor-pointer"
          >
            Acceso Comercio
          </button>
          <button
            type="button"
            onClick={() => navigateTo('admin')}
            className="whitespace-nowrap shrink-0 cursor-pointer"
          >
            Administración Municipal
          </button>
        </div>
      </header>

      <main className="flex-1">
        {view === 'home' && (
          <LandingPortal
            onNavigate={navigateTo}
            onOpenDigitalMenu={openDigitalMenu}
          />
        )}
        {view === 'merchant' && (
          <MerchantPanel onOpenDigitalMenu={openDigitalMenu} />
        )}
        {view === 'admin' && (
          <AdminDashboard onOpenDigitalMenu={openDigitalMenu} />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <span>
            Municipalidad de Vicuña Mackenna · Programa Carta o Menú Inclusivo
          </span>
          <span>
            Pictogramas ARASAAC (CC BY-NC-SA) · Sistema Braille Español · Pesos Argentinos (ARS)
          </span>
        </div>
      </footer>
    </div>
  );
}
