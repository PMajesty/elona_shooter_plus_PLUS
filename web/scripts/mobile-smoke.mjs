import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { Simulation } from '../src/simulation.ts';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('../../.tools/browser-qa/node_modules/playwright-core');
const engine = process.argv[2] ?? 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const url = process.argv[3] ?? 'http://127.0.0.1:5175/elona/';
const options = engine === 'chromium' ? { args: ['--mute-audio'], executablePath: process.env.CHROME_PATH } : {};
if (process.env.QA_PROXY && process.env.HTTPS_PROXY) {
  const proxy = new URL(process.env.HTTPS_PROXY);
  options.proxy = { server: proxy.origin, username: decodeURIComponent(proxy.username), password: decodeURIComponent(proxy.password) };
}
const browser = await (engine === 'webkit' ? webkit : chromium).launch(options);
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const game = page.locator('#game'), canvas = page.locator('#playfield > canvas');
  const screen = async name => {
    try { await page.locator(`#game[data-screen="${name}"]`).waitFor({ timeout: 12000 }); }
    catch (error) { console.error('Expected', name, 'saw', await game.getAttribute('data-screen'), await page.locator('#save-status').textContent()); throw error; }
  };
  const data = key => game.getAttribute('data-' + key);
  const point = async (x, y) => {
    const b = await canvas.boundingBox();
    return { x: b.x + x * b.width / 620, y: b.y + y * b.height / 380 };
  };
  const tap = async (x, y) => { const p = await point(x, y); await page.touchscreen.tap(p.x, p.y); };
  const openTitle = async () => {
    await page.goto(url);
    await page.locator('.opening-movie, #game[data-screen="title"]').first().waitFor();
    if (await page.locator('.opening-movie').isVisible()) await page.locator('.opening-movie').tap();
    await screen('title');
    // Кнопки спускаются на свои места в течение первых 48 кадров заставки.
    await page.locator('#game[data-title-buttons-ready="true"]').waitFor();
  };
  const exportPaused = async () => {
    await page.locator('#touch-guide').tap();
    const download = page.waitForEvent('download');
    await page.locator('#touch-export').tap();
    return JSON.parse(await readFile(await (await download).path(), 'utf8')).simulation;
  };
  await openTitle();
  const portrait = await canvas.boundingBox();
  assert.ok(portrait.width >= 388 && portrait.x >= 0 && portrait.x + portrait.width <= 391);
  assert.equal(await data('muted'), 'true');
  await tap(295, 195); await screen('gene');
  await page.locator('#touch-enlarge').tap();
  await page.waitForFunction(() => document.querySelector('#playfield > canvas').clientWidth >= 700);
  await page.locator('#touch-pan input').tap({ position: { x: 90, y: 22 } });
  await tap(310, 315); await screen('battle');
  const initialAmmo = Number(await data('ammo'));
  await tap(165, 214);
  await page.waitForFunction(n => Number(document.querySelector('#game').dataset.ammo) < n, initialAmmo);
  await page.locator('#touch-reload').tap();
  await page.waitForFunction(n => Number(document.querySelector('#game').dataset.ammo) === n, initialAmmo);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => document.querySelector('#playfield > canvas').clientWidth > 600);
  const landscape = await canvas.boundingBox(), controls = await page.locator('#game-controls').boundingBox();
  assert.ok(landscape.x >= 0 && landscape.y >= -1 && controls.x >= landscape.x + landscape.width - 1 && controls.x + controls.width <= 845);
  if (engine === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    const owner = { ...await point(210, 215), id: 1 };
    const dispatch = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    await dispatch('touchStart', [owner]);
    await page.waitForFunction(() => !document.querySelector('#touch-reload').disabled);
    const box = await page.locator('#touch-reload').boundingBox();
    const thumb = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 };
    await dispatch('touchStart', [owner, thumb]);
    await dispatch('touchEnd', [thumb]);
    await page.waitForFunction(() => Number(document.querySelector('#game').dataset.reloadTicks) > 0);
    await dispatch('touchMove', [{ ...await point(255, 238), id: 1 }]);
    await dispatch('touchEnd', []);
    await page.locator('#touch-pause').tap();
    const aimed = await exportPaused();
    assert.ok(Math.abs(aimed.aimX - 255) <= 1 && Math.abs(aimed.aimY - 238) <= 1);
    await page.locator('#touch-pause').tap();
  }
  await page.locator('#touch-fire-at-will').tap();
  await page.locator('#touch-fire-at-will[aria-pressed="true"]').waitFor();
  await page.locator('#touch-fire-at-will').tap();
  const grenades = Number(await data('grenades'));
  await tap(125, 360);
  await page.waitForFunction(n => Number(document.querySelector('#game').dataset.grenades) === n - 1, grenades);
  await page.locator('#touch-pause').tap();
  const saved = await exportPaused();
  await openTitle(); await tap(295, 249); await screen('battle');
  assert.equal(await data('paused'), 'true'); assert.equal(Number(await data('tick')), saved.tick);
  const resumed = await exportPaused();
  assert.equal(resumed.inventory[1].ammo, saved.inventory[1].ammo);
  assert.equal(resumed.rng, saved.rng);

  // Короткий снимок перед последней волной проходит обычные экраны добычи, итогов и города.
  const end = new Simulation(42, { heroClass: 'rogue' });
  end.state.waveIndex = 0; end.state.newWave = true;
  await page.locator('#touch-guide').tap();
  const picker = page.waitForEvent('filechooser');
  await page.locator('#touch-import').tap();
  await (await picker).setFiles({ name: 'final-wave.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'elona-shooter-browser', version: end.state.version, appearance: 0, simulation: end.toSave() })) });
  await page.waitForFunction(() => document.querySelector('#game').dataset.tick === '0');
  await page.locator('#touch-pause').tap(); await screen('loot');
  await tap(310, 315); await screen('result');
  await tap(205, 318); await screen('town');
  await tap(44, 75); await page.locator('#game[data-town-tab="mission"]').waitFor();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ engine, portrait, landscape, savedTick: saved.tick, screen: 'town', muted: await data('muted') }));
} finally {
  await browser.close();
}
