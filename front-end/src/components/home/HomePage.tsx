"use client";

/* Public links use document navigation, including before router hydration. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CreditCard,
  LockKeyhole,
  MapPin,
  Menu,
  PackageCheck,
  QrCode,
  ShoppingBag,
  Store,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import RegistrationForm from "@/components/auth/RegistrationForm";
import type { AccountRole } from "@/lib/auth/account";
import styles from "./home.module.css";

const navigation = [
  ["inicio", "Inicio"],
  ["nosotros", "Nosotros"],
  ["servicios", "Servicios"],
  ["planes", "Planes"],
  ["registro", "Registro"],
  ["contacto", "Contacto"],
] as const;

const steps = [
  {
    icon: Video,
    title: "Elige en el live",
    text: "Encuentra el producto en el catálogo que comparte el vendedor durante su transmisión.",
  },
  {
    icon: CreditCard,
    title: "Paga con respaldo",
    text: "El pago queda en garantía mientras el vendedor prepara y despacha tu pedido.",
  },
  {
    icon: Store,
    title: "Recoge en una tienda aliada",
    text: "El vendedor deja el paquete en el Punto LockBox que elegiste para el retiro.",
  },
  {
    icon: QrCode,
    title: "Confirma con tu QR",
    text: "Presenta el código en el punto. La entrega queda registrada y habilita la liquidación al vendedor.",
  },
];

const values = [
  {
    icon: LockKeyhole,
    title: "Pago en garantía",
    text: "El pago acompaña al pedido hasta confirmar la entrega.",
  },
  {
    icon: Store,
    title: "Tiendas aliadas",
    text: "Puntos físicos para entregar y recoger tus compras.",
  },
  {
    icon: QrCode,
    title: "Retiro verificado",
    text: "Un código identifica tu pedido en el punto de recojo.",
  },
  {
    icon: Users,
    title: "Una red conectada",
    text: "Compradores, vendedores y puntos comparten el estado del pedido.",
  },
];

const services = [
  {
    icon: ShoppingBag,
    title: "Compra desde el catálogo",
    text: "Consulta productos, prepara tu carrito y elige dónde recoger tu compra.",
    audience: "Para compradores",
  },
  {
    icon: PackageCheck,
    title: "Sigue cada entrega",
    text: "Revisa si tu pedido fue despachado, recibido o está listo para retirar.",
    audience: "Para compradores",
  },
  {
    icon: Video,
    title: "Prepara tus ventas en vivo",
    text: "Organiza tus productos y el catálogo que acompaña a tu transmisión.",
    audience: "Para vendedores",
  },
  {
    icon: Wallet,
    title: "Controla tus ventas",
    text: "Consulta pedidos, comisiones y saldo desde tu panel.",
    audience: "Para vendedores",
  },
  {
    icon: Store,
    title: "Gestiona tu punto",
    text: "Controla la capacidad, la recepción de paquetes y el historial de retiros.",
    audience: "Para tiendas aliadas",
  },
  {
    icon: QrCode,
    title: "Valida con un código",
    text: "Consulta el pedido y confirma su entrega al comprador.",
    audience: "Para tiendas aliadas",
  },
];

const roles = [
  {
    role: "comprador",
    icon: ShoppingBag,
    title: "Comprador",
    text: "Encuentra productos, sigue tus pedidos y recoge con QR.",
    link: "Quiero comprar",
  },
  {
    role: "vendedor",
    icon: Store,
    title: "Vendedor",
    text: "Publica tu catálogo y administra tus ventas y despachos.",
    link: "Quiero vender",
  },
  {
    role: "operador_punto",
    icon: MapPin,
    title: "Punto LockBox",
    text: "Afília tu tienda y gestiona la recepción y entrega de paquetes.",
    link: "Quiero afiliar mi tienda",
  },
] as const;

export default function HomePage({ role }: { role: AccountRole | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const track = useRef<HTMLDivElement>(null);

  function moveValues(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({
      left: element.clientWidth * direction,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div className={`home-theme ${styles.page}`}>
      <a className={styles.skipLink} href="#contenido">
        Saltar al contenido
      </a>
      <header className={styles.header}>
        <div className={styles.navBar}>
          <a
            className={styles.logo}
            href="#inicio"
            aria-label="LockBox, inicio"
            translate="no"
          >
            <span className={styles.logoMark}>
              <LockKeyhole size={23} aria-hidden="true" />
            </span>
            Lock<span>Box</span>
          </a>
          <button
            ref={menuButton}
            className={styles.menuButton}
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="home-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav
            id="home-navigation"
            aria-label="Navegación principal"
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMenuOpen(false);
                menuButton.current?.focus();
              }
            }}
          >
            {navigation.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a href="/login" className={styles.loginLink}>
              Iniciar sesión <ArrowRight size={16} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1}>
        <section
          id="inicio"
          className={styles.hero}
          aria-labelledby="hero-title"
        >
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <MapPin size={16} aria-hidden="true" /> Comercio social en La Paz
            </p>
            <h1 id="hero-title">
              Compra en vivo.
              <br />
              Recoge con <span>confianza.</span>
            </h1>
            <p className={styles.heroDescription}>
              Del live a una tienda cerca de ti. Conecta tus compras con pagos
              en garantía y un retiro verificado por QR.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#registro">
                Crear una cuenta <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className={styles.secondary} href="#como-funciona">
                Cómo funciona <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
            <ul
              className={styles.trustList}
              aria-label="Características de LockBox"
            >
              <li>
                <LockKeyhole size={17} aria-hidden="true" /> Pago en garantía
              </li>
              <li>
                <Store size={17} aria-hidden="true" /> Tiendas aliadas
              </li>
              <li>
                <QrCode size={17} aria-hidden="true" /> Retiro con QR
              </li>
            </ul>
          </div>
          <div
            className={styles.journey}
            aria-label="Recorrido de una compra con LockBox"
          >
            <div className={styles.journeyHeader}>
              <span>Tu compra, paso a paso</span>
              <PackageCheck size={24} aria-hidden="true" />
            </div>
            <div className={styles.journeyRoute}>
              <span>
                <Video aria-hidden="true" />
                Live
              </span>
              <ArrowRight aria-hidden="true" />
              <span>
                <Store aria-hidden="true" />
                Punto LockBox
              </span>
              <ArrowRight aria-hidden="true" />
              <span>
                <ShoppingBag aria-hidden="true" />
                Tú
              </span>
            </div>
            <ol className={styles.journeySteps}>
              <li>
                <span className={styles.stepIcon}>
                  <CreditCard size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>Pago en garantía</strong>
                  <p>El pedido comienza con respaldo.</p>
                </div>
                <Check size={18} aria-hidden="true" />
              </li>
              <li>
                <span className={styles.stepIcon}>
                  <PackageCheck size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>Paquete en el punto</strong>
                  <p>La tienda aliada registra su recepción.</p>
                </div>
                <Check size={18} aria-hidden="true" />
              </li>
              <li>
                <span className={styles.stepIcon}>
                  <QrCode size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>Retiro con QR</strong>
                  <p>Confirmas la entrega de tu compra.</p>
                </div>
                <Check size={18} aria-hidden="true" />
              </li>
            </ol>
            <div className={styles.journeyNote}>
              <CircleCheck size={19} aria-hidden="true" /> Un mismo pedido
              conectado de principio a fin.
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className={styles.section}
          aria-labelledby="flow-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>De la pantalla a tus manos</p>
              <h2 id="flow-title">Así funciona LockBox</h2>
            </div>
            <p>Conoce qué ocurre en cada etapa de tu pedido.</p>
          </div>
          <div className={styles.flowGrid}>
            {steps.map(({ icon: Icon, title, text }) => (
              <details className={styles.flowStep} key={title}>
                <summary>
                  <Icon size={22} aria-hidden="true" />
                  <h3>{title}</h3>
                  <ChevronDown size={17} aria-hidden="true" />
                </summary>
                <p>{text}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          id="nosotros"
          className={`${styles.section} ${styles.about}`}
          aria-labelledby="about-title"
        >
          <div className={styles.aboutIntro}>
            <div>
              <p className={styles.eyebrow}>Sobre nosotros</p>
              <h2 id="about-title">
                El comercio digital también necesita un punto de encuentro.
              </h2>
            </div>
            <div>
              <p>
                LockBox conecta las ventas por TikTok Live con una red de
                tiendas aliadas. Cada perfil tiene su espacio para coordinar la
                compra, el despacho y el retiro.
              </p>
              <p>
                Menos coordinación por mensajes. Más claridad sobre dónde está
                tu pedido y cómo recogerlo.
              </p>
            </div>
          </div>
          <div
            className={styles.carouselControls}
            aria-label="Controles de los pilares LockBox"
          >
            <button
              type="button"
              aria-label="Pilar anterior"
              aria-controls="home-values"
              onClick={() => moveValues(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Pilar siguiente"
              aria-controls="home-values"
              onClick={() => moveValues(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <div
            ref={track}
            id="home-values"
            className={styles.values}
            role="region"
            aria-label="Pilares de LockBox"
            tabIndex={0}
          >
            {values.map(({ icon: Icon, title, text }) => (
              <article className={styles.value} key={title}>
                <Icon size={25} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="servicios"
          className={styles.section}
          aria-labelledby="services-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Un espacio para cada perfil</p>
              <h2 id="services-title">Todo el recorrido, conectado</h2>
            </div>
            <p>Herramientas para comprar, vender y administrar un punto.</p>
          </div>
          <div className={styles.serviceGrid}>
            {services.map(({ icon: Icon, title, text, audience }) => (
              <article key={title} className={styles.service}>
                <Icon size={24} aria-hidden="true" />
                <p className={styles.audience}>{audience}</p>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="planes"
          className={styles.section}
          aria-labelledby="plans-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Para tu negocio</p>
              <h2 id="plans-title">Elige cómo empezar a vender</h2>
            </div>
            <p>Consulta las condiciones de cada plan desde tu cuenta.</p>
          </div>
          <div className={styles.plans}>
            <article className={styles.plan}>
              <p className={styles.eyebrow}>Plan Emprende</p>
              <h3>Empieza gratis</h3>
              <p className={styles.rate}>
                5%–8% <span>de comisión por venta</span>
              </p>
              <ul>
                {[
                  "Acceso a la red de Puntos LockBox",
                  "Liquidación en 48 horas",
                  "Pago en garantía",
                  "Catálogo para tus ventas en vivo",
                ].map((t) => (
                  <li key={t}>
                    <Check size={18} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <a className={styles.secondary} href="/?perfil=vendedor#registro">
                Registrarte como vendedor{" "}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </article>
            <article className={`${styles.plan} ${styles.proPlan}`}>
              <p className={styles.eyebrow}>Plan Pro</p>
              <h3>Más herramientas para crecer</h3>
              <p className={styles.rate}>
                1%–2% <span>de comisión · suscripción mensual</span>
              </p>
              <ul>
                {[
                  "Beneficios del Plan Emprende",
                  "Liquidación al confirmar la entrega con QR",
                  "Métricas de ventas y clientes",
                  "Soporte prioritario",
                ].map((t) => (
                  <li key={t}>
                    <Check size={18} aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <a className={styles.primary} href="/?perfil=vendedor#registro">
                Crear tu cuenta de vendedor{" "}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </article>
          </div>
        </section>

        <section
          id="registro"
          className={`${styles.section} ${styles.registration}`}
          aria-labelledby="registration-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Únete a la red</p>
              <h2 id="registration-title">Registro gratuito</h2>
            </div>
            <p>Elige el perfil que corresponde a tu actividad.</p>
          </div>
          <div className={styles.roles} aria-label="Tipo de cuenta">
            {roles.map(({ role: value, icon: Icon, title, text, link }) => (
              <a
                className={styles.role}
                key={value}
                href={`/?perfil=${value}#registro`}
                aria-current={role === value ? "true" : undefined}
              >
                <div className={styles.roleHeading}>
                  <Icon size={24} aria-hidden="true" />
                  {role === value && (
                    <span className={styles.selected}>
                      <Check size={15} aria-hidden="true" /> Seleccionado
                    </span>
                  )}
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className={styles.roleLink}>
                  {link}
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
          {role ? (
            <div className={styles.formCard}>
              <RegistrationForm key={role} role={role} />
            </div>
          ) : (
            <p className={styles.registrationHint}>
              Selecciona un perfil para completar tus datos. ¿Ya tienes cuenta?{" "}
              <a href="/login">Inicia sesión</a>.
            </p>
          )}
        </section>

        <section
          id="contacto"
          className={`${styles.section} ${styles.contact}`}
          aria-labelledby="contact-title"
        >
          <div>
            <p className={styles.eyebrow}>Tiendas aliadas</p>
            <h2 id="contact-title">
              Tu tienda puede ser el próximo Punto LockBox.
            </h2>
            <p>Recibe paquetes, confirma retiros y forma parte de la red.</p>
            <a
              className={styles.primary}
              href="/?perfil=operador_punto#registro"
            >
              Afiliar tu tienda <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.contactDetails}>
            <h3>Hablemos</h3>
            <a href="mailto:contacto@lockbox.bo">contacto@lockbox.bo</a>
            <a href="mailto:soporte@lockbox.bo">soporte@lockbox.bo</a>
            <p>
              La Paz, Bolivia
              <br />
              Lun–sáb, 8:00–20:00
            </p>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <a className={styles.logo} href="#inicio" translate="no">
          Lock<span>Box</span>
        </a>
        <p>Comercio social, con un punto de confianza.</p>
        <a href="#contenido">
          Volver al inicio <ArrowRight size={16} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
