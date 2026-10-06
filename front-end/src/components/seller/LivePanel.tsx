"use client";

import { useState } from "react";
import { Radio, Copy, Check, Square, Play } from "lucide-react";
import { activeLive, money } from "@/lib/seller/domain";
import Dialog from "./Dialog";
import { Badge, Empty, ProductVisual, dateLabel, type PanelProps } from "./ui";
import styles from "./seller.module.css";

export default function LivePanel({
  state,
  act,
  now,
}: PanelProps & { now: number }) {
  const live = activeLive(state);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const available = state.products.filter(
    (p) => p.status === "published" && p.stock > 0,
  );
  const minutes = live
    ? Math.max(0, Math.floor((now - Date.parse(live.startedAt)) / 60000))
    : 0;
  async function copyCatalog() {
    if (!live) return;
    const text =
      `${state.profile.storeName} · @${state.profile.handle}\n${live.title}\n` +
      state.products
        .filter((p) => live.productIds.includes(p.id))
        .map((p) => `${p.title} — ${money(p.priceCents)}`)
        .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Catálogo copiado. Pégalo en la descripción de tu live.");
    } catch {
      setCopyMessage(
        "El navegador no permitió copiar. Selecciona el catálogo en pantalla.",
      );
    }
  }
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Tu próxima venta empieza en vivo</h2>
          <p>Selecciona tu catálogo y prepara la transmisión.</p>
        </div>
        <Badge tone={live ? "red" : "neutral"}>
          {live ? "EN VIVO" : "SIN TRANSMISIÓN"}
        </Badge>
      </div>
      <div className={styles.liveLayout}>
        <section className={styles.card}>
          <div className={styles.liveStage}>
            <Radio size={48} strokeWidth={1.4} />
            <Badge tone={live ? "red" : "neutral"}>
              {live ? "LIVE SIMULADO" : "ESTUDIO LOCKBOX"}
            </Badge>
            <h3>{live?.title || "Conecta con tus compradores"}</h3>
            <p>
              {live
                ? `${live.productIds.length} productos · ${minutes} min en vivo`
                : "Tu catálogo, listo para acompañar el live de TikTok."}
            </p>
            <span className={styles.liveWatermark}>
              LOCKBOX / SOCIAL COMMERCE
            </span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.muted}>
              Esta demo no transmite video ni se conecta a TikTok. Simula el
              inicio y cierre del live con tu catálogo.
            </p>
            {live ? (
              <>
                <button
                  className={styles.danger}
                  onClick={() => setConfirmEnd(true)}
                >
                  <Square size={16} /> Finalizar live
                </button>
                <button className={styles.secondary} onClick={copyCatalog}>
                  <Copy size={16} /> Copiar catálogo para TikTok
                </button>
                <p role="status" className={styles.muted}>
                  {copyMessage}
                </p>
              </>
            ) : (
              <form
                className={styles.form}
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (
                    await act(
                      {
                        type: "startLive",
                        id: crypto.randomUUID(),
                        title,
                        productIds: selected,
                        at: new Date().toISOString(),
                      },
                      "Tu live simulado está activo.",
                    )
                  ) {
                    setTitle("");
                    setSelected([]);
                  }
                }}
              >
                <label>
                  Título de tu live
                  <input
                    required
                    maxLength={100}
                    placeholder="Ej. Nuevos favoritos · colección de octubre"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <button
                  className={styles.primary}
                  disabled={!selected.length || !title.trim()}
                >
                  <Play size={16} /> Iniciar live simulado
                </button>
              </form>
            )}
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <h3>{live ? "Catálogo en vivo" : "Elige tus productos"}</h3>
            <span className={styles.muted}>
              {live ? live.productIds.length : selected.length} seleccionados
            </span>
          </div>
          <div className={styles.liveProducts}>
            {(live
              ? state.products.filter((p) => live.productIds.includes(p.id))
              : available
            ).map((product) => (
              <label className={styles.liveProduct} key={product.id}>
                {!live && (
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, product.id]
                          : current.filter((id) => id !== product.id),
                      )
                    }
                  />
                )}
                <div className={styles.smallVisual}>
                  <ProductVisual product={product} />
                </div>
                <div>
                  <strong>{product.title}</strong>
                  <p>
                    {money(product.priceCents)}{" "}
                    <span>· {product.stock} disponibles</span>
                  </p>
                </div>
                {live && <Check size={18} className={styles.green} />}
              </label>
            ))}
          </div>
          {!available.length && !live && (
            <Empty title="Tu catálogo aún no está listo">
              Publica al menos un producto con stock para iniciar un live.
            </Empty>
          )}
        </section>
      </div>
      <section className={styles.card}>
        <div className={styles.cardHeading}>
          <h3>Transmisiones anteriores</h3>
          <Badge>
            {state.sessions.filter((s) => s.endedAt).length} finalizadas
          </Badge>
        </div>
        {state.sessions
          .filter((s) => s.endedAt)
          .map((session) => (
            <div key={session.id} className={styles.historyRow}>
              <div>
                <strong>{session.title}</strong>
                <p>
                  {dateLabel(session.startedAt)} · {session.productIds.length}{" "}
                  productos
                </p>
              </div>
              <Badge>Finalizada</Badge>
            </div>
          ))}
        {!state.sessions.some((s) => s.endedAt) && (
          <p className={styles.cardBody}>
            Cuando finalices tu primer live, aparecerá aquí.
          </p>
        )}
      </section>
      {confirmEnd && (
        <Dialog
          title="Finalizar transmisión"
          onClose={() => setConfirmEnd(false)}
        >
          <div className={styles.form}>
            <p>
              El catálogo dejará de estar en vivo. Tus productos seguirán
              publicados y podrás iniciar otra transmisión.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.secondary}
                onClick={() => setConfirmEnd(false)}
              >
                Seguir en vivo
              </button>
              <button
                className={styles.danger}
                onClick={async () => {
                  if (
                    await act(
                      { type: "endLive", at: new Date().toISOString() },
                      "Live finalizado.",
                    )
                  )
                    setConfirmEnd(false);
                }}
              >
                Finalizar live
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
