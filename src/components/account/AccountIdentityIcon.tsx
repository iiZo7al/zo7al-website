import BrandIcon from '@/components/ui/BrandIcon';
export default function AccountIdentityIcon({provider,size=20}:{provider:string;size?:number}) {
  if(provider!=='azure')return <BrandIcon slug={provider} size={size}/>;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>;
}
