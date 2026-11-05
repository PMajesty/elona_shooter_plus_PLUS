import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { Simulation } from '../src/simulation.ts';
import { createProfile } from '../src/profile.ts';
import { ItemFactory } from '../src/items.ts';
import { refreshPartyAI } from '../src/party-ai.ts';
import { DEFAULT_GAME_OPTIONS } from '../src/game-options.ts';
const require = createRequire(import.meta.url);
const { chromium } = require('../../.tools/browser-qa/node_modules/playwright-core');
const url = process.argv[2] ?? 'http://127.0.0.1:5175/elona/';
const launch = { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--mute-audio'] };
if (url.startsWith('https:') && process.env.HTTPS_PROXY) {
 const p=new URL(process.env.HTTPS_PROXY);launch.proxy={server:p.origin,username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)};
}
const browser = await chromium.launch(launch);
const evidence = { url, errors: [] };
let page;
try {
 page = await browser.newPage({viewport:{width:1280,height:800}});
 page.setDefaultTimeout(url.startsWith('https:')?45000:15000);page.on('pageerror', e=>evidence.errors.push(e.message));
 const canvas=page.locator('#playfield > canvas'), game=page.locator('#game');
 const data=key=>game.getAttribute('data-'+key);
 const rendered=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const click=async(x,y)=>{await rendered();const b=await canvas.boundingBox();await page.mouse.click(b.x+x*b.width/620,b.y+y*b.height/380);await rendered()};
 const screen=async name=>page.locator(`#game[data-screen="${name}"]`).waitFor();
 const open=async()=>{await page.goto(url);await page.locator('.opening-movie, #game[data-screen="title"]').first().waitFor();if(await page.locator('.opening-movie').isVisible())await page.locator('.opening-movie').click();await page.locator('#game[data-title-buttons-ready="true"]').waitFor();};
 const exported=async()=>{const d=page.waitForEvent('download');await page.keyboard.press('Control+Shift+s');return JSON.parse(await readFile(await(await d).path(),'utf8'));};
 const stored=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 const importSave=async(save,confirm=true)=>{
  const chooser=page.waitForEvent('filechooser');await page.keyboard.press('Control+Shift+o');
  await(await chooser).setFiles({name:'expanded-qa.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
  await page.locator('#game[data-replace-adventure="import"]').waitFor();await click(confirm?260:365,240);
 };

 const shots=[];
 const shot=async (name,keepPointer=false)=>{await rendered();if(!keepPointer)await page.mouse.move(10,10);const file=`.build/localization/qa-${name}.png`;await page.screenshot({path:file});shots.push(file);};
 const toggle=async()=>{const before=await data('language');await page.locator('#language').click();assert.notEqual(await data('language'),before);await rendered();};
 const envelope=sim=>{const save=sim.toSave();Simulation.fromSave(save);return {format:'elona-shooter-browser',version:sim.state.version,appearance:0,simulation:save,profile:createProfile(sim.state.ruleset.id)};};
 const resultScrollCheck=async()=>{
  await rendered();
  const box=await canvas.boundingBox(),scale=box.width/620;
  const region=(x,y,width,height)=>page.screenshot({clip:{x:box.x+x*scale,y:box.y+y*scale,width:width*scale,height:height*scale}});
  const outside=await region(316,289,170,38),inside=await region(316,140,170,135);
  await page.keyboard.press('ArrowDown');await rendered();await shot('result-scrolled');
  assert.ok((await region(316,289,170,38)).equals(outside),'Scrolling painted news below its box');
  assert.ok(!(await region(316,140,170,135)).equals(inside),'The report did not scroll');
  await page.keyboard.press('End');await rendered();await shot('result-end');
  assert.ok((await region(316,289,170,38)).equals(outside),'Report end painted outside its box');
  await page.keyboard.press('Home');await rendered();
  assert.ok((await region(316,140,170,135)).equals(inside),'Home did not restore the first report lines');
  await page.mouse.move(box.x+400*scale,box.y+200*scale);await page.mouse.wheel(0,45);await rendered();
  assert.ok((await region(316,289,170,38)).equals(outside),'Mouse-wheel scrolling painted below the box');
  assert.ok(!(await region(316,140,170,135)).equals(inside),'Mouse-wheel scrolling did not move report text');
  await page.keyboard.press('Home');await rendered();
 };
 await open();
 const bundleUrl=await page.locator('script[type="module"][src]').getAttribute('src');
 const remoteBundle=await page.request.get(new URL(bundleUrl,url).href);
 assert.ok(remoteBundle.ok());
 const bundleName=new URL(bundleUrl,url).pathname.split('/').at(-1);
 const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(digest(await remoteBundle.body()),digest(await readFile(`web/dist/assets/${bundleName}`)));
 evidence.bundle=bundleName;evidence.bundleVerified=true;
 assert.equal(await data('language'),'en');assert.match(await page.title(),/Elona Shooter Plus\+/);await shot('title-en-2x');
 await page.setViewportSize({width:620,height:460});await shot('title-en-1x');
 await toggle();assert.equal(await data('language'),'ru');await shot('title-ru-1x');
 await page.setViewportSize({width:1280,height:800});await shot('title');
 await open();assert.equal(await data('language'),'ru');assert.equal(await data('muted'),'true');
 await click(295,195);await screen('gene');await click(200,214);await shot('gene');
 await toggle();await toggle();assert.equal(await data('hero-class'),'rogue');
 await click(460,315);await screen('mods');await shot('mods');await page.keyboard.press('Escape');await screen('gene');
 await click(310,315);await screen('battle');await shot('battle');await page.keyboard.press('Escape');
 const before=await exported();await toggle();await toggle();assert.deepEqual((await exported()).simulation,before.simulation);await shot('pause');
 await open();await click(295,249);await screen('battle');assert.deepEqual((await exported()).simulation,before.simulation);
 // Названия и справка меняются на месте, не оставляя удалённых слушателей текста.
 await open();await click(295,300);await page.locator('#game[data-help-page="4"]').waitFor();await toggle();await toggle();await toggle();await toggle();await shot('help4');
 const layout=JSON.parse(await readFile('web/public/assets/town-layout.json','utf8')).help;
 for(const n of [1,2,3]){const p=layout.pages[0].children[`help${n}`];await click(layout.position.x+p.x+20,layout.position.y+p.y+10);await page.locator(`#game[data-help-page="${n}"]`).waitFor();await shot('help'+n);}
 await page.keyboard.press('Escape');
 const town=new Simulation(42,{heroClass:'rogue',ruleset:'expanded'});town.state.player.skillPoints=1;town['finishDay']();
 town.state.battleNews=['You have earned total of 100 weapon exp and gain Small Gun 2.', 'Little Girl gains Anti Armor 2.'];
 if(['loot','boss-loot'].includes(town.state.postbattle)){await importSave(envelope(town));await screen(town.state.postbattle);await shot('loot');}
 while(['loot','boss-loot'].includes(town.state.postbattle))town.finishLoot();
 while(town.state.postbattle==='skill'){await importSave(envelope(town));await screen('skill');await shot('skill');town.chooseSkill(town.state.skillChoices[0]);}
 await importSave(envelope(town));await screen('result');await shot('result');
 const longReport=Simulation.fromSave(town.toSave());
 longReport.state.battleNews.push(...Array.from({length:12},(_,i)=>`Parker gains Cool ${i+2}.`));
 await importSave({...envelope(longReport),options:{...DEFAULT_GAME_OPTIONS,disableFireworks:true}});await screen('result');
 await resultScrollCheck();await toggle();await resultScrollCheck();await toggle();
 await page.setViewportSize({width:640,height:400});await resultScrollCheck();
 await page.setViewportSize({width:1280,height:800});
 assert.ok(town.enterTown());
 const factory=new ItemFactory(()=>0.3),modified=factory.generate(1);modified.modMax=3;factory.enchant(modified,4,2);factory.enchant(modified,1,1);factory.enchant(modified,11,1);town.state.inventory[3]=modified;
 await importSave(envelope(town));await screen('town');
 for(const [name,x,y,tab] of [['inn',44,75,'mission'],['tower',44,135,'castle'],['barrack',44,194,'characters'],['equipment',75,218,'equipment'],['smithy',44,275,'shop'],['medals',44,326,'medals']]){await click(x,y);assert.equal(await data('town-tab'),tab);await shot(name);}
 await click(44,275);const box=await canvas.boundingBox();await page.mouse.move(box.x+338*box.width/620,box.y+250*box.height/380);await page.locator('#game[data-item-popup]').waitFor();await shot('item-popup',true);await toggle();await toggle();
 await click(44,194);await toggle();await toggle();assert.deepEqual((await exported()).simulation,town.toSave());
 assert.equal(JSON.parse(await data('options')).showAllyDamage,true);
 await page.keyboard.press('Escape');await page.locator('#game[data-paused="true"]').waitFor();
 const pauseLayout=JSON.parse(await readFile('web/public/assets/town-layout.json','utf8')).pause;
 const pauseParent=pauseLayout.children.options,allyOption=pauseLayout.options.optShowAllyDamage;
 await click(pauseParent.x+allyOption.x+7,pauseParent.y+allyOption.y+8);
 const optedOut=await exported();assert.equal(optedOut.optionsVersion,1);assert.equal(optedOut.options.showAllyDamage,false);
 assert.deepEqual(optedOut.simulation,town.toSave());
 await open();await click(295,249);await screen('town');
 assert.equal(JSON.parse(await data('options')).showAllyDamage,false);
 assert.deepEqual((await exported()).simulation,town.toSave());
 await page.keyboard.press('Escape');await page.locator('#game[data-paused="true"]').waitFor();
 await click(pauseParent.x+allyOption.x+7,pauseParent.y+allyOption.y+8);await page.keyboard.press('Escape');
 await page.setViewportSize({width:640,height:400});await shot('town-100');await page.setViewportSize({width:1280,height:800});
 const ballista=new Simulation(42,{heroClass:'rogue'});
 for(const [x,y] of [[170.25,200.25],[280.5,270.5]]){
  ballista['spawnEnemy']('cata');const enemy=ballista.state.enemies.at(-1);
  enemy.x=x;enemy.y=y;enemy.frame=21;
 }
 await importSave(envelope(ballista));await screen('battle');await page.keyboard.press('Escape');await shot('ballista');
 const defeat=Simulation.fromSave(town.toSave()),checkpoint=defeat.toSave();defeat.startNextDay();defeat.state.castleHp=0;for(let i=0;i<3&&defeat.state.phase==='battle';i++)defeat.tick();
 await importSave({...envelope(defeat),carryCheckpoint:checkpoint});await screen('defeat');await shot('defeat');await click(310,257);await page.locator('#game[data-carry-over-confirmation="true"]').waitFor();await shot('confirmation');await toggle();await toggle();await click(365,240);
 const fallback=await browser.newPage();await fallback.route('**/assets/ru/manifest.json',route=>route.abort());
 await fallback.goto(url);await fallback.locator('#game[data-screen="intro"], #game[data-screen="title"]').first().waitFor();assert.equal(await fallback.locator('#language').isDisabled(),true);await fallback.close();
 assert.deepEqual(evidence.errors,[]);evidence.result='passed';evidence.screenshots=shots;evidence.saveUnchanged=true;evidence.languageRemembered=true;evidence.helpToggle=true;evidence.muted=await data('muted');
 console.log(JSON.stringify(evidence));await writeFile(`.build/localization/${url.startsWith('https:')?'live-':''}browser-evidence.json`,JSON.stringify(evidence,null,2));
}catch(error){console.error('SCREEN',await page?.locator('#game').getAttribute('data-screen'),'ERRORS',evidence.errors);await page?.screenshot({path:'.build/localization/qa-failure.png'});throw error;}finally{await browser.close();}
