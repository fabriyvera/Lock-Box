"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  ClipboardList,
  Clock3,
  LogOut,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  ScanLine,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pointRequest } from "@/lib/collection-point/api";
import {
  nextPointStatus,
  STATUS_LABELS,
  type PointOrder,
  type PointState,
} from "@/lib/collection-point/model";
import styles from "./point.module.css";

const time = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function PointDashboard({ name }: { name: string }) {
  const [state, setState] = useState<PointState | null>(null);
  const [pointId, setPointId] = useState("");
  const [code, setCode] = useState("");
  const [scan, setScan] = useState<{
    order: PointOrder;
    qrCode: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const mutation = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    pointRequest<{ state: PointState }>("/state", {}, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setState(result.state);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar el punto.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => () => mutation.current?.abort(), []);

  const point =
    state?.points.find((item) => item.id === pointId) ?? state?.points[0];
  const orders =
    state?.orders.filter((item) => item.pointId === point?.id) ?? [];
  const activity =
    state?.activity.filter((item) => item.pointId === point?.id) ?? [];
  const next = scan ? nextPointStatus(scan.order.status) : null;

  async function lookup(event: FormEvent) {
    event.preventDefault();
    if (pending.current || loading || !code.trim()) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    setScan(null);
    mutation.current = new AbortController();
    try {
      const qrCode = code.trim();
      const result = await pointRequest<{ order: PointOrder }>(
        `/scan/${encodeURIComponent(qrCode)}`,
        {},
        mutation.current.signal,
      );
      setScan({ order: result.order, qrCode });
      setPointId(result.order.pointId);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo leer el código.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function confirm() {
    if (!scan || !next || pending.current || loading) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    mutation.current = new AbortController();
    let saved = false;
    try {
      const result = await pointRequest<{ order: PointOrder }>(
        `/${scan.order.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ qrCode: scan.qrCode, status: next.status }),
        },
        mutation.current.signal,
      );
      saved = true;
      setMessage(
        `Pedido ${result.order.id.slice(0, 8)}: ${STATUS_LABELS[result.order.status]}.`,
      );
      setScan(null);
      setCode("");
      const fresh = await pointRequest<{ state: PointState }>(
        "/state",
        {},
        mutation.current.signal,
      );
      setState(fresh.state);
      input.current?.focus();
    } catch (reason) {
      setScan(null);
      setError(
        saved
          ? "El cambio se guardó. Pulsa Actualizar para consultar los datos recientes."
          : reason instanceof Error
            ? reason.message
            : "No se pudo confirmar el cambio. Consulta el código antes de reintentar.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function refresh() {
    if (busy || loading) return;
    setLoading(true);
    setError(null);
    setScan(null);
    setRevision((value) => value + 1);
  }
  async function logout() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      window.location.replace("/login");
    } catch {
      setError("No se pudo cerrar sesión.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="LockBox, volver al inicio"
        >
          <span>LOCK</span>
          <span>BOX</span>
        </Link>
        <span className={styles.workspace}>ADMINISTRACIÓN DEL PUNTO</span>
        <div className={styles.account}>
          <UserRound size={18} aria-hidden="true" />
          <span>{name}</span>
        </div>
        <button
          className={styles.secondary}
          disabled={busy}
          onClick={() => void logout()}
        >
          <LogOut size={16} aria-hidden="true" /> Cerrar sesión
        </button>
      </header>
      <main className={styles.content} aria-busy={loading || busy}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" /> Volver al inicio
        </Link>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>RED LOCKBOX / PUNTO DE RECOJO</p>
            <h1>Control del punto de recojo</h1>
            <p className={styles.muted}>
              Recibe pedidos y confirma su entrega con el código del comprador.
            </p>
          </div>
          <button
            className={styles.secondary}
            onClick={refresh}
            disabled={busy || loading}
          >
            <RefreshCw size={16} aria-hidden="true" />{" "}
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {message && (
          <p role="status" className={styles.success}>
            {message}
          </p>
        )}
        {!state && loading && (
          <p className={styles.muted} role="status">
            Consultando tus puntos de recojo…
          </p>
        )}
        {state && !point && (
          <p className={styles.muted}>No tienes puntos activos asignados.</p>
        )}
        {point && (
          <>
            <section
              className={styles.pointBar}
              aria-label="Punto seleccionado"
            >
              <MapPin size={20} aria-hidden="true" />
              <div>
                <label htmlFor="point-select">Punto de recojo</label>
                <select
                  id="point-select"
                  value={point.id}
                  disabled={busy || loading}
                  onChange={(event) => {
                    setPointId(event.target.value);
                    setScan(null);
                    setCode("");
                    setMessage(null);
                  }}
                >
                  {state?.points.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <p className={styles.muted}>{point.address}</p>
              </div>
              <span className={styles.tag}>Datos de Supabase</span>
            </section>
            <div className={styles.stats}>
              <div className={styles.card}>
                <Package className={styles.warning} aria-hidden="true" />
                <div>
                  <span>Pedidos en el punto</span>
                  <strong>
                    {point.occupied}
                    <small> / capacidad {point.capacity}</small>
                  </strong>
                </div>
              </div>
              <div className={styles.card}>
                <Clock3 className={styles.info} aria-hidden="true" />
                <div>
                  <span>Listos para retiro</span>
                  <strong>{point.pending}</strong>
                </div>
              </div>
              <div className={styles.card}>
                <CheckCheck className={styles.accent} aria-hidden="true" />
                <div>
                  <span>Entregados hoy</span>
                  <strong>{point.deliveredToday}</strong>
                </div>
              </div>
            </div>
            <div className={styles.columns}>
              <div className={styles.left}>
                <section className={styles.panel} aria-labelledby="scan-title">
                  <h2 id="scan-title">
                    <ScanLine size={21} aria-hidden="true" /> Consultar código
                    QR
                  </h2>
                  <div className={styles.scanner}>
                    <div className={styles.reader}>
                      <QrCode size={72} strokeWidth={1.3} aria-hidden="true" />
                      <p>Lector QR o ingreso manual</p>
                    </div>
                    <form
                      onSubmit={(event) => void lookup(event)}
                      className={styles.form}
                    >
                      <label htmlFor="qr-code">Código del pedido</label>
                      <input
                        id="qr-code"
                        ref={input}
                        value={code}
                        maxLength={160}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={busy || loading}
                        onChange={(event) => {
                          setCode(event.target.value);
                          setScan(null);
                        }}
                        placeholder="LBX-…"
                        aria-describedby="qr-help"
                      />
                      <p id="qr-help" className={styles.muted}>
                        Consulta el código antes de confirmar cualquier cambio.
                      </p>
                      <button
                        className={styles.primary}
                        disabled={busy || loading || !code.trim()}
                        type="submit"
                      >
                        {busy ? "Procesando…" : "Consultar pedido"}
                      </button>
                    </form>
                  </div>
                  {scan && (
                    <div className={styles.confirmation}>
                      <span className={styles.tag}>
                        {STATUS_LABELS[scan.order.status]}
                      </span>
                      <h3>{scan.order.productTitle}</h3>
                      <p>
                        {scan.order.buyerLabel} · Pedido{" "}
                        {scan.order.id.slice(0, 8)}
                      </p>
                      <p className={styles.muted}>
                        {scan.order.status === "ready"
                          ? "Confirma únicamente después de entregar el paquete al comprador."
                          : "Comprueba el paquete antes de confirmar su estado."}
                      </p>
                      {next && (
                        <button
                          type="button"
                          className={styles.primary}
                          disabled={busy || loading}
                          onClick={() => void confirm()}
                        >
                          {next.label}
                        </button>
                      )}
                    </div>
                  )}
                </section>
                <section
                  className={styles.panel}
                  aria-labelledby="orders-title"
                >
                  <h2 id="orders-title">
                    <Package size={21} aria-hidden="true" /> Pedidos del punto
                  </h2>
                  {orders.length === 0 ? (
                    <p className={styles.muted}>
                      No hay pedidos pendientes en este punto.
                    </p>
                  ) : (
                    <div className={styles.orderGrid}>
                      {orders.map((order) => (
                        <article
                          key={order.id}
                          className={styles.order}
                          data-status={order.status}
                        >
                          <span className={styles.tag}>
                            {STATUS_LABELS[order.status]}
                          </span>
                          <h3>{order.productTitle}</h3>
                          <p>{order.buyerLabel}</p>
                          <small>Pedido {order.id.slice(0, 8)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
              <section
                className={styles.panel}
                aria-labelledby="activity-title"
              >
                <h2 id="activity-title">
                  <ClipboardList size={21} aria-hidden="true" /> Actividad
                  reciente
                </h2>
                {activity.length === 0 ? (
                  <p className={styles.muted}>
                    Todavía no hay movimientos registrados.
                  </p>
                ) : (
                  <ol className={styles.activity}>
                    {activity.map((item) => (
                      <li key={item.id}>
                        <Package size={18} aria-hidden="true" />
                        <div>
                          <p>
                            Pedido {item.orderId.slice(0, 8)} ·{" "}
                            {STATUS_LABELS[item.status] ?? item.status}
                          </p>
                          <time dateTime={item.at}>{time(item.at)}</time>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
            <p className={styles.footnote}>
              La lectura funciona con códigos ingresados manualmente o lectores
              QR que escriben en el campo. La conexión con cámara y apertura
              física de casilleros está pendiente.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
