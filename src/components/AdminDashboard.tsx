import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  KeyRound,
  LogOut,
  Edit3,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.ts';
import { fsIsUserAdmin, fsSeedInitialDataIfEmpty } from '../utils/firestoreService.ts';
import { ComercioAdmin, RubroComercio } from '../types.ts';
import {
  addOneYearIso,
  calcularVigenciaHabilitacion,
  formatFechaAr,
  getTodayArIso,
} from '../utils/dates.ts';
import {
  apiCreateComercio,
  apiDeleteComercio,
  apiGetAdminComercios,
  apiUpdateComercio,
} from '../utils/apiClient.ts';

interface AdminDashboardProps {
  onOpenDigitalMenu: (slug: string) => void;
}

const RUBROS: RubroComercio[] = [
  'Restaurante',
  'Bar',
  'Café',
  'Heladería',
  'Confitería',
  'Casa de Comidas',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenDigitalMenu,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [comercios, setComercios] = useState<ComercioAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alerta' | 'vigente' | 'vencida'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Formulario Alta / Edición
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState<RubroComercio>('Restaurante');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [fechaHabilitacion, setFechaHabilitacion] = useState(getTodayArIso());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadComercios = async () => {
    setLoading(true);
    try {
      const list = await apiGetAdminComercios();
      setComercios(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthChecking(true);
      setAuthError('');
      if (!user) {
        setAuthenticated(false);
        setAuthChecking(false);
        return;
      }
      const adminOk = await fsIsUserAdmin(user);
      if (adminOk) {
        setAuthenticated(true);
        try {
          await fsSeedInitialDataIfEmpty();
          await loadComercios();
        } catch (err) {
          setAuthError(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar la base de datos Firestore.'
          );
        }
      } else {
        setAuthenticated(false);
        setAuthError(
          `La cuenta ${user.email || ''} no tiene permisos de Administración Municipal.`
        );
      }
      setAuthChecking(false);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setAuthError('Se cerró la ventana de inicio de sesión.');
      } else {
        setAuthError('No se pudo iniciar sesión con Google. Verificá los popups del navegador.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthenticated(false);
    setComercios([]);
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setRubro('Restaurante');
    setDireccion('');
    setTelefono('');
    setPassword('');
    setFechaHabilitacion(getTodayArIso());
    setFormError('');
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (c: ComercioAdmin) => {
    setEditingId(c.id);
    setNombre(c.nombre);
    setRubro(c.rubro);
    setDireccion(c.direccion);
    setTelefono(c.telefono);
    setPassword(c.password);
    setFechaHabilitacion(c.fechaHabilitacion);
    setFormError('');
    setShowForm(true);
  };

  const handleSaveComercio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !password.trim() || !fechaHabilitacion) {
      setFormError('Completá nombre del comercio, contraseña y primera fecha de habilitación.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const result = editingId
        ? await apiUpdateComercio(editingId, {
            nombre,
            rubro,
            direccion,
            telefono,
            password,
            fechaHabilitacion,
          })
        : await apiCreateComercio({
            nombre,
            rubro,
            direccion,
            telefono,
            password,
            fechaHabilitacion,
          });
      if (!result.ok) {
        setFormError(result.error || 'No se pudo guardar el comercio.');
        return;
      }
      await loadComercios();
      setShowForm(false);
      resetForm();
    } catch {
      setFormError('Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRenovarUnAnio = async (c: ComercioAdmin) => {
    const hoy = getTodayArIso();
    await apiUpdateComercio(c.id, { fechaHabilitacion: hoy, activa: true });
    await loadComercios();
  };

  const handleToggleActiva = async (c: ComercioAdmin) => {
    await apiUpdateComercio(c.id, { activa: !c.activa });
    await loadComercios();
  };

  const handleDelete = async (c: ComercioAdmin) => {
    await apiDeleteComercio(c.id);
    await loadComercios();
  };

  const handleCopyPassword = async (id: string, pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore
    }
  };

  const alertas8Semanas = useMemo(
    () => comercios.filter((c) => c.vigencia.requiereAlerta8Semanas),
    [comercios]
  );
  const vencidos = useMemo(
    () => comercios.filter((c) => c.vigencia.estado === 'vencida'),
    [comercios]
  );

  const filtered = useMemo(() => {
    return comercios.filter((c) => {
      const q = searchTerm.trim().toLowerCase();
      if (
        q &&
        !c.nombre.toLowerCase().includes(q) &&
        !c.rubro.toLowerCase().includes(q) &&
        !c.obleaNumero.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter === 'alerta') return c.vigencia.requiereAlerta8Semanas;
      if (statusFilter === 'vigente') return c.vigencia.estado === 'vigente';
      if (statusFilter === 'vencida') return c.vigencia.estado === 'vencida';
      return true;
    });
  }, [comercios, searchTerm, statusFilter]);

  const previewVigencia = useMemo(
    () => calcularVigenciaHabilitacion(fechaHabilitacion),
    [fechaHabilitacion]
  );

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Municipalidad de Vicuña Mackenna
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Administración Municipal
            </h1>
            <p className="text-sm text-slate-600">
              Secretaría de Desarrollo Social · Área de Bromatología. Ingresá con la cuenta Google municipal para habilitar comercios, asignar contraseñas y sincronizar la base Firestore en la nube.
            </p>
          </div>

          {authChecking ? (
            <p className="text-sm text-slate-600 py-2">Verificando sesión municipal...</p>
          ) : (
            <div className="space-y-4">
              {firebaseUser && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                  <p>
                    Sesión actual: <strong className="text-slate-900">{firebaseUser.email}</strong>
                  </p>
                </div>
              )}

              {authError && (
                <p className="text-sm text-red-700 font-medium">{authError}</p>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                {authLoading
                  ? 'Conectando con Google...'
                  : firebaseUser
                    ? 'Cambiar cuenta Google (Municipio)'
                    : 'Ingresar con Google (Municipio)'}
              </button>

              {firebaseUser && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Cabecera del panel */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Secretaría de Desarrollo Social · Área de Bromatología
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Habilitaciones de Cartas Inclusivas
          </h1>
          {firebaseUser?.email && (
            <p className="text-xs text-slate-500 mt-0.5">
              Conectado en Firebase como {firebaseUser.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Habilitar nuevo comercio
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* Alertas de 8 semanas y vencimientos */}
      {(alertas8Semanas.length > 0 || vencidos.length > 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-amber-950">
                Alertas de Caducidad Anual (Plazo de 8 semanas / Vencidos)
              </h2>
              <p className="text-sm text-amber-900">
                Se detectaron {alertas8Semanas.length} comercio(s) dentro de las últimas 8 semanas previas a su caducidad anual y {vencidos.length} comercio(s) con plazo vencido.
              </p>
            </div>
          </div>

          <div className="divide-y divide-amber-200 bg-white border border-amber-200 rounded-lg">
            {[...vencidos, ...alertas8Semanas].map((c) => (
              <div
                key={c.id}
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <span className="font-semibold text-slate-900">{c.nombre}</span>
                  <span className="text-slate-500 mx-2">·</span>
                  <span className="font-mono-tabular text-slate-700">
                    Caduca: {formatFechaAr(c.vigencia.fechaCaducidad)}
                  </span>
                  <span className="text-slate-500 mx-2">·</span>
                  {c.vigencia.estado === 'vencida' ? (
                    <span className="font-semibold text-red-700">
                      Vencida hace {Math.abs(c.vigencia.diasRestantes)} días
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-800">
                      Restan {c.vigencia.diasRestantes} días ({c.vigencia.semanasRestantes} semanas)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRenovarUnAnio(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Renovar habilitación 1 año (desde hoy)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario modal/expandido para habilitar o editar comercio */}
      {showForm && (
        <div className="bg-white border border-slate-300 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Editar habilitación de comercio' : 'Habilitar nuevo comercio gastronómico'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={handleSaveComercio} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800">
                Nombre del comercio *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Parrilla Don José"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800">
                Rubro gastronómico *
              </label>
              <select
                value={rubro}
                onChange={(e) => setRubro(e.target.value as RubroComercio)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {RUBROS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800">
                Dirección en Vicuña Mackenna
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. Av. Italia 250, Vicuña Mackenna"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800">
                Teléfono de contacto
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 03583 42-0000"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800">
                Contraseña habilitada para el comercio *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ej. parrilla2026"
                className="w-full px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-800">
                Primera fecha de habilitación *
              </label>
              <input
                type="date"
                value={fechaHabilitacion}
                onChange={(e) => setFechaHabilitacion(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                required
              />
            </div>

            {/* Cálculo automático de caducidad y alerta 8 semanas */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-600">Caducidad automática (1 año): </span>
                <strong className="font-mono-tabular text-slate-900">
                  {formatFechaAr(addOneYearIso(fechaHabilitacion))}
                </strong>
              </div>
              <div>
                <span className="text-slate-600">Inicio alerta 8 semanas antes: </span>
                <strong className="font-mono-tabular text-amber-800">
                  {formatFechaAr(previewVigencia.fechaAlerta8Semanas)}
                </strong>
              </div>
            </div>

            {formError && (
              <p className="md:col-span-2 text-sm text-red-700 font-medium">
                {formError}
              </p>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 cursor-pointer disabled:opacity-60"
              >
                {saving
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar cambios'
                    : 'Habilitar comercio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar comercio, rubro u oblea..."
          className="w-full sm:w-80 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        />

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { key: 'all', label: `Todos (${comercios.length})` },
            { key: 'alerta', label: `Alerta 8 sem. (${alertas8Semanas.length})` },
            {
              key: 'vigente',
              label: `Vigentes (${comercios.filter((c) => c.vigencia.estado === 'vigente').length})`,
            },
            { key: 'vencida', label: `Vencidos (${vencidos.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de comercios */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Comercio y Rubro</th>
                <th className="py-3 px-4">Oblea / Clave</th>
                <th className="py-3 px-4">1ª Habilitación</th>
                <th className="py-3 px-4">Caducidad (1 año)</th>
                <th className="py-3 px-4">Estado de Vigencia</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Cargando padrón municipal...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No hay comercios que coincidan con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{c.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {c.rubro} · {c.cantidadPlatos} platos
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-xs font-mono-tabular text-slate-600">
                        {c.obleaNumero}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono-tabular text-xs font-semibold text-slate-900">
                          {c.password}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(c.id, c.password)}
                          title="Copiar contraseña"
                          className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-tabular text-slate-700">
                      {formatFechaAr(c.fechaHabilitacion)}
                    </td>

                    <td className="py-3.5 px-4 font-mono-tabular text-slate-900 font-medium">
                      {formatFechaAr(c.vigencia.fechaCaducidad)}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.vigencia.estado === 'vencida' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Vencida ({Math.abs(c.vigencia.diasRestantes)} d)
                          </span>
                        </div>
                      ) : c.vigencia.estado === 'alerta_8_semanas' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            Alerta 8 sem. ({c.vigencia.diasRestantes} d)
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            Vigente ({c.vigencia.diasRestantes} d)
                          </span>
                        </div>
                      )}
                      {!c.activa && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Acceso suspendido
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDigitalMenu(c.slug)}
                          title="Ver carta digital QR"
                          className="p-1.5 text-slate-600 hover:text-blue-700 rounded hover:bg-blue-50 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(c)}
                          title="Editar comercio o clave"
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenovarUnAnio(c)}
                          title="Renovar 1 año desde hoy"
                          className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded cursor-pointer whitespace-nowrap"
                        >
                          Renovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActiva(c)}
                          className="px-2.5 py-1 text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 rounded cursor-pointer whitespace-nowrap"
                        >
                          {c.activa ? 'Suspender' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          title="Eliminar comercio"
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
