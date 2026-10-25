import { Briefcase, Coins, Handshake, Landmark, Scale, Shield, Users, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  landmark: Landmark,
  users: Users,
  shield: Shield,
  briefcase: Briefcase,
  handshake: Handshake,
  coins: Coins,
};

export function PracticeIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && icons[name]) || Scale;
  return <Icon className={className} aria-hidden="true" />;
}
