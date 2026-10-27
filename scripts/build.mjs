import { rm, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath,['scripts/verify.mjs'],{stdio:'inherit'});
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
console.log('Web-only build complete: dist/index.html (no offline speech, no APK)');
