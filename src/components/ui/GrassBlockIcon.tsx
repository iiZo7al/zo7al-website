import type {SVGProps} from 'react';

/** User-supplied player-profile icon; the Minecraft page keeps its original cube icon. */
export default function GrassBlockIcon({size=20,...props}:SVGProps<SVGSVGElement>&{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 300 300" fill="none" aria-hidden="true" {...props}><image href="/assets/minecraft-player-icon.png" width="300" height="300"/></svg>;
}
