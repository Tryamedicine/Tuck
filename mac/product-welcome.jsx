import React from 'react';
import {GatherMark} from '../brand-art.jsx';
import {Icon} from './ui.jsx';
export default function ProductWelcome({onStart}){
 return <div className="productWelcome"><div className="introBrand"><GatherMark/><span>Tuck</span></div><h2 id="welcome-title">把眼前的事，<br/>轻轻收好。</h2><p>截图或写一句，收进待整理。<br/>再留几件，给今天。</p><div className="introScene" aria-hidden="true"><div className="introClipping"><div className="clippingTop"><i/>Alex</div><p>最新设计稿，今天方便发我吗？</p><span>10:24</span></div><div className="introConnector"><Icon name="arrow"/></div><div className="introTask"><span className="introCheckbox"><Icon name="check"/></span><div><strong>把设计稿发给 Alex</strong><small>产品设计</small></div><GatherMark/></div></div><div className="introFooter"><span><Icon name="keyboard" size={16}/>随时唤醒，随手收下</span><button className="primary" onClick={onStart}>开始使用<Icon name="arrow"/></button></div></div>;
}
