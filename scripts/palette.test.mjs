import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adapt, luminance, contrast, yaml, kitty, css } from '../src/theme.js';
const source = JSON.parse(await readFile(new URL('../colors.txt', import.meta.url), 'utf8'));
const accents = { red: 'base08', yellow: 'base0A', green: 'base0B', cyan: 'base0C', blue: 'base0D', magenta: 'base0E' };
const brightAccents = { red: 'base12', yellow: 'base13', green: 'base14', cyan: 'base15', blue: 'base16', magenta: 'base17' };
for (const variant of ['dark', 'light']) {
  test(`${variant}: complete portable roles, ordered neutrals, readable comments`, () => {
    for (const system of ['base16', 'base24']) {
      const p = adapt(source, variant, system);
      assert.equal(Object.keys(p).length, system === 'base16' ? 16 : 24);
      for (const value of Object.values(p)) assert.match(value, /^#[A-F\d]{6}$/);
      const neutrals = Array.from({ length: 8 }, (_, index) => luminance(p[`base0${index}`]));
      for (let i = 1; i < neutrals.length; i++) assert.ok(variant === 'dark' ? neutrals[i] > neutrals[i - 1] : neutrals[i] < neutrals[i - 1], `neutral ramp out of order at ${i}`);
      assert.ok(contrast(p.base03, p.base00) >= 4.5);
      assert.ok(contrast(p.base05, p.base00) >= 4.5);
      assert.ok(variant === 'dark' ? luminance(p.base11 || '#000000') < luminance(p.base00) : luminance(p.base11 || '#FFFFFF') > luminance(p.base00));
    }
  });
  test(`${variant}: Base24 preserves all normal/bright chromatic ANSI values`, () => {
    const p = adapt(source, variant, 'base24');
    for (const [name, role] of Object.entries(accents)) assert.equal(p[role], source[variant].terminal.normal[name]);
    for (const [name, role] of Object.entries(brightAccents)) assert.equal(p[role], source[variant].terminal.bright[name]);
  });
  test(`${variant}: YAML metadata and serialized palette match the adapter`, () => {
    for (const system of ['base16', 'base24']) {
      const output = yaml(source, variant, system);
      assert.ok(output.includes(`system: "${system}"`));
      assert.ok(output.includes(`variant: "${variant}"`));
      const serialized = Object.fromEntries([...output.matchAll(/^  (base[0-9A-F]{2}): "(#[A-F\d]{6})"$/gm)].map(match => [match[1], match[2]]));
      assert.deepEqual(serialized, adapt(source, variant, system));
    }
  });
  test(`${variant}: Kitty retains every original terminal slot`, () => {
    const output = kitty(source, variant);
    const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    const lines = Object.fromEntries(output.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(' ')));
    names.forEach((name, i) => { assert.equal(lines[`color${i}`], source[variant].terminal.normal[name]); assert.equal(lines[`color${i + 8}`], source[variant].terminal.bright[name]); });
    for (const [exportName, sourceName] of [['background', 'background'], ['foreground', 'foreground'], ['cursor', 'cursor'], ['cursor_text_color', 'cursorText'], ['selection_background', 'selectionBg'], ['selection_foreground', 'selectionFg']]) assert.equal(lines[exportName], source[variant].terminal[sourceName]);
  });
}
test('adapters preserve the source and CSS includes both variants', () => {
  const original = JSON.stringify(source);
  for (const variant of ['dark', 'light']) for (const system of ['base16', 'base24']) adapt(source, variant, system);
  assert.equal(JSON.stringify(source), original);
  const output = css(source);
  assert.ok(output.includes('[data-fen="dark"]'));
  assert.ok(output.includes('[data-fen="light"]'));
  assert.equal((output.match(/--fen-/g) || []).length, 32);
});
