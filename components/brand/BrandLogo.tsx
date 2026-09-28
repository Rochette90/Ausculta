import Image from "next/image";
import { cn } from "../../lib/utils";
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand";

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
        height={BRAND_LOGO_HEIGHT}
        priority={priority}
        sizes="(max-width: 640px) 138px, 164px"
        src={BRAND_LOGO_SRC}
        width={BRAND_LOGO_WIDTH}
      />
    </span>
  );
}
