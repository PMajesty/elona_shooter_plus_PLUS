const status = document.querySelector('#status');
const output = document.querySelector('#results');
const stage = document.querySelector('#stage');
const PREFIX = 'ELONA_ORACLE:';
const requestedSuite = new URLSearchParams(location.search).get('suite');
const suite = ['waves', 'combat'].includes(requestedSuite) ? requestedSuite : 'reload';
const suites = {
  reload: {swf:'/reference.swf',build:'/build-report.json',report:'/api/report',clock:'Manual calls to original methods; native frame/timer scheduling is outside this check.'},
  waves: {swf:'/waves-reference.swf',build:'/waves-build-report.json',report:'/api/waves-report',clock:'Synchronous original mission and wave generation under controlled xorshift32; no live enemy AI.'},
  combat: {swf:'/combat-reference.swf',build:'/combat-build-report.json',report:'/api/combat-report',clock:'Synchronous original spawn and single-pellet hit methods under controlled xorshift32; full shotgun spread and native scheduling are outside this check.'},
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
  let finish, reject;
  const completed = new Promise((resolve, fail) => { finish = resolve; reject = fail; });
  const timeout = setTimeout(() => reject(new Error(`Original run ${number} did not finish within 60 seconds.`)), 60000);
  const observe = message => {
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
  runs:[], status:'running',
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
