import url from './assets/message-example.png';
export const exampleAsset={url,name:'Tuck 示例截图.png',width:440,height:164};
export const exampleTitle='把设计稿发给 Alex';
export async function recognizeExample(){await new Promise(r=>setTimeout(r,900));return{title:exampleTitle,candidates:[],example:true}}
