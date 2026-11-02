import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('bundled help preserves the four source pages, every tip and the nine credits links', () => {
  const source = readFileSync(new URL('../../src/original/MainTimeline.as', import.meta.url), 'utf8');
  const layout = JSON.parse(readFileSync(new URL('../public/assets/town-layout.json', import.meta.url), 'utf8')).help;
  const tipsBody = source.split('public function insertHelp()')[1].split('public function refreshPlayer')[0];
  const tips = [...tipsBody.matchAll(/window4_mc\.help\.text \+= "(.*?)";/g)]
    .map(match => JSON.parse(`"${match[1].replaceAll("\\'", "'")}"`));
  assert.equal(tips.length, 13);
  assert.deepEqual(layout.tips, tips);
  const linksBody = source.split('public function procLink(')[1].split('internal function frame7')[0];
  const links = Object.fromEntries([...linksBody.matchAll(/url\[(\d+)\] = "(.*?)";/g)].filter(match => match[2]).map(match => [match[1], match[2]]));
  assert.equal(Object.keys(links).length, 9);
  assert.deepEqual(layout.links, links);
  assert.equal(layout.pages.length, 4);
  for (const [index, page] of layout.pages.entries()) {
    assert.equal(page.image, `help${index + 1}`);
    assert.ok(existsSync(new URL(`../public/assets/screens/${page.image}.png`, import.meta.url)));
    for (let tab = 1; tab <= 4; tab++) assert.ok(page.children[`help${tab}`]);
  }
});
