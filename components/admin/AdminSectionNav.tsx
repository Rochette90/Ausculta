import { BookOpenCheck, ClipboardList, MessageSquareWarning } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

export function AdminSectionNav() {
  return <nav aria-label="Sections d’administration" className="mb-6 flex flex-wrap gap-2"><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/pathologies"><BookOpenCheck size={15} /> Fiches</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/questions"><ClipboardList size={15} /> QCM</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin/reports"><MessageSquareWarning size={15} /> Signalements</Link></nav>;
}
