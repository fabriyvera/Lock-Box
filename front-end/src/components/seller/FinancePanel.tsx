'use client';

import { useState } from 'react';
import { ShieldCheck, Clock3, ArrowDownToLine, Check, Crown } from 'lucide-react';
import { PLANS, type PlanCode } from '@/lib/seller/model';
import { balances, money } from '@/lib/seller/domain';
import Dialog from './Dialog';
import { Badge, dateLabel, type PanelProps } from './ui';
import styles from './seller.module.css';

export function WalletPanel({ state, act, now }: PanelProps & { now: number }) {
  const balance = balances(state, now);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Tu dinero, con claridad</h2>
          <p>Separa las ventas en garantía del saldo que puedes liquidar.</p>
        </div>
        <Badge tone="green">SIN DINERO REAL</Badge>
      </div>
      <div className={styles.walletGrid}>
        <section className={styles.availableCard}>
          <span className={styles.eyebrow}>DISPONIBLE PARA LIQUIDAR</span>
          <strong>{money(balance.availableCents)}</strong>
          <p>Entrega confirmada y plazo de liquidación cumplido.</p>
          <button
            className={styles.primary}
            disabled={!balance.availableCents}
            onClick={() => setConfirm(true)}
          >
            <ArrowDownToLine size={17} /> Solicitar liquidación simulada
          </button>
        </section>
        <section className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.walletLine}>
              <ShieldCheck size={23} />
              <div>
                <span>En garantía</span>
                <strong>{money(balance.heldCents)}</strong>
                <small>Pendiente de entrega y validación QR.</small>
              </div>
            </div>
            <div className={styles.walletLine}>
              <Clock3 size={23} />
              <div>
                <span>En plazo de liquidación</span>
                <strong>{money(balance.settlingCents)}</strong>
                <small>Pago liberado; esperando el plazo de su venta.</small>
              </div>
            </div>
            <div className={styles.walletLine}>
              <ArrowDownToLine size={23} />
              <div>
                <span>Liquidaciones solicitadas</span>
                <strong>{money(balance.reservedCents)}</strong>
                <small>Saldo reservado, sin transferencia real.</small>
              </div>
            </div>
          </div>
        </section>
      </div>
      <p className={styles.note}>
        <Clock3 size={18} />
        Emprende: 48 horas desde la liberación del pago. Pro: disponibilidad inmediata tras
        confirmar el QR. Cada pedido conserva el plan y comisión de su compra.
      </p>
      <section className={styles.card}>
        <div className={styles.cardHeading}>
          <h3>Solicitudes de liquidación</h3>
          <Badge>{state.payouts.length} solicitudes</Badge>
        </div>
        {state.payouts.length ? (
          state.payouts.map((payout) => (
            <div className={styles.historyRow} key={payout.id}>
              <div>
                <strong>{money(payout.amountCents)}</strong>
                <p>
                  {dateLabel(payout.createdAt)} · {payout.id.slice(0, 8)}
                </p>
              </div>
              <Badge tone="amber">Pendiente · demo</Badge>
            </div>
          ))
        ) : (
          <p className={styles.cardBody}>
            Tus solicitudes aparecerán aquí. Las ventas en garantía no se pueden liquidar.
          </p>
        )}
      </section>
      {confirm && (
        <Dialog
          title="Solicitar liquidación simulada"
          onClose={() => {
            setConfirm(false);
            setError('');
          }}
        >
          <div className={styles.form}>
            <p>
              Se reservará el saldo disponible de <strong>{money(balance.availableCents)}</strong>.
              La solicitud quedará pendiente; no se realizará ninguna transferencia.
            </p>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={() => setConfirm(false)}>
                Cancelar
              </button>
              <button
                className={styles.primary}
                onClick={() => {
                  if (
                    act(
                      {
                        type: 'requestPayout',
                        id: crypto.randomUUID(),
                        at: new Date().toISOString(),
                      },
                      'Solicitud de liquidación registrada en la demo.',
                    )
                  )
                    setConfirm(false);
                  else setError('La solicitud no pudo registrarse. Comprueba el saldo disponible.');
                }}
              >
                Confirmar solicitud
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function PlansPanel({ state, act }: PanelProps) {
  const [nextPlan, setNextPlan] = useState<PlanCode | null>(null);
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Crece a tu ritmo</h2>
          <p>Elige el plan que acompaña tu negocio.</p>
        </div>
        <Badge tone="green">Plan actual: {PLANS[state.plan].name}</Badge>
      </div>
      <div className={styles.planGrid}>
        {(['emprende', 'pro'] as const).map((code) => (
          <section
            key={code}
            className={`${styles.planCard} ${code === 'pro' ? styles.proCard : ''}`}
          >
            <div className={styles.planTop}>
              <span className={styles.eyebrow}>
                {code === 'pro' ? 'PARA CRECER' : 'PARA EMPEZAR'}
              </span>
              {code === state.plan && <Badge tone="green">Tu plan</Badge>}
            </div>
            <Crown size={28} className={code === 'pro' ? styles.green : styles.muted} />
            <h3>{PLANS[code].name}</h3>
            <div className={styles.planPrice}>
              {code === 'pro' ? 'Suscripción mensual' : 'Gratis'}
              <small>
                {code === 'pro' ? 'Precio por definir · sin cobro en la demo' : 'Sin mensualidad'}
              </small>
            </div>
            <div className={styles.planCommission}>
              <strong>{PLANS[code].commissionPercent}%</strong>
              <span>comisión por venta simulada</span>
            </div>
            <ul className={styles.featureList}>
              {(code === 'pro'
                ? [
                    'Todo lo incluido en Emprende',
                    'Disponibilidad inmediata tras validar QR',
                    'Comisión reducida en nuevas ventas',
                    'IA de etiquetado (próxima integración)',
                    'Soporte prioritario (próxima integración)',
                  ]
                : [
                    'Catálogo y lives simulados',
                    'Red de Puntos LockBox',
                    'Pago en garantía hasta la entrega',
                    'Liquidación a las 48 horas',
                    'Gestión de pedidos y ventas',
                  ]
              ).map((feature) => (
                <li key={feature}>
                  <Check size={16} />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={code === state.plan}
              className={code === 'pro' ? styles.primary : styles.secondary}
              onClick={() => setNextPlan(code)}
            >
              {code === state.plan ? 'Plan activo' : `Cambiar a ${PLANS[code].name}`}
            </button>
          </section>
        ))}
      </div>
      <p className={styles.note}>
        Para esta demo usamos 6% en Emprende y 2% en Pro, dentro de los rangos del proyecto. Las
        tarifas finales y el precio mensual quedan por configurar. Cambiar el plan no modifica
        ventas anteriores.
      </p>
      {nextPlan && (
        <Dialog title={`Cambiar a ${PLANS[nextPlan].name}`} onClose={() => setNextPlan(null)}>
          <div className={styles.form}>
            <p>
              El cambio se aplicará a futuras ventas simuladas. Los pedidos existentes conservarán
              su comisión y plazo de liquidación. No hay cargos reales.
            </p>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={() => setNextPlan(null)}>
                Cancelar
              </button>
              <button
                className={styles.primary}
                onClick={() => {
                  if (
                    act(
                      { type: 'changePlan', plan: nextPlan },
                      `Plan ${PLANS[nextPlan].name} activado en la demo.`,
                    )
                  )
                    setNextPlan(null);
                }}
              >
                Confirmar cambio
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
