const esbuild=require('esbuild'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'ui');fs.mkdirSync(out,{recursive:true});
esbuild.buildSync({entryPoints:[path.join(__dirname,'renderer.jsx')],bundle:true,outdir:out,entryNames:'renderer',platform:'browser',format:'iife',minify:true,define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'file','.png':'dataurl','.svg':'file'}});
fs.copyFileSync(path.join(__dirname,'assets','figma','Inter-OFL.txt'),path.join(out,'Inter-OFL.txt'));
fs.copyFileSync(path.join(__dirname,'../vendor/lucide/LICENSE'),path.join(out,'Lucide-LICENSE.txt'));
fs.copyFileSync(path.join(__dirname,'assets/brand/Outfit-OFL.txt'),path.join(out,'Outfit-OFL.txt'));
fs.copyFileSync(path.join(__dirname,'assets/fluent/LICENSE.txt'),path.join(out,'Fluent-Emoji-LICENSE.txt'));
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; font-src \'self\'; connect-src \'none\'"><title>Tuck</title><link rel="stylesheet" href="renderer.css"></head><body><div id="root"><div class="launchSurface waiting" role="status" aria-label="正在打开 Tuck"><span class="launchSeed"></span></div></div><script src="renderer.js"></script></body></html>');
