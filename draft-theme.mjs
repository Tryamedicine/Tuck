// Prototype tokens inferred from the reference, not the author's source tokens.
export const projectPalette=['#94a5ff','#b6a0ff','#e09be9','#f19abd','#f5aa90'];
const examples={'首页改版':0,'设计系统':1,'用户研究':3,'产品探索':4};
export function projectStyle(name=''){
  const index=examples[name]??Array.from(name).reduce((n,c)=>(n*31+c.codePointAt(0))>>>0,0)%projectPalette.length;
  return {'--project-color':name?projectPalette[index]:'#a8a8b0'};
}
export function draftTasks(){
  const now=Date.now();
  return [
    ['确认首页改版的交互细节','首页改版','inbox'],
    ['整理本周设计评审的反馈','设计系统','inbox'],
    ['约一次新用户访谈','用户研究','inbox'],
    ['补齐组件的交互状态','设计系统','today'],
    ['试一试新的任务卡片','产品探索','today'],
    ['梳理首页的信息层级','首页改版','done'],
  ].map(([title,project,status],i)=>({id:'draft-'+i,title,project,status,createdAt:now-(i+1)*900000,asset:null,source:'视觉草稿示例',...(status==='done'?{completedAt:now,restore:{status:'today',index:0}}:{})}));
}
