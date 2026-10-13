import { Activity, BookOpenCheck, BookOpenText, ClipboardList, ListChecks, MessageSquareWarning, Mail } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function AdminSectionNav() {
  return <nav aria-label="Sections d’administration" className="mb-6 flex flex-wrap gap-2"><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/stations"><Activity size={15} /> Stations</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/pathologies"><BookOpenCheck size={15} /> Fiches</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/theorie"><BookOpenText size={15} /> Théorie</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/grilles"><ListChecks size={15} /> Grilles</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/questions"><ClipboardList size={15} /> QCM</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/reports"><MessageSquareWarning size={15} /> Signalements</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/contact"><Mail size={15} /> Contact</Link></nav>;
}
