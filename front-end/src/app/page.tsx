'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';

type Role = 'comprador' | 'vendedor' | null;


const VALUES = [
  { number: '01', label: 'SEGURIDAD', desc: 'Escrow automático que retiene el pago hasta confirmar la entrega física mediante código QR único.' },
  { number: '02', label: 'CONFIANZA', desc: 'Red de Puntos LockBox en tiendas aliadas que funcionan como centros de acopio verificados.' },
  { number: '03', label: 'INNOVACIÓN', desc: 'Modelo Phygital que fusiona el comercio digital con infraestructura física para cerrar el ciclo de venta.' },
  { number: '04', label: 'INCLUSIÓN', desc: 'Diseñado para comerciantes informales de TikTok Live que necesitan herramientas confiables sin barreras.' },
];

const FLOW = [
  { icon: '🎥', step: '01', label: 'Live en TikTok', sub: 'Vendedor expone catálogo' },
  { icon: '💳', step: '02', label: 'Pago Escrow', sub: 'Dinero retenido seguro' },
  { icon: '📦', step: '03', label: 'Punto LockBox', sub: 'Tienda aliada recibe' },
  { icon: '✅', step: '04', label: 'QR Confirmado', sub: 'Pago liberado al vendedor' },
];

export default function Home() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<string>('inicio');
  const [role, setRole] = useState<Role>(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    tienda: '',
  });
  const [submitted, setSubmitted] = useState(false);

 const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  setSubmitted(true);
  
  // Te lleva al dashboard después de 1 segundo
  setTimeout(() => {
    router.push(role === 'vendedor' ? '/vendedor' : '/dashboard');
  }, 1000);
};

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>LockBox · Comercio Social Seguro</title>
        <meta name="description" content="Plataforma Phygital para vendedores de TikTok Live con pagos en garantía y entrega verificada por QR." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background: 'var(--color-surface-deep)', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--color-surface-deep)', borderBottom: `2px solid var(--color-accent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: '52px',
        }}>
          <button onClick={() => scrollTo('inicio')} style={{
            display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}>
            <div style={{ background: 'var(--color-accent)', color: 'var(--color-surface-deep)', fontWeight: 900, fontSize: '15px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>LOCK</div>
            <div style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-white)', fontWeight: 900, fontSize: '15px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>BOX</div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Enlaces Informativos Internos */}
            {[
              { id: 'inicio', label: 'inicio' },
              { id: 'nosotros', label: 'nosotros' },
              { id: 'servicios', label: 'servicios' },
              { id: 'planes', label: 'planes' },
              { id: 'contacto', label: 'contacto' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
                color: activeNav === id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeNav === id ? `2px solid var(--color-accent)` : '2px solid transparent',
                paddingBottom: '2px', transition: 'color 0.2s',
              }}
                onMouseEnter={e => { if (activeNav !== id) e.currentTarget.style.color = 'var(--color-white)'; }}
                onMouseLeave={e => { if (activeNav !== id) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >{label}</button>
            ))}

            <div style={{ width: '1px', height: '18px', background: 'var(--color-border-strong)', margin: '0 4px' }} />
            <Link href="/login" style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '11px',
              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)',
              textDecoration: 'none', transition: 'color 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-white)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-accent)')}
            >
              Iniciar Sesión
            </Link>

            <button onClick={() => scrollTo('registro')} style={{
              background: 'var(--color-accent)', color: 'var(--color-surface-deep)', border: 'none', padding: '7px 16px',
              fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: '11px',
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Registro
            </button>
          </div>
        </nav>

        {/* ══════════════════════════════════════════ HERO ══════════════════════════════════════════ */}
        <section id="inicio" style={{
          height: '100vh', paddingTop: '52px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden',
        }}>
          <div style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--color-accent)', display: 'inline-block', width: 'fit-content', fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: 'var(--color-surface-deep)', padding: '3px 10px' }}>
              PLATAFORMA PHYGITAL · 2026
            </div>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px, 6.5vw, 80px)', lineHeight: 0.88, color: 'var(--color-white)', margin: 0, textTransform: 'uppercase' }}>LOCK</h1>
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px, 6.5vw, 80px)', lineHeight: 0.88, color: 'var(--color-accent)', margin: 0, textTransform: 'uppercase' }}>BOX</h1>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--color-foreground)', maxWidth: '420px', margin: 0, fontWeight: 300 }}>
              Comercio social seguro para vendedores de TikTok Live.
              Pagos en garantía, entrega verificada por QR, red de tiendas aliadas.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => scrollTo('registro')} style={{
                background: 'var(--color-accent)', color: 'var(--color-surface-deep)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em',
                padding: '11px 26px', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                fontFamily: "'Inter', sans-serif", transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >REGISTRARSE</button>
              <button onClick={() => scrollTo('nosotros')} style={{
                border: '2px solid var(--color-border-emphasis)', color: 'var(--color-text-secondary)', background: 'none',
                fontWeight: 600, fontSize: '11px', letterSpacing: '0.1em', padding: '9px 26px',
                cursor: 'pointer', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
                transition: 'border-color 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-white)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-emphasis)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >SABER MÁS</button>
            </div>
          </div>

          <div style={{ position: 'relative', background: 'var(--color-surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 40px' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--color-accent-faint) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-faint) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '50%', height: '140%', background: `linear-gradient(135deg, var(--color-accent), var(--color-info-strong))`, transform: 'skewX(-10deg)', opacity: 0.06 }} />

            <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>CÓMO FUNCIONA</div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-white)', letterSpacing: '-0.01em' }}>El flujo LockBox</div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {FLOW.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: i % 2 === 0 ? 'var(--color-surface-raised)' : 'var(--color-surface)', padding: '14px 18px', borderLeft: `3px solid ${i === 0 ? 'var(--color-accent)' : i === 3 ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderLeftColor = 'var(--color-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderLeftColor = i === 0 || i === 3 ? 'var(--color-accent)' : 'var(--color-border-strong)')}
                >
                  <div style={{ width: '36px', height: '36px', background: i === 0 || i === 3 ? 'var(--color-accent-soft)' : 'var(--color-surface-hover)', border: `1px solid ${i === 0 || i === 3 ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>{item.step}</div>
                  </div>
                  <div style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-white)', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>{item.sub}</div>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div style={{ fontSize: '14px', color: 'var(--color-border-strong)' }}>▼</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginTop: '16px' }}>
              {[
                { val: '100%', lbl: 'Protección' },
                { val: '48H', lbl: 'Liquidación' },
                { val: '0', lbl: 'Estafas' },
              ].map(s => (
                <div key={s.lbl} style={{ background: 'var(--color-accent-soft)', border: `1px solid var(--color-accent-muted)`, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '20px', color: 'var(--color-accent)', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginTop: '3px' }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '40px', height: '3px', background: 'var(--color-accent)' }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '3px', height: '40px', background: 'var(--color-accent)' }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '40px', height: '3px', background: 'var(--color-brand-secondary-hover)' }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '3px', height: '40px', background: 'var(--color-brand-secondary-hover)' }} />
          </div>
        </section>
        {/* ══════════════════════════════════════════ SOBRE NOSOTROS ══════════════════════════════════════════ */}
        <section id="nosotros" style={{
          height: '100vh', background: 'var(--color-surface-deep)', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
        }}>
          <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: '3px', background: `linear-gradient(to bottom, var(--color-accent), var(--color-brand-secondary))` }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 01</div>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: 'var(--color-white)', margin: 0 }}>
                SOBRE <span style={{ color: 'var(--color-brand-secondary)', WebkitTextStroke: '1px var(--color-brand-secondary-hover)' }}>NOSOTROS</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-foreground)', margin: '0 0 12px 0', fontWeight: 300 }}>
                <strong style={{ color: 'var(--color-white)', fontWeight: 600 }}>LockBox</strong> nació de una observación concreta: los comerciantes informales que venden por lives en TikTok enfrentan un ecosistema caótico donde el pago es inseguro y la entrega se coordina a mano.
              </p>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-foreground)', margin: 0, fontWeight: 300 }}>
                Somos un equipo de ingenieros de sistemas unidos por la convicción de que la tecnología debe resolver problemas reales del comercio latinoamericano.
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-foreground)', margin: '0 0 12px 0', fontWeight: 300 }}>
                Nuestra solución combina un sistema de pagos tipo <strong style={{ color: 'var(--color-white)', fontWeight: 500 }}>escrow</strong> —que retiene el dinero hasta confirmar la entrega— con una red física de tiendas aliadas llamadas <strong style={{ color: 'var(--color-accent)', fontWeight: 500 }}>"Puntos LockBox"</strong>.
              </p>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-foreground)', margin: 0, fontWeight: 300 }}>
                El comprador escanea un código QR único en el punto de entrega y el sistema libera automáticamente el pago al vendedor. Sin estafas, sin caos, sin riesgo.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '2px solid var(--color-border-strong)', borderBottom: '2px solid var(--color-border-strong)', marginBottom: '20px' }}>
            {[
              { value: 'PHYGITAL', label: 'Modelo de negocio' },
              { value: '48H', label: 'Liquidación de pagos' },
              { value: 'QR', label: 'Validación de entrega' },
              { value: 'YAPE/BCP', label: 'Integración de pagos' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 20px', borderRight: i < 3 ? '1px solid var(--color-border-strong)' : 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontWeight: 800, fontSize: '22px', color: i % 2 === 0 ? 'var(--color-accent)' : 'var(--color-brand-secondary-hover)' }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: '9px', letterSpacing: '0.15em', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
            {VALUES.map((v) => (
              <div key={v.number} style={{
                background: 'var(--color-surface-raised)', padding: '18px', borderLeft: '3px solid transparent',
                transition: 'border-color 0.2s, background 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderLeftColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = 'var(--color-surface-raised)'; }}
              >
                <div style={{ fontWeight: 900, fontSize: '26px', color: 'var(--color-border-strong)', lineHeight: 1, marginBottom: '4px' }}>{v.number}</div>
                <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', color: 'var(--color-white)', textTransform: 'uppercase', marginBottom: '5px' }}>{v.label}</div>
                <p style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, fontWeight: 400 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════ SERVICIOS ══════════════════════════════════════════ */}
        <section id="servicios" style={{
          height: '100vh', background: 'var(--color-surface-raised)', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '32%', height: '100%', background: 'var(--color-surface-hover)', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 02</div>
                <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: 'var(--color-white)', margin: 0 }}>
                  NUESTROS <span style={{ color: 'var(--color-accent)' }}>SERVICIOS</span>
                </h2>
              </div>
              <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '4px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
              {[
                { icon: '🛡️', title: 'Pago en Garantía', desc: 'Tu dinero queda retenido hasta que confirmes haber recibido tu pedido. Sin estafas.', tag: 'COMPRADORES' },
                { icon: '📦', title: 'Puntos LockBox', desc: 'Red de tiendas aliadas que reciben los paquetes y los entregan contra escaneo de QR.', tag: 'ENTREGA' },
                { icon: '📲', title: 'Catálogo en Live', desc: 'Vende durante tu live en TikTok con catálogo integrado. Tus clientes compran con un clic.', tag: 'VENDEDORES' },
                { icon: '⚡', title: 'Liquidación 48H', desc: 'Confirmada la entrega, el dinero llega a tu Yape o BCP en menos de 48 horas.', tag: 'VENDEDORES' },
                { icon: '🔍', title: 'Validación QR', desc: 'Cada compra genera un QR único. Al escanearlo se libera el pago automáticamente.', tag: 'SEGURIDAD' },
                { icon: '📊', title: 'Dashboard Pro', desc: 'Métricas de rotación, historial de ventas y análisis de clientes. Desde 1% de comisión.', tag: 'ANALYTICS' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'var(--color-surface-deep)', padding: '22px',
                  borderBottom: '3px solid transparent', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>{s.icon}</span>
                    <span style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontWeight: 700, fontSize: '8px', letterSpacing: '0.2em', padding: '2px 6px', textTransform: 'uppercase' }}>{s.tag}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-white)', margin: '0 0 5px 0' }}>{s.title}</h3>
                  <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, fontWeight: 400 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ PLANES ══════════════════════════════════════════ */}
        <section id="planes" style={{
          height: '100vh', background: 'var(--color-surface-deep)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 03</div>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: 'var(--color-white)', margin: 0 }}>
                PLANES DE <span style={{ color: 'var(--color-accent)' }}>SUSCRIPCIÓN</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '24px' }}>
            {/* Plan Emprende */}
            <div style={{ background: 'var(--color-surface-raised)', padding: '40px', borderTop: '4px solid var(--color-brand-secondary-hover)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', border: '1px solid var(--color-border-strong)', borderRadius: '50%', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.3em', color: 'var(--color-brand-secondary-hover)', textTransform: 'uppercase', marginBottom: '8px' }}>PLAN EMPRENDE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 900, fontSize: '40px', color: 'var(--color-white)', lineHeight: 1 }}>Gratuito</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>5% – 8% de comisión por transacción exitosa</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {['Acceso a red de Puntos LockBox', 'Liquidación de pagos en 48 horas', 'Pago en garantía incluido', 'Catálogo en live básico', 'Soporte por chat'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', background: 'var(--color-brand-secondary-hover)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollTo('registro')} style={{
                background: 'transparent', border: '2px solid var(--color-brand-secondary-hover)', color: 'var(--color-text-secondary)',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.1em', padding: '11px 28px', cursor: 'pointer',
                textTransform: 'uppercase', transition: 'background 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-brand-secondary-hover)'; e.currentTarget.style.color = 'var(--color-white)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >EMPEZAR GRATIS</button>
            </div>

            {/* Plan Pro */}
            <div style={{ background: 'var(--color-product-default)', padding: '40px', borderTop: `4px solid var(--color-accent)`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', border: `1px solid var(--color-accent-muted)`, borderRadius: '50%', opacity: 0.6 }} />
              <div style={{ position: 'absolute', top: '12px', right: '16px' }}>
                <div style={{ background: 'var(--color-accent)', color: 'var(--color-surface-deep)', fontWeight: 700, fontSize: '8px', letterSpacing: '0.2em', padding: '3px 8px', textTransform: 'uppercase' }}>RECOMENDADO</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '8px' }}>PLAN PRO</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 900, fontSize: '40px', color: 'var(--color-white)', lineHeight: 1 }}>Mensual</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>1% – 2% de comisión · Liquidación inmediata</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {['Todo lo del Plan Emprende', 'Dashboard de métricas avanzado', 'Liquidación inmediata al confirmar QR', 'IA para etiquetado automático de productos', 'Soporte prioritario 24/7'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollTo('registro')} style={{
                background: 'var(--color-accent)', border: 'none', color: 'var(--color-surface-deep)',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.1em', padding: '13px 28px', cursor: 'pointer',
                textTransform: 'uppercase', transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >ACTIVAR PLAN PRO</button>
            </div>
          </div>
        </section>
{/* ══════════════════════════════════════════ REGISTRO ══════════════════════════════════════════ */}
        <section id="registro" style={{
          height: '100vh', background: 'var(--color-surface-raised)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 04</div>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: 'var(--color-white)', margin: 0 }}>
                REGISTRO
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: 'var(--color-border-strong)', marginBottom: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--color-foreground)', marginBottom: '16px', fontWeight: 400 }}>
                Elige tu rol en la plataforma y empieza a operar con seguridad desde el primer día.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '20px' }}>
                {([
                  { r: 'comprador' as Role, icon: '🛒', title: 'Comprador', desc: 'Compra en lives de TikTok con pago protegido y recoge en un Punto LockBox cercano.' },
                  { r: 'vendedor' as Role, icon: '🏪', title: 'Vendedor', desc: 'Vende durante tus lives con catálogo integrado y recibe pagos seguros en 48 horas.' },
                ]).map(({ r, icon, title, desc }) => (
                  <button key={r!} onClick={() => { setRole(r); setSubmitted(false); }} style={{
                    background: role === r ? 'var(--color-accent-soft)' : 'var(--color-surface-deep)',
                    border: `2px solid ${role === r ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                    padding: '18px', textAlign: 'left', cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s', fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={e => { if (role !== r) e.currentTarget.style.borderColor = 'var(--color-brand-secondary-hover)'; }}
                    onMouseLeave={e => { if (role !== r) e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: role === r ? 'var(--color-accent)' : 'var(--color-white)', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.55, fontWeight: 400 }}>{desc}</div>
                  </button>
                ))}
              </div>

              {role === 'comprador' && (
                <div style={{ borderLeft: `3px solid var(--color-accent)`, paddingLeft: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '9px', color: 'var(--color-accent)', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BENEFICIOS PARA COMPRADORES</div>
                  {['Pago 100% protegido hasta recibir tu pedido', 'Red de puntos de entrega en tu ciudad', 'Devolución garantizada si el producto no llega', 'Sin comisión adicional para compradores'].map(b => (
                    <div key={b} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <div style={{ width: '5px', height: '5px', background: 'var(--color-accent)', flexShrink: 0, marginTop: '5px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {role === 'vendedor' && (
                <div style={{ borderLeft: `3px solid var(--color-accent)`, paddingLeft: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '9px', color: 'var(--color-accent)', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BENEFICIOS PARA VENDEDORES</div>
                  {['Catálogo integrado en TikTok Live', 'Pago garantizado antes de entregar', 'Liquidación a Yape/BCP en 48 horas', 'Red logística sin costo de repartidor'].map(b => (
                    <div key={b} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <div style={{ width: '5px', height: '5px', background: 'var(--color-accent)', flexShrink: 0, marginTop: '5px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {!role && (
                <div style={{ borderLeft: `3px solid var(--color-border-strong)`, paddingLeft: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    Selecciona Comprador o Vendedor para ver los beneficios y completar tu registro en segundos.
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <div style={{ background: 'var(--color-surface-deep)', padding: '32px', borderTop: `3px solid ${role ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, transition: 'border-color 0.3s' }}>
              {!role ? (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '8px' }}>¿QUIÉN ERES?</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--color-white)', lineHeight: 1.1, marginBottom: '10px' }}>
                      Elige tu perfil<br />
                      <span style={{ color: 'var(--color-accent)' }}>y empieza hoy.</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                      Selecciona Comprador o Vendedor en el panel izquierdo para desbloquear el formulario de registro personalizado.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { icon: '🛒', role: 'Comprador', detail: 'Compra segura · Recogida QR · Sin comisión' },
                      { icon: '🏪', role: 'Vendedor', detail: 'Pago garantizado · Dashboard · Liquidación 48H' },
                    ].map(item => (
                      <div key={item.role} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'var(--color-surface-raised)', borderLeft: '3px solid var(--color-border-strong)' }}>
                        <span style={{ fontSize: '24px' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-white)', marginBottom: '2px' }}>{item.role}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border-strong)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-border-emphasis)', fontWeight: 600, letterSpacing: '0.1em' }}>REGISTRO GRATUITO</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border-strong)' }} />
                  </div>
                </div>
              ) : submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '44px', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-accent)', marginBottom: '8px' }}>¡Registro exitoso!</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-foreground)', lineHeight: 1.6 }}>
                    Te contactaremos a <strong style={{ color: 'var(--color-white)' }}>{form.email}</strong> para activar tu cuenta de {role}.
                  </div>
                  <button onClick={() => { setSubmitted(false); setForm({ nombre: '', email: '', password: '', confirmPassword: '', telefono: '', tienda: '' }); }}
                    style={{ marginTop: '16px', background: 'transparent', border: `1px solid var(--color-border-strong)`, color: 'var(--color-text-secondary)', padding: '8px 20px', cursor: 'pointer', fontSize: '11px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s, color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-white)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >Registrar otra cuenta</button>
                </div>
              ) : (
                <form onSubmit={e => {
                  e.preventDefault();
                  if (form.password !== form.confirmPassword) {
                    alert('Las contraseñas no coinciden');
                    return;
                  }
                  handleSubmit(e); // Llama a la función de envío existente de tu compañero
                }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-white)', marginBottom: '20px' }}>
                    Registro como <span style={{ color: 'var(--color-accent)', textTransform: 'capitalize' }}>{role}</span>
                  </div>
                  {[
                    { key: 'nombre', label: 'Nombre completo', type: 'text', placeholder: 'Ej. María Gonzáles' },
                    { key: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tucorreo@gmail.com' },
                    { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' },
                    { key: 'confirmPassword', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••' },
                    { key: 'telefono', label: 'Número de celular', type: 'tel', placeholder: '+591 7xx-xxxxx' },
                    ...(role === 'vendedor' ? [{ key: 'tienda', label: 'Tienda en TikTok', type: 'text', placeholder: '@mitienda' }] : []),
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom: '11px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '9px', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>{field.label}</label>
                      <input type={field.type} required placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-strong)', color: 'var(--color-white)', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--color-border-strong)')}
                      />
                    </div>
                  ))}
                  <button type="submit" style={{ width: '100%', background: 'var(--color-accent)', color: 'var(--color-surface-deep)', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', padding: '13px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', marginTop: '6px', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >Crear mi cuenta de {role}</button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ CONTACTO / FOOTER ══════════════════════════════════════════ */}
        <footer id="contacto" style={{
          height: '100vh', background: 'var(--color-canvas)', borderTop: `2px solid var(--color-accent)`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', paddingBottom: '24px', borderBottom: '1px solid var(--color-surface-raised)' }}>
            <div>
              <div style={{ display: 'flex', marginBottom: '10px' }}>
                <div style={{ background: 'var(--color-accent)', color: 'var(--color-surface-deep)', fontWeight: 900, fontSize: '18px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>LOCK</div>
                <div style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-white)', fontWeight: 900, fontSize: '18px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>BOX</div>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, fontWeight: 300, maxWidth: '340px' }}>
                Plataforma Phygital de Comercio Social Seguro. Pagos en garantía, entrega verificada por QR y red de tiendas aliadas en Bolivia.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.2em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>Est. La Paz, Bolivia · 2026</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {[
                  { label: 'TikTok', url: 'https://www.tiktok.com' },
                  { label: 'Instagram', url: 'https://www.instagram.com' },
                  { label: 'WhatsApp', url: 'https://wa.me/59170000000' },
                ].map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                    border: `1px solid var(--color-border-strong)`, padding: '6px 14px', fontSize: '10px',
                    color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                    display: 'inline-block',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-accent-soft)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                  >{s.label}</a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '36px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '14px' }}>CONTACTO DIRECTO</div>
              {[
                { label: 'Email general', value: 'contacto@lockbox.bo' },
                { label: 'Soporte técnico', value: 'soporte@lockbox.bo' },
                { label: 'Ciudad', value: 'La Paz, Bolivia' },
                { label: 'Pagos aceptados', value: 'Yape · BCP · Transferencia' },
                { label: 'Horario', value: 'Lun–Sáb 8:00–20:00' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '9px' }}>
                  <div style={{ fontWeight: 700, fontSize: '8px', letterSpacing: '0.15em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '1px' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-white)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '14px' }}>PLATAFORMA</div>
              {['Vendedores', 'Compradores', 'Puntos LockBox', 'Plan Emprende', 'Plan Pro', 'Validación QR'].map(item => (
                <div key={item} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-white)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >{item}</div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '14px' }}>EMPRESA</div>
              {['Sobre Nosotros', 'Modelo de Negocio', 'Inversionistas', 'Términos de Uso', 'Política de Privacidad', 'Prensa'].map(item => (
                <div key={item} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-white)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >{item}</div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '14px' }}>PARA TIENDAS</div>
              <p style={{ fontSize: '12px', lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: '0 0 14px 0', fontWeight: 300 }}>
                ¿Tu tienda quiere convertirse en un Punto LockBox oficial y generar ingresos por comisión?
              </p>
              <button onClick={() => scrollTo('registro')} style={{
                background: 'transparent', border: `1px solid var(--color-accent)`, color: 'var(--color-accent)',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                padding: '8px 16px', cursor: 'pointer', textTransform: 'uppercase',
                fontFamily: "'Inter', sans-serif", transition: 'background 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-surface-deep)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)'; }}
              >AFILIARSE</button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border-strong)', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 500, fontSize: '10px', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              © 2026 LockBox — Todos los derechos reservados
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              Ingeniería de Sistemas · 8vo Semestre · Bolivia
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}