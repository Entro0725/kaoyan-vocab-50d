import {mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';

execFileSync(process.execPath,['scripts/verify.mjs'],{stdio:'inherit'});
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
await build({
  entryPoints:['scripts/native-bridge.js'],
  outfile:'dist/native-tts.js',
  bundle:true,
  platform:'browser',
  format:'iife',
  target:['es2020'],
  logLevel:'warning'
});
console.log('Web build + Capacitor bridge: dist/ ready');
