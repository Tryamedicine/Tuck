import React from 'react';
import {shortcutParts} from './shortcut-format.cjs';
export function ShortcutKeys({value}){return <span className="shortcutKeys">{shortcutParts(value).map((part,i)=><React.Fragment key={i}>{i>0&&<span className="keyPlus">+</span>}<kbd>{part}</kbd></React.Fragment>)}</span>}
export default function ShortcutHint({value}){return <div className="onboardingShortcutHint">{value?<><span>在任何应用，按</span><ShortcutKeys value={value}/><span>唤起新建事项</span></>:<span>快捷键已停用，可在设置中开启</span>}</div>}
