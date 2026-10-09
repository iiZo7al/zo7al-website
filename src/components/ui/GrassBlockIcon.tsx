import type {SVGProps} from 'react';

/** Pixel-textured grass block for Minecraft account navigation. */
export default function GrassBlockIcon({size=20,...props}:SVGProps<SVGSVGElement>&{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
    <path fill="#966343" d="m2 9 14 7v15L2 24z"/>
    <path fill="#6D452F" d="m16 16 14-7v15l-14 7z"/>
    <path fill="#78B745" d="m2 9 14-7 14 7-14 7z"/>
    <path fill="#98CC57" d="m6 7 4 2 4-2-4-2zm8-4 4 2 4-2-4-2zm4 6 4 2 4-2-4-2z"/>
    <path fill="#589D38" d="m2 9 14 7v5l-4-2v-2l-4-2v3l-3-2v-2l-3-1z"/>
    <path fill="#3F7C2C" d="m16 16 14-7v5l-3 1v2l-4 2v-3l-3 2v3l-4 2z"/>
    <path fill="#BD8555" d="m4 19 3 1.5v3L4 22zm7 3.5 3 1.5v3L11 25.5z"/>
    <path fill="#895B3C" d="m19 24 3-1.5v3L19 27zm7-5 2-1v3l-2 1z"/>
  </svg>;
}
