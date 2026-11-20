import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocurrió un error inesperado.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 space-y-4">
            <h1 className="text-xl font-bold text-slate-900">
              Se produjo un error de conexión o permisos
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              No se pudo completar la operación en la base de datos. Verificá tu sesión e intentá recargar la página.
            </p>
            <details className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <summary className="cursor-pointer font-medium text-slate-700">
                Detalle técnico
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono-tabular">
                {this.state.errorMessage}
              </pre>
            </details>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
