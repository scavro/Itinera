import fs from 'node:fs';

const source = fs.readFileSync('DESIGN.md', 'utf8');
const colors = source.split('colors:\n')[1]?.split('typography:')[0];
if (!colors) throw new Error('DESIGN.md: sección colors no encontrada');
const matches = [...colors.matchAll(/^  ([\w-]+): ["']([^"']+)["']/gm)];
if (matches.length < 10) throw new Error('DESIGN.md: paleta incompleta');
const tokens = matches.map(([, key, value]) => `  --color-${key}: ${value};`);
const output = `/* Generated from DESIGN.md; run node scripts/generate-tokens.mjs. */\n:root {\n${tokens.join('\n')}\n  --font-body: 'DM Sans', system-ui, sans-serif;\n  --font-display: 'Newsreader', Georgia, serif;\n}\n`;
if (process.argv.includes('--check')) {
  if (fs.readFileSync('src/tokens.css', 'utf8') !== output) {
    throw new Error('src/tokens.css no coincide con DESIGN.md');
  }
} else {
  fs.writeFileSync('src/tokens.css', output);
}
