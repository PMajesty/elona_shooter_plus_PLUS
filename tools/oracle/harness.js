const status = document.querySelector('#status');
const output = document.querySelector('#results');
const stage = document.querySelector('#stage');
const PREFIX = 'ELONA_ORACLE:';
const STARTUP_PREFIX = 'ELONA_STARTUP:';
const requestedSuite = new URLSearchParams(location.search).get('suite');
const suite = ['castle-upgrades', 'party-combat', 'party-progression', 'party-hiring', 'party-ai', 'waves', 'prepared-waves', 'third-day-waves', 'fourth-day-waves', 'fifth-day-waves', 'sixth-day-waves', 'seventh-day-waves', 'seventh-town', 'boss-special', 'sixth-town', 'barbarian', 'fly', 'archer', 'boss-ai', 'hero', 'shoot', 'equipment', 'rest', 'second-town', 'third-town', 'fourth-town', 'fifth-town', 'castle', 'projectiles', 'modifications', 'combat', 'geometry', 'loot', 'progression', 'town', 'town-preparation'].includes(requestedSuite) ? requestedSuite : 'reload';
const suites = {
  'castle-upgrades': {swf:'/castle-upgrades-reference.swf',build:'/castle-upgrades-build-report.json',report:'/api/castle-upgrades-report',clock:'Original Castle House and Wall tile purchases with controlled town inputs; fresh town preparation and native UI timing are separate.'},
  'party-combat': {swf:'/party-combat-reference.swf',build:'/party-combat-build-report.json',report:'/api/party-combat-report',clock:'Original companion damage, credit, Guardian retaliation and postbattle growth with controlled RNG.'},
  'party-progression': {swf:'/party-progression-reference.swf',build:'/party-progression-build-report.json',report:'/api/party-progression-report',clock:'Original companion skill selection, growth, party bonuses and wages with controlled RNG; live AI is separate.'},
  'party-hiring': {swf:'/party-hiring-reference.swf',build:'/party-hiring-build-report.json',report:'/api/party-hiring-report',clock:'Original recruitment, dismissal and equipment transactions with retained inactive records; live AI is separate.'},
  'party-ai': {swf:'/party-ai-reference.swf',build:'/party-ai-build-report.json',report:'/api/party-ai-report',clock:'Original companion targeting, frame/timer steps and action requests; full native scheduling is separate.'},

  'seventh-day-waves': {swf:'/seventh-day-waves-reference.swf',build:'/seventh-day-waves-build-report.json',report:'/api/seventh-day-waves-report',clock:'Original mission6 prepared on day6, then waves on day7, including RANGED branch selection and exact RNG; live combat is separate.'},
  'seventh-town': {swf:'/seventh-town-reference.swf',build:'/seventh-town-build-report.json',report:'/api/seventh-town-report',clock:'Original day7 town preparation, recruit growth, tax and earned-title salary; native campaign scheduling is separate.'},
  'boss-special': {swf:'/boss-special-reference.swf',build:'/boss-special-build-report.json',report:'/api/boss-special-report',clock:'Original boss special attack, explicit child-frame and projectile steps; native full-battle scheduling is not asserted.'},
  'sixth-day-waves': {swf:'/sixth-day-waves-reference.swf',build:'/sixth-day-waves-build-report.json',report:'/api/sixth-day-waves-report',clock:'Original mission5 prepared on day5, then waves on day6, including AIR/BATCH1 and Barbarian selection; live combat is separate.'},
  'sixth-town': {swf:'/sixth-town-reference.swf',build:'/sixth-town-build-report.json',report:'/api/sixth-town-report',clock:'Original day6 town preparation, tax and title actions, plus a controlled following settlement; native full campaign scheduling is separate.'},
  barbarian: {swf:'/barbarian-reference.swf',build:'/barbarian-build-report.json',report:'/api/barbarian-report',clock:'Original Barbarian AI, damage and explicit child-frame steps, including rage and geometry; native scheduling is not asserted.'},
  fly: {swf:'/fly-reference.swf',build:'/fly-build-report.json',report:'/api/fly-report',clock:'Original Fly AI then explicit child-frame step, fresh/pooled/reset cases and filled body/shadow grids; native timeline scheduling is not asserted.'},
  'fifth-town': {swf:'/fifth-town-reference.swf',build:'/fifth-town-build-report.json',report:'/api/fifth-town-report',clock:'Original day5 town generation and Holy Grail mission preparation, plus controlled level-two/three recruit growth; native town interaction is separate.'},
  'fifth-day-waves': {swf:'/fifth-day-waves-reference.swf',build:'/fifth-day-waves-build-report.json',report:'/api/fifth-day-waves-report',clock:'Original mission4 prepared on day4, then waves on day5, including AIR/BATCH1 random boundaries; live combat is separate.'},
  'fourth-town': {swf:'/fourth-town-reference.swf',build:'/fourth-town-build-report.json',report:'/api/fourth-town-report',clock:'Original day4 town generation, MOD-sale overwrite and medal60/61 absorption, plus controlled level-two recruit growth in all nine classes; native town interaction is separate.'},
  'fourth-day-waves': {swf:'/fourth-day-waves-reference.swf',build:'/fourth-day-waves-build-report.json',report:'/api/fourth-day-waves-report',clock:'Original mission3 prepared on day3, then waves on day4, including controlled BATCH1 random boundaries; live combat is separate.'},
  'boss-ai': {swf:'/boss-ai-reference.swf',build:'/boss-ai-build-report.json',report:'/api/boss-ai-report',clock:'Original boss AI then explicit ally1 child-frame step; native timeline scheduling is not asserted.'},
  archer: {swf:'/archer-reference.swf',build:'/archer-build-report.json',report:'/api/archer-report',clock:'Original Archer AI, explicit child-frame stepping, arrow effects and filled shape grids; native scheduling remains separate.'},
  'third-day-waves': {swf:'/third-day-waves-reference.swf',build:'/third-day-waves-build-report.json',report:'/api/third-day-waves-report',clock:'Original mission2 prepared on day2, then waves on day3, including controlled zero and high random boundaries.'},
  reload: {swf:'/reference.swf',build:'/build-report.json',report:'/api/report',clock:'Manual calls to original methods; native frame/timer scheduling is outside this check.'},
  waves: {swf:'/waves-reference.swf',build:'/waves-build-report.json',report:'/api/waves-report',clock:'Synchronous original mission and wave generation under controlled xorshift32; no live enemy AI.'},
  'prepared-waves': {swf:'/prepared-waves-reference.swf',build:'/prepared-waves-build-report.json',report:'/api/prepared-waves-report',clock:'Original level1 mission preparation on day1 followed by wave generation on day2; Rest interaction and live combat are separate checks.'},
  hero: {swf:'/hero-reference.swf',build:'/hero-build-report.json',report:'/api/hero-report',clock:'Original Sheriff creation and level-up methods with controlled randomness; UI and subsequent combat are separate checks.'},
  shoot: {swf:'/shoot-reference.swf',build:'/shoot-build-report.json',report:'/api/shoot-report',clock:'Synchronous original shoot with controlled aim and randomness; original vector hits are observed per pellet, and native port geometry needs separate checks.'},
  equipment: {swf:'/equipment-reference.swf',build:'/equipment-build-report.json',report:'/api/equipment-report',clock:'Controlled original equipment input and player steps; native event scheduling is outside this comparison.'},
  rest: {swf:'/rest-reference.swf',build:'/rest-build-report.json',report:'/api/rest-report',clock:'Original Rest dialog and acknowledgment through battle entry; the decorative Begin wait is skipped with the original frame handler, and town preparation is a separate check.'},
  'second-town': {swf:'/second-town-reference.swf',build:'/second-town-build-report.json',report:'/api/second-town-report',clock:'Original day2 town preparation with retained recruit and item metadata; medal60 absorption is compared, and day3 combat is outside this boundary.'},
  'third-town': {swf:'/third-town-reference.swf',build:'/third-town-build-report.json',report:'/api/third-town-report',clock:'Original day3 town preparation with retained recruit and item metadata, Shop Token calendar loot and medal60 absorption; day4 combat is outside this boundary.'},
  castle: {swf:'/castle-reference.swf',build:'/castle-build-report.json',report:'/api/castle-report',clock:'Controlled original castle damage, protection and solo trait effects; native enemy attack scheduling is outside this comparison.'},
  projectiles: {swf:'/projectiles-reference.swf',build:'/projectiles-build-report.json',report:'/api/projectiles-report',clock:'Original projectile launch and manually stepped lifecycle/hit cases, plus a bounded native birth-order observation and vertical-trajectory diagnostics; this is not a full native battle replay.'},
  modifications: {swf:'/modifications-reference.swf',build:'/modifications-build-report.json',report:'/api/modifications-report',clock:'Original Upgrade and MOD dialog methods with controlled items, eligibility and randomness; raw and explicitly corrected upgrade cases remain separate, and ordinary mouse interaction needs separate checks.'},
  combat: {swf:'/combat-reference.swf',build:'/combat-build-report.json',report:'/api/combat-report',clock:'Synchronous original spawn and single-pellet hit methods under controlled xorshift32; full shotgun spread and native scheduling are outside this check.'},
  geometry: {swf:'/geometry-reference.swf',build:'/geometry-build-report.json',report:'/api/geometry-report',clock:'Original vector body/shadow point grids after explicit frame setup; one synchronous case per diagnostic frame, not native battle scheduling.'},
  loot: {swf:'/loot-reference.swf',build:'/loot-build-report.json',report:'/api/loot-report',clock:'Synchronous original item and loot generation under controlled xorshift32; inventory interaction and campaign transitions are separate checks.'},
  progression: {swf:'/progression-reference.swf',build:'/progression-build-report.json',report:'/api/progression-report',clock:'Original Sheriff skill choices and descriptions under controlled randomness; later combat effects are separate checks.'},
  town: {swf:'/town-reference.swf',build:'/town-build-report.json',report:'/api/town-report',clock:'Controlled original result settlement, action points and Free Repair methods; full town stock and next-day preparation are outside this boundary.'},
  'town-preparation': {swf:'/town-preparation-reference.swf',build:'/town-preparation-build-report.json',report:'/api/town-preparation-report',clock:'Original first-town shop, cards, mission configuration and recruit generation in source order; save I/O, town interactions, Rest and day2 combat are outside this boundary.'},
};
const paths = suites[suite];
document.querySelector('#report-link').href = paths.report;

// Сравнение повторных запусков исключает время измерения, но сохраняет каждое событие оригинала.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}

async function runOriginal(number) {
  status.textContent = `Original run ${number}/2: waiting for automatic initialization…`;
  status.dataset.state = 'running';
  const player = window.RufflePlayer.newest().createPlayer();
  // Два ограниченных запуска сохраняют приостановленный экземпляр до закрытия страницы.
  // Удаление первого элемента может закрыть AudioContext с ожидающим разрешения resume().
  for (const previous of stage.children) previous.hidden = true;
  stage.append(player);
  const api = player.ruffle();
  const records = [];
  const startup = {run:number,observerAttached:false,events:[]};
  report.startup.push(startup);
  let finish, reject;
  const completed = new Promise((resolve, fail) => { finish = resolve; reject = fail; });
  const timeout = setTimeout(() => reject(new Error(`Original run ${number} did not finish within 60 seconds.`)), 60000);
  const observe = message => {
    if (message.startsWith(STARTUP_PREFIX)) {
      try {
        const event = JSON.parse(message.slice(STARTUP_PREFIX.length));
        startup.events.push(event);
        status.dataset.startupFrame = String(event.frame);
        status.dataset.startupLogoFrame = String(event.logoFrame ?? '');
        status.dataset.startupTick = String(event.tick);
      } catch (error) { reject(error); }
      return;
    }
    if (!message.startsWith(PREFIX)) return;
    try {
      const record = JSON.parse(message.slice(PREFIX.length));
      records.push(record);
      output.textContent = records.map(row => JSON.stringify(row)).join('\n');
      if (record.type === 'error') reject(new Error(record.message));
      if (record.type === 'complete') finish(records);
    } catch (error) { reject(error); }
  };
  try {
    await api.load({url:paths.swf,autoplay:'on',unmuteOverlay:'hidden',allowScriptAccess:false});
    // Ruffle 0.7.1 сохраняет наблюдателя только после создания внутреннего экземпляра load().
    api.volume = 0;
    api.traceObserver = observe;
    startup.observerAttached = true;
    return await completed;
  } finally {
    clearTimeout(timeout);
    api.suspend();
  }
}

const report = {
  format:'elona-original-oracle',version:1,
  runtime:'@ruffle-rs/ruffle 0.7.1', suite,
  capturedAt:new Date().toISOString(),
  clock:paths.clock,
  runs:[], startup:[], status:'running',
};
try {
  const response = await fetch(paths.build);
  if (!response.ok) throw new Error('Build the diagnostic SWF before running this page.');
  report.build = await response.json();
  for (let number = 1; number <= 2; number++) report.runs.push(await runOriginal(number));
  report.repeatable = JSON.stringify(stable(report.runs[0])) === JSON.stringify(stable(report.runs[1]));
  if (!report.repeatable) throw new Error('The two original traces differ. Comparison expectations must not be accepted yet.');
  if (report.runs.some(run => run.at(-1)?.ok !== true || !run.some(row => row.type === 'snapshot'))) throw new Error('Original fixture did not produce a successful complete trace.');
  report.status = 'passed';
  status.textContent = `PASS: two identical original traces, ${report.runs[0].filter(row => row.type === 'snapshot').length} snapshots each. Run the port comparator against the saved report.`;
} catch (error) {
  report.status = 'failed'; report.error = error.message;
  status.textContent = `FAIL: ${error.message}`;
} finally {
  status.dataset.state = report.status;
  status.className = report.status === 'passed' ? 'pass' : 'fail';
  const saved = await fetch(paths.report, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
  if (!saved.ok) { status.textContent += ` Report could not be saved (HTTP ${saved.status}).`; status.dataset.state = 'failed'; }
}
