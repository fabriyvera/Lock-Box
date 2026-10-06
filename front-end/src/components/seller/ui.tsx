import {
  Backpack,
  Shirt,
  Headphones,
  Sparkles,
  House,
  Package,
  type LucideIcon,
} from "lucide-react";
import type {
  SellerProduct,
  SellerAction,
  SellerState,
} from "@/lib/seller/model";
import styles from "./seller.module.css";

export type PanelProps = {
  state: SellerState;
  act: (action: SellerAction, message: string) => Promise<boolean>;
};
export function ProductVisual({ product }: { product: SellerProduct }) {
  const Icon: LucideIcon =
    (
      {
        Moda: Shirt,
        Tecnología: Headphones,
        Accesorios: Backpack,
        Belleza: Sparkles,
        Hogar: House,
      } as Record<string, LucideIcon>
    )[product.category] ?? Package;
  return (
    <div className={styles.productVisual} data-category={product.category}>
      <Icon size={48} strokeWidth={1.3} aria-hidden="true" />
      {product.imageUrl /* Product URLs can be user-supplied; native img avoids permitting arbitrary Next image hosts. */ && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={product.imageUrl}
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <Package size={32} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
