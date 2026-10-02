import {
  ArrowUpRight,
  Package,
  Truck,
  ShieldCheck,
  Wallet,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { money, balances, activeLive } from '@/lib/seller/domain';
import { ORDER_LABELS, type SellerState } from '@/lib/seller/model';
import { Badge } from './ui';
import styles from './seller.module.css';

export type Screen = 'overview' | 'catalog' | 'live' | 'orders' | 'wallet' | 'plans' | 'profile';
export default function OverviewPanel({
  state,
  now,
  navigate,
}: {
  state: SellerState;
  now: number;
  navigate: (screen: Screen) => void;
}) {
  const balance = balances(state, now);
  const paid = state.orders.filter(
    (order) => !['pending', 'cancelled', 'refunded'].includes(order.status),
  );
  const gross = paid.reduce((sum, order) => sum + order.subtotalCents, 0);
  const dispatchCount = state.orders.filter((order) => order.status === 'paid').length;
  const activeProducts = state.products.filter((product) => product.status === 'published');
  const live = activeLive(state);
  const dayKey = (date: number | string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  const days = Array.from({ length: 7 }, (_, index) => {
    const time = now - (6 - index) * 86400000;
    return {
      label: new Intl.DateTimeFormat('es-BO', {
        weekday: 'short',
        timeZone: 'America/La_Paz',
      }).format(time),
      cents: paid
        .filter((order) => dayKey(order.createdAt) === dayKey(time))
        .reduce((sum, order) => sum + order.subtotalCents, 0),
    };
  });
  const max = Math.max(1, ...days.map((day) => day.cents));
  return (
    <>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>TU NEGOCIO, EN MOVIMIENTO</span>
          <h2>De tu live a sus manos.</h2>
          <p>
            Publica, vende y entrega con confianza.
            <br />
            LockBox acompaña cada paso de tu venta.
          </p>
          <button className={styles.primary} onClick={() => navigate('catalog')}>
            Gestionar catálogo <ArrowUpRight size={17} />
          </button>
        </div>
        <div className={styles.heroGraphic} aria-hidden="true">
          <div className={styles.orbitOne} />
          <div className={styles.orbitTwo} />
          <div className={styles.heroBox}>
            <Package size={68} strokeWidth={1} />
          </div>
          <span className={styles.heroPill}>
            <ShieldCheck size={15} /> PAGO PROTEGIDO
          </span>
          <span className={styles.heroPillTwo}>
            <Truck size={15} /> ENTREGA SEGURA
          </span>
        </div>
      </section>
      <div className={styles.metricGrid}>
        {[
          {
            label: 'Ventas confirmadas',
            value: money(gross),
            note: `${paid.length} pedidos · total de la demo`,
            icon: ArrowUpRight,
            tone: 'green',
          },
          {
            label: 'Por despachar',
            value: String(dispatchCount).padStart(2, '0'),
            note: 'Con pago confirmado',
            icon: Truck,
            tone: 'amber',
          },
          {
            label: 'En garantía',
            value: money(balance.heldCents),
            note: 'Pendiente de entrega y QR',
            icon: ShieldCheck,
            tone: 'blue',
          },
          {
            label: 'Saldo disponible',
            value: money(balance.availableCents),
            note: 'Listo para solicitar liquidación',
            icon: Wallet,
            tone: 'green',
          },
        ].map((metric) => (
          <section key={metric.label} className={styles.metric}>
            <div>
              <span>{metric.label}</span>
              <metric.icon size={18} data-tone={metric.tone} />
            </div>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </section>
        ))}
      </div>
      <div className={styles.overviewGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <div>
              <h3>Actividad de ventas</h3>
              <p>Ventas brutas confirmadas · últimos 7 días</p>
            </div>
            <Badge>DEMO</Badge>
          </div>
          <div
            className={styles.chart}
            role="img"
            aria-label={days.map((day) => `${day.label}: ${money(day.cents)}`).join('; ')}
          >
            {days.map((day, index) => (
              <div className={styles.chartColumn} key={index}>
                <span>{day.cents ? money(day.cents) : '—'}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ height: `${day.cents ? Math.max(5, (day.cents / max) * 100) : 0}%` }}
                  />
                </div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <h3>Tu siguiente paso</h3>
          </div>
          <div className={styles.nextSteps}>
            <button onClick={() => navigate('orders')}>
              <Truck size={21} />
              <div>
                <strong>Prepara tus entregas</strong>
                <p>{dispatchCount} pedidos esperan despacho</p>
              </div>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate('catalog')}>
              <Package size={21} />
              <div>
                <strong>Mantén tu catálogo al día</strong>
                <p>
                  {activeProducts.length} productos publicados ·{' '}
                  {state.products.filter((p) => p.status !== 'archived' && p.stock <= 3).length} con
                  stock bajo
                </p>
              </div>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate('live')}>
              <Radio size={21} />
              <div>
                <strong>{live ? 'Tu live está activo' : 'Prepara tu próximo live'}</strong>
                <p>{live?.title || 'Elige productos y conecta con tu audiencia'}</p>
              </div>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>
      <section className={styles.card}>
        <div className={styles.cardHeading}>
          <h3>Pedidos recientes</h3>
          <button className={styles.textButton} onClick={() => navigate('orders')}>
            Ver todos <ArrowUpRight size={15} />
          </button>
        </div>
        {[...state.orders]
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 4)
          .map((order) => (
            <button
              className={styles.recentOrder}
              key={order.id}
              onClick={() => navigate('orders')}
            >
              <div className={styles.orderIcon}>
                <Package size={19} />
              </div>
              <div>
                <strong>{order.productTitle}</strong>
                <p>
                  {order.id} · {order.buyer}
                </p>
              </div>
              <Badge
                tone={
                  order.status === 'paid' ? 'amber' : order.status === 'released' ? 'green' : 'blue'
                }
              >
                {ORDER_LABELS[order.status]}
              </Badge>
              <strong>{money(order.subtotalCents)}</strong>
              <ChevronRight size={17} />
            </button>
          ))}
      </section>
    </>
  );
}
