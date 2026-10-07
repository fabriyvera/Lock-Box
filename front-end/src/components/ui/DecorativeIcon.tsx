import type { LucideIcon } from 'lucide-react';

type DecorativeIconProps = {
  icon: LucideIcon;
  size?: number | string;
  className?: string;
};

// Usar junto a una etiqueta visible; el lector de pantalla solo anuncia el texto.
export function DecorativeIcon({
  icon: Glyph,
  size = 20,
  className = '',
}: DecorativeIconProps) {
  return (
    <Glyph
      size={size}
      aria-hidden="true"
      focusable="false"
      className={`inline-block shrink-0 align-middle ${className}`}
    />
  );
}
