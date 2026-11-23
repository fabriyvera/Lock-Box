"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/auth/account";
import type { AdminState } from "@/lib/admin/model";
import { pointReportCsv } from "@/lib/admin/report";
import { STATUS_LABELS } from "@/lib/collection-point/model";
import Dialog from "@/components/seller/Dialog";
import styles from "./admin.module.css";

const money = (cents: number) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(cents / 100);
const localDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
type Filters = { from: string; to: string; includeTests: boolean };
async function request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const { data, error } = await createClient().auth.getSession();
  if (error || !data.session) throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
  const response = await fetch(apiUrl(`/api/admin${path}`), { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "No se pudo consultar la administración.");
  return result;
}

export default function AdminDashboard({ name }: { name: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(() => ({ from: localDate().slice(0, 7) + "-01", to: localDate(), includeTests: false }));
  const [applied, setApplied] = useState(filters);
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ entity: "profile" | "point"; id: string; name: string; active: boolean } | null>(null);
  const mutation = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ from: applied.from, to: applied.to, includeTests: String(applied.includeTests) });
    request<{ state: AdminState }>(`/state?${query}`, {}, controller.signal)
      .then((result) => { if (!controller.signal.aborted) { setState(result.state); setError(""); } })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No se pudo cargar el reporte."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied, revision]);
  useEffect(() => () => mutation.current?.abort(), []);
  function apply(event: FormEvent) {
    event.preventDefault(); setState(null); setLoading(true); setError(""); setApplied({ ...filters });
  }
  async function confirmActive() {
    if (!pending || busy) return;
    const controller = new AbortController(); mutation.current = controller; setBusy(true); setError("");
    try {
      await request("/active", { method: "POST", body: JSON.stringify({ entity: pending.entity, id: pending.id, active: pending.active }) }, controller.signal);
      setNotice(`Estado actualizado: ${pending.name}.`); setPending(null); setRevision((value) => value + 1);
    } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No se pudo actualizar el estado."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function exportReport() {
    if (!state || error || loading) return;
    const csv = pointReportCsv(state.pointReport, applied.from, applied.to, applied.includeTests);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `lockbox-comisiones-${applied.from}-${applied.to}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function logout() {
    try { const { error } = await createClient().auth.signOut(); if (error) throw error; router.replace("/login"); router.refresh(); }
    catch { setError("No se pudo cerrar la sesión. Inténtalo nuevamente."); }
  }
  const profiles = state?.profiles.filter((profile) => `${profile.name} ${profile.username} ${profile.role}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  return <div className={`app-theme ${styles.shell}`}>
    <a href="#admin-content" className="sr-only focus:not-sr-only">Saltar al contenido</a>
    <header className={styles.header}><Link href="/" className={styles.brand}>LockBox</Link><p>Administración · {name}</p><button className={styles.button} onClick={logout}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button></header>
    <main id="admin-content" className={styles.main}>
      <div className={styles.intro}><div><p className={styles.eyebrow}>Control de la red</p><h1>Administración y comisiones</h1><p>Consulta la actividad, administra el acceso y revisa lo que genera cada servicio completado.</p></div><button className={styles.button} onClick={exportReport} disabled={!state || loading || !!error}><Download size={18} aria-hidden="true" />Exportar comisiones CSV</button></div>
      <form onSubmit={apply} className={styles.filters} aria-label="Periodo del reporte">
        <label>Desde<input required type="date" value={filters.from} max={filters.to} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label>Hasta<input required type="date" value={filters.to} min={filters.from} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <label className={styles.check}><input type="checkbox" checked={filters.includeTests} onChange={(event) => setFilters({ ...filters, includeTests: event.target.checked })} />Incluir pedidos de prueba</label>
        <button className={`${styles.button} ${styles.primary}`} disabled={loading}><RefreshCw size={18} aria-hidden="true" />Consultar</button>
      </form>
      <p className={`${styles.note} mt-4`}><ShieldCheck className="inline mr-2" size={18} aria-hidden="true" />Tarifa de Bs 8 a cargo del comprador: Bs 4 para el punto y Bs 1,50 de costo variable estimado. Contribución: Bs 2,50 antes de costos fijos. Sin cobros ni transferencias reales.</p>
      {loading && <p role="status" className={styles.notice}>Cargando administración…</p>}
      {error && <p role="alert" className={`${styles.notice} ${styles.error}`}>{error}</p>}
      {notice && <p role="status" className={`${styles.notice} ${styles.success}`}>{notice}</p>}
      {state && <>
        <p className={styles.note}>{applied.includeTests ? "Reporte con pruebas incluidas. Los importes simulados no son ingresos reales." : "Reporte sin pedidos de prueba."} Zona horaria: La Paz. Las comisiones se reconocen por fecha de entrega.</p>
        <dl className={styles.metrics}>{[
          ["Servicios completados", state.summary.completedOrders], ["Ingresos por servicio", money(state.summary.serviceRevenueCents)], ["Comisiones de puntos", money(state.summary.pointCommissionCents)], ["Otros costos estimados", money(state.summary.variableCostCents)], ["Contribución antes de costos fijos", money(state.summary.contributionCents)],
        ].map(([label, value]) => <div className={styles.metric} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <section className={styles.section}><h2>Comisiones por punto</h2><p className={styles.note}>Cálculos registrados una vez por pedido entregado. No representan una liquidación bancaria.</p><div className={styles.tableWrap}><table className={styles.table}><caption>Todos los puntos y sus servicios del periodo</caption><thead><tr><th scope="col">Punto</th><th scope="col">Estado</th><th scope="col">Pedidos completados</th><th scope="col">Comisión</th><th scope="col">Acción</th></tr></thead><tbody>{state.pointReport.map((point) => <tr key={point.id}><td>{point.name}</td><td>{point.active ? "Activo" : "Inactivo"}</td><td>{point.completedOrders}</td><td className={styles.amount}>{money(point.commissionCents)}</td><td><button className={styles.button} disabled={busy || loading} onClick={() => setPending({ entity: "point", id: point.id, name: point.name, active: !point.active })}>{point.active ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div></section>
        <section className={styles.section}><h2>Resumen mensual</h2><div className={styles.tableWrap}><table className={styles.table}><caption>Servicios completados según fecha de entrega</caption><thead><tr><th scope="col">Mes</th><th scope="col">Servicios</th><th scope="col">Ingreso servicio</th><th scope="col">Puntos</th><th scope="col">Otros costos</th><th scope="col">Contribución</th></tr></thead><tbody>{state.monthlyReport.length ? state.monthlyReport.map((row) => <tr key={row.month}><td>{row.month}</td><td>{row.completedOrders}</td><td className={styles.amount}>{money(row.serviceRevenueCents)}</td><td className={styles.amount}>{money(row.pointCommissionCents)}</td><td className={styles.amount}>{money(row.variableCostCents)}</td><td className={styles.amount}>{money(row.contributionCents)}</td></tr>) : <tr><td colSpan={6}>No hay servicios con la nueva tarifa completados en este periodo.</td></tr>}</tbody></table></div></section>
        <section className={styles.section}><h2>Pedidos recientes</h2><p className={styles.note}>Hasta 200 pedidos creados en el periodo. El valor de la mercadería pertenece al vendedor y no se suma al ingreso del servicio. Los pedidos anteriores conservan su política original.</p><div className={styles.tableWrap}><table className={styles.table}><caption>Seguimiento comercial</caption><thead><tr><th scope="col">Pedido</th><th scope="col">Participantes</th><th scope="col">Estado</th><th scope="col">Mercadería</th><th scope="col">Servicio</th><th scope="col">Tipo</th></tr></thead><tbody>{state.orders.map((order) => <tr key={order.id}><td>LB-{order.id.slice(0, 8).toUpperCase()}</td><td>{order.buyer}<br />{order.seller}<br />{order.point}</td><td><span className={styles.status}>{STATUS_LABELS[order.status] ?? order.status}</span></td><td className={styles.amount}>{money(order.merchandiseCents)}</td><td className={styles.amount}>{money(order.serviceFeeCents)}{!order.policyVersion && " · anterior"}</td><td>{order.isTest ? "Prueba" : "Operativo"}</td></tr>)}{!state.orders.length && <tr><td colSpan={6}>No hay pedidos que coincidan con el filtro.</td></tr>}</tbody></table></div></section>
        <section className={styles.section}><h2>Acceso de usuarios</h2><p className={styles.note}>Activa o desactiva perfiles sin borrar su historial. La asignación de administradores se realiza por un procedimiento separado.</p><label className="sr-only" htmlFor="admin-search">Buscar por nombre, usuario o rol</label><input id="admin-search" type="search" value={search} placeholder="Buscar nombre, usuario o rol…" onChange={(event) => setSearch(event.target.value)} className={styles.search} /><div className={styles.tableWrap}><table className={styles.table}><caption>Perfiles registrados</caption><thead><tr><th scope="col">Nombre</th><th scope="col">Usuario</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Acción</th></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}><td>{profile.name}</td><td>{profile.username}</td><td>{profile.role}</td><td>{profile.active ? "Activo" : "Inactivo"}</td><td>{profile.role === "admin" ? "Acceso protegido" : <button className={styles.button} disabled={busy || loading} onClick={() => setPending({ entity: "profile", id: profile.id, name: profile.name, active: !profile.active })}>{profile.active ? "Desactivar" : "Activar"}</button>}</td></tr>)}</tbody></table></div></section>
        <section className={styles.section}><h2>Historial administrativo</h2><p className={styles.note}>Últimos 50 cambios de acceso registrados con su responsable.</p><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Fecha</th><th scope="col">Entidad</th><th scope="col">Referencia</th><th scope="col">Estado</th></tr></thead><tbody>{state.audit.map((event) => <tr key={event.id}><td>{new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", dateStyle: "short", timeStyle: "short" }).format(new Date(event.at))}</td><td>{event.entity === "profile" ? "Perfil" : "Punto"}</td><td>{event.targetId}<br />Responsable: {event.actorId}</td><td>{event.active ? "Activado" : "Desactivado"}</td></tr>)}{!state.audit.length && <tr><td colSpan={4}>Todavía no hay cambios administrativos.</td></tr>}</tbody></table></div></section>
      </>}
    </main>
    {pending && <Dialog title={pending.active ? "Activar acceso" : "Desactivar acceso"} onClose={() => { if (!busy) setPending(null); }}>
      <p>¿Quieres {pending?.active ? "activar" : "desactivar"} {pending?.name}? Su historial se conservará.</p><div className="flex flex-wrap gap-3 mt-5"><button className={styles.button} disabled={busy} onClick={() => setPending(null)}>Cancelar</button><button className={`${styles.button} ${styles.primary}`} disabled={busy} onClick={confirmActive}>{busy ? "Guardando…" : "Confirmar cambio"}</button></div>
    </Dialog>}
  </div>;
}
