'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowLeftRight, ArrowUpRight, CreditCard, Eye, Flame, Gem, KeyRound, Landmark, LoaderCircle, MapPin, Smartphone, Sparkles, Tag, UserRound, Video, Zap, type LucideIcon } from 'lucide-react';
import { DecorativeIcon } from '@/components/ui/DecorativeIcon';

/* ─── constants ─── */

const SELLERS = [
  {
    id: '8fa90f54-3066-499f-944b-be2d34f9c435', handle: '@MarketLaPaz', name: 'Market La Paz', category: 'Moda & Accesorios', viewers: 3247,
    cover: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format',
    country: 'Bolivia',
    products: [
      { id: '10100000-0000-4000-a000-000000000101', name: 'Zapatillas Urban Run', price: 'Bs. 280', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=220&fit=crop&auto=format', tag: 'Oferta' },
      { id: '10200000-0000-4000-a000-000000000102', name: 'Mochila Explorer 30L', price: 'Bs. 195', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=220&fit=crop&auto=format', tag: 'Top' },
      { id: '10300000-0000-4000-a000-000000000103', name: 'Gorra Streetwear', price: 'Bs. 85', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=220&fit=crop&auto=format', tag: 'Nuevo' },
      { id: '10400000-0000-4000-a000-000000000104', name: 'Cinturón Cuero Premium', price: 'Bs. 120', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&h=220&fit=crop&auto=format', tag: 'Premium' },
    ],
  },
  {
    id: 'a57d7915-ce30-4a2c-8127-fa61af87ba2e', handle: '@TechShopCBBA', name: 'Tech Shop CBBA', category: 'Electrónica & Gadgets', viewers: 5821,
    cover: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    country: 'Bolivia',
    products: [
      { id: '20100000-0000-4000-a000-000000000201', name: 'Auriculares BT Pro', price: 'Bs. 340', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=220&fit=crop&auto=format', tag: 'Top' },
      { id: '20200000-0000-4000-a000-000000000202', name: 'Power Bank 20000mAh', price: 'Bs. 210', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=220&fit=crop&auto=format', tag: 'Oferta' },
      { id: '20300000-0000-4000-a000-000000000203', name: 'Smartwatch Sport X2', price: 'Bs. 480', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=220&fit=crop&auto=format', tag: 'Nuevo' },
      { id: '20400000-0000-4000-a000-000000000204', name: 'Teclado Mecánico RGB', price: 'Bs. 390', img: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=220&fit=crop&auto=format', tag: 'Premium' },
    ],
  },
  {
    id: '5b40796d-56e0-4bd5-a08b-82d724283371', handle: '@BeautyBolivia', name: 'Beauty Bolivia', category: 'Belleza & Cuidado', viewers: 2134,
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&auto=format',
    country: 'Bolivia',
    products: [
      { id: '30100000-0000-4000-a000-000000000301', name: 'Perfume Noche Árabe', price: 'Bs. 150', img: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=300&h=220&fit=crop&auto=format', tag: 'Premium' },
      { id: '30200000-0000-4000-a000-000000000302', name: 'Set Maquillaje Pro', price: 'Bs. 220', img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=220&fit=crop&auto=format', tag: 'Top' },
      { id: '30300000-0000-4000-a000-000000000303', name: 'Crema Hidratante K-Beauty', price: 'Bs. 95', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=220&fit=crop&auto=format', tag: 'Oferta' },
      { id: '30400000-0000-4000-a000-000000000304', name: 'Sérum Vitamina C', price: 'Bs. 130', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=220&fit=crop&auto=format', tag: 'Nuevo' },
    ],
  },
  {
    id: '806a9ff7-b65d-4de9-91d6-1ec32f2b2573', handle: '@CocinaFacil', name: 'Cocina Fácil', category: 'Hogar & Cocina', viewers: 1876,
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=480&h=280&fit=crop&auto=format',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format',
    country: 'Bolivia',
    products: [
      { id: '40100000-0000-4000-a000-000000000401', name: 'Sartén Antiadherente 28cm', price: 'Bs. 175', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&h=220&fit=crop&auto=format', tag: 'Oferta' },
      { id: '40200000-0000-4000-a000-000000000402', name: 'Licuadora 1200W', price: 'Bs. 320', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=300&h=220&fit=crop&auto=format', tag: 'Top' },
      { id: '40300000-0000-4000-a000-000000000403', name: 'Set Cuchillos Chef', price: 'Bs. 240', img: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=300&h=220&fit=crop&auto=format', tag: 'Premium' },
      { id: '40400000-0000-4000-a000-000000000404', name: 'Freidora de Aire 3.5L', price: 'Bs. 450', img: 'https://images.unsplash.com/photo-1612966809785-1f8ed7e33a3b?w=300&h=220&fit=crop&auto=format', tag: 'Nuevo' },
    ],
  }
];

const PAYMENT_METHODS = [
  { id: 'yape', label: 'Yape', icon: Smartphone, desc: 'Pago móvil instantáneo' },
  { id: 'bcp', label: 'BCP', icon: Landmark, desc: 'Transferencia bancaria' },
  { id: 'transfer', label: 'Transferencia', icon: ArrowLeftRight, desc: 'Cualquier banco' },
  { id: 'card', label: 'Tarjeta', icon: CreditCard, desc: 'Visa / Mastercard' },
];

const INITIAL_LOCKERS = [
  { id: 'centro', name: 'Zona Centro', address: 'Av. 16 de Julio #1420', dist: '0.8 km', slots: 12 },
  { id: 'miraflores', name: 'Miraflores', address: 'Calle Antofagasta #340', dist: '2.1 km', slots: 8 },
  { id: 'sopocachi', name: 'Sopocachi', address: 'Av. 20 de Octubre #2340', dist: '3.4 km', slots: 5 },
  { id: 'calacoto', name: 'Calacoto', address: 'Calle 21 #8765', dist: '5.2 km', slots: 14 },
];

type Product = { id: string; name: string; price: string; img: string; tag: string };
type DigitalKey = { product: Product; seller: string; locker: typeof INITIAL_LOCKERS[0]; casillero: number; purchasedAt: string; qrToken?: string; orderId?: string };
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
      <rect width={size} height={size} fill="var(--color-white)" rx="8" />
      {pat.map((row, r) => row.map((v, c) => v
        ? <rect key={`${r}-${c}`} x={c * cell + 8} y={r * cell + 8} width={cell - 1} height={cell - 1} fill="var(--color-surface)" rx="1" />
        : null
      ))}
      <rect x={size/2-12} y={size/2-12} width={24} height={24} fill={'var(--color-accent)'} rx="4" />
      <text x={size/2} y={size/2+5} textAnchor="middle" fill="var(--color-surface-deep)" fontSize="11" fontWeight="900" fontFamily="Inter,sans-serif">LB</text>
    </svg>
  );
}

function MapPlaceholder({ locker }: { locker: typeof INITIAL_LOCKERS[0] }) {
  return (
    <div style={{ position: 'relative', background: 'var(--color-surface)', borderRadius: '10px', overflow: 'hidden', height: '150px', border: '1px solid var(--color-border-strong)' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
        {[0,1,2,3,4].map(i => <line key={`h${i}`} x1="0" y1={`${i*25}%`} x2="100%" y2={`${i*25}%`} stroke="var(--color-border-strong)" strokeWidth="1" />)}
        {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={`${i*17}%`} y1="0" x2={`${i*17}%`} y2="100%" stroke="var(--color-border-strong)" strokeWidth="1" />)}
        <rect x="0" y="45%" width="100%" height="8%" fill="var(--color-surface-hover)" />
        <rect x="38%" y="0" width="8%" height="100%" fill="var(--color-surface-hover)" />
        <circle cx="42%" cy="49%" r="10" fill={'var(--color-accent)'} opacity="0.9" />
        <text x="42%" y="52%" textAnchor="middle" fill="var(--color-surface-deep)" fontSize="12" fontWeight="900">P</text>
      </svg>
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'var(--color-surface-deep-glass)', padding: '4px 10px', borderRadius: '4px', border: `1px solid var(--color-accent)` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}><DecorativeIcon icon={MapPin} size={12} /> {locker.name}</div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{locker.address}</div>
      </div>
    </div>
  );
}

const PRODUCT_TAG_ICONS: Record<string, LucideIcon> = {
  Oferta: Zap,
  Top: Flame,
  Nuevo: Sparkles,
  Premium: Gem,
};

function ProductTag({ label }: { label: string }) {
  return <><DecorativeIcon icon={PRODUCT_TAG_ICONS[label] ?? Tag} size={11} /> {label}</>;
}

function BuyerNavBar({ screen, keyCount, maxKeys, onExit, onNavigate }: {
  screen: ClientScreen;
  keyCount: number;
  maxKeys: number;
  onExit: () => void;
  onNavigate: (screen: ClientScreen) => void;
}) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface-deep-opaque)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', height: '54px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onExit} style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-secondary)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter',sans-serif", transition: 'border-color 0.2s, color 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-white)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        ><DecorativeIcon icon={ArrowLeft} size={14} /> Salir</button>
        <div style={{ display: 'flex' }}>
          <div style={{ background: 'var(--color-accent)', color: 'var(--color-surface-deep)', fontWeight: 900, fontSize: '13px', padding: '3px 8px', borderRadius: '4px 0 0 4px', lineHeight: 1 }}>LOCK</div>
          <div style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-white)', fontWeight: 900, fontSize: '13px', padding: '3px 8px', borderRadius: '0 4px 4px 0', lineHeight: 1 }}>BOX</div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500, borderLeft: '1px solid var(--color-border-strong)', paddingLeft: '12px' }}>Vista Cliente</span>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-raised)', padding: '4px', borderRadius: '8px' }}>
        {([
          [1, Video, 'Live Commerce'],
          [2, CreditCard, 'Checkout Seguro'],
          [3, KeyRound, `Mis Llaves${keyCount > 0 ? ` (${keyCount})` : ''}`],
        ] as [ClientScreen, LucideIcon, string][]).map(([s, ico, label]) => (
          <button key={s} onClick={() => onNavigate(s)} style={{ background: screen === s ? 'var(--color-accent)' : 'transparent', color: screen === s ? 'var(--color-surface-deep)' : 'var(--color-text-secondary)', border: 'none', borderRadius: '6px', padding: '6px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DecorativeIcon icon={ico} size={16} /> {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {keyCount >= maxKeys && (
          <div style={{ fontSize: '10px', color: 'var(--color-warning-strong)', fontWeight: 700, background: 'var(--color-warning-strong-subtle)', border: '1px solid var(--color-warning-strong-border)', borderRadius: '4px', padding: '3px 8px' }}>
            Máx. {maxKeys} llaves alcanzado
          </div>
        )}
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-muted)', border: `2px solid var(--color-accent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}><DecorativeIcon icon={UserRound} size={18} /></div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-white)', lineHeight: 1 }}>Mi cuenta</div>
          <div style={{ fontSize: '10px', color: 'var(--color-accent)' }}>Comprador</div>
        </div>
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
  const [lockers, setLockers] = useState(INITIAL_LOCKERS);
  const [selectedLocker, setSelectedLocker] = useState(INITIAL_LOCKERS[0]);
  const [paying, setPaying] = useState(false);
  const [keys, setKeys] = useState<DigitalKey[]>([]);
  const MAX_KEYS = 4;

  useEffect(() => {
    // Espacio reservado: aquí llamaremos a la DB de Supabase para traer los 10 puntos de La Paz
    // fetch('http://localhost:4000/lockbox-points')
  }, []);

  const goTo = (s: ClientScreen) => setScreen(s);

  const handleBuy = (p: Product, seller: typeof SELLERS[0]) => {
    setSelectedProduct(p);
    setActiveSeller(seller);
    setSelectedPayment(null);
    goTo(2);
  };

  const handlePay = async () => {
    if (!selectedProduct || !selectedPayment || paying) return;
    setPaying(true);
    
    try {
      const numericPrice = parseFloat(selectedProduct.price.replace('Bs. ', '').trim());

      const response = await fetch('http://localhost:4000/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // UUID real (usamos el perfil de MarketLaPaz temporalmente como comprador)
          buyer_id: "8fa90f54-3066-499f-944b-be2d34f9c435", 
          
          // Datos 100% dinámicos sacados de tu arreglo SELLERS actualizado
          seller_id: activeSeller?.id,
          product_id: selectedProduct.id,
          
          // UUID real de tu tabla lockbox_points (el que ya usaste ayer)
          lockbox_id: "089c131b-8e59-43b1-b21b-5ab0b03c21c7", 
          
          quantity: 1,
          unit_price: numericPrice
        })
      });

      if (!response.ok) {
        throw new Error("Fallo en la comunicación con el servidor");
      }
      
      const backendData = await response.json();

      const newKey: DigitalKey = {
        product: selectedProduct,
        seller: activeSeller?.handle ?? '',
        locker: selectedLocker,
        casillero: Math.floor(Math.random() * 60) + 1,
        purchasedAt: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        qrToken: backendData.qr_code,
        orderId: backendData.order_id
      };

      setKeys(prev => [newKey, ...prev].slice(0, MAX_KEYS));
      goTo(3);

    } catch (error) {
      console.error("Fallo al procesar el checkout:", error);
      alert("Hubo un problema procesando tu pago.");
    } finally {
      setPaying(false);
    }
  };

  /* ════════ SCREEN 1 — Live Commerce ════════ */
  if (screen === 1) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--color-surface-deep)', overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
      <BuyerNavBar screen={screen} keyCount={keys.length} maxKeys={MAX_KEYS} onExit={() => router.push('/')} onNavigate={goTo} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 36px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>DESCUBRIMIENTO</div>
            <h1 style={{ fontWeight: 900, fontSize: '26px', color: 'var(--color-white)', margin: 0 }}>Lives en este momento</h1>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)', padding: '6px 14px', border: '1px solid var(--color-border-strong)', borderRadius: '6px' }}>
            {SELLERS.reduce((a, s) => a + s.viewers, 0).toLocaleString('es-BO')} espectadores en vivo
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {SELLERS.map(seller => (
            <div key={seller.id} onClick={() => setActiveSeller(activeSeller?.id === seller.id ? null : seller)}
              style={{ background: 'var(--color-surface-raised)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeSeller?.id === seller.id ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = activeSeller?.id === seller.id ? 'var(--color-accent)' : 'var(--color-border-strong)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'relative' }}>
                <img src={seller.cover} alt={seller.name} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, var(--color-surface-deep-glass))' }} />
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--color-danger-strong)', borderRadius: '12px', padding: '3px 8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-white)' }} />
                  <span style={{ fontWeight: 800, fontSize: '9px', color: 'var(--color-white)', letterSpacing: '0.1em' }}>EN VIVO</span>
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--color-surface-deep-glass)', borderRadius: '10px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-white)', fontWeight: 600 }}>
                  <DecorativeIcon icon={Eye} size={12} /> {seller.viewers.toLocaleString('es-BO')}
                </div>
              </div>
              <div style={{ padding: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <img src={seller.avatar} alt={seller.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid var(--color-accent)`, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.handle}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{seller.category}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeSeller && (
          <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', border: `2px solid var(--color-accent)`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0 }}>
              <div style={{ position: 'relative' }}>
                <img src={activeSeller.cover} alt={activeSeller.name} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, var(--color-surface-deep-glass))' }} />
                <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={activeSeller.avatar} alt={activeSeller.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `3px solid var(--color-accent)`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-white)' }}>{activeSeller.handle}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground)' }}>{activeSeller.category} · <DecorativeIcon icon={MapPin} size={12} /> {activeSeller.country}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '28px', background: 'var(--color-surface-deep)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.2em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Transmitiendo en</div>
                  <div style={{ fontWeight: 900, fontSize: '20px', color: 'var(--color-white)' }}>TikTok Live</div>
                </div>
                
                <a href={`https://www.tiktok.com/${activeSeller.handle}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--color-black)', borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', border: '2px solid var(--color-border-strong)', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" fill="var(--color-white)"/></svg>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-white)' }}>Ir al Live en TikTok</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}><DecorativeIcon icon={ArrowUpRight} size={12} /></span>
                </a>
              </div>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--color-border-strong)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-white)' }}>Productos disponibles</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {activeSeller.products.map(p => {
                  const full = keys.length >= MAX_KEYS;
                  return (
                    <div key={p.id} style={{ background: 'var(--color-surface)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border-strong)' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={p.img} alt={p.name} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'var(--color-surface-deep-glass)', borderRadius: '3px', padding: '2px 6px', fontSize: '9px', fontWeight: 700, color: 'var(--color-white)' }}><ProductTag label={p.tag} /></div>
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--color-accent)', marginBottom: '8px' }}>{p.price}</div>
                        <button onClick={() => !full && handleBuy(p, activeSeller)} disabled={full} style={{ width: '100%', background: full ? 'var(--color-border-strong)' : 'var(--color-accent)', border: 'none', borderRadius: '6px', color: full ? 'var(--color-text-secondary)' : 'var(--color-surface-deep)', fontWeight: 700, fontSize: '11px', padding: '8px', cursor: full ? 'not-allowed' : 'pointer' }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--color-surface-deep)', overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
      <BuyerNavBar screen={screen} keyCount={keys.length} maxKeys={MAX_KEYS} onExit={() => router.push('/')} onNavigate={goTo} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 36px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>PAGO ESCROW</div>
          <h1 style={{ fontWeight: 900, fontSize: '26px', color: 'var(--color-white)', margin: 0 }}>Checkout Seguro</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: '18px', border: '1px solid var(--color-border-strong)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>Resumen del pedido</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                <img src={selectedProduct.img} alt={selectedProduct.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-white)', marginBottom: '3px' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>Vendedor: {activeSeller?.handle}</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: 'var(--color-accent)' }}>{selectedProduct.price}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: '18px', border: '1px solid var(--color-border-strong)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>Smart Locker más cercano</div>
              <MapPlaceholder locker={selectedLocker} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {lockers.map(loc => (
                  <div key={loc.id} onClick={() => setSelectedLocker(loc)} style={{ padding: '10px 12px', borderRadius: '7px', border: `1px solid ${selectedLocker.id === loc.id ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: selectedLocker.id === loc.id ? 'var(--color-accent-soft)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: `2px solid ${selectedLocker.id === loc.id ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: selectedLocker.id === loc.id ? 'var(--color-accent)' : 'transparent' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: selectedLocker.id === loc.id ? 'var(--color-accent)' : 'var(--color-foreground)' }}>{loc.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{loc.address}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: '18px', border: '1px solid var(--color-border-strong)' }}>
              <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '14px' }}>Método de pago</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {PAYMENT_METHODS.map(m => (
                  <div key={m.id} onClick={() => setSelectedPayment(m.id)} style={{ padding: '11px 12px', borderRadius: '8px', border: `2px solid ${selectedPayment === m.id ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: selectedPayment === m.id ? 'var(--color-accent-soft)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: selectedPayment === m.id ? 'var(--color-accent)' : 'var(--color-foreground)' }}><DecorativeIcon icon={m.icon} size={16} /> {m.label}</div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handlePay} disabled={!selectedPayment || paying} style={{ width: '100%', background: (!selectedPayment || paying) ? 'var(--color-success-surface)' : 'var(--color-accent)', border: 'none', borderRadius: '8px', color: 'var(--color-surface-deep)', fontWeight: 800, fontSize: '14px', padding: '15px', cursor: (!selectedPayment || paying) ? 'not-allowed' : 'pointer' }}>
                {paying ? (
                  <><DecorativeIcon icon={LoaderCircle} size={18} className="motion-safe:animate-spin" /> Procesando pago seguro...</>
                ) : (
                  <><DecorativeIcon icon={KeyRound} size={18} /> Pagar y Generar Llave QR</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════ SCREEN 3 — Mis Llaves ════════ */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--color-surface-deep)', overflowY: 'auto', fontFamily: "'Inter',sans-serif" }}>
      <BuyerNavBar screen={screen} keyCount={keys.length} maxKeys={MAX_KEYS} onExit={() => router.push('/')} onNavigate={goTo} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 36px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.35em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>RETIRO EN CASILLERO</div>
            <h1 style={{ fontWeight: 900, fontSize: '26px', color: 'var(--color-white)', margin: 0 }}>Mis Llaves Digitales</h1>
          </div>
          {keys.length < MAX_KEYS && (
            <button onClick={() => goTo(1)} style={{ background: 'var(--color-accent-soft)', border: `1px solid var(--color-accent)`, borderRadius: '8px', color: 'var(--color-accent)', fontWeight: 700, fontSize: '12px', padding: '10px 20px', cursor: 'pointer' }}>
              + Comprar otro producto
            </button>
          )}
        </div>

        {keys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--color-surface-raised)', borderRadius: '12px', border: '1px dashed var(--color-border-strong)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}><DecorativeIcon icon={KeyRound} size={56} className="text-accent" /></div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Aún no tienes llaves digitales</div>
            <button onClick={() => goTo(1)} style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '8px', color: 'var(--color-surface-deep)', fontWeight: 700, fontSize: '13px', padding: '13px 32px', cursor: 'pointer', marginTop: '10px' }}>Ver Lives</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: keys.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
            {keys.map((key, idx) => (
              <div key={idx} style={{ background: 'var(--color-surface-raised)', borderRadius: '14px', border: `2px solid var(--color-accent)`, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--color-success-surface), var(--color-surface-raised))', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-strong)' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '2px' }}>Llave #{idx + 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-white)' }}>{key.product.name}</div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning-strong)' }}>En espera</div>
                </div>
                <div style={{ padding: '18px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, padding: '10px', background: 'var(--color-white)', borderRadius: '10px', boxShadow: `0 0 0 3px var(--color-accent-muted)` }}>
                    <QRCode seed={key.casillero} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--color-surface-deep)', borderRadius: '8px', padding: '10px' }}>
                      <img src={key.product.img} alt={key.product.name} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-foreground)' }}>{key.product.name}</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--color-accent)' }}>{key.product.price}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-white)' }}><DecorativeIcon icon={MapPin} size={12} /> {key.locker.name} - Casillero #{key.casillero}</div>
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