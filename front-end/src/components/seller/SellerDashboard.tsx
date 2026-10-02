'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Radio,
  ClipboardList,
  Wallet,
  Crown,
  Settings,
  ArrowLeft,
  RotateCcw,
  X,
  Store,
} from 'lucide-react';
import { useSellerStore } from '@/lib/seller/store';
import { activeLive } from '@/lib/seller/domain';
import { PLANS, type SellerAction } from '@/lib/seller/model';
import CatalogPanel from './CatalogPanel';
import LivePanel from './LivePanel';
import OrdersPanel from './OrdersPanel';
import { WalletPanel, PlansPanel } from './FinancePanel';
import ProfilePanel from './ProfilePanel';
import OverviewPanel, { type Screen } from './OverviewPanel';
import Dialog from './Dialog';
import { Badge } from './ui';
import styles from './seller.module.css';

const NAV = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'catalog', label: 'Mi catálogo', icon: Package },
  { id: 'live', label: 'Live & ventas', icon: Radio },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'wallet', label: 'Mi saldo', icon: Wallet },
  { id: 'plans', label: 'Mi plan', icon: Crown },
  { id: 'profile', label: 'Mi tienda', icon: Settings },
] as const;

export default function SellerDashboard() {
  const { state, dispatch, reset, storageWarning } = useSellerStore();
  const [screen, setScreen] = useState<Screen>('overview');
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!toast || toast.error) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  function act(action: SellerAction, message: string) {
    try {
      dispatch(action);
      setToast({ message, error: false });
      return true;
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'No se pudo guardar el cambio.',
        error: true,
      });
      return false;
    }
  }
  if (!state)
    return (
      <main className={styles.loading} aria-busy="true">
        <div className={styles.logo}>
          <span>LOCK</span>
          <span>BOX</span>
        </div>
        <p>Cargando tu espacio de vendedor…</p>
      </main>
    );
  const paidCount = state.orders.filter((order) => order.status === 'paid').length;
  const live = activeLive(state);
  const props = { state, act };
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" prefetch={false} className={styles.logo} aria-label="LockBox, ir al inicio">
          <span>LOCK</span>
          <span>BOX</span>
        </Link>
        <p className={styles.workspaceLabel}>ESPACIO DEL VENDEDOR</p>
        <nav aria-label="Módulo del vendedor">
          {NAV.map((item) => (
            <button
              key={item.id}
              aria-label={item.label}
              onClick={() => setScreen(item.id)}
              aria-current={screen === item.id ? 'page' : undefined}
              className={screen === item.id ? styles.activeNav : ''}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === 'orders' && paidCount > 0 && <b>{paidCount}</b>}
              {item.id === 'live' && live && <i className={styles.liveDot} />}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarPlan}>
            <Crown size={20} />
            <div>
              <strong>Plan {PLANS[state.plan].name}</strong>
              <p>{PLANS[state.plan].commissionPercent}% de comisión · demo</p>
            </div>
          </div>
          <button className={styles.textButton} onClick={() => setScreen('plans')}>
            Explorar planes →
          </button>
          <Link href="/" prefetch={false} className={styles.backLink}>
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span>LOCKBOX / VENDEDOR</span>
            <strong>{NAV.find((item) => item.id === screen)?.label}</strong>
          </div>
          <div className={styles.topbarRight}>
            {live && (
              <button className={styles.liveIndicator} onClick={() => setScreen('live')}>
                <i className={styles.liveDot} /> EN LIVE
              </button>
            )}
            <Badge tone="green">DEMO ACADÉMICA</Badge>
            <button
              className={styles.account}
              onClick={() => setScreen('profile')}
              aria-label="Editar mi tienda"
            >
              <div className={styles.avatar}>
                <Store size={18} />
              </div>
              <span>
                <strong>{state.profile.storeName}</strong>
                <small>@{state.profile.handle}</small>
              </span>
            </button>
          </div>
        </header>
        <div className={styles.demoBanner}>
          <span>
            <strong>Modo demostración.</strong> Productos y operaciones simulados, guardados en este
            navegador. No procesa pagos reales.
          </span>
          <button onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Reiniciar demo
          </button>
        </div>
        <main className={styles.content} id="seller-content">
          <div className={styles.pageHeading}>
            <div>
              <span className={styles.eyebrow}>
                {state.profile.city.toUpperCase()} / COMERCIO SOCIAL SEGURO
              </span>
              <h1>
                {screen === 'overview'
                  ? `Hola, ${state.profile.storeName}.`
                  : NAV.find((item) => item.id === screen)?.label}
              </h1>
            </div>
            <span className={styles.date}>
              {new Intl.DateTimeFormat('es-BO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/La_Paz',
              }).format(now)}
            </span>
          </div>
          {storageWarning && (
            <p role="alert" className={styles.error}>
              {storageWarning}
            </p>
          )}
          {screen === 'overview' && <OverviewPanel state={state} now={now} navigate={setScreen} />}
          {screen === 'catalog' && <CatalogPanel {...props} />}
          {screen === 'live' && <LivePanel {...props} now={now} />}
          {screen === 'orders' && <OrdersPanel {...props} />}
          {screen === 'wallet' && <WalletPanel {...props} now={now} />}
          {screen === 'plans' && <PlansPanel {...props} />}
          {screen === 'profile' && <ProfilePanel {...props} />}
          <footer className={styles.footer}>
            <span>LOCKBOX · TU NEGOCIO, TU COMUNIDAD.</span>
            <span>Comercio social seguro / Bolivia</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div
          role={toast.error ? 'alert' : 'status'}
          className={styles.toast}
          data-error={toast.error}
        >
          <span>{toast.message}</span>
          <button aria-label="Cerrar aviso" onClick={() => setToast(null)}>
            <X size={17} />
          </button>
        </div>
      )}
      {confirmReset && (
        <Dialog title="Reiniciar datos de demostración" onClose={() => setConfirmReset(false)}>
          <div className={styles.form}>
            <p>
              Se restaurará la tienda de ejemplo. Los productos, lives, cambios de plan y
              solicitudes guardados en este navegador se perderán.
            </p>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={() => setConfirmReset(false)}>
                Conservar cambios
              </button>
              <button
                className={styles.danger}
                onClick={() => {
                  try {
                    reset();
                    setConfirmReset(false);
                    setScreen('overview');
                    setToast({ message: 'Demo restaurada.', error: false });
                  } catch (err) {
                    setToast({
                      message: err instanceof Error ? err.message : 'No se pudo reiniciar.',
                      error: true,
                    });
                  }
                }}
              >
                Reiniciar demo
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
