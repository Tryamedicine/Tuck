import React from 'react';
import {Sun,Inbox,Check,Plus,X,ArrowLeft,ArrowRight,ChevronDown,ChevronRight,Ellipsis,ImagePlus,Image,ScanLine,Keyboard,Brain,Settings,Undo2,Trash2,UserRound,Folder,Link,ShieldCheck,Pause} from '../vendor/lucide/dist/esm/lucide-react.mjs';

const icons={pause:Pause,sun:Sun,inbox:Inbox,check:Check,plus:Plus,close:X,back:ArrowLeft,arrow:ArrowRight,down:ChevronDown,chevron:ChevronRight,more:Ellipsis,image:Image,imagePlus:ImagePlus,scan:ScanLine,keyboard:Keyboard,brain:Brain,settings:Settings,undo:Undo2,trash:Trash2,person:UserRound,folder:Folder,link:Link,shield:ShieldCheck};
export function Icon({name,size=18,...props}){const C=icons[name]||ArrowRight;return <C size={size} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" {...props}/>}
export function IconButton({icon,label,className='',...props}){return <button type="button" aria-label={label} title={label} className={'iconButton '+className} {...props}><Icon name={icon}/></button>}
export function PageHeader({title,onBack,action}){return <header className="settingsHeader">{onBack&&<IconButton icon="back" label="返回设置" onClick={onBack}/>}<h1>{title}</h1>{action&&<div className="headerAction">{action}</div>}</header>}
export function SettingRow({title,description,children,className=''}){return <div className={'settingrow '+className}><div className="settingLabel"><span>{title}</span>{description&&<small>{description}</small>}</div><div className="settingControl">{children}</div></div>}
