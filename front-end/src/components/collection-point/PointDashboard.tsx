"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Camera,
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
  LoaderCircle,
} from "lucide-react";
import QrCameraScanner from "./QrCameraScanner";
import Dialog from "@/components/seller/Dialog";
import { createClient } from "@/lib/supabase/client";
import { pointRequest } from "@/lib/collection-point/api";
import {
  nextPointStatus,
  STATUS_LABELS,
  type PointOrder,
  type PointState,
} from "@/lib/collection-point/model";
import styles from "./point.module.css";

const count = new Intl.NumberFormat("es-BO");
const money = (value = 0) =>
  `Bs. ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
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
  const [codeError, setCodeError] = useState<string | null>(null);
  const [scan, setScan] = useState<{
    order: PointOrder;
    qrCode?: string;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [balanceConfirmed, setBalanceConfirmed] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const errorNotice = useRef<HTMLParagraphElement>(null);
  const scanResult = useRef<HTMLDivElement>(null);
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

  async function lookupCode(rawCode: string) {
  if (pending.current || loading) return;
  const qrCode = rawCode.trim();
  if (!qrCode) {
    setCodeError("Ingresa el código del pedido para consultarlo.");
    input.current?.focus();
    return;
  }
  pending.current = true;
  setBusy(true);
  setError(null);
  setMessage(null);
  setScan(null);
  setCodeError(null);
  setConfirmOpen(false);
  setBalanceConfirmed(false);
  mutation.current = new AbortController();
  try {
    const result = await pointRequest<{ order: PointOrder }>(
      `/scan/${encodeURIComponent(qrCode)}`,
      {},
      mutation.current.signal,
    );
    setCode(qrCode);
    setScan({ order: result.order, qrCode });
    setPointId(result.order.pointId);
    requestAnimationFrame(() => scanResult.current?.focus());
  } catch (reason) {
    setError(
      reason instanceof Error ? reason.message : "No se pudo leer el código.",
    );
    requestAnimationFrame(() => errorNotice.current?.focus());
  } finally {
    pending.current = false;
    setBusy(false);
  }
}

function lookup(event: FormEvent) {
  event.preventDefault();
  void lookupCode(code);
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
          body: JSON.stringify(
            scan.qrCode
              ? { qrCode: scan.qrCode, status: next.status }
              : { status: next.status },
          ),
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
      requestAnimationFrame(() => input.current?.focus());
    } catch (reason) {
      setScan(null);
      setError(
        saved
          ? "El cambio se guardó. Pulsa Actualizar para consultar los datos recientes."
          : reason instanceof Error
            ? reason.message
            : "No se pudo confirmar el cambio. Consulta el código antes de reintentar.",
      );
      requestAnimationFrame(() => errorNotice.current?.focus());
    } finally {
      pending.current = false;
      setBusy(false);
      setConfirmOpen(false);
    }
  }
  function refresh() {
    if (busy || loading) return;
    setLoading(true);
    setError(null);
    setScan(null);
    setConfirmOpen(false);
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
    <div className={`app-theme ${styles.shell}`}>
      <a href="#point-content" className="workspace-skip-link">
        Saltar al contenido
      </a>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="LockBox, volver al inicio"
        >
          <span>LOCK</span>
          <span>BOX</span>
        </Link>
        <span className={styles.workspace}>ESPACIO DEL PUNTO LOCKBOX</span>
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
      <main id="point-content" tabIndex={-1} className={styles.content}>
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
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={loading ? styles.spinning : undefined}
            />{" "}
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
        {error && (
          <p
            ref={errorNotice}
            tabIndex={-1}
            role="alert"
            className={styles.error}
          >
            {error}
          </p>
        )}
        {message && (
          <p role="status" className={styles.success}>
            {message}
          </p>
        )}
        {busy && (
          <p role="status" className={styles.processing}>
            <LoaderCircle
              size={18}
              aria-hidden="true"
              className={styles.spinning}
            />
            Procesando solicitud…
          </p>
        )}
        {!state && loading && (
          <p className={styles.muted} role="status">
            Consultando tus puntos de recojo…
          </p>
        )}
        {state && !point && (
          <section className={styles.empty} aria-label="Sin puntos asignados">
            <MapPin size={32} aria-hidden="true" />
            <h2>No tienes puntos activos asignados</h2>
            <p>
              Contacta al equipo de LockBox para revisar la asignación de tu
              punto de recojo.
            </p>
          </section>
        )}
        {point && (
          <>
            <section
  className={styles.pointBar}
  aria-label="Ubicación del punto de recojo"
>
  <div className={styles.pointIcon}>
    <MapPin size={26} aria-hidden="true" />
  </div>
  <div className={styles.pointInfo}>
    <span className={styles.pointLabel}>UBICACIÓN ACTUAL DEL PUNTO</span>
    <h2 className={styles.pointName}>{point.name}</h2>
    <p className={styles.pointAddress}>{point.address}</p>
  </div>
  <span className={styles.tag}>Punto activo</span>
</section>
            <div className={styles.stats}>
              <div className={styles.card}>
                <Package className={styles.warning} aria-hidden="true" />
                <div>
                  <span>Pedidos en el punto</span>
                  <strong>
                    {count.format(point.occupied)}
                    <small> / capacidad {count.format(point.capacity)}</small>
                  </strong>
                </div>
              </div>
              <div className={styles.card}>
                <Clock3 className={styles.info} aria-hidden="true" />
                <div>
                  <span>Listos para retiro</span>
                  <strong>{count.format(point.pending)}</strong>
                </div>
              </div>
              <div className={styles.card}>
                <CheckCheck className={styles.accent} aria-hidden="true" />
                <div>
                  <span>Entregados hoy</span>
                  <strong>{count.format(point.deliveredToday)}</strong>
                </div>
              </div>
            </div>
            <section
              className={styles.workflow}
              aria-label="Flujo de un pedido en el punto"
            >
              <h2 className="sr-only">Cómo gestionar un pedido</h2>
              {[
                {
                  icon: Package,
                  title: "Recibe",
                  text: "Comprueba el paquete y su código.",
                },
                {
                  icon: QrCode,
                  title: "Prepara",
                  text: "Márcalo listo para el retiro.",
                },
                {
                  icon: CheckCheck,
                  title: "Entrega",
                  text: "Verifica el código del comprador y confirma.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon size={20} aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </section>
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
  <button
    type="button"
    className={styles.secondary}
    disabled={busy || loading}
    onClick={() => setScannerOpen(true)}
  >
    <Camera size={16} aria-hidden="true" /> Escanear con cámara
  </button>
</div>
                    <form
                      noValidate
                      onSubmit={(event) => void lookup(event)}
                      className={styles.form}
                    >
                      <label htmlFor="qr-code">Código del pedido</label>
                      <input
                        id="qr-code"
                        name="qrCode"
                        type="text"
                        required
                        autoCapitalize="none"
                        ref={input}
                        value={code}
                        maxLength={160}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={busy || loading}
                        onChange={(event) => {
                          setCode(event.target.value);
                          setCodeError(null);
                          setScan(null);
                        }}
                        placeholder="LBX-…"
                        aria-invalid={Boolean(codeError) || undefined}
                        aria-describedby={
                          codeError ? "qr-help qr-error" : "qr-help"
                        }
                      />
                      {codeError && (
                        <p
                          id="qr-error"
                          role="alert"
                          className={styles.fieldError}
                        >
                          {codeError}
                        </p>
                      )}
                      <p id="qr-help" className={styles.muted}>
                        Consulta el código antes de confirmar cualquier cambio.
                      </p>
                      <button
                        className={styles.primary}
                        disabled={busy || loading}
                        type="submit"
                      >
                        {busy ? "Procesando…" : "Consultar pedido"}
                      </button>
                    </form>
                  </div>
                  {scan && (
                    <div
                      ref={scanResult}
                      tabIndex={-1}
                      className={styles.confirmation}
                      aria-labelledby="scan-result-title"
                    >
                      <span
                        className={styles.tag}
                        data-status={scan.order.status}
                      >
                        {STATUS_LABELS[scan.order.status]}
                      </span>
                      <h3 id="scan-result-title">{scan.order.productTitle}</h3>
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
                          onClick={() => setConfirmOpen(true)}
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
                      {orders.map((order) => {
                        const step = nextPointStatus(order.status);
                        return (
                          <article
                            key={order.id}
                            className={styles.order}
                            data-status={order.status}
                          >
                            <span
                              className={styles.tag}
                              data-status={order.status}
                            >
                              {STATUS_LABELS[order.status]}
                            </span>
                            <h3>{order.productTitle}</h3>
                            <p>{order.buyerLabel}</p>
                            <small>Pedido {order.id.slice(0, 8)}</small>

                            {step && order.status !== "ready" && (
                              <button
                                type="button"
                                className={styles.primary}
                                style={{ marginTop: "12px", width: "100%" }}
                                disabled={busy || loading}
                                onClick={() => {
                                  setScan({ order });
                                  setConfirmOpen(true);
                                }}
                              >
                                {step.label}
                              </button>
                            )}
                            {order.status === "ready" && (
                              <p
                                className={styles.muted}
                                style={{ marginTop: "10px", marginBottom: 0 }}
                              >
                                Escanea el QR del comprador para entregar.
                              </p>
                            )}
                          </article>
                        );
                      })}
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
      {confirmOpen && scan && next && (
        <Dialog
          title={next.label}
          onClose={() => {
            if (!busy) setConfirmOpen(false);
          }}
        >
          <div className={styles.confirmBody}>
            <p>
              Vas a actualizar el pedido{" "}
              <strong>{scan.order.id.slice(0, 8)}</strong> de{" "}
              <strong>{scan.order.buyerLabel}</strong>.
            </p>
            <dl className={styles.summary}>
              <div>
                <dt>Producto</dt>
                <dd>{scan.order.productTitle}</dd>
              </div>
              <div>
                <dt>Punto</dt>
                <dd>{point?.name}</dd>
              </div>
              <div>
                <dt>Estado actual</dt>
                <dd>{STATUS_LABELS[scan.order.status]}</dd>
              </div>
              <div>
                <dt>Nuevo estado</dt>
                <dd>{STATUS_LABELS[next.status]}</dd>
              </div>
              {scan.order.totalAmount !== undefined && (
                <>
                  <div>
                    <dt>Total pedido</dt>
                    <dd>{money(scan.order.totalAmount)}</dd>
                  </div>
                  <div>
                    <dt>Reserva (50%)</dt>
                    <dd>{money(scan.order.depositAmount)} (Pagado)</dd>
                  </div>
                  <div>
                    <dt>Saldo al recoger (50%)</dt>
                    <dd>
                      <strong>{money(scan.order.balanceAmount)}</strong>
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {next.status === "delivered" ? (
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-accent-border)",
                  background: "var(--color-accent-faint)",
                  cursor: "pointer",
                  marginBottom: "16px",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={balanceConfirmed}
                  disabled={busy}
                  onChange={(e) => setBalanceConfirmed(e.target.checked)}
                  style={{ width: "20px", height: "20px", marginTop: "2px" }}
                />
                <span>
                  Confirmo la entrega del paquete y la verificación del 50%
                  restante ({money(scan.order.balanceAmount)}).
                </span>
              </label>
            ) : (
              <p className={styles.muted}>
                Verifica que el paquete esté en el punto y que corresponda al
                pedido consultado.
              </p>
            )}

            {busy && (
              <p role="status" className={styles.processing}>
                <LoaderCircle
                  size={18}
                  aria-hidden="true"
                  className={styles.spinning}
                />
                Guardando estado del pedido…
              </p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                disabled={busy}
                onClick={() => {
                  setConfirmOpen(false);
                  setBalanceConfirmed(false);
                }}
              >
                Volver a revisar
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={
                  busy ||
                  loading ||
                  (next.status === "delivered" && !balanceConfirmed)
                }
                onClick={() => void confirm()}
              >
                {busy ? "Guardando…" : next.label}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {scannerOpen && (
  <Dialog
    title="Escanear código QR"
    onClose={() => setScannerOpen(false)}
  >
    <QrCameraScanner
      onClose={() => setScannerOpen(false)}
      onScan={(decodedText) => {
        setScannerOpen(false);
        void lookupCode(decodedText);
      }}
    />
  </Dialog>
)}
    </div>
  );
}
