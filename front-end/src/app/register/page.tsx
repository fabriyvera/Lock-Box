'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Store } from 'lucide-react';
import { DecorativeIcon } from '@/components/ui/DecorativeIcon';

type Role = 'comprador' | 'vendedor';

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('vendedor');
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correo: '',
    celular: '',
    tiendaTiktok: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    console.log('Datos de registro:', { role, ...formData });
    alert(`¡Cuenta de ${role} creada con éxito!`);
  };

  return (
    <div className="min-h-screen bg-canvas text-white flex flex-col">
      {/* Barra de navegación superior */}
      <header className="border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="bg-accent text-black font-black px-2 py-1 text-sm rounded-l">LOCK</span>
          <span className="bg-surface-deep border border-border text-white font-bold px-2 py-1 text-sm rounded-r tracking-wider">BOX</span>
        </div>
        <Link href="/" className="text-sm text-text-muted hover:text-accent transition-colors">
          <DecorativeIcon icon={ArrowLeft} size={16} /> Volver al inicio
        </Link>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 py-10 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-accent font-mono text-xs tracking-wider mb-2">
            <span className="w-6 h-[1px] bg-accent"></span>
            SECCIÓN DE REGISTRO
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-wide uppercase mb-2">
            REGISTRO
          </h1>
          <p className="text-text-muted text-sm">
            Elige tu rol en la plataforma y empieza a operar con seguridad desde el primer día.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Izquierda: Selector de Roles y Beneficios */}
          <div className="lg:col-span-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setRole('comprador')}
                className={`cursor-pointer p-5 rounded-lg border transition-all duration-300 relative ${
                  role === 'comprador'
                    ? 'border-accent bg-surface'
                    : 'border-border bg-surface-deep hover:border-border-strong'
                }`}
              >
                <div className="text-2xl mb-2"><DecorativeIcon icon={ShoppingCart} size={28} className="text-accent" /></div>
                <h3 className="font-bold text-base mb-1 text-white">Comprador</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Compra en lives de TikTok con pago protegido y recoge en un Punto LockBox cercano.
                </p>
              </div>

              <div
                onClick={() => setRole('vendedor')}
                className={`cursor-pointer p-5 rounded-lg border transition-all duration-300 relative ${
                  role === 'vendedor'
                    ? 'border-accent bg-surface'
                    : 'border-border bg-surface-deep hover:border-border-strong'
                }`}
              >
                <div className="text-2xl mb-2"><DecorativeIcon icon={Store} size={28} className="text-accent" /></div>
                <h3 className="font-bold text-base mb-1 text-white">Vendedor</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Vende durante tus lives con catálogo integrado y recibe pagos seguros en 48 horas.
                </p>
              </div>
            </div>

            {/* Caja de Beneficios */}
            <div className="p-5 rounded-lg border border-border/60 bg-surface-deep/50">
              <h4 className="text-xs font-bold tracking-wider text-accent uppercase mb-3">
                Beneficios para {role === 'comprador' ? 'compradores' : 'vendedores'}
              </h4>
              <ul className="space-y-2 text-xs md:text-sm text-text-secondary">
                {role === 'comprador' ? (
                  <>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Pago 100% protegido hasta recibir tu pedido</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Red de puntos de entrega en tu ciudad</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Devolución garantizada si el producto no llega</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Sin comisión adicional para compradores</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Catálogo integrado en TikTok Live</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Pago garantizado antes de entregar</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Liquidación a Yape/BCP en 48 horas</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-sm"></span> Red logística sin costo de repartidor</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Derecha: Formulario con el borde izquierdo estilo Login */}
          <div className="lg:col-span-7 bg-surface-deep border border-border rounded-xl p-6 md:p-8 relative shadow-2xl overflow-hidden">
            {/* Barra lateral verde distintiva idéntica al diseño del Login */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>

            <div className="mb-5 pl-2">
              <span className="text-xs text-text-muted">Registrándote como</span>
              <h3 className="text-base font-bold text-accent capitalize">{role}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pl-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  placeholder="Ej. María Gonzáles"
                  className="w-full bg-canvas border border-border rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="tucorreo@gmail.com"
                  className="w-full bg-canvas border border-border rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-canvas border border-border rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-canvas border border-border rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Número de Celular
                  </label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    placeholder="+591 7xx-xxxxx"
                    className="w-full bg-canvas border border-border rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
              </div>

              {role === 'vendedor' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    Tienda en TikTok
                  </label>
                  <input
                    type="text"
                    name="tiendaTiktok"
                    value={formData.tiendaTiktok}
                    onChange={handleChange}
                    placeholder="@mitienda"
                    className="w-full bg-canvas border border-border rounded-md px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 bg-accent hover:bg-accent-hover text-black font-bold py-3 px-6 rounded-md transition-all uppercase tracking-wider text-sm shadow-lg cursor-pointer"
              >
                Crear mi cuenta de {role}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-text-muted">¿Ya tienes una cuenta? </span>
                <Link href="/login" className="text-xs text-accent hover:underline font-semibold">
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}