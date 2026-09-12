'use client';

import { useState, FormEvent } from 'react';
import Head from 'next/head';

type Role = 'comprador' | 'vendedor' | null;

const A = '#00D4AA';
const AD = 'rgba(0,212,170,0.10)';

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
  const [activeNav, setActiveNav] = useState<string>('inicio');
  const [role, setRole] = useState<Role>(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    tienda: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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

      <div style={{ background: '#080f1e', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: '#080f1e', borderBottom: `2px solid ${A}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: '52px',
        }}>
          <button onClick={() => scrollTo('inicio')} style={{
            display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}>
            <div style={{ background: A, color: '#080f1e', fontWeight: 900, fontSize: '15px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>LOCK</div>
            <div style={{ background: '#1a3a6b', color: '#ffffff', fontWeight: 900, fontSize: '15px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>BOX</div>
          </button>

          <div style={{ display: 'flex', gap: '28px' }}>
            {[
              { id: 'inicio', label: 'inicio' },
              { id: 'nosotros', label: 'nosotros' },
              { id: 'servicios', label: 'servicios' },
              { id: 'planes', label: 'planes' },
              { id: 'registro', label: 'registro' },
              { id: 'contacto', label: 'contacto' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
                color: activeNav === id ? A : '#adc4de',
                borderBottom: activeNav === id ? `2px solid ${A}` : '2px solid transparent',
                paddingBottom: '2px', transition: 'color 0.2s',
              }}
                onMouseEnter={e => { if (activeNav !== id) e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { if (activeNav !== id) e.currentTarget.style.color = '#adc4de'; }}
              >{label}</button>
            ))}
          </div>
        </nav>

        {/* ══════════════════════════════════════════ HERO ══════════════════════════════════════════ */}
        <section id="inicio" style={{
          height: '100vh', paddingTop: '52px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden',
        }}>
          <div style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
            <div style={{ background: A, display: 'inline-block', width: 'fit-content', fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: '#080f1e', padding: '3px 10px' }}>
              PLATAFORMA PHYGITAL · 2026
            </div>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px, 6.5vw, 80px)', lineHeight: 0.88, color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>LOCK</h1>
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px, 6.5vw, 80px)', lineHeight: 0.88, color: A, margin: 0, textTransform: 'uppercase' }}>BOX</h1>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.65, color: '#dce8f5', maxWidth: '420px', margin: 0, fontWeight: 300 }}>
              Comercio social seguro para vendedores de TikTok Live.
              Pagos en garantía, entrega verificada por QR, red de tiendas aliadas.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => scrollTo('registro')} style={{
                background: A, color: '#080f1e', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em',
                padding: '11px 26px', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                fontFamily: "'Inter', sans-serif", transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >REGISTRARSE</button>
              <button onClick={() => scrollTo('nosotros')} style={{
                border: '2px solid #2a4a6b', color: '#adc4de', background: 'none',
                fontWeight: 600, fontSize: '11px', letterSpacing: '0.1em', padding: '9px 26px',
                cursor: 'pointer', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
                transition: 'border-color 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a4a6b'; e.currentTarget.style.color = '#adc4de'; }}
              >SABER MÁS</button>
            </div>
          </div>

          <div style={{ position: 'relative', background: '#0a1525', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 40px' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,170,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '50%', height: '140%', background: `linear-gradient(135deg, ${A}, #0077cc)`, transform: 'skewX(-10deg)', opacity: 0.06 }} />

            <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: A, textTransform: 'uppercase', marginBottom: '4px' }}>CÓMO FUNCIONA</div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#ffffff', letterSpacing: '-0.01em' }}>El flujo LockBox</div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {FLOW.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: i % 2 === 0 ? '#0d1a30' : '#0a1525', padding: '14px 18px', borderLeft: `3px solid ${i === 0 ? A : i === 3 ? A : '#1e3358'}`, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderLeftColor = A)}
                  onMouseLeave={e => (e.currentTarget.style.borderLeftColor = i === 0 || i === 3 ? A : '#1e3358')}
                >
                  <div style={{ width: '36px', height: '36px', background: i === 0 || i === 3 ? AD : '#122040', border: `1px solid ${i === 0 || i === 3 ? A : '#1e3358'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: A, letterSpacing: '0.05em' }}>{item.step}</div>
                  </div>
                  <div style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#adc4de', fontWeight: 400 }}>{item.sub}</div>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div style={{ fontSize: '14px', color: '#1e3358' }}>▼</div>
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
                <div key={s.lbl} style={{ background: AD, border: `1px solid rgba(0,212,170,0.2)`, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '20px', color: A, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#adc4de', textTransform: 'uppercase', marginTop: '3px' }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '40px', height: '3px', background: A }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '3px', height: '40px', background: A }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '40px', height: '3px', background: '#2a5298' }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '3px', height: '40px', background: '#2a5298' }} />
          </div>
        </section>

        {/* ══════════════════════════════════════════ SOBRE NOSOTROS ══════════════════════════════════════════ */}
        <section id="nosotros" style={{
          height: '100vh', background: '#080f1e', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
        }}>
          <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: '3px', background: `linear-gradient(to bottom, ${A}, #1a3a6b)` }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: A, textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 01</div>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: '#ffffff', margin: 0 }}>
                SOBRE <span style={{ color: '#1a3a6b', WebkitTextStroke: '1px #2a5298' }}>NOSOTROS</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#1e3358', marginBottom: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#dce8f5', margin: '0 0 12px 0', fontWeight: 300 }}>
                <strong style={{ color: '#ffffff', fontWeight: 600 }}>LockBox</strong> nació de una observación concreta: los comerciantes informales que venden por lives en TikTok enfrentan un ecosistema caótico donde el pago es inseguro y la entrega se coordina a mano.
              </p>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#dce8f5', margin: 0, fontWeight: 300 }}>
                Somos un equipo de ingenieros de sistemas unidos por la convicción de que la tecnología debe resolver problemas reales del comercio latinoamericano.
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#dce8f5', margin: '0 0 12px 0', fontWeight: 300 }}>
                Nuestra solución combina un sistema de pagos tipo <strong style={{ color: '#ffffff', fontWeight: 500 }}>escrow</strong> —que retiene el dinero hasta confirmar la entrega— con una red física de tiendas aliadas llamadas <strong style={{ color: A, fontWeight: 500 }}>"Puntos LockBox"</strong>.
              </p>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#dce8f5', margin: 0, fontWeight: 300 }}>
                El comprador escanea un código QR único en el punto de entrega y el sistema libera automáticamente el pago al vendedor. Sin estafas, sin caos, sin riesgo.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '2px solid #1e3358', borderBottom: '2px solid #1e3358', marginBottom: '20px' }}>
            {[
              { value: 'PHYGITAL', label: 'Modelo de negocio' },
              { value: '48H', label: 'Liquidación de pagos' },
              { value: 'QR', label: 'Validación de entrega' },
              { value: 'YAPE/BCP', label: 'Integración de pagos' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 20px', borderRight: i < 3 ? '1px solid #1e3358' : 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontWeight: 800, fontSize: '22px', color: i % 2 === 0 ? A : '#2a5298' }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: '9px', letterSpacing: '0.15em', color: '#adc4de', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
            {VALUES.map((v) => (
              <div key={v.number} style={{
                background: '#0d1a30', padding: '18px', borderLeft: '3px solid transparent',
                transition: 'border-color 0.2s, background 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderLeftColor = A; e.currentTarget.style.background = '#122040'; }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = '#0d1a30'; }}
              >
                <div style={{ fontWeight: 900, fontSize: '26px', color: '#1e3358', lineHeight: 1, marginBottom: '4px' }}>{v.number}</div>
                <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', color: '#ffffff', textTransform: 'uppercase', marginBottom: '5px' }}>{v.label}</div>
                <p style={{ fontSize: '11px', lineHeight: 1.6, color: '#adc4de', margin: 0, fontWeight: 400 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════ SERVICIOS ══════════════════════════════════════════ */}
        <section id="servicios" style={{
          height: '100vh', background: '#0d1a30', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '32%', height: '100%', background: '#122040', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: A, textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 02</div>
                <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: '#ffffff', margin: 0 }}>
                  NUESTROS <span style={{ color: A }}>SERVICIOS</span>
                </h2>
              </div>
              <div style={{ flex: 1, height: '2px', background: '#1e3358', marginBottom: '4px' }} />
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
                  background: '#080f1e', padding: '22px',
                  borderBottom: '3px solid transparent', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderBottomColor = A; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>{s.icon}</span>
                    <span style={{ background: AD, color: A, fontWeight: 700, fontSize: '8px', letterSpacing: '0.2em', padding: '2px 6px', textTransform: 'uppercase' }}>{s.tag}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff', margin: '0 0 5px 0' }}>{s.title}</h3>
                  <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#adc4de', margin: 0, fontWeight: 400 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ PLANES ══════════════════════════════════════════ */}
        <section id="planes" style={{
          height: '100vh', background: '#080f1e',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: A, textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 03</div>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: '#ffffff', margin: 0 }}>
                PLANES DE <span style={{ color: A }}>SUSCRIPCIÓN</span>
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#1e3358', marginBottom: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '24px' }}>
            {/* Plan Emprende */}
            <div style={{ background: '#0d1a30', padding: '40px', borderTop: '4px solid #2a5298', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', border: '1px solid #1e3358', borderRadius: '50%', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.3em', color: '#2a5298', textTransform: 'uppercase', marginBottom: '8px' }}>PLAN EMPRENDE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 900, fontSize: '40px', color: '#ffffff', lineHeight: 1 }}>Gratuito</span>
              </div>
              <div style={{ fontSize: '13px', color: '#adc4de', marginBottom: '28px' }}>5% – 8% de comisión por transacción exitosa</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {['Acceso a red de Puntos LockBox', 'Liquidación de pagos en 48 horas', 'Pago en garantía incluido', 'Catálogo en live básico', 'Soporte por chat'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#2a5298', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#dce8f5', fontWeight: 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollTo('registro')} style={{
                background: 'transparent', border: '2px solid #2a5298', color: '#adc4de',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.1em', padding: '11px 28px', cursor: 'pointer',
                textTransform: 'uppercase', transition: 'background 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2a5298'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#adc4de'; }}
              >EMPEZAR GRATIS</button>
            </div>

            {/* Plan Pro */}
            <div style={{ background: '#0a1a1a', padding: '40px', borderTop: `4px solid ${A}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', border: `1px solid rgba(0,212,170,0.2)`, borderRadius: '50%', opacity: 0.6 }} />
              <div style={{ position: 'absolute', top: '12px', right: '16px' }}>
                <div style={{ background: A, color: '#080f1e', fontWeight: 700, fontSize: '8px', letterSpacing: '0.2em', padding: '3px 8px', textTransform: 'uppercase' }}>RECOMENDADO</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.3em', color: A, textTransform: 'uppercase', marginBottom: '8px' }}>PLAN PRO</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 900, fontSize: '40px', color: '#ffffff', lineHeight: 1 }}>Mensual</span>
              </div>
              <div style={{ fontSize: '13px', color: '#adc4de', marginBottom: '28px' }}>1% – 2% de comisión · Liquidación inmediata</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {['Todo lo del Plan Emprende', 'Dashboard de métricas avanzado', 'Liquidación inmediata al confirmar QR', 'IA para etiquetado automático de productos', 'Soporte prioritario 24/7'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', background: A, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#dce8f5', fontWeight: 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollTo('registro')} style={{
                background: A, border: 'none', color: '#080f1e',
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
          height: '100vh', background: '#0d1a30',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.4em', color: A, textTransform: 'uppercase', marginBottom: '6px' }}>— SECCIÓN 04</div>
              <h2 style={{ fontWeight: 900, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 0.92, textTransform: 'uppercase', color: '#ffffff', margin: 0 }}>
                REGISTRO
              </h2>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#1e3358', marginBottom: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#dce8f5', marginBottom: '16px', fontWeight: 400 }}>
                Elige tu rol en la plataforma y empieza a operar con seguridad desde el primer día.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '20px' }}>
                {([
                  { r: 'comprador' as Role, icon: '🛒', title: 'Comprador', desc: 'Compra en lives de TikTok con pago protegido y recoge en un Punto LockBox cercano.' },
                  { r: 'vendedor' as Role, icon: '🏪', title: 'Vendedor', desc: 'Vende durante tus lives con catálogo integrado y recibe pagos seguros en 48 horas.' },
                ]).map(({ r, icon, title, desc }) => (
                  <button key={r!} onClick={() => { setRole(r); setSubmitted(false); }} style={{
                    background: role === r ? AD : '#080f1e',
                    border: `2px solid ${role === r ? A : '#1e3358'}`,
                    padding: '18px', textAlign: 'left', cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s', fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={e => { if (role !== r) e.currentTarget.style.borderColor = '#2a5298'; }}
                    onMouseLeave={e => { if (role !== r) e.currentTarget.style.borderColor = '#1e3358'; }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: role === r ? A : '#ffffff', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontSize: '11px', color: '#adc4de', lineHeight: 1.55, fontWeight: 400 }}>{desc}</div>
                  </button>
                ))}
              </div>

              {role === 'comprador' && (
                <div style={{ borderLeft: `3px solid ${A}`, paddingLeft: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '9px', color: A, marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BENEFICIOS PARA COMPRADORES</div>
                  {['Pago 100% protegido hasta recibir tu pedido', 'Red de puntos de entrega en tu ciudad', 'Devolución garantizada si el producto no llega', 'Sin comisión adicional para compradores'].map(b => (
                    <div key={b} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <div style={{ width: '5px', height: '5px', background: A, flexShrink: 0, marginTop: '5px' }} />
                      <span style={{ fontSize: '12px', color: '#dce8f5', fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {role === 'vendedor' && (
                <div style={{ borderLeft: `3px solid ${A}`, paddingLeft: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '9px', color: A, marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BENEFICIOS PARA VENDEDORES</div>
                  {['Catálogo integrado en TikTok Live', 'Pago garantizado antes de entregar', 'Liquidación a Yape/BCP en 48 horas', 'Red logística sin costo de repartidor'].map(b => (
                    <div key={b} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <div style={{ width: '5px', height: '5px', background: A, flexShrink: 0, marginTop: '5px' }} />
                      <span style={{ fontSize: '12px', color: '#dce8f5', fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {!role && (
                <div style={{ borderLeft: `3px solid #1e3358`, paddingLeft: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#adc4de', lineHeight: 1.6 }}>
                    Selecciona Comprador o Vendedor para ver los beneficios y completar tu registro en segundos.
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <div style={{ background: '#080f1e', padding: '32px', borderTop: `3px solid ${role ? A : '#1e3358'}`, transition: 'border-color 0.3s' }}>
              {!role ? (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: A, textTransform: 'uppercase', marginBottom: '8px' }}>¿QUIÉN ERES?</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: '#ffffff', lineHeight: 1.1, marginBottom: '10px' }}>
                      Elige tu perfil<br />
                      <span style={{ color: A }}>y empieza hoy.</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#adc4de', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                      Selecciona Comprador o Vendedor en el panel izquierdo para desbloquear el formulario de registro personalizado.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { icon: '🛒', role: 'Comprador', detail: 'Compra segura · Recogida QR · Sin comisión' },
                      { icon: '🏪', role: 'Vendedor', detail: 'Pago garantizado · Dashboard · Liquidación 48H' },
                    ].map(item => (
                      <div key={item.role} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#0d1a30', borderLeft: '3px solid #1e3358' }}>
                        <span style={{ fontSize: '24px' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff', marginBottom: '2px' }}>{item.role}</div>
                          <div style={{ fontSize: '11px', color: '#adc4de' }}>{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '1px', background: '#1e3358' }} />
                    <span style={{ fontSize: '11px', color: '#2a4a6b', fontWeight: 600, letterSpacing: '0.1em' }}>REGISTRO GRATUITO</span>
                    <div style={{ flex: 1, height: '1px', background: '#1e3358' }} />
                  </div>
                </div>
              ) : submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '44px', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: A, marginBottom: '8px' }}>¡Registro exitoso!</div>
                  <div style={{ fontSize: '13px', color: '#dce8f5', lineHeight: 1.6 }}>
                    Te contactaremos a <strong style={{ color: '#ffffff' }}>{form.email}</strong> para activar tu cuenta de {role}.
                  </div>
                  <button onClick={() => { setSubmitted(false); setForm({ nombre: '', email: '', telefono: '', ciudad: '', tienda: '' }); }}
                    style={{ marginTop: '16px', background: 'transparent', border: `1px solid #1e3358`, color: '#adc4de', padding: '8px 20px', cursor: 'pointer', fontSize: '11px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s, color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3358'; e.currentTarget.style.color = '#adc4de'; }}
                  >Registrar otra cuenta</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff', marginBottom: '20px' }}>
                    Registro como <span style={{ color: A, textTransform: 'capitalize' }}>{role}</span>
                  </div>
                  {[
                    { key: 'nombre', label: 'Nombre completo', type: 'text', placeholder: 'Ej. María Gonzáles' },
                    { key: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tucorreo@gmail.com' },
                    { key: 'telefono', label: 'Número de celular', type: 'tel', placeholder: '+591 7xx-xxxxx' },
                    { key: 'ciudad', label: 'Ciudad', type: 'text', placeholder: 'La Paz, Cochabamba...' },
                    ...(role === 'vendedor' ? [{ key: 'tienda', label: 'Tienda en TikTok', type: 'text', placeholder: '@mitienda' }] : []),
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom: '11px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '9px', letterSpacing: '0.1em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '4px' }}>{field.label}</label>
                      <input type={field.type} required placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={{ width: '100%', background: '#0d1a30', border: '1px solid #1e3358', color: '#ffffff', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={e => (e.target.style.borderColor = A)}
                        onBlur={e => (e.target.style.borderColor = '#1e3358')}
                      />
                    </div>
                  ))}
                  <button type="submit" style={{ width: '100%', background: A, color: '#080f1e', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', padding: '13px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', marginTop: '6px', transition: 'opacity 0.2s' }}
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
          height: '100vh', background: '#04080f', borderTop: `2px solid ${A}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', paddingBottom: '24px', borderBottom: '1px solid #0d1a30' }}>
            <div>
              <div style={{ display: 'flex', marginBottom: '10px' }}>
                <div style={{ background: A, color: '#080f1e', fontWeight: 900, fontSize: '18px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>LOCK</div>
                <div style={{ background: '#1a3a6b', color: '#ffffff', fontWeight: 900, fontSize: '18px', letterSpacing: '0.06em', padding: '4px 10px', lineHeight: 1 }}>BOX</div>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#adc4de', margin: 0, fontWeight: 300, maxWidth: '340px' }}>
                Plataforma Phygital de Comercio Social Seguro. Pagos en garantía, entrega verificada por QR y red de tiendas aliadas en Bolivia.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.2em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '10px' }}>Est. La Paz, Bolivia · 2026</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {[
                  { label: 'TikTok', url: 'https://www.tiktok.com' },
                  { label: 'Instagram', url: 'https://www.instagram.com' },
                  { label: 'WhatsApp', url: 'https://wa.me/59170000000' },
                ].map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                    border: `1px solid #1e3358`, padding: '6px 14px', fontSize: '10px',
                    color: '#adc4de', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                    display: 'inline-block',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; e.currentTarget.style.background = AD; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3358'; e.currentTarget.style.color = '#adc4de'; e.currentTarget.style.background = 'transparent'; }}
                  >{s.label}</a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '36px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: A, textTransform: 'uppercase', marginBottom: '14px' }}>CONTACTO DIRECTO</div>
              {[
                { label: 'Email general', value: 'contacto@lockbox.bo' },
                { label: 'Soporte técnico', value: 'soporte@lockbox.bo' },
                { label: 'Ciudad', value: 'La Paz, Bolivia' },
                { label: 'Pagos aceptados', value: 'Yape · BCP · Transferencia' },
                { label: 'Horario', value: 'Lun–Sáb 8:00–20:00' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '9px' }}>
                  <div style={{ fontWeight: 700, fontSize: '8px', letterSpacing: '0.15em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '1px' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#ffffff' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: A, textTransform: 'uppercase', marginBottom: '14px' }}>PLATAFORMA</div>
              {['Vendedores', 'Compradores', 'Puntos LockBox', 'Plan Emprende', 'Plan Pro', 'Validación QR'].map(item => (
                <div key={item} style={{ fontSize: '12px', color: '#adc4de', marginBottom: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#adc4de')}
                >{item}</div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: A, textTransform: 'uppercase', marginBottom: '14px' }}>EMPRESA</div>
              {['Sobre Nosotros', 'Modelo de Negocio', 'Inversionistas', 'Términos de Uso', 'Política de Privacidad', 'Prensa'].map(item => (
                <div key={item} style={{ fontSize: '12px', color: '#adc4de', marginBottom: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#adc4de')}
                >{item}</div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.3em', color: A, textTransform: 'uppercase', marginBottom: '14px' }}>PARA TIENDAS</div>
              <p style={{ fontSize: '12px', lineHeight: 1.65, color: '#adc4de', margin: '0 0 14px 0', fontWeight: 300 }}>
                ¿Tu tienda quiere convertirse en un Punto LockBox oficial y generar ingresos por comisión?
              </p>
              <button onClick={() => scrollTo('registro')} style={{
                background: 'transparent', border: `1px solid ${A}`, color: A,
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                padding: '8px 16px', cursor: 'pointer', textTransform: 'uppercase',
                fontFamily: "'Inter', sans-serif", transition: 'background 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = A; e.currentTarget.style.color = '#080f1e'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A; }}
              >AFILIARSE</button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1e3358', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 500, fontSize: '10px', letterSpacing: '0.1em', color: '#adc4de', textTransform: 'uppercase' }}>
              © 2026 LockBox — Todos los derechos reservados
            </div>
            <div style={{ fontSize: '10px', color: '#adc4de' }}>
              Ingeniería de Sistemas · 8vo Semestre · Bolivia
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}