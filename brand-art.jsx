import React from 'react';

export function GatherMark(){
  return <svg viewBox="0 0 76 76" fill="currentColor" aria-hidden="true">
    <path d="M22 12h36v20H44c-7 0-12 5-12 12v14H22c-6 0-10-4-10-10V22c0-6 4-10 10-10Z"/>
    <path d="M40 44c0-2 2-4 4-4h14L40 58Z"/>
  </svg>;
}

export function DayCompleteArt(){
  return <svg className="dayCompleteArt" viewBox="0 0 260 200" fill="none" aria-hidden="true">
    <ellipse cx="130" cy="174" rx="83" ry="11" fill="#b6a0ff06"/>
    <ellipse cx="130" cy="172" rx="57" ry="6" fill="#b6a0ff0a"/>
    <path d="M56 118 77 91h109l20 27v40H56z" fill="#18151f" stroke="#5f526f" strokeWidth="1.3" strokeLinejoin="round"/>
    <g transform="rotate(-12 102 94)">
      <rect x="74" y="48" width="62" height="85" rx="10" fill="#7c6cad"/>
      <path d="M88 65h31M88 73h23" stroke="#d9cdfa" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="91" cy="94" r="7" fill="#c7b5f9"/>
      <path d="m88 94 2 2 4-4" stroke="#5b477d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <g transform="rotate(11 160 103)">
      <rect x="130" y="65" width="60" height="74" rx="10" fill="#b77c69"/>
      <path d="M143 81h30M143 89h20" stroke="#ffdbc9" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="146" cy="109" r="7" fill="#f5b89d"/>
      <path d="m143 109 2 2 4-4" stroke="#7a4f43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <rect x="102" y="79" width="58" height="65" rx="9" fill="#91a572" stroke="#cfe2b0" strokeOpacity=".35"/>
    <path d="M115 94h31M115 102h23" stroke="#dfeacb" strokeWidth="2" strokeLinecap="round"/>
    <path d="M56 118h44l11 15h38l11-15h46v39a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10z" fill="#27212f" stroke="#9682ad" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M58 143h146" stroke="#c8b2df" strokeOpacity=".08"/>
    <rect x="114" y="146" width="32" height="6" rx="3" fill="#a18cb7"/>
    <path d="m204 57 2.5 7.5L214 67l-7.5 2.5L204 77l-2.5-7.5L194 67l7.5-2.5z" fill="#d2e7a1"/>
    <path d="m52 82 1.5 4.5L58 88l-4.5 1.5L52 94l-1.5-4.5L46 88l4.5-1.5z" fill="#c3a6e9"/>
    <circle cx="174" cy="40" r="2.5" fill="#f0acbb"/>
    <circle cx="66" cy="46" r="2" fill="#93a4e1"/>
    <path d="m214 104 5-3M40 128l5 2" stroke="#a39ab5" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}

// A continuous rounded square borrows the brand silhouette without its cutout.
export function FrostedCompleteArt(){
  const front="M70 42h65c15 0 25 10 25 25v65c0 15-10 25-25 25H70c-15 0-25-10-25-25V67c0-15 10-25 25-25Z";
  return <svg className="completionShieldStudy" viewBox="0 0 230 220" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="shieldRearFill" x1="85" y1="35" x2="155" y2="180" gradientUnits="userSpaceOnUse"><stop stopColor="#93aff2"/><stop offset="1" stopColor="#6483d3"/></linearGradient>
      <linearGradient id="shieldFrontFill" x1="45" y1="40" x2="155" y2="165" gradientUnits="userSpaceOnUse"><stop stopColor="#c5d1e4" stopOpacity=".88"/><stop offset=".55" stopColor="#a3b5d3" stopOpacity=".82"/><stop offset="1" stopColor="#d8e2f0" stopOpacity=".9"/></linearGradient>
      <linearGradient id="shieldEdge" x1="50" y1="30" x2="144" y2="166" gradientUnits="userSpaceOnUse"><stop stopColor="#f1f6ff" stopOpacity=".8"/><stop offset="1" stopColor="#dce7ff" stopOpacity=".28"/></linearGradient>
      <filter id="shieldDiffuse" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="shieldSeparation" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="4" dy="3" stdDeviation="3" floodColor="#253960" floodOpacity=".23"/></filter>
      <clipPath id="shieldFrontClip"><path d={front}/></clipPath>
      <mask id="shieldRearMask"><rect width="230" height="220" fill="white"/><path d={front} fill="black"/></mask>
    </defs>
    <g mask="url(#shieldRearMask)"><path d={front} transform="translate(25 18)" fill="url(#shieldRearFill)"/></g>
    <path d={front} fill="url(#shieldFrontFill)" filter="url(#shieldSeparation)"/>
    <g clipPath="url(#shieldFrontClip)">
      <path d={front} transform="translate(25 18)" fill="#7394e3" fillOpacity=".45" filter="url(#shieldDiffuse)"/>
    </g>
    <path d={front} stroke="url(#shieldEdge)" strokeWidth="1.5"/>
    <path d="m88 101 7 7 19-20" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
