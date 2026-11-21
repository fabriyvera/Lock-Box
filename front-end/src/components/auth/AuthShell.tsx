/* eslint-disable @next/next/no-html-link-for-pages -- Public navigation works before router hydration. */
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  MapPin,
  ShoppingBag,
  Store,
} from "lucide-react";
import type { AccountRole } from "@/lib/auth/account";
import styles from "./auth.module.css";
export function parseRole(value: unknown): AccountRole | null {
  return value === "comprador" ||
    value === "vendedor" ||
    value === "operador_punto"
    ? value
    : null;
}
const roles = [
  {
    role: "comprador",
    label: "Comprador",
    icon: ShoppingBag,
    text: "Consulta el catálogo, sigue tus pedidos y recoge con QR.",
  },
  {
    role: "vendedor",
    label: "Vendedor",
    icon: Store,
    text: "Administra tu tienda, tus productos y tus despachos.",
  },
  {
    role: "operador_punto",
    label: "Punto LockBox",
    icon: MapPin,
    text: "Recibe paquetes y confirma los retiros en tu tienda.",
  },
] as const;
export default function AuthShell({
  mode,
  role,
  children,
}: {
  mode: "login" | "register";
  role: AccountRole | null;
  children: ReactNode;
}) {
  const register = mode === "register";
  const selected = roles.find((item) => item.role === role);
  return (
    <div className={`home-theme ${styles.shell}`}>
      <a href="#account-form" className={styles.skip}>
        Saltar al formulario
      </a>
      <header className={styles.header}>
        <a
          href="/"
          className={styles.brand}
          aria-label="LockBox, inicio"
          translate="no"
        >
          <LockKeyhole aria-hidden="true" size={22} />
          Lock<span>Box</span>
        </a>
        <a href="/" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al inicio
        </a>
      </header>
      <main className={styles.layout}>
        <aside className={styles.profiles} aria-labelledby="profile-title">
          <p className={styles.eyebrow}>Tu espacio en LockBox</p>
          <p id="profile-title" className={styles.profileTitle}>
            {register ? "Elige cómo formar parte." : "¿A qué módulo ingresas?"}
          </p>
          <p>
            {register
              ? "Selecciona el perfil que corresponde a tu actividad."
              : "Selecciona tu perfil para identificar el módulo. Tu cuenta determina qué panel puedes abrir."}
          </p>
          <nav className={styles.choices} aria-label="Tipo de cuenta">
            {roles.map(({ role: value, label, icon: Icon, text }) => (
              <a
                key={value}
                href={`/${mode}?perfil=${value}#account-form`}
                aria-current={role === value ? "true" : undefined}
                className={styles.choice}
              >
                <Icon size={22} aria-hidden="true" />
                <span>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </span>
                {role === value ? (
                  <Check size={18} aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} aria-hidden="true" />
                )}
              </a>
            ))}
          </nav>
        </aside>
        <section
          id="account-form"
          tabIndex={-1}
          className={styles.panel}
          aria-labelledby="account-title"
        >
          <p className={styles.eyebrow}>
            {register ? "Registro gratuito" : "Acceso a tu cuenta"}
          </p>
          <h1 id="account-title">
            {register ? "Crea tu cuenta" : "Inicia sesión"}
            {selected && <span>{selected.label}</span>}
          </h1>
          <p className={styles.intro}>
            {register
              ? "Completa tus datos para empezar."
              : "Ingresa tu correo y contraseña para abrir tu panel."}
          </p>
          {children}
          <p className={styles.switch}>
            {register ? "¿Ya tienes cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
            <a
              href={`/${register ? "login" : "register"}${role ? `?perfil=${role}` : ""}`}
            >
              {register ? "Inicia sesión" : "Regístrate gratis"}{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </p>
        </section>
      </main>
      <footer className={styles.footer}>
        LockBox · Comercio social con un punto de confianza.
      </footer>
    </div>
  );
}
