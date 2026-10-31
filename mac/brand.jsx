import React from 'react';
export default function Brand({large=false}){return <div className={'brandLockup '+(large?'brandLarge':'brandSmall')} aria-label="Tuck"><svg viewBox="10 10 50 50" fill="currentColor" aria-hidden="true"><path d="M22 12h36v20H44c-7 0-12 5-12 12v14H22c-6 0-10-4-10-10V22c0-6 4-10 10-10Z"/><path d="M40 44c0-2 2-4 4-4h14L40 58Z"/></svg><strong>Tuck</strong></div>}
