'use client';

import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
/* ─── constants ─── */
const A = '#00D4AA';
const AD = 'rgba(0,212,170,0.10)';
const ABD = 'rgba(0,212,170,0.18)';

const SELLERS = [
  {
    id: 1, handle: '@MarketLaPaz', name: 'Market La Paz', category: 'Moda & Accesorios', viewers: 3247,
    cover: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 101, name: 'Zapatillas Urban Run', price: 'Bs. 280', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 102, name: 'Mochila Explorer 30L', price: 'Bs. 195', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 103, name: 'Gorra Streetwear', price: 'Bs. 85', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
      { id: 104, name: 'Cinturón Cuero Premium', price: 'Bs. 120', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
    ],
  },
  {
    id: 2, handle: '@TechShopCBBA', name: 'Tech Shop CBBA', category: 'Electrónica & Gadgets', viewers: 5821,
    cover: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 201, name: 'Auriculares BT Pro', price: 'Bs. 340', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 202, name: 'Power Bank 20000mAh', price: 'Bs. 210', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 203, name: 'Smartwatch Sport X2', price: 'Bs. 480', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
      { id: 204, name: 'Teclado Mecánico RGB', price: 'Bs. 390', img: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
    ],
  },
  {
    id: 3, handle: '@BeautyBolivia', name: 'Beauty Bolivia', category: 'Belleza & Cuidado', viewers: 2134,
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 301, name: 'Perfume Noche Árabe', price: 'Bs. 150', img: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
      { id: 302, name: 'Set Maquillaje Pro', price: 'Bs. 220', img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 303, name: 'Crema Hidratante K-Beauty', price: 'Bs. 95', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 304, name: 'Sérum Vitamina C', price: 'Bs. 130', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
    ],
  },
  {
    id: 4, handle: '@CocinaFacil', name: 'Cocina Fácil', category: 'Hogar & Cocina', viewers: 1876,
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 401, name: 'Sartén Antiadherente 28cm', price: 'Bs. 175', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 402, name: 'Licuadora 1200W', price: 'Bs. 320', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 403, name: 'Set Cuchillos Chef', price: 'Bs. 240', img: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
      { id: 404, name: 'Freidora de Aire 3.5L', price: 'Bs. 450', img: 'https://images.unsplash.com/photo-1612966809785-1f8ed7e33a3b?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
    ],
  },
  {
    id: 5, handle: '@DeportesTotal', name: 'Deportes Total', category: 'Deportes & Fitness', viewers: 4102,
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 501, name: 'Mancuernas Ajustables 20kg', price: 'Bs. 380', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 502, name: 'Cuerda para Saltar Pro', price: 'Bs. 65', img: 'https://images.unsplash.com/photo-1598289431512-b97b0917afb3?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 503, name: 'Banda Elástica Set x5', price: 'Bs. 90', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
      { id: 504, name: 'Botella Térmica 1L', price: 'Bs. 110', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
    ],
  },
  {
    id: 6, handle: '@LibrosYMas', name: 'Libros y Más', category: 'Libros & Educación', viewers: 987,
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 601, name: 'Pack Desarrollo Personal x3', price: 'Bs. 135', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 602, name: 'Agenda Ejecutiva 2026', price: 'Bs. 75', img: 'https://images.unsplash.com/photo-1518122139490-4b9f6c25b98e?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
      { id: 603, name: 'Marcadores Profesionales', price: 'Bs. 55', img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 604, name: 'Cuaderno Leuchtturm A5', price: 'Bs. 95', img: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
    ],
  },
  {
    id: 7, handle: '@JuguetesKids', name: 'Juguetes Kids', category: 'Juguetes & Niños', viewers: 2650,
    cover: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 701, name: 'LEGO Creator 450 pzs', price: 'Bs. 290', img: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 702, name: 'Auto RC Turbo 4WD', price: 'Bs. 220', img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 703, name: 'Kit Ciencias Experimentos', price: 'Bs. 145', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
      { id: 704, name: 'Muñeca Articulada Deluxe', price: 'Bs. 165', img: 'https://images.unsplash.com/photo-1612404819070-b2cd5e496e5b?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
    ],
  },
  {
    id: 8, handle: '@MascotasFelices', name: 'Mascotas Felices', category: 'Mascotas & Accesorios', viewers: 1430,
    cover: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    flag: '🇧🇴',
    products: [
      { id: 801, name: 'Cama Ortopédica Perro L', price: 'Bs. 195', img: 'https://images.unsplash.com/photo-1601758174493-7a76eeb83b17?w=300&h=220&fit=crop&auto=format', tag: '🔥 Top' },
      { id: 802, name: 'Arnés Antitirones Reflectivo', price: 'Bs. 110', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=220&fit=crop&auto=format', tag: '⚡ Oferta' },
      { id: 803, name: 'Rascador Gato Torre', price: 'Bs. 230', img: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=220&fit=crop&auto=format', tag: '✨ Nuevo' },
      { id: 804, name: 'Comedero Automático Smart', price: 'Bs. 285', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&h=220&fit=crop&auto=format', tag: '💎 Premium' },
    ],
  },
];

const PAYMENT_METHODS = [
  { id: 'yape', label: 'Yape', icon: '📱', desc: 'Pago móvil instantáneo' },
  { id: 'bcp', label: 'BCP', icon: '🏦', desc: 'Transferencia bancaria' },
  { id: 'transfer', label: 'Transferencia', icon: '💸', desc: 'Cualquier banco' },
  { id: 'card', label: 'Tarjeta', icon: '💳', desc: 'Visa / Mastercard' },
];

const LOCKERS = [
  { id: 'centro', name: 'Zona Centro', address: 'Av. 16 de Julio #1420', dist: '0.8 km', slots: 12 },
  { id: 'miraflores', name: 'Miraflores', address: 'Calle Antofagasta #340', dist: '2.1 km', slots: 8 },
  { id: 'sopocachi', name: 'Sopocachi', address: 'Av. 20 de Octubre #2340', dist: '3.4 km', slots: 5 },
  { id: 'calacoto', name: 'Calacoto', address: 'Calle 21 #8765', dist: '5.2 km', slots: 14 },
];

type Product = { id: number; name: string; price: string; img: string; tag: string };
type DigitalKey = { product: Product; seller: string; locker: typeof LOCKERS[0]; casillero: number; purchasedAt: string };
type ClientScreen = 1 | 2 | 3;

function QRCode({ seed = 0 }: { seed?: number }) {
  const base = [
    [1,1,1,1,1,1,1,0,1,0,1,0,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,0,1,1,0,1,1,0,1],
    [0,1,0,0,1,0,0,0,1,1,0,1,1,1,0,0,1,0,0,1,0],
    [1,0,1,0,1,1,1,0,0,1,0,0,1,0,1,0,1,1,0,0,1],
    [0,1,0,1,0,0,0,1,1,0,1,1,0,1,0,1,0,0,1,1,0],
    [1,0,1,0,1,0,1,0,0,1,0,0,1,0,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,1,0,1,0,0,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,0,1,1,0],
    [1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,1,0,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1],
    [1,1,1,1,1,1,1,1,0,1,1,0,1,0,1,1,0,1,0,1,1],
  ];
  const pat = base.map((row, r) => row.map((v, c) => {
    if (r >= 8 && r <= 12 && c >= 8 && c <= 12) return (v + seed + r + c) % 2;
    return v;
  }));
  const cell = 6, size = pat.length * cell + 16;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="#ffffff" rx="8" />
      {pat.map((row, r) => row.map((v, c) => v
        ? <rect key={`${r}-${c}`} x={c * cell + 8} y={r * cell + 8} width={cell - 1} height={cell - 1} fill="#0a1525" rx="1" />
        : null
      ))}
      <rect x={size/2-12} y={size/2-12} width={24} height={24} fill={A} rx="4" />
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="#080f1e" fontSize="11" fontWeight="900" fontFamily="Inter,sans-serif">LB</text>
    </svg>
  );
}

function MapPlaceholder({ locker }: { locker: typeof LOCKERS[0] }) {
  return (
    <div style={{ position: 'relative', background: '#0a1525', borderRadius: '10px', overflow: 'hidden', height: '150px', border: '1px solid #1e3358' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
        {[0,1,2,3,4].map(i => <line key={`h${i}`} x1="0" y1={`${i*25}%`} x2="100%" y2={`${i*25}%`} stroke="#1e3358" strokeWidth="1" />)}
        {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={`${i*17}%`} y1="0" x2={`${i*17}%`} y2="100%" stroke="#1e3358" strokeWidth="1" />)}
        <rect x="0" y="45%" width="100%" height="8%" fill="#122040" />
        <rect x="38%" y="0" width="8%" height="100%" fill="#122040" />
        <circle cx="42%" cy="49%" r="10" fill={A} opacity="0.9" />
        <text x="42%" y="52%" textAnchor="middle" fill="#080f1e" fontSize="12" fontWeight="900">P</text>
      </svg>
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(8,15,30,0.88)', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${A}` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: A }}>📍 {locker.name}</div>
        <div style={{ fontSize: '10px', color: '#adc4de' }}>{locker.address}</div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const router = useRouter();
  const [screen, setScreen] = useState<ClientScreen>(1);
  const [activeSeller, setActiveSeller] = useState<typeof SELLERS[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedLocker, setSelectedLocker] = useState(LOCKERS[0]);
  const [paying, setPaying] = useState(false);
  const [keys, setKeys] = useState<DigitalKey[]>([]);
  const MAX_KEYS = 4;

  const goTo = (s: ClientScreen) => setScreen(s);

  const handleBuy = (p: Product, seller: typeof SELLERS[0]) => {
    setSelectedProduct(p);
    setActiveSeller(seller);
    setSelectedPayment(null);
    goTo(2);
  };

  const handlePay = () => {
    if (!selectedProduct || !selectedPayment || paying) return;
    setPaying(true);
    setTimeout(() => {
      const newKey: DigitalKey = {
        product: selectedProduct,
        seller: activeSeller?.handle ?? '',
        locker: selectedLocker,
        casillero: Math.floor(Math.random() * 60) + 1,
        purchasedAt: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      };
      setKeys(prev => [newKey, ...prev].slice(0, MAX_KEYS));
      setPaying(false);
      goTo(3);
    }, 1800);
  };

  const NavBar = () => (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(8,15,30,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e3358', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', height: '54px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/')} style={{ background: '#0d1a30', border: '1px solid #1e3358', color: '#adc4de', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter',sans-serif", transition: 'border-color 0.2s, color 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3358'; e.currentTarget.style.color = '#adc4de'; }}
        >← Salir</button>
        <div style={{ display: 'flex' }}>
          <div style={{ background: A, color: '#080f1e', fontWeight: 900, fontSize: '13px', padding: '3px 8px', borderRadius: '4px 0 0 4px', lineHeight: 1 }}>LOCK</div>
          <div style={{ background: '#1a3a6b', color: '#fff', fontWeight: 900, fontSize: '13px', padding: '3px 8px', borderRadius: '0 4px 4px 0', lineHeight: 1 }}>BOX</div>
        </div>
        <span style={{ fontSize: '11px', color: '#adc4de', fontWeight: 500, borderLeft: '1px solid #1e3358', paddingLeft: '12px' }}>Vista Cliente</span>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: '#0d1a30', padding: '4px', borderRadius: '8px' }}>
        {([
          [1, '🎥', 'Live Commerce'],
          [2, '💳', 'Checkout Seguro'],
          [3, '🔑', `Mis Llaves${keys.length > 0 ? ` (${keys.length})` : ''}`],
        ] as [ClientScreen, string, string][]).map(([s, ico, label]) => (
          <button key={s} onClick={() => goTo(s)} style={{ background: screen === s ? A : 'transparent', color: screen === s ? '#080f1e' : '#adc4de', border: 'none', borderRadius: '6px', padding: '6px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{ico}</span> {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {keys.length >= MAX_KEYS && (
          <div style={{ fontSize: '10px', color: '#f5a623', fontWeight: 700, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '4px', padding: '3px 8px' }}>
            Máx. {MAX_KEYS} llaves alcanzado
          </div>
        )}
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ABD, border: `2px solid ${A}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1 }}>Mi cuenta</div>
          <div style={{ fontSize: '10px', color: A }}>Comprador</div>
        </div>
      </div>
    </div>
   ); /* ════════ SCREEN 1 — Live Commerce ════════ */
  if (screen === 1) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080f1e', overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 36px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: A, textTransform: 'uppercase', marginBottom: '4px' }}>DESCUBRIMIENTO</div>
            <h1 style={{ fontWeight: 900, fontSize: '26px', color: '#fff', margin: 0 }}>Lives en este momento</h1>
          </div>
          <div style={{ fontSize: '12px', color: '#adc4de', background: '#0d1a30', padding: '6px 14px', border: '1px solid #1e3358', borderRadius: '6px' }}>
            {SELLERS.reduce((a, s) => a + s.viewers, 0).toLocaleString('es-BO')} espectadores en vivo
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {SELLERS.map(seller => (
            <div key={seller.id} onClick={() => setActiveSeller(activeSeller?.id === seller.id ? null : seller)}
              style={{ background: '#0d1a30', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeSeller?.id === seller.id ? A : '#1e3358'}`, transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = activeSeller?.id === seller.id ? A : '#1e3358'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'relative' }}>
                <img src={seller.cover} alt={seller.name} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(8,15,30,0.85))' }} />
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '5px', background: '#e53935', borderRadius: '12px', padding: '3px 8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                  <span style={{ fontWeight: 800, fontSize: '9px', color: '#fff', letterSpacing: '0.1em' }}>EN VIVO</span>
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(8,15,30,0.75)', borderRadius: '10px', padding: '2px 8px', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                  👁 {seller.viewers.toLocaleString('es-BO')}
                </div>
              </div>
              <div style={{ padding: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <img src={seller.avatar} alt={seller.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${A}`, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.handle}</div>
                  <div style={{ fontSize: '10px', color: '#adc4de' }}>{seller.category}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeSeller && (
          <div style={{ background: '#0d1a30', borderRadius: '12px', border: `2px solid ${A}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0 }}>
              <div style={{ position: 'relative' }}>
                <img src={activeSeller.cover} alt={activeSeller.name} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(8,15,30,0.9))' }} />
                <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={activeSeller.avatar} alt={activeSeller.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${A}`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{activeSeller.handle}</div>
                    <div style={{ fontSize: '11px', color: '#dce8f5' }}>{activeSeller.category} · Bolivia {activeSeller.flag}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '28px', background: '#080f1e' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '28px', background: '#080f1e' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '6px' }}>Transmitiendo en</div>
                  <div style={{ fontWeight: 900, fontSize: '20px', color: '#fff' }}>TikTok Live</div>
                </div>
                
                <a href={`https://www.tiktok.com/${activeSeller.handle}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#010101', borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', border: '2px solid #2a2a2a', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = A)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" fill="white"/></svg>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Ir al Live en TikTok</span>
                  <span style={{ fontSize: '12px', color: '#adc4de' }}>↗</span>
                </a>
              </div>
                
              </div>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #1e3358' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Productos disponibles</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {activeSeller.products.map(p => {
                  const full = keys.length >= MAX_KEYS;
                  return (
                    <div key={p.id} style={{ background: '#0a1525', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e3358' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={p.img} alt={p.name} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(8,15,30,0.82)', borderRadius: '3px', padding: '2px 6px', fontSize: '9px', fontWeight: 700, color: '#fff' }}>{p.tag}</div>
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#dce8f5', marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: A, marginBottom: '8px' }}>{p.price}</div>
                        <button onClick={() => !full && handleBuy(p, activeSeller)} disabled={full} style={{ width: '100%', background: full ? '#1e3358' : A, border: 'none', borderRadius: '6px', color: full ? '#adc4de' : '#080f1e', fontWeight: 700, fontSize: '11px', padding: '8px', cursor: full ? 'not-allowed' : 'pointer' }}>
                          {full ? 'Sin espacio' : 'Comprar Seguro'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════ SCREEN 2 — Checkout ════════ */
  if (screen === 2 && selectedProduct) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080f1e', overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 36px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: A, textTransform: 'uppercase', marginBottom: '4px' }}>PAGO ESCROW</div>
          <h1 style={{ fontWeight: 900, fontSize: '26px', color: '#fff', margin: 0 }}>Checkout Seguro</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#0d1a30', borderRadius: '12px', padding: '18px', border: '1px solid #1e3358' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '12px' }}>Resumen del pedido</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                <img src={selectedProduct.img} alt={selectedProduct.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '3px' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: '11px', color: '#adc4de', marginBottom: '3px' }}>Vendedor: {activeSeller?.handle}</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: A }}>{selectedProduct.price}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#0d1a30', borderRadius: '12px', padding: '18px', border: '1px solid #1e3358' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '12px' }}>Smart Locker más cercano</div>
              <MapPlaceholder locker={selectedLocker} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {LOCKERS.map(loc => (
                  <div key={loc.id} onClick={() => setSelectedLocker(loc)} style={{ padding: '10px 12px', borderRadius: '7px', border: `1px solid ${selectedLocker.id === loc.id ? A : '#1e3358'}`, background: selectedLocker.id === loc.id ? AD : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: `2px solid ${selectedLocker.id === loc.id ? A : '#1e3358'}`, background: selectedLocker.id === loc.id ? A : 'transparent' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: selectedLocker.id === loc.id ? A : '#dce8f5' }}>{loc.name}</div>
                        <div style={{ fontSize: '10px', color: '#adc4de' }}>{loc.address}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#0d1a30', borderRadius: '12px', padding: '18px', border: '1px solid #1e3358' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: '#adc4de', textTransform: 'uppercase', marginBottom: '14px' }}>Método de pago</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {PAYMENT_METHODS.map(m => (
                  <div key={m.id} onClick={() => setSelectedPayment(m.id)} style={{ padding: '11px 12px', borderRadius: '8px', border: `2px solid ${selectedPayment === m.id ? A : '#1e3358'}`, background: selectedPayment === m.id ? AD : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: selectedPayment === m.id ? A : '#dce8f5' }}>{m.icon} {m.label}</div>
                      <div style={{ fontSize: '9px', color: '#adc4de' }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handlePay} disabled={!selectedPayment || paying} style={{ width: '100%', background: (!selectedPayment || paying) ? '#0a6655' : A, border: 'none', borderRadius: '8px', color: '#080f1e', fontWeight: 800, fontSize: '14px', padding: '15px', cursor: (!selectedPayment || paying) ? 'not-allowed' : 'pointer' }}>
                {paying ? '⏳ Procesando pago seguro...' : '🔑 Pagar y Generar Llave QR'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════ SCREEN 3 — Mis Llaves ════════ */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080f1e', overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 36px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: A, textTransform: 'uppercase', marginBottom: '4px' }}>RETIRO EN CASILLERO</div>
            <h1 style={{ fontWeight: 900, fontSize: '26px', color: '#fff', margin: 0 }}>Mis Llaves Digitales</h1>
          </div>
          {keys.length < MAX_KEYS && (
            <button onClick={() => goTo(1)} style={{ background: AD, border: `1px solid ${A}`, borderRadius: '8px', color: A, fontWeight: 700, fontSize: '12px', padding: '10px 20px', cursor: 'pointer' }}>
              + Comprar otro producto
            </button>
          )}
        </div>

        {keys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#0d1a30', borderRadius: '12px', border: '1px dashed #1e3358' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔑</div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#adc4de', marginBottom: '8px' }}>Aún no tienes llaves digitales</div>
            <button onClick={() => goTo(1)} style={{ background: A, border: 'none', borderRadius: '8px', color: '#080f1e', fontWeight: 700, fontSize: '13px', padding: '13px 32px', cursor: 'pointer', marginTop: '10px' }}>Ver Lives</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: keys.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
            {keys.map((key, idx) => (
              <div key={idx} style={{ background: '#0d1a30', borderRadius: '14px', border: `2px solid ${A}`, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #0a2018, #0a1a30)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3358' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: '2px' }}>Llave #{idx + 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{key.product.name}</div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f5a623' }}>En espera</div>
                </div>
                <div style={{ padding: '18px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, padding: '10px', background: '#fff', borderRadius: '10px', boxShadow: `0 0 0 3px ${ABD}` }}>
                    <QRCode seed={idx + key.product.id} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#080f1e', borderRadius: '8px', padding: '10px' }}>
                      <img src={key.product.img} alt={key.product.name} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#dce8f5' }}>{key.product.name}</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: A }}>{key.product.price}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>📍 {key.locker.name} - Casillero #{key.casillero}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}