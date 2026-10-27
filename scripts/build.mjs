import {mkdir,copyFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/verify.mjs'],{stdio:'inherit'});
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
console.log('GitHub Pages build: dist/index.html ready');
