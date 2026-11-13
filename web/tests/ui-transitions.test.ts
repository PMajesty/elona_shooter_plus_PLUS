import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PanelSlide, REFERENCE_FRAME_MS, SLIDE_DISTANCE, HELP_SLIDE_DELAY, RESULT_UNDERLAY_SHIFT, TOWN_ENTRY_FRAMES,
  slideOffset, slideFinished, fadeLevel, fadeFinished, blackInBrightness, beginWindowAlpha, beginFinished,
  pauseSlideProgress, townEntryFrames, townEntryFinished, easeOutExpo } from '../src/ui-transitions.ts';

const frame = (count: number) => count * REFERENCE_FRAME_MS;
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('event windows slide from x=590 to MENU_X with the original animeTime^1.7 steps', () => {
  close(590 - SLIDE_DISTANCE, -15.587619764971691);
  assert.equal(slideOffset(0, 3), SLIDE_DISTANCE);
  // delay>3: первые 3 кадра окно стоит на месте, на 4-м делает первый шаг 15^1.7.
  assert.equal(slideOffset(frame(3), 3), SLIDE_DISTANCE);
  close(slideOffset(frame(4), 3), SLIDE_DISTANCE - 15 ** 1.7);
  close(slideOffset(frame(3.5), 3), SLIDE_DISTANCE - 15 ** 1.7 / 2);
  assert.equal(slideOffset(frame(19), 3), 0);
  assert.ok(slideFinished(frame(19), 3) && !slideFinished(frame(18.9), 3));
  // Справка становится видимой уже после первого шага.
  close(slideOffset(0, HELP_SLIDE_DELAY), SLIDE_DISTANCE - 15 ** 1.7);
  assert.ok(slideFinished(frame(15), HELP_SLIDE_DELAY));
});

test('fade, black-in, begin, pause and town entry follow the original frame counters', () => {
  assert.equal(fadeLevel(0), 1);
  close(fadeLevel(frame(1)), 0.8);
  close(fadeLevel(frame(5)), 0.4);
  assert.equal(fadeLevel(frame(9)), 0);
  assert.ok(fadeFinished(frame(9)) && !fadeFinished(frame(8.9)));
  close(blackInBrightness(frame(20)), 0.5);
  assert.equal(blackInBrightness(frame(40)), 1);
  assert.equal(beginWindowAlpha(frame(70)), 1);
  close(beginWindowAlpha(frame(75)), 0.5);
  assert.equal(beginWindowAlpha(frame(80)), 0);
  assert.ok(beginFinished(frame(90)) && !beginFinished(frame(89.9)));
  assert.equal(pauseSlideProgress(frame(9)), 1);
  close(pauseSlideProgress(frame(3)), 1 / 3);
  assert.equal(townEntryFrames(frame(45)), TOWN_ENTRY_FRAMES);
  assert.ok(townEntryFinished(frame(31)) && !townEntryFinished(frame(30.9)));
  // window3_mc копирует позицию при delay==30, когда окно итогов сдвинулось 29 раз.
  close(RESULT_UNDERLAY_SHIFT, 29 * 1.1);
  assert.equal(easeOutExpo(0), 0);
  assert.equal(easeOutExpo(1), 1);
});

test('PanelSlide keeps progress across rebuilds of the same window and restarts for a new one', () => {
  const slide = new PanelSlide();
  const panel = { x: 10 };
  assert.equal(slide.begin('loot', 0), true);
  slide.track(panel, 0);
  assert.equal(panel.x, 10 + SLIDE_DISTANCE);
  slide.update(frame(10));
  const midway = panel.x;
  assert.ok(midway > 10 && midway < 10 + SLIDE_DISTANCE);
  // Перестройка того же окна после перемещения предмета продолжает въезд.
  const rebuilt = { x: 10 };
  assert.equal(slide.begin('loot', frame(10)), false);
  slide.track(rebuilt, frame(10));
  assert.equal(rebuilt.x, midway);
  assert.ok(slide.sliding(frame(10)));
  slide.update(frame(30));
  assert.equal(rebuilt.x, 10);
  assert.ok(!slide.sliding(frame(30)));
  // Новое окно или явный перезапуск (навигация города) въезжает с начала.
  const next = { x: 0 };
  assert.equal(slide.begin('result', frame(30)), true);
  slide.track(next, frame(30));
  assert.equal(next.x, SLIDE_DISTANCE);
  assert.equal(slide.begin('result', frame(31), undefined, true), true);
  slide.clear();
  assert.ok(!slide.sliding(frame(31)));
});
