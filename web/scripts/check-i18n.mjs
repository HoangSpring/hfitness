/* global URL, process, console */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Z]):/, '$1:');
const allowlisted = /(?:test|\.test\.)/i;
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
}
walk(root);
const findings = [];
const translationSource = readFileSync(join(root, 'i18n', 'en.ts'), 'utf8');
const objectStart = translationSource.indexOf('export const en =');
const objectOpen = translationSource.indexOf('{', objectStart);
let depth = 0;
let objectEnd = objectOpen;
let quote = '';
for (; objectEnd < translationSource.length; objectEnd += 1) {
  const character = translationSource[objectEnd];
  if (quote) {
    if (character === quote && translationSource[objectEnd - 1] !== '\\') quote = '';
    continue;
  }
  if (character === "'" || character === '"' || character === '`') {
    quote = character;
  } else if (character === '{') {
    depth += 1;
  } else if (character === '}' && --depth === 0) {
    break;
  }
}
const englishDictionary = Function(`return (${translationSource.slice(objectOpen, objectEnd + 1)})`)();
function hasTranslation(key) {
  return key.split('.').reduce((value, part) => value && typeof value === 'object' ? value[part] : undefined, englishDictionary) !== undefined;
}
for (const file of files) {
  if (/\.test\./i.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
    if (!hasTranslation(match[1])) findings.push(`${relative(process.cwd(), file)}: missing translation key ${match[1]}`);
  }
  for (const match of source.matchAll(/\btEnum\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g)) {
    const key = `enum.${match[1]}.${match[2]}`;
    if (!hasTranslation(key)) findings.push(`${relative(process.cwd(), file)}: missing enum translation key ${key}`);
  }
}
for (const file of files) {
  if (allowlisted.test(file)) continue;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const jsxText = line.match(/>([A-Z][A-Za-z][^<{]{1,80})</g) ?? [];
    const attrs = line.match(/(?:placeholder|aria-label|title|alt|label)="([^"]*[A-Za-z][^"]*)"/g) ?? [];
    for (const match of [...jsxText, ...attrs]) {
      if (!/HF|kg|kcal|g\b|ml\b|autoComplete|type=/.test(match) && !/^[\s>]*[A-Z][A-Za-z]+[<"]/.test(match)) {
        findings.push(`${relative(process.cwd(), file)}:${index + 1}: ${match}`);
      }
    }
  });
}
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('i18n scan passed: no likely hardcoded user-facing strings found.');
}
