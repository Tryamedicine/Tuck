const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {receiptMotion}=require('./receipt.cjs');
test('native receipt script is valid for full and reduced motion',()=>{
 const line=fs.readFileSync(__dirname+'/main.cjs','utf8').split('\n').find(l=>l.includes('h.animate'));
 const raw=line.slice(line.indexOf('`')+1,line.lastIndexOf('`'));
 for(const reduced of [false,true]){
  const script=new Function('receiptMotion','reduced','return `'+raw+'`')(receiptMotion,reduced);new vm.Script(script);
  let captured;const context={document:{querySelector:()=>({animate:(frames,options)=>{captured={frames,options};return{finished:Promise.resolve()}}})}};vm.runInNewContext(script,context);
  assert.equal(captured.options.duration,reduced?0:1200);assert.equal(captured.frames.at(-1).opacity,1);
 }
});
