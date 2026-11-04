import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Исходные английские строки остаются ключами; контекст нужен переводчику.
const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, '.build/localization'); mkdirSync(out, { recursive: true });
const contentFiles = new Set(['party-progression.ts', 'progression.ts', 'items.ts', 'item-details.ts',
  'hero-classes.ts', 'medals.ts', 'recruits.ts', 'titles.ts']);
const groups = { content: new Map(), ui: new Map() };
function record(group, text, context) {
  if (!/[A-Za-z]{2}/.test(text) || !(/[A-Z]/.test(text) || /[a-z]{2} [a-z]{2}/.test(text))) return;
  if (/^(\.\/|\.\.\/|https?:|#|\[data-|[A-Za-z-]+\.[a-z]{2,5}$)/.test(text)) return;
  const entries = groups[group];
  if (!entries.has(text)) entries.set(text, []);
  if (entries.get(text).length < 3) entries.get(text).push(context);
}
for (const file of readdirSync(path.join(root, 'web/src')).filter(file => file.endsWith('.ts'))) {
  const source = readFileSync(path.join(root, 'web/src', file), 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const visit = node => {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node))
      && !ts.isImportDeclaration(node.parent) && !ts.isLiteralTypeNode(node.parent)) {
      const text = ts.isTemplateExpression(node) ? node.head.text + node.templateSpans.map((span, i) => `{${i}}${span.literal.text}`).join('') : node.text;
      const line = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
      record(contentFiles.has(file) ? 'content' : 'ui', text, `${file}:${line} ${node.parent.getText(tree).slice(0, 180)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
function jsonStrings(value, location) {
  if (typeof value === 'string') record('ui', value, location);
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) jsonStrings(child, `${location}.${key}`);
}
for (const file of readdirSync(path.join(root, 'web/public/assets')).filter(file => file.endsWith('.json') && file !== 'manifest.json')) {
  if (/layout|content|help/.test(file)) jsonStrings(JSON.parse(readFileSync(path.join(root, 'web/public/assets', file), 'utf8')), file);
}
for (const [name, entries] of Object.entries(groups)) {
  writeFileSync(path.join(out, `${name}-source.json`), JSON.stringify([...entries].map(([source, context]) => ({ source, context })), null, 2));
  console.log(`${name}: ${entries.size} source entries`);
}
