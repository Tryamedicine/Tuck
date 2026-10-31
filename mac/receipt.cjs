const {shortcutParts,escapeHtml}=require('./shortcut-format.cjs');
// The native tray receipt and its review specimen use this same markup and style.
const receiptStyle=`
.hanger{position:absolute;inset:0;opacity:0;pointer-events:none}
.sign{position:absolute;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.9);backdrop-filter:blur(18px);color:#44465e;border:1px solid rgba(216,211,229,.65);border-radius:16px;padding:12px 18px;font:13px/20px -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;box-shadow:0 6px 24px #39314c10;white-space:nowrap}
.receiptCheck{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;background:#eeebf8;color:#796dba}
.receiptCheck svg{width:15px;height:15px;display:block}
.tether{position:absolute;inset:0;overflow:visible;pointer-events:none}
.tether path{fill:none;stroke-linecap:round;stroke-linejoin:round}
.tether .outline{stroke:#ffffffe0;stroke-width:3.5}
.tether .cord{stroke:#b3a7cc;stroke-width:1.25}
`;
const receiptMarkup='<div class="hanger"><svg class="tether" width="100%" height="100%"><path class="outline"/><path class="cord"/></svg><div class="sign"><span class="receiptCheck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><span>任务已收下</span></div></div>';
function shortcutReceiptMarkup(shortcut){
 const keys=shortcutParts(shortcut);if(!keys.length)return null;
 const caps=keys.map(s=>'<kbd>'+escapeHtml(s)+'</kbd>').join('<span class="keyPlus">+</span>');
 return '<div class="hanger"><svg class="tether" width="100%" height="100%"><path class="outline"/><path class="cord"/></svg><div class="sign shortcutSign"><span class="receiptCheck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 16h8"/></svg></span><span class="shortcutReceiptCopy"><strong>随时收下一件事</strong><span>按 <span class="shortcutKeys">'+caps+'</span> 快速新建事项</span></span></div></div>';
}
const receiptMotion=[{opacity:0,transform:'rotate(5deg) scaleY(.3)'},{opacity:1,transform:'rotate(-3deg) scaleY(1.08)',offset:.48},{opacity:1,transform:'rotate(2deg) scaleY(.98)',offset:.68},{opacity:1,transform:'rotate(-1deg) scaleY(1)',offset:.84},{opacity:1,transform:'rotate(0deg) scaleY(1)'}];
module.exports={receiptStyle:receiptStyle+`
.shortcutSign{padding:14px 18px;gap:12px}.shortcutSign .receiptCheck{width:28px;height:28px;border-radius:9px}.shortcutSign .receiptCheck svg{width:18px;height:18px}.shortcutReceiptCopy{display:flex;flex-direction:column;gap:4px}.shortcutReceiptCopy strong{font-size:13px;line-height:20px;font-weight:500;color:#373348}.shortcutReceiptCopy>span{font-size:12px;line-height:22px;color:#706981}.shortcutKeys{display:inline-flex;align-items:center;gap:4px}.shortcutKeys kbd{display:inline-block;border:1px solid #ded7eb;border-radius:5px;background:#f7f4fc;padding:0 5px;color:#796dba;font:500 11px/18px -apple-system,BlinkMacSystemFont,sans-serif}.keyPlus{color:#a098af;font-size:10px}
`,receiptMarkup,receiptMotion,shortcutReceiptMarkup};
