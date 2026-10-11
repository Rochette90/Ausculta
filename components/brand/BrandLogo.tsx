import Image from "next/image";
import { cn } from "../../lib/utils";
import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand";

/**
 * Mot-symbole officiel. Deux fichiers : le tracé sombre pour le thème clair, le
 * tracé clair pour le thème sombre ; la feuille de style n'affiche que le bon.
 */
export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("brand-logo", className)}>
      <Image
        alt={BRAND_NAME}
        className="brand-logo-light"
        height={BRAND_LOGO_HEIGHT}
        priority={priority}
        sizes="(max-width: 640px) 128px, 150px"
        src={BRAND_LOGO_SRC}
        width={BRAND_LOGO_WIDTH}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="brand-logo-dark"
        height={BRAND_LOGO_HEIGHT}
        sizes="(max-width: 640px) 128px, 150px"
        src={BRAND_LOGO_DARK_SRC}
        width={BRAND_LOGO_WIDTH}
      />
    </span>
  );
}

/** Les quatre barres seules : indicateur d'écoute et repère de marque. */
export function ListeningBars({ className, state = "idle" }: { className?: string; state?: "idle" | "listening" | "speaking" }) {
  return (
    <span aria-hidden="true" className={cn("listening-bars", state !== "idle" && `is-${state}`, className)}>
      <i /><i /><i /><i />
    </span>
  );
}
