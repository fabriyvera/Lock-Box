'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ChartColumnIncreasing,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CreditCard,
  Package,
  ScanSearch,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Video,
  Zap,
  AlertTriangle,
  Sparkles,
  Lock,
  QrCode,
  Users,
} from 'lucide-react';
import { DecorativeIcon } from '@/components/ui/DecorativeIcon';
import RegistrationForm from '@/components/auth/RegistrationForm';
import type { AccountRole } from '@/lib/auth/account';
import styles from './page.module.css';

const VALUES = [
  {
    number: '01',
    icon: Lock,
    tag: '100% PROTEGIDO',
    label: 'SEGURIDAD ESCROW',
    desc: 'Dinero custodiado hasta confirmar tu entrega con QR.',
  },
  {
    number: '02',
    icon: Store,
    tag: 'RED VERIFICADA',
    label: 'PUNTOS LOCKBOX',
    desc: 'Tiendas aliadas seguras para dejar y recoger paquetes.',
  },
  {
    number: '03',
    icon: QrCode,
    tag: 'ESCANEO RÁPIDO',
    label: 'MODELO PHYGITAL',
    desc: 'Conectamos TikTok Live con puntos físicos reales.',
  },
  {
    number: '04',
    icon: Users,
    tag: 'CERO BARRERAS',
    label: 'INCLUSIÓN DIGITAL',
    desc: 'Cobros directos por Yape y BCP para todo vendedor.',
  },
];

const FLOW = [
  {
    icon: Video,
    step: '01',
    label: 'Live en TikTok',
    sub: 'Vendedor muestra su catálogo en vivo',
    details:
      'El comprador elige el producto desde el enlace del Live en 1 clic, sin coordinar por WhatsApp.',
  },
  {
    icon: CreditCard,
    step: '02',
    label: 'Pago Escrow',
    sub: 'Dinero 100% retenido en garantía',
    details:
      'Pagas con QR, Yape o BCP. LockBox resguarda tu dinero hasta que tengas el paquete en tus manos.',
  },
  {
    icon: Package,
    step: '03',
    label: 'Punto LockBox',
    sub: 'Tienda aliada recibe y valida el paquete',
    details:
      'El vendedor deja el pedido en el Punto LockBox cercano y recibes una alerta para pasar a recogerlo.',
  },
  {
    icon: CircleCheck,
    step: '04',
    label: 'QR Confirmado',
    sub: 'Escaneo instantáneo y pago liberado',
    details:
      'Muestras tu código QR único en la tienda, recoges tu compra y el dinero se transfiere al vendedor.',
  },
];

const SERVICES = [
  {
    icon: ShieldCheck,
    title: 'Pago en Garantía',
    metric: '0% ESTAFAS',
    desc: 'Custodiamos tu dinero hasta que recojas y verifiques tu pedido.',
    tag: 'COMPRADORES',
  },
  {
    icon: Package,
    title: 'Puntos LockBox',
    metric: '+10 ZONAS EN LA PAZ',
    desc: 'Tiendas aliadas verificadas para entregar y recoger sin citas peligrosas.',
    tag: 'ENTREGA FÍSICA',
  },
  {
    icon: Smartphone,
    title: 'Catálogo en Live',
    metric: 'COMPRA EN 1 CLIC',
    desc: 'Tus espectadores compran en tiempo real sin salir de tu transmisión.',
    tag: 'VENDEDORES',
  },
  {
    icon: Zap,
    title: 'Liquidación Rápida',
    metric: 'MENOS DE 48H',
    desc: 'Recibe tus ganancias directo en tu cuenta BCP o billetera Yape.',
    tag: 'PAGOS DIRECTOS',
  },
  {
    icon: ScanSearch,
    title: 'Validación con QR',
    metric: 'TOKEN ÚNICO LBX',
    desc: 'Escaneo en tienda que confirma la entrega y libera el pago al instante.',
    tag: 'SEGURIDAD TOTAL',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Dashboard Pro',
    metric: 'DESDE 1% COMISIÓN',
    desc: 'Controla tu inventario, pedidos activos y ganancias en un solo panel.',
    tag: 'ANALÍTICA',
  },
];

const NAV_SECTIONS = ['inicio', 'nosotros', 'servicios', 'planes', 'registro', 'contacto'] as const;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('inicio');
  const [role, setRole] = useState<AccountRole | null>(null);
  const [openFlowStep, setOpenFlowStep] = useState<number | null>(0);
  const aboutTrack = useRef<HTMLDivElement>(null);

  // ScrollSpy: Detecta automáticamente en qué sección está el usuario al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const navHeight = 72;
      const scrollPosition = window.scrollY + navHeight + (window.innerHeight - navHeight) * 0.35;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
        setActiveNav('contacto');
        return;
      }

      let currentSection = 'inicio';
      for (const id of NAV_SECTIONS) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = id;
            break;
          }
        }
      }
      setActiveNav(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveNav(id);
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  function slideAbout(direction: -1 | 1) {
    const track = aboutTrack.current;
    const first = track?.firstElementChild;
    const second = first?.nextElementSibling;
    if (!track || !first || !second) return;
    const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    const last = track.scrollWidth - track.clientWidth;
    const atEdge = direction === 1 ? track.scrollLeft >= last - 1 : track.scrollLeft <= 1;
    track.scrollTo({
      left: atEdge ? (direction === 1 ? 0 : last) : track.scrollLeft + step * direction,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  const toggleFlowStep = (index: number) => {
    setOpenFlowStep(prev => (prev === index ? null : index));
  };

  return (
    <>
      <div
        className={styles.page}
        style={{ background: 'var(--color-surface-deep)', fontFamily: 'var(--font-inter), sans-serif' }}
      >
        {/* ── NAV ── */}
        <nav
          style={{
            top: 0,
            zIndex: 50,
            background: 'var(--color-surface-deep)',
            borderBottom: `2px solid var(--color-accent)`,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className={styles.siteNav}
        >
          <button
            onClick={() => scrollTo('inicio')}
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                fontWeight: 900,
                fontSize: '19px',
                letterSpacing: '0.06em',
                padding: '6px 14px',
                lineHeight: 1,
              }}
            >
              LOCK
            </div>
            <div
              style={{
                background: 'var(--color-brand-secondary)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '19px',
                letterSpacing: '0.06em',
                padding: '6px 14px',
                lineHeight: 1,
              }}
            >
              BOX
            </div>
          </button>

          <button
            className={styles.menuToggle}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="home-navigation"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </button>

          <div id="home-navigation" className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
            {[
              { id: 'inicio', label: 'inicio' },
              { id: 'nosotros', label: 'nosotros' },
              { id: 'servicios', label: 'servicios' },
              { id: 'planes', label: 'planes' },
              { id: 'contacto', label: 'contacto' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={styles.navButton}
                data-active={activeNav === id}
                style={{
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 800,
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  paddingBottom: '4px',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {label}
              </button>
            ))}

            <div style={{ width: '1px', height: '22px', background: 'var(--color-border-strong)', margin: '0 6px' }} />
            <a
              href="/login"
              className={styles.accentLink}
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 800,
                fontSize: '15px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Iniciar Sesión
            </a>

            <button
              onClick={() => scrollTo('registro')}
              className={styles.primaryButton}
              style={{
                border: activeNav === 'registro' ? '2px solid #ffffff' : 'none',
                padding: '10px 24px',
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 900,
                fontSize: '15px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Registro
            </button>
          </div>
        </nav>

        {/* ══════════════════════════════════════════ HERO (INICIO) ══════════════════════════════════════════ */}
        <section id="inicio" style={{ display: 'grid' }} className={styles.twoColumns + ' ' + styles.hero}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '24px',
              padding: 'clamp(28px, 4vh, 56px) clamp(24px, 5vw, 72px)',
            }}
            className={styles.heroPanel}
          >
            <div
              style={{
                background: 'var(--color-accent)',
                display: 'inline-block',
                width: 'fit-content',
                fontWeight: 900,
                fontSize: '16px',
                letterSpacing: '0.22em',
                color: 'var(--color-on-accent)',
                padding: '8px 18px',
              }}
            >
              PLATAFORMA PHYGITAL · 2026
            </div>

            <div>
              <h1
                style={{
                  fontWeight: 900,
                  fontSize: 'clamp(72px, 8.8vw, 124px)',
                  lineHeight: 0.88,
                  color: '#ffffff',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  textShadow: '0 4px 24px rgba(255, 255, 255, 0.15)',
                }}
              >
                LOCK
              </h1>
              <h1
                style={{
                  fontWeight: 900,
                  fontSize: 'clamp(72px, 8.8vw, 124px)',
                  lineHeight: 0.88,
                  color: 'var(--color-accent)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  textShadow: '0 4px 28px rgba(0, 229, 153, 0.28)',
                }}
              >
                BOX
              </h1>
            </div>

            <p
              style={{
                fontSize: 'clamp(21px, 1.9vw, 26px)',
                lineHeight: 1.5,
                color: '#ffffff',
                maxWidth: '600px',
                margin: 0,
                fontWeight: 600,
              }}
            >
              Comercio social seguro para TikTok Live.{' '}
              <span style={{ color: 'var(--color-accent)' }}>Pagos en garantía</span>, entrega con QR y red de tiendas aliadas.
            </p>

            <div style={{ display: 'flex', gap: '16px', paddingTop: '4px' }} className={styles.wrappingRow}>
              <button
                onClick={() => scrollTo('registro')}
                className={styles.primaryButton}
                style={{
                  fontWeight: 900,
                  fontSize: '17px',
                  letterSpacing: '0.1em',
                  padding: '18px 36px',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                REGISTRARSE AHORA
              </button>
              <button
                onClick={() => scrollTo('nosotros')}
                className={`${styles.secondaryButton} ${styles.secondaryStrong}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderColor: '#ffffff',
                  fontWeight: 800,
                  fontSize: '17px',
                  letterSpacing: '0.1em',
                  padding: '16px 36px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-inter), sans-serif',
                  transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                }}
              >
                SABER MÁS
              </button>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 'clamp(24px, 3.5vh, 48px) clamp(24px, 4.5vw, 56px)',
            }}
            className={styles.heroPanel}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(var(--color-accent-faint) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-faint) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-20%',
                right: '-8%',
                width: '50%',
                height: '140%',
                background: `linear-gradient(135deg, var(--color-accent), var(--color-info-strong))`,
                transform: 'skewX(-10deg)',
                opacity: 0.06,
              }}
            />

            <div style={{ position: 'relative', zIndex: 1, marginBottom: '16px' }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                PASO A PASO · HAZ CLIC PARA VER DETALLE
              </div>
              <div style={{ fontWeight: 900, fontSize: 'clamp(28px, 2.8vw, 38px)', color: '#ffffff', letterSpacing: '-0.01em' }}>
                El flujo LockBox
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FLOW.map((item, i) => {
                const isOpen = openFlowStep === i;
                return (
                  <div
                    key={item.step}
                    className={styles.flowCard}
                    data-highlighted={isOpen}
                    style={{
                      background: isOpen
                        ? 'var(--color-surface-hover)'
                        : i % 2 === 0
                        ? 'var(--color-surface-raised)'
                        : 'var(--color-surface)',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <button
                      className={styles.flowButton}
                      type="button"
                      onClick={() => toggleFlowStep(i)}
                      aria-expanded={isOpen}
                      aria-controls={`flow-details-${item.step}`}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-inter), sans-serif',
                      }}
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          background: isOpen ? 'var(--color-accent-soft)' : 'var(--color-surface-hover)',
                          border: `2px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                          {item.step}
                        </div>
                      </div>

                      <div style={{ fontSize: '28px', flexShrink: 0 }}>
                        <DecorativeIcon icon={item.icon} size="1em" className={styles.icon} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '21px', color: '#ffffff', marginBottom: '2px' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '17px', color: '#ffffff', fontWeight: 500 }}>{item.sub}</div>
                      </div>

                      <div
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s ease',
                          color: 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <ChevronDown size={26} aria-hidden="true" />
                      </div>
                    </button>

                    <div
                      id={`flow-details-${item.step}`}
                      hidden={!isOpen}
                      className={styles.flowDetails}
                    >
                      {item.details}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '6px', marginTop: '16px' }} className={styles.threeColumns}>
              {[
                { val: '100%', lbl: 'Protección' },
                { val: '48H', lbl: 'Liquidación' },
                { val: '0', lbl: 'Estafas' },
              ].map(s => (
                <div
                  key={s.lbl}
                  style={{
                    background: 'var(--color-accent-soft)',
                    border: `1px solid var(--color-accent)`,
                    padding: '14px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: '28px', color: 'var(--color-accent)', lineHeight: 1 }}>{s.val}</div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      marginTop: '6px',
                    }}
                  >
                    {s.lbl}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', top: '16px', left: '16px', width: '36px', height: '3px', background: 'var(--color-accent)' }} />
            <div style={{ position: 'absolute', top: '16px', left: '16px', width: '3px', height: '36px', background: 'var(--color-accent)' }} />
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '36px', height: '3px', background: 'var(--color-accent)' }} />
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '3px', height: '36px', background: 'var(--color-accent)' }} />
          </div>
        </section>

        {/* ══════════════════════════════════════════ SOBRE NOSOTROS ══════════════════════════════════════════ */}
        <section
          id="nosotros"
          style={{
            background: 'var(--color-surface-deep)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          className={styles.section}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '8%',
              bottom: '8%',
              width: '4px',
              background: 'var(--color-accent)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '16px' }}>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.3em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                — SECCIÓN 01
              </div>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: 'clamp(38px, 4.8vw, 58px)',
                  lineHeight: 0.92,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                SOBRE <span style={{ color: 'var(--color-accent)' }}>NOSOTROS</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '6px' }} />
          </div>

          <div style={{ display: 'grid', gap: '18px', marginBottom: '16px' }} className={styles.twoColumns}>
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border-strong)',
                borderLeft: '5px solid #ef4444',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#ef4444', display: 'flex' }}>
                  <AlertTriangle size={32} />
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.18em', color: '#ef4444', textTransform: 'uppercase' }}>
                    ANTES DE LOCKBOX
                  </div>
                  <h3 style={{ fontSize: '25px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Caos en Ventas por Live
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Desconfianza al pagar por adelantado.',
                  'Horas perdidas coordinando por WhatsApp.',
                  'Entregas callejeras inseguras o pedidos falsos.',
                ].map(point => (
                  <div key={point} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '20px' }}>✕</span>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', lineHeight: 1.35 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-accent)',
                borderLeft: '5px solid var(--color-accent)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--color-accent)', display: 'flex' }}>
                  <Sparkles size={32} />
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 900,
                      letterSpacing: '0.18em',
                      color: 'var(--color-accent)',
                      textTransform: 'uppercase',
                    }}
                  >
                    CON LOCKBOX
                  </div>
                  <h3 style={{ fontSize: '25px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Comercio 100% Protegido
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Pago retenido en garantía (Escrow).',
                  'Red de tiendas aliadas ("Puntos LockBox").',
                  'Escaneo QR que libera el dinero al instante.',
                ].map(point => (
                  <div key={point} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: '20px' }}>✔</span>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', lineHeight: 1.35 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barra de indicadores */}
          <div
            style={{
              display: 'grid',
              borderTop: '2px solid var(--color-border-strong)',
              borderBottom: '2px solid var(--color-border-strong)',
              marginBottom: '16px',
              background: 'var(--color-surface)',
            }}
            className={styles.fourColumns}
          >
            {[
              { value: 'PHYGITAL', label: 'Modelo de negocio' },
              { value: '48H', label: 'Liquidación rápida' },
              { value: 'QR ÚNICO', label: 'Validación de entrega' },
              { value: 'YAPE / BCP', label: 'Pagos integrados' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 20px',
                  borderRight: i < 3 ? '1px solid var(--color-border-strong)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 'clamp(24px, 2.6vw, 32px)',
                    color: 'var(--color-accent)',
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '15px',
                    letterSpacing: '0.1em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.aboutControls} aria-label="Controles de los pilares LockBox">
            <button type="button" aria-label="Pilar anterior" aria-controls="about-values" onClick={() => slideAbout(-1)}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Pilar siguiente" aria-controls="about-values" onClick={() => slideAbout(1)}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
          <div id="about-values" ref={aboutTrack} className={styles.aboutTrack} role="region" aria-label="Pilares de LockBox">
            {VALUES.map(v => (
              <div
                key={v.number}
                className={styles.valueCard}
                style={{
                  padding: '18px 20px',
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--color-border-strong)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '30px', color: 'var(--color-accent)', display: 'flex' }}>
                      <DecorativeIcon icon={v.icon} size="1em" className={styles.icon} />
                    </span>
                    <span style={{ fontWeight: 900, fontSize: '28px', color: 'var(--color-accent)', opacity: 0.55, lineHeight: 1 }}>
                      {v.number}
                    </span>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'var(--color-accent-soft)',
                      color: 'var(--color-accent)',
                      fontWeight: 900,
                      fontSize: '13px',
                      letterSpacing: '0.12em',
                      padding: '4px 10px',
                      marginBottom: '8px',
                    }}
                  >
                    {v.tag}
                  </span>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: '20px',
                      letterSpacing: '0.02em',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    {v.label}
                  </div>
                </div>
                <p style={{ fontSize: '17px', lineHeight: 1.45, color: '#ffffff', margin: 0, fontWeight: 500 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════ SERVICIOS ══════════════════════════════════════════ */}
        <section
          id="servicios"
          style={{
            background: 'var(--color-surface-raised)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          className={styles.section}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '32%',
              height: '100%',
              background: 'var(--color-surface-hover)',
              clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: '15px',
                    letterSpacing: '0.3em',
                    color: 'var(--color-accent)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  — SECCIÓN 02
                </div>
                <h2
                  style={{
                    fontWeight: 900,
                    fontSize: 'clamp(38px, 4.8vw, 58px)',
                    lineHeight: 0.92,
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  NUESTROS <span style={{ color: 'var(--color-accent)' }}>SERVICIOS</span>
                </h2>
              </div>
              <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '6px' }} />
            </div>

            <div style={{ display: 'grid', gap: '16px' }} className={styles.threeColumns}>
              {SERVICES.map((s, i) => (
                <div
                  key={i}
                  className={styles.serviceCard}
                  style={{
                    background: 'var(--color-surface-deep)',
                    border: '1px solid var(--color-border-strong)',
                    borderTop: '4px solid var(--color-accent)',
                    padding: '22px 24px',
                    transition: 'border-color 0.2s, transform 0.2s',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          background: 'var(--color-accent-soft)',
                          border: '2px solid var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '26px',
                        }}
                      >
                        <DecorativeIcon icon={s.icon} size="1em" className={styles.icon} />
                      </div>
                      <span
                        style={{
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-accent)',
                          color: 'var(--color-accent)',
                          fontWeight: 900,
                          fontSize: '13px',
                          letterSpacing: '0.12em',
                          padding: '6px 12px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {s.tag}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 900,
                        color: 'var(--color-accent)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      {s.metric}
                    </div>

                    <h3 style={{ fontWeight: 900, fontSize: '24px', color: '#ffffff', margin: '0 0 6px 0' }}>
                      {s.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: '18px', lineHeight: 1.45, color: '#ffffff', margin: 0, fontWeight: 500 }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ PLANES ══════════════════════════════════════════ */}
        <section
          id="planes"
          style={{ background: 'var(--color-surface-deep)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          className={styles.section}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '22px' }}>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.3em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                — SECCIÓN 03
              </div>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: 'clamp(38px, 4.8vw, 58px)',
                  lineHeight: 0.92,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                PLANES DE <span style={{ color: 'var(--color-accent)' }}>SUSCRIPCIÓN</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '6px' }} />
          </div>

          <div style={{ display: 'grid', gap: '24px' }} className={styles.twoColumns}>
            <div
              style={{
                background: 'var(--color-surface-raised)',
                padding: '32px 36px',
                border: '1px solid var(--color-border-strong)',
                borderTop: '5px solid var(--color-brand-secondary-hover)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.22em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                PLAN EMPRENDE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 900, fontSize: '44px', color: '#ffffff', lineHeight: 1 }}>Gratuito</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '22px' }}>
                5% – 8% de comisión solo si vendes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '26px' }}>
                {[
                  'Acceso a toda la red de Puntos LockBox',
                  'Liquidación de pagos en 48 horas',
                  'Pago en garantía Escrow incluido',
                  'Catálogo en TikTok Live básico',
                  'Soporte directo por WhatsApp',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: '19px' }}>✔</span>
                    <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => scrollTo('registro')}
                className={styles.planButton}
                style={{
                  border: '2px solid #ffffff',
                  color: '#ffffff',
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 900,
                  fontSize: '16px',
                  letterSpacing: '0.1em',
                  padding: '15px 32px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                EMPEZAR GRATIS
              </button>
            </div>

            <div
              style={{
                background: 'var(--color-product-default)',
                padding: '32px 36px',
                border: '1px solid var(--color-accent)',
                borderTop: `5px solid var(--color-accent)`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: '16px', right: '20px' }}>
                <div
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    fontWeight: 900,
                    fontSize: '13px',
                    letterSpacing: '0.16em',
                    padding: '6px 14px',
                    textTransform: 'uppercase',
                  }}
                >
                  RECOMENDADO
                </div>
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.22em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                PLAN PRO
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 900, fontSize: '44px', color: '#ffffff', lineHeight: 1 }}>Mensual</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '22px' }}>
                1% – 2% de comisión · Liquidación al instante
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '26px' }}>
                {[
                  'Todo lo incluido en el Plan Emprende',
                  'Dashboard de métricas y clientes avanzado',
                  'Liquidación inmediata al escanear el QR',
                  'Etiquetado rápido de productos en Live',
                  'Soporte prioritario 24/7',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: '19px' }}>✔</span>
                    <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => scrollTo('registro')}
                className={styles.primaryButton}
                style={{
                  border: 'none',
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 900,
                  fontSize: '16px',
                  letterSpacing: '0.1em',
                  padding: '16px 32px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                ACTIVAR PLAN PRO
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ REGISTRO (LETRAS GRANDES Y VISIBLES) ══════════════════════════════════════════ */}
        <section
          id="registro"
          style={{ background: 'var(--color-surface-raised)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          className={styles.section}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '16px' }}>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.3em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                — SECCIÓN 04
              </div>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: 'clamp(38px, 4.8vw, 58px)',
                  lineHeight: 0.92,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                REGISTRO <span style={{ color: 'var(--color-accent)' }}>GRATUITO</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '6px' }} />
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ fontSize: '21px', lineHeight: 1.4, color: '#ffffff', margin: 0, fontWeight: 700 }}>
              Selecciona tu perfil para abrir el formulario de registro.
            </p>

            <div style={{ display: 'grid', gap: '20px' }} className={styles.threeColumns}>
              {(
                [
                  {
                    r: 'comprador' as const,
                    icon: ShoppingCart,
                    title: 'Soy Comprador',
                    badge: 'SIN COMISIÓN · COMPRA PROTEGIDA',
                    desc: 'Compra en TikTok Live sin miedo a estafas y recoge con QR en tu Punto LockBox cercano.',
                    benefits: [
                      'Reembolso 100% garantizado si no llega',
                      'Recogida segura en tiendas aliadas',
                    ],
                  },
                  {
                    r: 'vendedor' as const,
                    icon: Store,
                    title: 'Soy Vendedor',
                    badge: 'COBRO SEGURO · LIQUIDACIÓN 48H',
                    desc: 'Muestra tu catálogo en vivo, asegura tus cobros y entrega paquetes sin repartidores.',
                    benefits: [
                      'Dinero asegurado antes de enviar el producto',
                      'Pagos directos a tu Yape o cuenta BCP',
                    ],
                  },
                  {
                    r: 'operador_punto' as const,
                    icon: QrCode,
                    title: 'Soy Punto LockBox',
                    badge: 'TIENDA ALIADA · RECOJO CON QR',
                    desc: 'Afília tu tienda para recibir paquetes y entregarlos a los compradores.',
                    benefits: [
                      'Administra los pedidos y la capacidad de tu punto',
                      'Verifica el código de retiro al entregar el paquete',
                    ],
                  },
                ]
              ).map(({ r, icon, title, badge, desc, benefits }) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={styles.roleCard}
                    data-selected={isSelected}
                    aria-pressed={isSelected}
                    style={{
                      padding: '24px 28px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background 0.2s',
                      fontFamily: 'var(--font-inter), sans-serif',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '36px', display: 'flex' }}>
                          <DecorativeIcon icon={icon} size="1em" className={styles.icon} />
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 900,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '6px 12px',
                            background: 'var(--color-accent-soft)',
                            color: 'var(--color-accent)',
                            border: '1px solid var(--color-accent)',
                          }}
                        >
                          {badge}
                        </span>
                      </div>

                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: '28px',
                          color: isSelected ? 'var(--color-accent)' : '#ffffff',
                          marginBottom: '6px',
                        }}
                      >
                        {title}
                      </div>

                      <div style={{ fontSize: '18px', color: '#ffffff', lineHeight: 1.5, fontWeight: 500 }}>{desc}</div>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid var(--color-border-strong)',
                        paddingTop: '12px',
                        display: 'grid',
                        gap: '8px',
                      }}
                    >
                      {benefits.map(b => (
                        <div key={b} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: '18px' }}>✔</span>
                          <span style={{ fontSize: '17px', color: '#ffffff', fontWeight: 600 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                width: '100%',
                background: 'var(--color-surface-deep)',
                borderTop: `4px solid ${role ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                transition: 'border-color 0.3s',
              }}
              className={styles.registrationCard}
            >
              {role ? (
                <RegistrationForm key={role} role={role} />
              ) : (
                <div
                  style={{
                    padding: '18px 0',
                    textAlign: 'center',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}
                >
                  Elige Comprador, Vendedor o Punto LockBox.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ CONTACTO / FOOTER ══════════════════════════════════════════ */}
        <footer
          id="contacto"
          style={{
            background: 'var(--color-canvas)',
            borderTop: `2px solid var(--color-accent)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          className={styles.section}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--color-surface-raised)',
            }}
            className={styles.wrappingRow}
          >
            <div>
              <div style={{ display: 'flex', marginBottom: '10px' }}>
                <div
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    fontWeight: 900,
                    fontSize: '22px',
                    letterSpacing: '0.06em',
                    padding: '5px 14px',
                    lineHeight: 1,
                  }}
                >
                  LOCK
                </div>
                <div
                  style={{
                    background: 'var(--color-brand-secondary)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '22px',
                    letterSpacing: '0.06em',
                    padding: '5px 14px',
                    lineHeight: 1,
                  }}
                >
                  BOX
                </div>
              </div>
              <p
                style={{
                  fontSize: '17px',
                  lineHeight: 1.5,
                  color: '#ffffff',
                  margin: 0,
                  fontWeight: 500,
                  maxWidth: '440px',
                }}
              >
                Plataforma Phygital de Comercio Social Seguro en Bolivia.
              </p>
            </div>
            <div className={styles.footerSocial}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '14px',
                  letterSpacing: '0.16em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Est. La Paz, Bolivia · 2026
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {[
                  { label: 'TikTok', url: 'https://www.tiktok.com' },
                  { label: 'Instagram', url: 'https://www.instagram.com' },
                  { label: 'WhatsApp', url: 'https://wa.me/59170000000' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    style={{
                      padding: '10px 18px',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#ffffff',
                      textDecoration: 'none',
                      transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                      display: 'inline-block',
                    }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '36px', marginBottom: '28px' }} className={styles.footerColumns}>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                CONTACTO DIRECTO
              </div>
              {[
                { label: 'Email general', value: 'contacto@lockbox.bo' },
                { label: 'Soporte técnico', value: 'soporte@lockbox.bo' },
                { label: 'Ciudad', value: 'La Paz, Bolivia' },
                { label: 'Pagos aceptados', value: 'Yape · BCP · QR' },
                { label: 'Horario', value: 'Lun–Sáb 8:00–20:00' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '10px' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '0.1em',
                      color: '#cbd5e1',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                PLATAFORMA
              </div>
              {['Vendedores', 'Compradores', 'Puntos LockBox', 'Plan Emprende', 'Plan Pro', 'Validación QR'].map(item => (
                <div
                  key={item}
                  className={styles.textLink}
                  style={{ fontSize: '17px', fontWeight: 500, color: '#ffffff', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                >
                  {item}
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                EMPRESA
              </div>
              {['Sobre Nosotros', 'Modelo de Negocio', 'Inversionistas', 'Términos de Uso', 'Política de Privacidad'].map(item => (
                <div
                  key={item}
                  className={styles.textLink}
                  style={{ fontSize: '17px', fontWeight: 500, color: '#ffffff', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                >
                  {item}
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                PARA TIENDAS ALIADAS
              </div>
              <p style={{ fontSize: '17px', lineHeight: 1.55, color: '#ffffff', margin: '0 0 16px 0', fontWeight: 500 }}>
                ¿Quieres ser un Punto LockBox oficial y ganar comisiones por paquete?
              </p>
              <button
                onClick={() => {
                  setRole('operador_punto');
                  scrollTo('registro');
                }}
                className={styles.affiliateButton}
                style={{
                  border: `2px solid var(--color-accent)`,
                  fontSize: '15px',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-inter), sans-serif',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                AFILIAR MI TIENDA
              </button>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-border-strong)',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            className={styles.wrappingRow}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '0.06em',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              © 2026 LockBox — Todos los derechos reservados
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-accent)' }}>
              Ingeniería de Sistemas · 8vo Semestre · Bolivia
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
