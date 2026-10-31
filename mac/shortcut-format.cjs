const labels={Alt:'Option',CommandOrControl:'Command',Command:'Command',Meta:'Command',Control:'Control',Shift:'Shift'};
function shortcutParts(value){return typeof value==='string'&&value?value.split('+').map(s=>labels[s]||s):[]}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
module.exports={shortcutParts,escapeHtml};
