import {
  Activity,
  Ambulance,
  Baby,
  Bone,
  Brain,
  BrainCircuit,
  Bug,
  Droplets,
  FlaskConical,
  HeartPulse,
  Microscope,
  Ribbon,
  ScanLine,
  Siren,
  Stethoscope,
  VenusAndMars,
  Wind,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  activity: Activity,
  ambulance: Ambulance,
  baby: Baby,
  bone: Bone,
  brain: Brain,
  "brain-circuit": BrainCircuit,
  bug: Bug,
  droplets: Droplets,
  "flask-conical": FlaskConical,
  heart: HeartPulse,
  microscope: Microscope,
  ribbon: Ribbon,
  "scan-line": ScanLine,
  siren: Siren,
  "venus-and-mars": VenusAndMars,
  wind: Wind,
};

export function SpecialtyIcon({ className, name, size = 24 }: { className?: string; name: string | null; size?: number }) {
  const Icon = (name && icons[name]) || Stethoscope;
  return <Icon aria-hidden="true" className={className} size={size} strokeWidth={1.8} />;
}
