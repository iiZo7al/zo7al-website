import { CalendarDays, Clapperboard, HelpCircle, AlertTriangle, Newspaper, ReceiptText, Rocket, UserRound, ShieldCheck, Link2, Images, Gamepad2 } from 'lucide-react';
import CommerceIcon from '@/components/ui/CommerceIcon';
import SolidIcon from '@/components/ui/SolidIcon';
import GrassBlockIcon from '@/components/ui/GrassBlockIcon';
import BrandIcon from '@/components/ui/BrandIcon';
import { searchResultIcon } from '@/lib/data/search-icons';

export default function SearchResultIcon({ entry }: { entry: { href: string; category?: string } }) {
  const icon = searchResultIcon(entry);
  if (icon === 'store' || icon === 'subscriptions') return <CommerceIcon name='shopping-bag' size={18}/>;
  if (icon === 'minecraft' || icon === 'fortnite') return <Gamepad2 size={18} aria-hidden='true'/>;
  if (icon === 'player') return <GrassBlockIcon size={20}/>;
  if (icon === 'modrinth' || icon === 'curseforge') return <BrandIcon slug={icon} size={19}/>;
  if (icon === 'home' || icon === 'modpacks' || icon === 'socials' || icon === 'support') return <SolidIcon name={icon === 'modpacks' ? 'box' : icon === 'socials' ? 'share' : icon === 'support' ? 'headset' : 'home'} size={18}/>;
  const Icon = { game: Rocket, news: Newspaper, events: CalendarDays, orders: ReceiptText, applications: Clapperboard, gallery: Images, faq: HelpCircle, errors: AlertTriangle, account: UserRound, security: ShieldCheck, link: Link2 }[icon];
  return <Icon size={18} aria-hidden='true'/>;
}
