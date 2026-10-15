export const brand = { name: 'Fen', author: 'lysec', variants: { dark: 'Dusk', light: 'Dawn' } };
export const roles = [
  ['base00', 'Water', 'Background'], ['base01', 'Bank', 'Raised surface'],
  ['base02', 'Marsh', 'Selection'], ['base03', 'Silt', 'Comments'],
  ['base04', 'Lichen', 'Secondary text'], ['base05', 'Reed', 'Foreground'],
  ['base06', 'Mist', 'Bright foreground'], ['base07', 'Linen', 'Highest emphasis'],
  ['base08', 'Clay', 'Variables · errors'], ['base09', 'Ember', 'Numbers · constants'],
  ['base0A', 'Amber', 'Types · classes'], ['base0B', 'Moss', 'Strings · additions'],
  ['base0C', 'Estuary', 'Support · escapes'], ['base0D', 'Tide', 'Functions'],
  ['base0E', 'Heather', 'Keywords'], ['base0F', 'Bark', 'Deprecated · embedded tags']
];
export function mix(a, b, amount) {
  const channels = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16));
  const first = channels(a), second = channels(b);
  return '#' + first.map((n, i) => Math.round(n + (second[i] - n) * amount).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}
function readable(color, background, foreground) {
  for (let step = 0; step <= 100; step++) {
    const candidate = mix(color, foreground, step / 100);
    if (contrast(candidate, background) >= 4.5) return candidate;
  }
  return foreground;
}
export function adapt(source, variant, system = 'base16') {
  const s = source[variant];
  if (!s || !['base16', 'base24'].includes(system)) throw new Error('Unknown palette variant or system');
  const t = s.terminal;
  const colors = variant === 'dark' ? t.bright : t.normal;
  const p = {
    base00: s.mSurface, base01: s.mSurfaceVariant, base02: t.selectionBg,
    base03: readable(t.bright.black, s.mSurface, s.mOnSurface),
    base04: s.mOnSurfaceVariant,
    base05: variant === 'dark' ? t.normal.white : s.mOnSurface,
    base06: variant === 'dark' ? s.mOnSurface : t.bright.white,
    base07: variant === 'dark' ? mix(s.mOnSurface, '#FFFFFF', .25) : mix(t.bright.white, '#000000', .3),
    base08: colors.red,
    base09: variant === 'dark' ? mix(s.mTertiary, s.mError, .4) : s.mTertiary,
    base0A: colors.yellow, base0B: colors.green, base0C: colors.cyan,
    base0D: colors.blue, base0E: colors.magenta,
    base0F: variant === 'dark' ? readable(t.normal.magenta, s.mSurface, s.mOnSurface) : mix(s.mTertiary, t.normal.magenta, .5)
  };
  if (system === 'base24') {
    Object.assign(p, {
      base08: t.normal.red, base0A: t.normal.yellow, base0B: t.normal.green,
      base0C: t.normal.cyan, base0D: t.normal.blue, base0E: t.normal.magenta,
      base10: mix(s.mSurface, variant === 'dark' ? s.mShadow : '#FFFFFF', .5),
      base11: variant === 'dark' ? s.mShadow : '#FFFFFF',
      base12: t.bright.red, base13: t.bright.yellow, base14: t.bright.green,
      base15: t.bright.cyan, base16: t.bright.blue, base17: t.bright.magenta
    });
  }
  return p;
}
export function yaml(source, variant, system) {
  const palette = adapt(source, variant, system);
  return `# Generated from colors.txt. Palette adapters are defined in src/theme.js.\nsystem: "${system}"\nname: "${brand.name} ${brand.variants[variant]}"\nauthor: "${brand.author}"\nvariant: "${variant}"\npalette:\n` + Object.entries(palette).map(([key, value]) => `  ${key}: "${value}"`).join('\n') + '\n';
}
export function css(source) {
  return Object.keys(brand.variants).map(variant => `[data-fen="${variant}"] {\n` + roles.map(([key, name]) => `  --fen-${name.toLowerCase()}: ${adapt(source, variant)[key]};`).join('\n') + '\n}').join('\n\n') + '\n';
}
export function kitty(source, variant) {
  const t = source[variant].terminal;
  const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  return `# Fen ${brand.variants[variant]}: original Noctalia terminal colors\nbackground ${t.background}\nforeground ${t.foreground}\ncursor ${t.cursor}\ncursor_text_color ${t.cursorText}\nselection_background ${t.selectionBg}\nselection_foreground ${t.selectionFg}\n` + names.map((name, i) => `color${i} ${t.normal[name]}\ncolor${i + 8} ${t.bright[name]}`).join('\n') + '\n';
}
