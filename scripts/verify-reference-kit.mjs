import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expected = new Map([
  ['portrait-renderer.js', '48c625bebbba04c7d93d04a59ca6b30352e01cef450d28cc0dda9594c4dec5a6'],
  ['auto-reveal-field.js', '1fe99a8c7452ef1f48e7c52ac19623e0c35e4d065db487df77225b8a4187d293']
]);

let failed = false;
for (const [file, hash] of expected) {
  const bytes = readFileSync(resolve(root, 'assets/reference-renderer', file));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== hash) {
    failed = true;
    console.error(`${file}: expected ${hash}, received ${actual}`);
  }
}

if (failed) process.exit(1);
console.log('PASS: accepted racing-helmet renderer snapshot is intact');
