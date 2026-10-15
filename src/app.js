import source from './palette.js';
import { brand, roles, adapt, contrast, yaml } from './theme.js';

let variant = 'dark';
try { const saved = localStorage.getItem('fen-variant'); if (saved === 'dark' || saved === 'light') variant = saved; } catch { /* Storage is optional. */ }
let paletteMode = 'signature';
let toastTimeout;
const $ = selector => document.querySelector(selector);
const signature = [
  ['mPrimary', 'Moss', 'Primary accent'], ['mSecondary', 'Fern', 'Secondary accent'],
  ['mTertiary', 'Amber', 'Warm accent'], ['mError', 'Clay', 'Error accent'],
  ['mSurface', 'Water', 'Main surface'], ['mSurfaceVariant', 'Bank', 'Raised surface'],
  ['mOnSurfaceVariant', 'Lichen', 'Secondary text'], ['mOnSurface', 'Mist', 'Foreground']
];
const extraRoles = [
  ['base10', 'Still', 'Deep surface'], ['base11', 'Depth', 'Deepest surface'],
  ['base12', 'Bright clay', 'Bright red'], ['base13', 'Bright amber', 'Bright yellow'],
  ['base14', 'Bright moss', 'Bright green'], ['base15', 'Bright estuary', 'Bright cyan'],
  ['base16', 'Bright tide', 'Bright blue'], ['base17', 'Bright heather', 'Bright magenta']
];
const noctaliaNames = {
  mPrimary: 'Primary', mOnPrimary: 'On primary', mSecondary: 'Secondary', mOnSecondary: 'On secondary',
  mTertiary: 'Tertiary', mOnTertiary: 'On tertiary', mError: 'Error', mOnError: 'On error',
  mSurface: 'Surface', mOnSurface: 'On surface', mSurfaceVariant: 'Surface variant',
  mOnSurfaceVariant: 'On surface variant', mOutline: 'Outline', mShadow: 'Shadow', mHover: 'Hover', mOnHover: 'On hover'
};
function toast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
async function copy(text, message) {
  try { await navigator.clipboard.writeText(text); toast(message); }
  catch {
    $('#copy-text').value = text;
    $('#copy-dialog').showModal();
    $('#copy-text').focus();
    $('#copy-text').select();
  }
}
function paletteEntries() {
  if (paletteMode === 'signature') return signature.map(([key, name, description]) => ({ key, name, description, value: source[variant][key] }));
  if (paletteMode === 'noctalia') {
    const s = source[variant];
    const entries = Object.entries(noctaliaNames).map(([key, name]) => ({ key, name, description: key, value: s[key] }));
    for (const group of ['normal', 'bright']) for (const [name, value] of Object.entries(s.terminal[group])) entries.push({ key: `terminal.${group}.${name}`, name: `${group} ${name}`, description: 'Original ANSI color', value });
    for (const [key, value] of Object.entries(s.terminal)) if (typeof value === 'string') entries.push({ key: `terminal.${key}`, name: key.replace(/([A-Z])/g, ' $1'), description: 'Original terminal role', value });
    return entries;
  }
  const palette = adapt(source, variant, paletteMode);
  return [...roles, ...(paletteMode === 'base24' ? extraRoles : [])].map(([key, name, description]) => ({ key, name, description, value: palette[key] }));
}
function swatch(entry, ribbon = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = ribbon ? 'ribbon-swatch' : 'swatch';
  button.setAttribute('aria-label', `Copy ${entry.name}, ${entry.value}, ${entry.description}`);
  button.title = `${entry.key}: ${entry.value} (click to copy)`;
  if (ribbon) {
    button.style.backgroundColor = entry.value;
    button.style.color = contrast('#0B1824', entry.value) > contrast('#EFF1DE', entry.value) ? '#0B1824' : '#EFF1DE';
    const name = document.createElement('span'); name.className = 'ribbon-name'; name.textContent = entry.name;
    const value = document.createElement('span'); value.className = 'ribbon-hex'; value.textContent = entry.value;
    button.append(name, value);
  } else {
    const chip = document.createElement('span'); chip.className = 'swatch-chip'; chip.style.backgroundColor = entry.value; chip.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span'); text.className = 'swatch-text';
    const name = document.createElement('strong'); name.textContent = entry.name;
    const description = document.createElement('small'); description.textContent = paletteMode.startsWith('base') ? `${entry.key} · ${entry.description}` : entry.description;
    text.append(name, description);
    const value = document.createElement('span'); value.className = 'swatch-value'; value.textContent = entry.value;
    button.append(chip, text, value);
  }
  button.addEventListener('click', () => copy(entry.value, `${entry.name} ${entry.value} copied`));
  return button;
}
function renderPalette() {
  $('#swatch-grid').replaceChildren(...paletteEntries().map(entry => swatch(entry)));
  $('#palette-note').textContent = {
    signature: 'The main accents, backgrounds and text colors.',
    base16: '16 portable roles. Dusk uses bright accents for syntax; a few supporting shades are derived.',
    base24: '24 portable roles, including all original normal and bright terminal accent colors.',
    noctalia: 'Every original UI and terminal role, preserved exactly as supplied.'
  }[paletteMode];
  document.querySelectorAll('[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === paletteMode)));
}
function setVariant(next) {
  variant = next;
  const s = source[variant], p = adapt(source, variant);
  const css = { bg:s.mSurface, surface:s.mSurfaceVariant, fg:s.mOnSurface, muted:s.mOnSurfaceVariant, border:s.mOutline, accent:s.mPrimary, 'accent-fg':s.mOnPrimary, gold:s.mTertiary, red:s.mError, secondary:s.mSecondary, selection:s.terminal.selectionBg, shadow:s.mShadow, comment:p.base03, 'syntax-red':p.base08, 'syntax-orange':p.base09, 'syntax-yellow':p.base0A, 'syntax-green':p.base0B, 'syntax-cyan':p.base0C, 'syntax-blue':p.base0D, 'syntax-magenta':p.base0E };
  document.documentElement.dataset.theme = variant;
  for (const [name, value] of Object.entries(css)) document.documentElement.style.setProperty(`--${name}`, value);
  document.querySelector('meta[name="theme-color"]').content = s.mSurface;
  document.querySelectorAll('[data-variant-name]').forEach(el => el.textContent = brand.variants[variant]);
  $('[data-code-variant]').textContent = `'${brand.variants[variant].toLowerCase()}'`;
  $('#theme-label').textContent = brand.variants[variant];
  $('.theme-symbol').textContent = variant === 'dark' ? '☾' : '☼';
  $('.theme-toggle').setAttribute('aria-label', variant === 'dark' ? 'Switch to Dawn light theme' : 'Switch to Dusk dark theme');
  for (const format of ['base16', 'base24', 'kitty']) $(`#${format}-download`).href = `./downloads/fen-${brand.variants[variant].toLowerCase()}-${format}.${format === 'kitty' ? 'conf' : 'yaml'}`;
  const oldMode = paletteMode;
  paletteMode = 'signature';
  $('#color-ribbon').replaceChildren(...paletteEntries().map(entry => swatch(entry, true)));
  paletteMode = oldMode;
  const terminalColors = { red:'red', green:'green', yellow:'yellow', blue:'blue', cyan:'cyan' };
  const terminalAccents = variant === 'dark' ? s.terminal.bright : s.terminal.normal;
  for (const [role, color] of Object.entries(terminalColors)) document.documentElement.style.setProperty(`--terminal-${role}`, terminalAccents[color]);
  renderPalette();
  try { localStorage.setItem('fen-variant', variant); } catch { /* Storage is optional. */ }
}
$('.theme-toggle').addEventListener('click', () => setVariant(variant === 'dark' ? 'light' : 'dark'));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  const mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  for (const panel of ['code', 'terminal', 'interface']) $(`#${panel}-preview`).hidden = panel !== mode;
  $('#window-title').textContent = { code:'palette.ts', terminal:'~/projects/fen', interface:'Notes' }[mode];
  $('#status-language').textContent = { code:'TypeScript', terminal:'Shell', interface:'Interface' }[mode];
}));
document.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click', () => { paletteMode = button.dataset.palette; renderPalette(); }));
$('#copy-palette').addEventListener('click', () => {
  const text = paletteMode.startsWith('base') ? yaml(source, variant, paletteMode) : JSON.stringify(paletteMode === 'noctalia' ? source[variant] : Object.fromEntries(paletteEntries().map(entry => [entry.name.toLowerCase(), entry.value])), null, 2);
  copy(text, `Fen ${brand.variants[variant]} palette copied`);
});
$('#save-note').addEventListener('click', () => {
  const value = $('#demo-note').value.trim();
  $('#note-status').textContent = value ? `Saved in this demo: ${value}` : 'Enter a note first.';
  if (!value) $('#demo-note').focus();
});
setVariant(variant);
