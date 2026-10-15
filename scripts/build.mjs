import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { brand, adapt, yaml, css, kitty } from '../src/theme.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = JSON.parse(await readFile(resolve(root, 'colors.txt'), 'utf8'));
for (const variant of ['dark', 'light']) {
  if (!source[variant]) throw new Error(`Missing ${variant} variant`);
  const check = object => Object.values(object).forEach(value => {
    if (typeof value === 'object' && value !== null) check(value);
    else if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid color: ${value}`);
  });
  check(source[variant]);
  adapt(source, variant);
}
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'downloads'), { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'theme.js', 'favicon.svg']) await cp(resolve(root, 'src', file), resolve(dist, file));
await cp(resolve(root, 'LICENSE'), resolve(dist, 'LICENSE'));
await writeFile(resolve(dist, 'palette.js'), `export default ${JSON.stringify(source, null, 2)};\n`);
const downloads = resolve(dist, 'downloads');
await writeFile(resolve(downloads, 'fen-noctalia.json'), JSON.stringify(source, null, 2) + '\n');
await writeFile(resolve(downloads, 'fen.css'), css(source));
for (const variant of ['dark', 'light']) {
  const slug = `fen-${brand.variants[variant].toLowerCase()}`;
  for (const system of ['base16', 'base24']) await writeFile(resolve(downloads, `${slug}-${system}.yaml`), yaml(source, variant, system));
  await writeFile(resolve(downloads, `${slug}-kitty.conf`), kitty(source, variant));
}
console.log(`Built Fen: ${dist} (2 variants, 8 color exports)`);
