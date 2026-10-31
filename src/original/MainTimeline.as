package shootem_fla
{
   import caurina.transitions.*;
   import caurina.transitions.properties.*;
   import com.kongregate.as3.client.*;
   import fl.controls.ComboBox;
   import fl.events.*;
   import flash.accessibility.*;
   import flash.display.*;
   import flash.errors.*;
   import flash.events.*;
   import flash.filters.*;
   import flash.geom.*;
   import flash.media.*;
   import flash.net.*;
   import flash.system.*;
   import flash.text.*;
   import flash.ui.*;
   import flash.utils.*;
   import mochi.as3.*;
   
   [SWF(width="620", height="380", backgroundColor="#000000", frameRate="30")]
   public dynamic class MainTimeline extends MovieClip
   {
      
      public var loaded:*;
      
      public const _medalBeta:int = 90;
      
      public var sound_reloaded1:Sound;
      
      public var sound_reloaded3:Sound;
      
      public var sound_reloaded2:Sound;
      
      public var bgAlpha:MovieClip;
      
      public var sound_drop:Sound;
      
      public var sound_gun1:Sound;
      
      public var sound_gun2:Sound;
      
      public var sound_gun3:Sound;
      
      public var sound_gun4:Sound;
      
      public var sound_gun5:Sound;
      
      public var sound_gun6:Sound;
      
      public var sound_gun7:Sound;
      
      public var sound_gun8:Sound;
      
      public var sound_gun9:Sound;
      
      public const _devRogue:int = 3;
      
      public const _maxRunner:int = 8;
      
      public var frenzyMode:int;
      
      public var kong_mc2:MovieClip;
      
      public const _medalRagnarok:int = 92;
      
      public var window_mc:MovieClip;
      
      public var debugLoader:int;
      
      public var debugDay:int;
      
      public var upgradeCount:int;
      
      public var itemName:*;
      
      public var radio_mc:Array;
      
      public const _sheep:int = 3;
      
      public const _medalFirework:int = 93;
      
      public var airLine:int;
      
      public var i:int;
      
      public var blendCounter:int;
      
      public var shakeStrX:*;
      
      public var p:*;
      
      public const _elonaUrl:* = "http://homepage3.nifty.com/rfish/index_e.html";
      
      public var shakeStrY:*;
      
      public var w:int;
      
      public var z:int;
      
      public var fireAtWill:Boolean;
      
      public var groundWidth:int;
      
      public var weaponRange:*;
      
      public var t:int;
      
      public var maxEnemy:int;
      
      public var eventDialog:int;
      
      public const _air:int = 1;
      
      public const _aiNormal:int = 0;
      
      public const _defenseLine:int = 455;
      
      public var encList:*;
      
      public var targetBoss:*;
      
      public var sound_gold1:Sound;
      
      public const _aiFireAtWill:int = 6;
      
      public var critArray:*;
      
      public const _invPlayer:int = 20;
      
      public var traitLvFix:int;
      
      public var window2_mc:MovieClip;
      
      public var maxChara:int;
      
      public var popTime:*;
      
      public var vol:MovieClip;
      
      public var upgradeRef:Array;
      
      public var sound_click1:Sound;
      
      public var sound_launch:Sound;
      
      public var sound_night:Sound;
      
      public var debugBattle:int;
      
      public const _devGuard:int = 9;
      
      public const _dialogActSleep:int = 7;
      
      public const _eventLootBoss:int = 8;
      
      public var maxSave:int;
      
      public var sound_rampageEnemy:Sound;
      
      public const _dialogActPray:int = 9;
      
      public const _dialogTrash:int = 9;
      
      public const _dialogRefreshStock:int = 1;
      
      public var ammoText:TextField;
      
      public var ID:*;
      
      public var sound_chickenAttack:Sound;
      
      public const _helpUrl:* = "http://homepage3.nifty.com/rfish/index_e.html";
      
      public var sound_deadBoss1:Sound;
      
      public var sound_deadBoss2:Sound;
      
      public var sound_pop1:Sound;
      
      public var blurMcHelp:*;
      
      public var armor:*;
      
      public const _eventEnd:int = 1;
      
      public const _encImpact:int = 8;
      
      public var castleHPText:TextField;
      
      public var armorButton:SimpleButton;
      
      public var dragSlot:int;
      
      public const _maxItem:int = 40;
      
      public const _maxMedal:int = 200;
      
      public const _medalCritical1:int = 70;
      
      public const _medalCritical2:int = 71;
      
      public const _maxDev:int = 9;
      
      public var missionLevel:int;
      
      public const _typeToken:int = 6;
      
      public const _aiHero:int = -1;
      
      public const _medalCritical3:int = 72;
      
      public var inventory:Object;
      
      public var window4_mc:MovieClip;
      
      public const _eventClear:int = 4;
      
      public const _medalSister1:int = 53;
      
      public const _medalSister2:int = 54;
      
      public const _medalSister3:int = 55;
      
      public var encRef:*;
      
      public var lvCycle:int;
      
      public var sound_deadChicken:Sound;
      
      public var delay:int;
      
      public var col:*;
      
      public var longest:TextField;
      
      public var mission:Object;
      
      public var playerY:Array;
      
      public const _devMilitia:int = 4;
      
      public var dialogAction:int;
      
      public var amb:SoundChannel;
      
      public const _encReloading:int = 2;
      
      public const _medalClass1:int = 65;
      
      public var sound_battleEnd:Sound;
      
      public var lvText:TextField;
      
      public const _medalClass2:int = 66;
      
      public var upgradeRefStr:Array;
      
      public var kongregate:*;
      
      public var soundCs:*;
      
      public var textCarryOver:TextField;
      
      public var radioCount:int;
      
      public const _medalClass3:int = 67;
      
      public const _medalClass4:int = 68;
      
      public var sound_good:Sound;
      
      public var TRAIT:*;
      
      public var menuLine:int;
      
      public var eRef:*;
      
      public const _medalKongregate:int = 91;
      
      public const _dialogHire:int = 6;
      
      public var castleCounter:int;
      
      public var slot:int;
      
      public var skipAd:int;
      
      public const _normal:int = 0;
      
      public var moneyText:TextField;
      
      public const _encArmor:int = 6;
      
      public var shakeY:*;
      
      public var groundLine:int;
      
      public var shakeX:*;
      
      public var sister:MovieClip;
      
      public var customCursor:MovieClip;
      
      public const _medalDay1:int = 40;
      
      public var sound_bg_forest:Sound;
      
      public const _medalDay3:int = 42;
      
      public const _medalDay4:int = 43;
      
      public const _medalDay5:int = 44;
      
      public const _medalDay6:int = 45;
      
      public const _medalDay7:int = 46;
      
      public const _encAccuracy:int = 1;
      
      public const _medalDay2:int = 41;
      
      public var medalPage:*;
      
      public var buttonArray:Array;
      
      public var classList:Array;
      
      public var pop:*;
      
      public const _nc:int = 5;
      
      public var CALC:*;
      
      public var eventList:Array;
      
      public const _dialogSell:int = 1;
      
      public var defenseLine:int;
      
      public var sound_fireball:Sound;
      
      public var hintCount2:*;
      
      public const _typeNormal:int = 0;
      
      public var sound_complete:Sound;
      
      public var dragItem:int;
      
      public const _typeSniper:int = 1;
      
      public var maxAlly:int;
      
      public var ammobar:MovieClip;
      
      public var filterDrop:DropShadowFilter;
      
      public const _dialogActClaim:int = 13;
      
      public var sound_pray1:Sound;
      
      public var page:int;
      
      public const _pc:int = 0;
      
      public const _maxTarget:int = 3;
      
      public var upgrade_mc:Array;
      
      public var text_rampage:*;
      
      public var airWidth:int;
      
      public var menuList:Array;
      
      public const _encAutoReload:int = 10;
      
      public var trans:Array;
      
      public const _dialogActEat:int = 8;
      
      public const _typeUse:int = 4;
      
      public var gameResult:Boolean;
      
      public var toTownMenu:Boolean;
      
      public var kongAPI:KongregateAPI;
      
      public var PARTY:*;
      
      public const _typeItem:int = 2;
      
      public var time:int;
      
      public var chainSound:*;
      
      public var PARTYLV:*;
      
      public var news:String;
      
      public const _dialogRecruit:int = 4;
      
      public var sound_search:Sound;
      
      public var menuId:int;
      
      public const _waveNormal:int = 0;
      
      public const _dialogFreeRepair:int = 3;
      
      public var player:Object;
      
      public const _eventLoot:int = 3;
      
      public var sound_exp1:Sound;
      
      public var cancelFirework:*;
      
      public const _ignore:int = 9;
      
      public var unlocked:Boolean;
      
      public var frenzyBar:MovieClip;
      
      public var fireworkCount:*;
      
      public var armorEmu:int;
      
      public var item:int;
      
      public var titleList:*;
      
      public var sound_repair1:Sound;
      
      public var sound_bg_town:Sound;
      
      public const G_RANGE:int = 50;
      
      public var blendType:int;
      
      public const _dragon:int = 15;
      
      public var g_count:*;
      
      public var trash:SimpleButton;
      
      public var sound_throw1:Sound;
      
      public var nameBoy:Array;
      
      public const _aiNoAir:int = 1;
      
      public const _dialogNewRecruit:int = 2;
      
      public var sound_mute:Sound;
      
      public var debugStartDay:int;
      
      public const _medalHardcore1:int = 95;
      
      public const _medalHardcore3:int = 97;
      
      public const _ratdrop:int = 18;
      
      public const _medalHardcore2:int = 96;
      
      public var inventory_mc:Array;
      
      public var upgradeItem:*;
      
      public const G_CLASS:int = 0;
      
      public var geneClass:int;
      
      public const _dialogActEgg:int = 11;
      
      public var sound_damage1:Sound;
      
      public var dbgWin:*;
      
      public const _crow:int = 6;
      
      public var sound_firework:Sound;
      
      public const debugName:* = ["random","ogre","archer","sheep","lava","cata","crow","barb","knight","spider","fly","bomb","tank","dino","ghost","dragon","bird","rat","ratdrop"];
      
      public var orderIsOpen:Boolean;
      
      public var debugTown:int;
      
      public const _bomb:int = 11;
      
      public const _version:int = 1304;
      
      public var currentHint:int;
      
      public var sound_battleBegin:Sound;
      
      public var traitRef:*;
      
      public const _stageTitle:int = 0;
      
      public const _knight:int = 8;
      
      public const _maxWeaponSkill:int = 5;
      
      public var filter1:Array;
      
      public var filter2:Array;
      
      public const _lava:int = 4;
      
      public var gamePaused:Boolean;
      
      public var frenzyText:TextField;
      
      public const _fly:int = 10;
      
      public var sound_crow:Sound;
      
      public var filter1a:BitmapFilter;
      
      public const G_BASE:int = 900;
      
      public var sound_medal:Sound;
      
      public var sound_scroll1:Sound;
      
      public const _eventBegin:int = 5;
      
      public var aiTarget:*;
      
      public var missionButton:SimpleButton;
      
      public var maxParty:int;
      
      public var filter2a:BitmapFilter;
      
      public const _devSniper:int = 2;
      
      public var medal_mc:Array;
      
      public var sound_card1:Sound;
      
      public var game:Object;
      
      public var debugGroup:String;
      
      public var gameOver:Boolean;
      
      public var bag:MovieClip;
      
      public var wexpList:*;
      
      public var selectBaseX:int;
      
      public var chainMode:*;
      
      public const _encLeech:int = 9;
      
      public var selectBaseY:int;
      
      public const _spider:int = 9;
      
      public const _dialogActTrain:int = 15;
      
      public var tgCard:int;
      
      public var sound_low:Sound;
      
      public const _typeMod:int = 5;
      
      public const _cata:int = 5;
      
      public const urlKong:* = "http://www.kongregate.com/?gamereferral=elonashooter";
      
      public var sound_gun10:Sound;
      
      public var sound_gun11:Sound;
      
      public var sound_gun12:Sound;
      
      public var sound_gun13:Sound;
      
      public var sound_gun14:Sound;
      
      public var sound_gun15:Sound;
      
      public const _armor:int = 2;
      
      public var debugUnlockClass:int;
      
      public const _encNull:int = 0;
      
      public var itemDesc:*;
      
      public var bg:MovieClip;
      
      public var eDupe:*;
      
      public var continueButtonOrgX:*;
      
      public var bt:SimpleButton;
      
      public var bgChange:int;
      
      public var actList:*;
      
      public const _boss:int = 999;
      
      public var blurMc:*;
      
      public var medalCount:int;
      
      public var ce:int;
      
      public const _devDuelist:int = 7;
      
      public var debugMedal:int;
      
      public var pic_mc:Array;
      
      public var ci:int;
      
      public const _invRefer:int = 49;
      
      public var cs:int;
      
      public var defHint:*;
      
      public var fixedLvMax:int;
      
      public const _chicken:int = 19;
      
      public const _maxTrait:int = 1000;
      
      public var REF:*;
      
      public var sound_impact1:Sound;
      
      public var sound_rampage:Sound;
      
      public var cb:int;
      
      public var sound_cata:Sound;
      
      public var immune:Boolean;
      
      public var helpMode:int;
      
      public var debugBatch:int;
      
      public const _archer:int = 2;
      
      public var info:LoaderInfo;
      
      public var posTrans:Array;
      
      public const _aiArmor:int = 5;
      
      public const _dialogRobVisitor:int = 4;
      
      public var invSlotCount:int;
      
      public var gameContinued:Boolean;
      
      public var sound_bad:Sound;
      
      public var sound_bow1:Sound;
      
      public var sound_bow2:Sound;
      
      public var debugShowUpdate:int;
      
      public var sisterList:*;
      
      public var i2:*;
      
      public var expText:TextField;
      
      public var dbgMode:int;
      
      public var kongregateEmu:int;
      
      public var castle:MovieClip;
      
      public var select:int;
      
      public const _dialogActParty:int = 14;
      
      public var runner_mc:Array;
      
      public const _medalBadge1:int = 86;
      
      public const _medalBadge2:int = 87;
      
      public var medalButton:SimpleButton;
      
      public const _maxInv:int = 50;
      
      public var sound_eat1:Sound;
      
      public var window3_mc:MovieClip;
      
      public var frenzyBar2:MovieClip;
      
      public var sound_dead1:Sound;
      
      public var sound_dead2:Sound;
      
      public var sound_dead3:Sound;
      
      public var sound_dead4:Sound;
      
      public var sound_dead5:Sound;
      
      public var sound_dead7:Sound;
      
      public var sound_dead9:Sound;
      
      public var sound_dead6:Sound;
      
      public var sound_dead8:Sound;
      
      public const _stageTown:int = 2;
      
      public var eventModeEnabled:*;
      
      public var drag:Boolean;
      
      public var stats_mc:Array;
      
      public const _aiNoArmor:int = 2;
      
      public const _medalElona:int = 94;
      
      public const _invShop:int = 0;
      
      public const _invAlly:int = 40;
      
      public var popMax:int;
      
      public const _dialogQuit:int = 2;
      
      public var sound_tank2:Sound;
      
      public var sound_beep:Sound;
      
      public var menuButton:SimpleButton;
      
      public const _encFireRate:int = 3;
      
      public const _dialogActTaunt:int = 12;
      
      public const _encAmmo:int = 7;
      
      public var shakeDirY:*;
      
      public const _ghost:int = 14;
      
      public const _bird:int = 16;
      
      public const _encAutofire:int = 12;
      
      public const _encMuzzleBrake:int = 13;
      
      public var upgradeMax:Array;
      
      public var shakeCount:int;
      
      public var logo:MovieClip;
      
      public var sound_killed:Sound;
      
      public const _devSheriff:int = 6;
      
      public var shakeDirX:*;
      
      public const _dialogUpgrade:int = 8;
      
      public var maxButton:int;
      
      public var sound_pay1:Sound;
      
      public const _typeShotgun:int = 2;
      
      public var shopButton:SimpleButton;
      
      public const _tank:int = 12;
      
      public const _devRanger:int = 5;
      
      public var helpButton:SimpleButton;
      
      public var debugTownDay:int;
      
      public const _dino:int = 13;
      
      public var shakeRange:*;
      
      public const _dialogCarryOver:int = 7;
      
      public var invIcon_mc:Array;
      
      public var soundCounter:int;
      
      public var bottomBar:MovieClip;
      
      public var equipMode:int;
      
      public const _typeMachine:int = 3;
      
      public var beta:int;
      
      public var apText:TextField;
      
      public const _eventMode:int = 9;
      
      public const urlExclusive:* = "http://www.kongregate.com/games/noanoa/elona-shooter";
      
      public var currentPop:int;
      
      public var sound_tank:Sound;
      
      public var nextAlert:*;
      
      public const _dialogDismiss:int = 3;
      
      public var gameStage:int;
      
      public var showUpdate:*;
      
      public var cloud:MovieClip;
      
      public const _dialogActSearch:int = 10;
      
      public const _devNoble:int = 8;
      
      public var invSlot_mc:Array;
      
      public var castleButton:SimpleButton;
      
      public const _dialogRecycle:int = 5;
      
      public const _dialogRecharge:int = 6;
      
      public var debugEnemyNum:int;
      
      public var debug:int;
      
      public var sound_bag1:Sound;
      
      public var draw_count:*;
      
      public var sound_goodshot:Array;
      
      public const _typeGun:int = 1;
      
      public var skipLoader:int;
      
      public const _defTag:int = 60;
      
      public var runner_speed:Array;
      
      public const _devHunter:int = 1;
      
      public var sound_chicken:Sound;
      
      public const _medalNoDamage1:int = 60;
      
      public const _medalNoDamage3:int = 62;
      
      public const _medalNoDamage4:int = 63;
      
      public var popList:Array;
      
      public var gameoverLogo:MovieClip;
      
      public const _dialogActHire:int = 16;
      
      public var helpButtonOrgX:*;
      
      public const _waveAir:int = 1;
      
      public const _medalNoDamage2:int = 61;
      
      public const _encLivingWeapon:int = 11;
      
      public const _eventLevel:int = 7;
      
      public const _maxPic:* = 22;
      
      public var mouseHidden:Boolean;
      
      public var continueButton:SimpleButton;
      
      public var idx:Object;
      
      public var sound_chain1:Sound;
      
      public var sound_chain2:Sound;
      
      public var sound_chain3:Sound;
      
      public var upgradeHint:Array;
      
      public var hintCount:int;
      
      public var debugId:int;
      
      public var sound_reloading1:Sound;
      
      public var sound_reloading2:Sound;
      
      public var charaButton:SimpleButton;
      
      public var sound_reloading3:Sound;
      
      public var protTime:int;
      
      public var dayText:TextField;
      
      public const _ogre:int = 1;
      
      public var bg_color:ColorTransform;
      
      public const _stageLoader:int = 4;
      
      public var medal:Array;
      
      public var kong_mc:MovieClip;
      
      public var targetWall:*;
      
      public const _stageResult:int = 3;
      
      public var waveRef:*;
      
      public var saveBox:ComboBox;
      
      public const _aiAir:int = 4;
      
      public var selectID:int;
      
      public const _strEmptySave:* = "Empty Save";
      
      public const _typeSell:int = 3;
      
      public const _dialogMod:int = 5;
      
      public var shakeDec:*;
      
      public var cursor_mc:*;
      
      public var invIconCount:int;
      
      public var runner_x:Array;
      
      public var runner_y:Array;
      
      public var sound_award:Sound;
      
      public const _encAir:int = 5;
      
      public const _eventAlly:int = 2;
      
      public const _medalChicken2:int = 51;
      
      public const _medalChicken3:int = 52;
      
      public const G_GEN:int = 100;
      
      public const _medalChicken1:int = 50;
      
      public var old_timer:*;
      
      public var timer:Timer;
      
      public const _eventGene:int = 6;
      
      public const chainSoundLength:* = 2462;
      
      public var critMsg:*;
      
      public var popupMc:*;
      
      public const _rat:int = 17;
      
      public const _encDamage:int = 4;
      
      public var elonaButton:SimpleButton;
      
      public var devGroup:*;
      
      public const _aiDefault:int = 0;
      
      public var sound_puls:Sound;
      
      public var newGameButton:SimpleButton;
      
      public var equipButton:SimpleButton;
      
      public const _stageBattle:int = 1;
      
      public var newGameButtonOrgX:*;
      
      public var sound_lightning:Sound;
      
      public const _barb:int = 7;
      
      public const _medalAction1:int = 80;
      
      public const _medalAction3:int = 82;
      
      public const _medalAction4:int = 83;
      
      public const _medalAction5:int = 84;
      
      public var eRefId:*;
      
      public var eCount:*;
      
      public const _medalAction2:int = 81;
      
      public var gunSound:*;
      
      public var statsCount:int;
      
      public var enemyArray:Array;
      
      public var player_mc:Array;
      
      public var sound_party:Sound;
      
      public var cursorX:*;
      
      public var cursorY:*;
      
      public var toBlackScreen:int;
      
      public var sound_mod:Sound;
      
      public var chainPos:*;
      
      public var gameDialog:Boolean;
      
      public var startFromTown:Boolean;
      
      public var cardCount:int;
      
      public var textCount:int;
      
      public const _aiNeither:int = 3;
      
      public var sound_defend:Sound;
      
      public var cardSound:*;
      
      public var fadeCount:int;
      
      public var hero:int;
      
      public var runner_pic:Array;
      
      public var dialog_mc:MovieClip;
      
      public function MainTimeline()
      {
         super();
         addFrameScript(0,frame1,2,frame3,5,frame6,6,frame7,8,frame9,12,frame13,21,frame22,26,frame27,32,frame33,56,frame57,64,frame65,70,frame71,80,frame81);
      }
      
      public function onEnterFrame_help(param1:Event) : *
      {
         stage.setChildIndex(window4_mc,stage.numChildren - 1);
         if(window4_mc.animeTime)
         {
            --window4_mc.animeTime;
            window4_mc.visible = true;
            window4_mc.x -= Math.pow(window4_mc.animeTime,1.7);
            if(window4_mc.animeTime == 0)
            {
               window4_mc.help1.mouseEnabled = true;
               window4_mc.help2.mouseEnabled = true;
               window4_mc.help3.mouseEnabled = true;
               window4_mc.help4.mouseEnabled = true;
            }
            else if(window4_mc.getChildByName("help1"))
            {
               window4_mc.help1.mouseEnabled = false;
               window4_mc.help2.mouseEnabled = false;
               window4_mc.help3.mouseEnabled = false;
               window4_mc.help4.mouseEnabled = false;
            }
         }
      }
      
      public function museumMedal() : *
      {
         if(medalNum() >= 25)
         {
            getMedal(_medalBadge1);
         }
         if(game.day >= 100 && game.HC == true || idx.daysHC >= 100)
         {
            getMedal(_medalBadge2);
         }
      }
      
      public function selectEnemy(param1:*, param2:*, param3:*, param4:*) : *
      {
         var _loc5_:int = 0;
         var _loc6_:int = 0;
         var _loc8_:* = undefined;
         var _loc9_:Boolean = false;
         var _loc7_:int = -1;
         var _loc10_:int = param1;
         if(_loc10_ > fixedLvMax)
         {
            _loc10_ = fixedLvMax;
         }
         var _loc11_:* = int(_loc10_ - Math.random() * Math.random() * _loc10_);
         _loc5_ = 0;
         for(; _loc5_ < eCount; _loc5_++)
         {
            if(!(_loc5_ == eRefId[_fly] && Math.random() > 0.2))
            {
               if(eRef[_loc5_].lv <= param1)
               {
                  if(_loc7_ != -1)
                  {
                     if(eRef[_loc5_].lv == eRef[_loc7_].lv)
                     {
                        if(Math.random() > 0.5)
                        {
                           continue;
                        }
                     }
                     else if(Math.abs(_loc11_ - eRef[_loc5_].lv) > Math.abs(_loc11_ - eRef[_loc7_].lv))
                     {
                        continue;
                     }
                  }
                  _loc9_ = false;
                  _loc6_ = 0;
                  while(_loc6_ < param3.length)
                  {
                     if(eRef[_loc5_][param3[_loc6_]] != true)
                     {
                        _loc9_ = true;
                        break;
                     }
                     _loc6_++;
                  }
                  if(_loc9_ == false)
                  {
                     _loc6_ = 0;
                     while(_loc6_ < eDupe.length)
                     {
                        if(_loc5_ == eDupe[_loc6_])
                        {
                           _loc9_ = true;
                           break;
                        }
                        _loc6_++;
                     }
                  }
                  if(!_loc9_)
                  {
                     _loc7_ = _loc5_;
                  }
               }
            }
         }
         if(_loc7_ == -1)
         {
            debugGroup += "#";
            _loc7_ = int(eRefId[3]);
            if(Math.random() > 0.7)
            {
               _loc7_ = int(eRefId[17]);
            }
            if(mission.fixedLv > 1 && Math.random() > 0.7)
            {
               _loc7_ = int(eRefId[19]);
            }
            if(mission.fixedLv > 3 && Math.random() > 0.5)
            {
               _loc7_ = int(eRefId[17]);
            }
            if(mission.fixedLv > 7 && Math.random() > 0.5)
            {
               _loc7_ = int(eRefId[7]);
            }
            if(mission.fixedLv > 13 && Math.random() > 0.5)
            {
               _loc7_ = int(eRefId[9]);
            }
            if(mission.fixedLv > 17 && Math.random() > 0.4)
            {
               _loc7_ = int(eRefId[1]);
            }
            if(mission.fixedLv > 22 && Math.random() > 0.4)
            {
               _loc7_ = int(eRefId[8]);
            }
         }
         if(debugId)
         {
            _loc7_ = int(eRefId[debugId]);
         }
         eDupe.push(_loc7_);
         _loc8_ = eRef[_loc7_].power;
         _loc7_ = int(eRef[_loc7_].id);
         _loc6_ = mission.power * param2 / 100 / _loc8_;
         if(_loc6_ < 1)
         {
            _loc6_ = 1;
         }
         _loc5_ = 0;
         while(_loc5_ < _loc6_)
         {
            pop[param4].push(_loc7_);
            _loc5_++;
         }
         debugGroup += "" + debugName[_loc7_] + "*" + _loc6_ + "(" + _loc10_ + ") ";
      }
      
      public function versionFix() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         mission.wave = int(mission.wave);
         mission.bossWave = int(mission.bossWave);
         if(game.submit == undefined)
         {
            game.submit = true;
         }
         if(game.version == undefined)
         {
            game.version = 0;
         }
         if(game.version < 100)
         {
            _loc3_ = 0;
            while(_loc3_ < maxAlly + 1)
            {
               player.wexp = [];
               player.wexpRef = [];
               player.wexp[_loc3_] = [];
               _loc1_ = 0;
               while(_loc1_ < _maxWeaponSkill)
               {
                  player.wexp[_loc3_][_loc1_] = 0;
                  _loc1_++;
               }
               _loc3_++;
            }
         }
         if(game.version < 140)
         {
            idx.beta = beta;
            player.optBoss = [];
            player.optWall = [];
            player.onMark = [];
            _loc3_ = 0;
            while(_loc3_ < maxAlly + 1)
            {
               player.optBoss[_loc3_] = false;
               player.optWall[_loc3_] = false;
               _loc3_++;
            }
         }
         if(game.version < 1100)
         {
            game.HC = false;
         }
         if(game.version < 1120)
         {
            showUpdate = true;
         }
         if(game.version < 1301)
         {
            _loc3_ = 0;
            if(inventory.livingWeapon == null)
            {
               inventory.livingWeapon = [];
            }
            while(_loc3_ < inventory.id.length)
            {
               if(inventory.livingWeapon[_loc3_] == null)
               {
                  inventory.livingWeapon[_loc3_] = 0;
               }
               _loc3_++;
            }
         }
      }
      
      public function updateCastleMenu() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         var _loc3_:String = null;
         var _loc4_:Boolean = false;
         updateUpgradeHint();
         window2_mc.unkeep.text = calcUnkeep();
         upgradeCount = 0;
         window2_mc.locker.visible = false;
         window2_mc.locker.mouseEnabled = false;
         _loc1_ = 0;
         while(_loc1_ < 8)
         {
            _loc2_ = _loc1_ + page * 8;
            upgrade_mc[_loc1_] = new upgrades() as MovieClip;
            upgrade_mc[_loc1_].x = 150 + int(_loc1_ % 4) * 100;
            upgrade_mc[_loc1_].y = 140 + int(_loc1_ / 4) * 110;
            _loc3_ = upgradeRefStr[_loc2_];
            if(_loc2_ != 0 && game[upgradeRef[_loc2_]] > 0)
            {
               _loc3_ += " Lv " + game[upgradeRef[_loc2_]];
            }
            upgrade_mc[_loc1_].upgradeName.text = _loc3_;
            upgrade_mc[_loc1_].upgradeCost.text = getUpgradeCost(_loc2_);
            upgrade_mc[_loc1_].hintTxt = [_loc3_,upgradeHint[_loc2_][0],upgradeHint[_loc2_][1],upgradeMax[_loc2_],""];
            upgrade_mc[_loc1_].upgradePic.hintTxt = [_loc3_,upgradeHint[_loc2_][0],upgradeHint[_loc2_][1],upgradeMax[_loc2_],""];
            upgrade_mc[_loc1_].upgradePic.gotoAndStop(_loc2_ + 2);
            upgrade_mc[_loc1_].upgradePic.mouseEnabled = false;
            if(getUpgradeCost(_loc2_) == -1)
            {
               upgrade_mc[_loc1_].upgradeCost.text = 0;
               window2_mc.locker.visible = true;
               upgrade_mc[_loc1_].upgradePic.gotoAndStop(30);
            }
            _loc4_ = true;
            if(getUpgradeCost(_loc2_) > player.money[_pc] || getUpgradeCost(_loc2_) == 0)
            {
               upgrade_mc[_loc1_].upgradeCost.textColor = 13369344;
               _loc4_ = false;
            }
            if(_loc4_)
            {
               upgrade_mc[_loc1_].upgradeCost.textColor = 204;
               upgrade_mc[_loc1_].upgradeButton.mouseEnabled = true;
               upgrade_mc[_loc1_].alpha = 1;
            }
            else
            {
               upgrade_mc[_loc1_].upgradeButton.mouseEnabled = false;
               upgrade_mc[_loc1_].alpha = 0.3;
            }
            upgrade_mc[_loc1_].possible = _loc4_;
            window2_mc.addChild(upgrade_mc[_loc1_]);
            ++upgradeCount;
            _loc1_++;
         }
      }
      
      public function swapStuff(param1:int, param2:int) : *
      {
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         for(_loc3_ in inventory)
         {
            _loc4_ = inventory[_loc3_][param1];
            inventory[_loc3_][param1] = inventory[_loc3_][param2];
            inventory[_loc3_][param2] = _loc4_;
         }
      }
      
      public function deleteGame() : *
      {
         game.version = _version;
         var _loc1_:* = SharedObject.getLocal("elonas" + idx.slot);
         if(_loc1_)
         {
            _loc1_.data.deleted = true;
            if(game.HC == true)
            {
               popInfo("Game Deleted(Hardcore Mode).");
            }
            else
            {
               popInfo("Game Deleted.");
            }
         }
      }
      
      public function updateCharaList() : *
      {
         var _loc1_:* = undefined;
         window2_mc.recruitText.visible = false;
         _loc1_ = 0;
         while(_loc1_ < maxAlly + 1)
         {
            if(player.exist[_loc1_] != false)
            {
               player_mc[_loc1_] = new ally3() as MovieClip;
               player_mc[_loc1_].x = 160 + _loc1_ * 62;
               if(_loc1_ == maxAlly)
               {
                  player_mc[_loc1_].x += 10;
                  window2_mc.recruitText.visible = true;
               }
               player_mc[_loc1_].y = 146;
               player_mc[_loc1_].pic = player.pic[_loc1_];
               player_mc[_loc1_].gotoAndPlay("stand");
               player_mc[_loc1_].pname.text = player.name[_loc1_];
               player_mc[_loc1_].lv.text = "L:" + player.lv[_loc1_] + "\nE:" + player.exp[_loc1_] / 10;
               player_mc[_loc1_].lv.mouseEnabled = false;
               player_mc[_loc1_].pname.mouseEnabled = false;
               player_mc[_loc1_].chara1.mouseEnabled = false;
               window2_mc.addChild(player_mc[_loc1_]);
            }
            _loc1_++;
         }
      }
      
      public function castleAbsorb() : *
      {
         return 1 - game.sandbag * 0.05;
      }
      
      public function procHit(shooterId:*, weaponIndex:*, hitX:*, hitY:*, damage:*) : *
      {
         var enemyIndex:int = 0;
         var hasHitAnyEnemy:Boolean = false;
         hasHitAnyEnemy = false;
         enemyIndex = 0;
         for(; enemyIndex < maxEnemy; enemyIndex++)
         {
            if(enemyArray[enemyIndex].isFree() == false)
            {
               if(enemyArray[enemyIndex].mc.shadowHit == false)
               {
                  if(enemyArray[enemyIndex].mc.shadow.hitTestPoint(hitX,hitY,true))
                  {
                     continue;
                  }
               }
               if(enemyArray[enemyIndex].mc.hitTestPoint(hitX,hitY,true))
               {
                  var critType:int = 0;
                  if(Math.random() * 100 < CALC.SENSE(shooterId))
                  {
                     critType = 2;
                  }
                  if(hitY > enemyArray[enemyIndex].crit[2] + enemyArray[enemyIndex].y && hitY < enemyArray[enemyIndex].crit[3] + enemyArray[enemyIndex].y)
                  {
                     if(hitX > enemyArray[enemyIndex].crit[0] + enemyArray[enemyIndex].x && hitX < enemyArray[enemyIndex].crit[1] + enemyArray[enemyIndex].x)
                     {
                        if(enemyArray[enemyIndex].isDead() == false)
                        {
                           critType = 1;
                        }
                     }
                  }
                  if(enemyArray[enemyIndex].isDead() == false)
                  {
                     hasHitAnyEnemy = true;
                  }
                  if(player.trait[shooterId][TRAIT.DUELIST] > 0)
                  {
                     player.frenzy[shooterId] += CALC.DUELIST(shooterId) / (inventory.shootRate[weaponIndex] * 0.03) + 0.1;
                     if(player.frenzy[shooterId] > calcDuelistMaxDamage(player.trait[shooterId][TRAIT.DUELIST]))
                     {
                        player.frenzy[shooterId] = calcDuelistMaxDamage(player.trait[shooterId][TRAIT.DUELIST]);
                     }
                  }
                  enemyArray[enemyIndex].knockBack = CALC.SHERIFF(shooterId);
                  enemyArray[enemyIndex].damage(damage,weaponIndex,hitX,hitY,shooterId,critType);
               }
            }
         }
         return hasHitAnyEnemy;
      }
      
      public function getTrait(param1:int, param2:int) : *
      {
         return ["1","2"];
      }
      
      internal function frame13() : *
      {
         gotoAndStop("init");
      }
      
      public function removeInvSlot() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < invSlotCount)
         {
            window2_mc.removeChild(invSlot_mc[_loc1_]);
            _loc1_++;
         }
      }
      
      internal function frame27() : *
      {
         debugDay = 80;
         critMsg = ["HEAD  SHOT!","LIMB  SHOT!","CORE  SHOT!","ABDOMEN SHOT!","TORSO  SHOT!","NULL"];
         critArray = [0,1,0,0,0,2,0,0,4,3,0,2,2,1,0,1,0,0,0,4];
         if(amb != null)
         {
            amb.stop();
         }
         amb = sound_bg_forest.play(0,999999) as SoundChannel;
         cb = 0;
         col = [];
         col[0] = [0,0,0,0,0,0];
         col[1] = [0,0,0,0,0,0];
         protTime = 0;
         textCount = 0;
         pop = [];
         popTime = [];
         eCount = 0;
         eRef = [];
         eDupe = [];
         eRefId = [];
         bg_color = new ColorTransform();
         waveRef = [_waveAir];
         setEnemy(_boss,9999,500,[]);
         setEnemy(_bomb,9999,50,[]);
         setEnemy(_ratdrop,9999,80,[]);
         setEnemy(_sheep,0,70,["BATCH"]);
         setEnemy(_rat,1,50,["BATCH","MASS"]);
         setEnemy(_archer,4,100,["RANGED"]);
         setEnemy(_crow,3,110,["AIR","MASS"]);
         setEnemy(_fly,6,30,["AIR"]);
         setEnemy(_barb,7,95,["BATCH","MASS"]);
         setEnemy(_lava,9,300,["KAMIKAZE","MASS"]);
         setEnemy(_cata,11,300,["BOSS"]);
         setEnemy(_spider,13,160,["BATCH","MASS"]);
         setEnemy(_ghost,15,260,["BATCH","MASS"]);
         setEnemy(_ogre,17,350,["BATCH","MASS"]);
         setEnemy(_knight,19,280,["BATCH","MASS"]);
         setEnemy(_bird,22,420,["AIR"]);
         setEnemy(_tank,25,400,["BOSS"]);
         setEnemy(_dino,28,550,["BOSS","MASS"]);
         setEnemy(_dragon,32,550,["BOSS"]);
         setEnemy(_chicken,2,90,["BATCH","MASS"]);
         if(mission.bossDay == true)
         {
            text_effect("Boss Day!");
         }
         preGenerateWave();
         sisterList = [];
         i = 0;
         while(i < mission.wave + 1)
         {
            sisterList[i] = 0;
            ++i;
         }
         if(game.sister)
         {
            i = 0;
            while(i < game.sister)
            {
               ++sisterList[int(Math.random() * mission.wave) + 1];
               ++i;
            }
         }
         if(player.ai[_pc] == _aiHero)
         {
            hero = _pc;
         }
         else
         {
            hero = -1;
         }
         updateFrenzyBar();
         apText.visible = false;
         text_rampage = ["","[6] Great shot!","[5] Fantastic!","[4] Shena is dancing!","[3] Jure blesses you!","[2] Lulwy is pleased!","[1] ....meoowwwww!"];
         stop();
         bottomBar.gotoAndStop(1);
         initPartySkill();
         fireAtWill = false;
         mission.resultBefore = player.money[_pc];
         mission.resultTaken = 0;
         news = "";
         root.x = 0;
         root.y = 0;
         immune = false;
         bgChange = 0;
         castleCounter = 0;
         gameStage = _stageBattle;
         shakeCount = 0;
         ci = _invPlayer;
         customCursor.x = mouseX;
         customCursor.y = mouseY;
         if(game.optionColor == true)
         {
            customCursor.gotoAndStop(3);
         }
         else
         {
            customCursor.gotoAndStop(1);
         }
         menuButton.mouseEnabled = false;
         resetBG();
         customCursor.visible = true;
         updateInterface();
         updateInventory();
         updateAlly();
         Mouse.hide();
         startBattleMedal();
         stage.addEventListener(KeyboardEvent.KEY_DOWN,KeyDown);
         stage.addEventListener(MouseEvent.MOUSE_OVER,mouseOverHandler);
         stage.addEventListener(MouseEvent.MOUSE_DOWN,mouseDownFunc);
         stage.addEventListener(MouseEvent.MOUSE_UP,mouseUpFunc);
         stage.addEventListener(MouseEvent.MOUSE_MOVE,MouseMove);
         addEventListener(Event.ENTER_FRAME,onEnterFrame);
         timer.addEventListener(TimerEvent.TIMER,onTick);
         timer.start();
      }
      
      public function kongregateLink() : *
      {
         var request:URLRequest;
         sound_click1.play();
         popInfo("A Webpage has been opend in your browser.");
         request = new URLRequest(urlKong);
         try
         {
            navigateToURL(request);
         }
         catch(e:Error)
         {
         }
         getMedal(_medalKongregate);
      }
      
      public function randLv(param1:*, param2:*) : *
      {
         return int(param1 * (1 - Math.random() * (1 - Math.random() * param2)));
      }
      
      internal function frame33() : *
      {
         gameoverLogo.carryOver.gotoAndStop(1);
         if(game.HC == true || game.day < 2)
         {
            gameoverLogo.carryOver.visible = false;
         }
         else
         {
            gameoverLogo.carryOver.visible = true;
            if(game.carryOver == true)
            {
               gameoverLogo.carryOver.gotoAndStop(2);
            }
         }
      }
      
      public function calcUnkeep() : *
      {
         var _loc1_:int = 0;
         _loc1_ += (game.house - 1) * 50;
         _loc1_ += game.repair * 60;
         _loc1_ += (game.castleMHP - 40) * 2;
         _loc1_ += game.sandbag * 40;
         _loc1_ += game.storage * 40;
         if(medal[_medalBadge1])
         {
            _loc1_ -= 40;
         }
         _loc1_ += game.looter * 5;
         _loc1_ += game.museum * 15;
         if(_loc1_ < 0)
         {
            _loc1_ = 0;
         }
         return _loc1_;
      }
      
      public function museumFix() : *
      {
         return 1 + (game.museum - 1) * 0.3;
      }
      
      public function orderRollOver(param1:ListEvent) : void
      {
         var _loc2_:uint = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         _loc2_ = param1.rowIndex as uint;
         _loc3_ = ["",""];
         _loc4_ = window2_mc.hint;
         _loc5_ = window2_mc.order.getItemAt(_loc2_).data;
         _loc4_.alpha = 1;
         if(_loc5_ == _aiHero)
         {
            _loc3_ = ["Hero Mode","You can manually control your character in the hero mode. The commander\'s items can\'t be used in this mode."];
         }
         if(_loc5_ == _aiNormal)
         {
            _loc3_ = ["Attack mobs in weapon range","The character attacks mobs within his weapon range. Note that regardless of any order given, the shorter the distance between him and the target, the quicker he will be abled to aim and shoot."];
         }
         if(_loc5_ == _aiNoArmor)
         {
            _loc3_ = ["Don\'t attack armored mobs","The character attacks mobs within his weapon range but ignores armored mobs."];
         }
         if(_loc5_ == _aiNoAir)
         {
            _loc3_ = ["Don\'t attack air mobs","The character attacks mobs within his weapon range but ignores air mobs."];
         }
         if(_loc5_ == _aiNeither)
         {
            _loc3_ = ["Don\'t attack either","The character attacks mobs within his weapon range but ignores neither armored mobs nor air mobs."];
         }
         if(_loc5_ == _aiAir)
         {
            _loc3_ = ["Attack air mobs","The character only attacks air mobs. He does not attack other types of mobs but his weapon range is increased without the accuracy penalty."];
         }
         if(_loc5_ == _aiArmor)
         {
            _loc3_ = ["Attack armored mobs","The character only attacks armored mobs. He does not attack other types of mobs but his weapon range is increased without the accuracy penalty."];
         }
         if(_loc5_ == _aiFireAtWill)
         {
            _loc3_ = ["Always fire at will","The same effect as if he were in \"Fire at will\" mode. The character can attack any mob in the battle field but suffer significant accuracy penalty."];
         }
         _loc4_.itemName.text = _loc3_[0];
         _loc4_.itemDesc.text = _loc3_[1];
         _loc4_.itemDesc2.text = "";
         _loc4_.typeText.visible = false;
         _loc4_.maxText.visible = false;
         window2_mc.setChildIndex(window2_mc.hint,window2_mc.numChildren - 1);
         window2_mc.hint.visible = true;
         orderIsOpen = true;
      }
      
      public function MouseLDownFunc_result(param1:MouseEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:* = 0;
         _loc2_ = stage.mouseX;
         _loc3_ = stage.mouseY;
         if(vol.hitTestPoint(_loc2_,_loc3_,true))
         {
            toggleMute();
            return;
         }
         if(gameDialog)
         {
            if(dialog_mc.yes.hitTestPoint(_loc2_,_loc3_,true))
            {
               endDialog(true);
            }
            else
            {
               endDialog(false);
            }
            return;
         }
         if(toTownMenu)
         {
            return;
         }
         if(fadeCount)
         {
            return;
         }
         if(window2_mc.animeTime)
         {
            return;
         }
         if(ce == _eventBegin)
         {
            return;
         }
         if(ce == _eventClear)
         {
            fadeCount = 9;
            return;
         }
         if(gamePaused)
         {
            pauseProc();
            return;
         }
         if(ce == _eventMode)
         {
            if(window2_mc.backButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               sound_click1.play();
               eventList.push(_eventGene);
               fadeCount = 9;
               eventModeEnabled = false;
               if(unlocked == true)
               {
                  unlocked = false;
               }
               else
               {
                  unlocked = true;
               }
               popInfo("Game MODs have been reset.");
               return;
            }
            if(window2_mc.detailWin.visible == true)
            {
               if(window2_mc.detailWin.closeButton.hitTestPoint(_loc2_,_loc3_,true))
               {
                  window2_mc.detailWin.visible = false;
               }
               return;
            }
            if(window2_mc.detailButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               sound_scroll1.play();
               window2_mc.detailWin.x = 145;
               window2_mc.detailWin.visible = true;
            }
         }
         if(ce == _eventLevel)
         {
            _loc4_ = 0;
            while(_loc4_ < radioCount)
            {
               if(radio_mc[_loc4_].hitTestPoint(_loc2_,_loc3_,true))
               {
                  sound_click1.play();
                  cs = _loc4_;
                  updateLevel();
               }
               _loc4_++;
            }
         }
         if(ce == _eventGene)
         {
            if(window2_mc.unlockButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               sound_click1.play();
               changeUnlock();
            }
            _loc4_ = 0;
            while(_loc4_ < _maxPic)
            {
               if(pic_mc[_loc4_].hitTestPoint(_loc2_,_loc3_,true))
               {
                  sound_click1.play();
                  cs = _loc4_;
                  updateGene();
                  break;
               }
               _loc4_++;
            }
            _loc4_ = 3;
            while(_loc4_ >= 0)
            {
               if(radio_mc[_loc4_].hitTestPoint(_loc2_,_loc3_,true))
               {
                  if(radio_mc[_loc4_].mouseEnabled == false)
                  {
                     sound_beep.play();
                     popInfo("You have to win a medal!");
                     return;
                  }
                  sound_click1.play();
                  geneClass = _loc4_;
                  if(unlocked)
                  {
                     geneClass += 4;
                  }
                  updateGene();
                  break;
               }
               _loc4_--;
            }
         }
         if(drag == false)
         {
            if(menuButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               pauseMenu();
               return;
            }
            if(ce == _eventGene && window2_mc.extraButton.visible == true && Boolean(window2_mc.extraButton.hitTestPoint(mouseX,mouseY,true)))
            {
               sound_click1.play();
               eventList.push(_eventMode);
               fadeCount = 9;
               eventModeEnabled = true;
               return;
            }
            if(ce == _eventEnd && Boolean(window2_mc.mc_playMore.visible) && Boolean(window2_mc.mc_playMore.kongButton.hitTestPoint(mouseX,mouseY,true)))
            {
               kongregateLink();
               return;
            }
            if(ce == _eventLoot || ce == _eventLootBoss || ce == _eventGene || ce == _eventEnd || ce == _eventLevel || ce == _eventMode)
            {
               if(window2_mc.procButton.visible == true && Boolean(window2_mc.procButton.hitTestPoint(mouseX,mouseY,true)))
               {
                  sound_click1.play();
                  if(ce == _eventEnd)
                  {
                     window2_mc.procButton.visible = false;
                     Tweener.addTween(window2_mc.mc_playMore,{
                        "alpha":0,
                        "time":1
                     });
                     delay = 0;
                     toTownMenu = true;
                     fadeCount = 9;
                     return;
                  }
                  if(ce == _eventLevel)
                  {
                     ++player.trait[_pc][radio_mc[cs].id];
                  }
                  fadeCount = 9;
                  if(ce == _eventMode)
                  {
                     stage.focus = stage;
                     setGameOption();
                     if(startFromTown)
                     {
                        toTownMenu = true;
                        gameStart();
                        ce = eventList.pop();
                        ce = _eventGene;
                        delay = 0;
                        return;
                     }
                  }
                  return;
               }
            }
         }
         if(ce == _eventLoot || ce == _eventLootBoss)
         {
            invDrag();
         }
      }
      
      public function setEnemy(param1:*, param2:*, param3:*, param4:*) : *
      {
         var _loc5_:int = 0;
         var _loc6_:int = eCount;
         eRef[_loc6_] = {};
         eRef[_loc6_].id = param1;
         eRef[_loc6_].lv = param2;
         eRef[_loc6_].power = param3;
         eRefId[param1] = _loc6_;
         _loc5_ = 0;
         while(_loc5_ < param4.length)
         {
            eRef[_loc6_][param4[_loc5_]] = true;
            _loc5_++;
         }
         ++eCount;
      }
      
      public function updateInvSlots(param1:int) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:int = 0;
         var _loc5_:* = undefined;
         if(param1 == -1)
         {
            _loc2_ = -1;
         }
         else
         {
            _loc2_ = int(invSlot_mc[param1].id);
         }
         window2_mc.warning.visible = false;
         _loc3_ = 0;
         while(_loc3_ < invSlotCount)
         {
            _loc4_ = _pc;
            _loc5_ = invSlot_mc[_loc3_].id;
            invSlot_mc[_loc3_].filters = [];
            if(invSlot_mc[_loc3_].id >= _invAlly)
            {
               _loc4_ = invSlot_mc[_loc3_].id - _invAlly;
            }
            if(inventory.type[_loc2_] == _typeToken && invSlot_mc[_loc3_].op == 0)
            {
               invSlot_mc[_loc3_].filters = [new GlowFilter(4160956)];
            }
            if(equipMode == 1)
            {
               if(invSlot_mc[_loc3_].op == 0 || inventory.num[_loc5_] <= 0 || inventory.type[_loc5_] != _typeGun || _loc5_ >= _invAlly)
               {
                  invSlot_mc[_loc3_].alpha = 0.5;
               }
            }
            else if(equipMode == 2)
            {
               if(inventory.ammoMax[_loc5_] == 0 || inventory.num[_loc5_] <= 0 || inventory.type[_loc5_] != _typeUse || _loc5_ >= _invAlly)
               {
                  invSlot_mc[_loc3_].alpha = 0.5;
               }
            }
            else if(!(invSlot_mc[_loc3_].op == -1 || invSlot_mc[_loc3_].id < _invPlayer))
            {
               if(_loc2_ == -1)
               {
                  invSlot_mc[_loc3_].alpha = 1;
               }
               else
               {
                  if(invSlot_mc[param1].op == 0 && inventory.num[_loc5_] > 0)
                  {
                     invSlot_mc[_loc3_].alpha = 0.5;
                  }
                  if(_loc2_ >= _invAlly && inventory.num[_loc5_] > 0 && inventory.type[_loc5_] != _typeGun)
                  {
                     invSlot_mc[_loc3_].alpha = 0.5;
                  }
                  if(_loc2_ >= _invAlly && inventory.num[_loc5_] > 0 && inventory.type[_loc5_] == _typeGun && player.trait[_loc2_ - _invAlly][inventory.reqTrait[_loc5_]] < inventory.reqLv[_loc5_])
                  {
                     invSlot_mc[_loc3_].alpha = 0.5;
                  }
                  if(_loc4_ != _pc && inventory.type[_loc2_] != _typeGun && inventory.type[_loc2_] != _typeMod)
                  {
                     invSlot_mc[_loc3_].alpha = 0.5;
                  }
                  if(_loc4_ != _pc && inventory.num[_invAlly + _loc4_] <= 0 && inventory.type[_loc2_] == _typeMod)
                  {
                     invSlot_mc[_loc3_].alpha = 0.5;
                  }
                  if(inventory.type[_loc2_] == _typeGun && player.trait[_loc4_][inventory.reqTrait[_loc2_]] < inventory.reqLv[_loc2_])
                  {
                     if(_loc4_ != _pc)
                     {
                        invSlot_mc[_loc3_].alpha = 0.5;
                     }
                     if(_loc4_ == _pc)
                     {
                        window2_mc.warning.visible = true;
                     }
                  }
                  if(inventory.type[_loc2_] == _typeMod && inventory.type[_loc5_] == _typeGun && inventory.num[_loc5_] > 0)
                  {
                     invSlot_mc[_loc3_].filters = [new GlowFilter(4160956)];
                  }
               }
            }
            _loc3_++;
         }
      }
      
      public function throwSister(param1:*, param2:*, param3:*, param4:*) : *
      {
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         _loc6_ = 12 * Math.atan2(Math.abs(param3 - param1) * 2,Math.abs(param4 - param2)) * 2 / Math.PI + 0.1;
         _loc5_ = new bullet_grenade3() as MovieClip;
         _loc5_.x = param1;
         _loc5_.y = 0;
         _loc5_.a = 0.003;
         _loc5_.speed = _loc6_;
         _loc5_.x2 = param1;
         _loc5_.y2 = param2;
         _loc5_.x1 = param3;
         _loc5_.y1 = param4;
         _loc5_.dmg = 20;
         _loc5_.chara = _pc;
         _loc5_.explode = explode;
         stage.addChild(_loc5_);
      }
      
      public function generatePlayer(param1:int, param2:int, param3:int) : *
      {
         var _loc5_:* = undefined;
         player.exist[param1] = true;
         player.sex[param1] = int(Math.random() * 2);
         player.name[param1] = nameBoy[int(Math.random() * nameBoy.length)];
         if(param1 == _pc)
         {
            player.name[param1] = "You";
         }
         if(param3 == -1)
         {
            player.devType[param1] = int(Math.random() * _maxDev) + 1;
         }
         else
         {
            player.devType[param1] = param3;
         }
         var _loc4_:* = 0;
         while(_loc4_ < _maxTrait)
         {
            player.trait[param1][_loc4_] = 0;
            _loc4_++;
         }
         player.potentialAim[param1] = Math.random() / 1.25 + 0.1;
         player.potentialTeam[param1] = Math.random() / 1.25 + 0.1;
         player.trait[param1][player.devType[param1]] = 1;
         player.trait[param1][TRAIT.BASE_AIMING] = 1 + int(Math.random() * 10);
         player.trait[param1][TRAIT.BASE_TEAMWORK] = 1 + int(Math.random() * 10);
         player.lv[param1] = 1;
         player.sp[param1] = 0;
         player.trained[param1] = 0;
         _loc4_ = 1;
         while(_loc4_ < param2)
         {
            levelUp(param1,false);
            _loc4_++;
         }
         player.optBoss[param1] = true;
         player.optWall[param1] = true;
         player.kill[param1] = 0;
         player.earn[param1] = 0;
         player.money[param1] = 200;
         player.nextTrait[param1] = int(Math.random() * 100);
         if(param1 == _pc)
         {
            player.ai[param1] = _aiHero;
         }
         else
         {
            player.ai[param1] = _aiDefault;
         }
         player.forcus[param1] = -1;
         player.cost[param1] = player.lv[param1] * 50 + 350;
         player.exp[param1] = 0;
         player.wexp[param1] = [];
         _loc4_ = 0;
         while(_loc4_ < _maxWeaponSkill)
         {
            player.wexp[param1][_loc4_] = 0;
            _loc4_++;
         }
         initPartySkill();
         if(param1 == _pc)
         {
            _loc5_ = _invPlayer + 1;
            generateStuff(_loc5_,11);
            inventory.lv[_loc5_] = 1;
            inventory.name[_loc5_] = "Soldier\'s Grenade";
            inventory.attack[_loc5_] = 45;
            inventory.ammoMax[_loc5_] = 5;
            inventory.ammo[_loc5_] = inventory.ammoMax[_loc5_];
            inventory.value[_loc5_] = 100;
            _loc5_ = _invPlayer;
         }
         else
         {
            player.pic[param1] = 0 + int(Math.random() * _maxPic);
            _loc5_ = _invAlly + param1;
         }
         generateStuff(_loc5_,24);
         switch(player.devType[param1])
         {
            case _devHunter:
               player.trait[param1][TRAIT.SMALL_GUN] = 1;
               player.trait[param1][TRAIT.RIFLE] = 1;
               player.trait[param1][TRAIT.SHOTGUN] = 1;
               player.trait[param1][TRAIT.SCAVENGER] = 1;
               generateStuff(_loc5_,23);
               inventory.name[_loc5_] = "Hunter\'s Crossbow";
               inventory.shootRate[_loc5_] = 32;
               inventory.baseAccuracy[_loc5_] = 160;
               inventory.attack[_loc5_] = 30;
               inventory.reqLv[_loc5_] = 1;
               break;
            case _devSniper:
               player.trait[param1][TRAIT.RIFLE] = 2;
               player.trait[param1][TRAIT.KILLER] = 1;
               generateStuff(_loc5_,4);
               break;
            case _devSheriff:
               player.trait[param1][TRAIT.SHOTGUN] = 2;
               player.trait[param1][TRAIT.FURY] = 1;
               generateStuff(_loc5_,3);
               break;
            case _devRogue:
               generateStuff(_loc5_,1);
               player.trait[param1][TRAIT.SMALL_GUN] = 2;
               player.trait[param1][TRAIT.RIFLE] = 1;
               player.trait[param1][TRAIT.LUCK] = 1;
               break;
            case _devRanger:
               player.trait[param1][TRAIT.SMALL_GUN] = 1;
               player.trait[param1][TRAIT.BIG_GUN] = 2;
               generateStuff(_loc5_,36);
               break;
            case _devMilitia:
               player.trait[param1][TRAIT.RIFLE] = 2;
               player.trait[param1][TRAIT.BIG_GUN] = 1;
               generateStuff(_loc5_,4);
               generateStuff(_loc5_ + 2,40);
               inventory.name[_loc5_ + 2] = "Simple Flame Thrower";
               inventory.attack[_loc5_ + 2] = 10;
               inventory.reqLv[_loc5_ + 2] = 1;
               inventory.modMax[_loc5_ + 2] = 1;
               enchant(_loc5_ + 2,_encLivingWeapon,1);
               generateStuff(_loc5_ + 3,16);
               inventory.name[_loc5_ + 3] = "Simple Chain Gun";
               inventory.reqLv[_loc5_ + 3] = 1;
               break;
            case _devGuard:
               player.trait[param1][TRAIT.SMALL_GUN] = 1;
               player.trait[param1][TRAIT.SHOTGUN] = 1;
               player.trait[param1][TRAIT.DEFENDER] = 2;
               break;
            case _devNoble:
               generateStuff(_loc5_,2);
               inventory.name[_loc5_] = "PDW";
               inventory.modMax[_loc5_] = 2;
               inventory.reqLv[_loc5_] = 1;
               enchant(_loc5_,_encAccuracy,3);
               player.trait[param1][TRAIT.SMALL_GUN] = 1;
               player.trait[param1][TRAIT.RIFLE] = 1;
               player.trait[param1][TRAIT.SHOTGUN] = 1;
               player.trait[param1][TRAIT.BIG_GUN] = 1;
               break;
            case _devDuelist:
               generateStuff(_loc5_,1);
               inventory.modMax[_loc5_] = 4;
               player.trait[param1][TRAIT.SMALL_GUN] = 3;
               enchant(_loc5_,_encAmmo,3);
         }
      }
      
      public function onEnterFrame(param1:Event) : *
      {
         var index:int = 0;
         var offsetValue:int = 0;
         var targetEnemy:* = undefined;
         var targetYOffset:* = undefined;
         var chainSoundSeekPos:* = undefined;
         setChildIndex(customCursor,numChildren - 1);
         if(shakeCount)
         {
            shakeFrame();
         }
         if(gamePaused)
         {
            stopSound();
            return;
         }
         cb = 0;
         if(protTime)
         {
            --protTime;
            if(protTime <= 0)
            {
               if(col[0][2] >= 0)
               {
                  col[0][2] -= 0.1;
               }
               --protTime;
               if(protTime <= -100)
               {
                  protTime = 0;
                  col[0][2] = 0;
               }
            }
            else if(col[0][2] < 1.3)
            {
               col[0][2] += 0.1;
            }
            cb = 1;
         }
         if(blendCounter && game.optionFlashShot == false)
         {
            --blendCounter;
            if(blendCounter == 0)
            {
               col[1] = [0,0,0,0,0,0];
            }
            else
            {
               offsetValue = blendCounter * 8;
               col[1] = [0.01,0.01,0.01,offsetValue,offsetValue,offsetValue];
            }
            cb = 2;
         }
         if(cb)
         {
            bg_color.redMultiplier = 1;
            bg_color.blueMultiplier = 1;
            bg_color.greenMultiplier = 1;
            bg_color.redOffset = 0;
            bg_color.greenOffset = 0;
            bg_color.blueOffset = 0;
            index = 0;
            while(index < cb)
            {
               bg_color.redMultiplier += col[index][0];
               bg_color.greenMultiplier += col[index][1];
               bg_color.blueMultiplier += col[index][2];
               bg_color.redOffset += col[index][3];
               bg_color.greenOffset += col[index][4];
               bg_color.blueOffset += col[index][5];
               index++;
            }
            root.transform.colorTransform = bg_color;
         }
         if(castleCounter)
         {
            --castleCounter;
            if(castleCounter == 0)
            {
               castle.x = 575;
               castle.y = 220;
               castle.transform.colorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
            }
            else
            {
               castle.x = 575 + Math.random() * 3;
               castle.y = 220 + Math.random() * 3;
               if(blendType == 0)
               {
                  castle.transform.colorTransform = new ColorTransform(1 + castleCounter * 0.05,1,1,1,1,0,0);
               }
               else
               {
                  offsetValue = castleCounter * 4;
                  castle.transform.colorTransform = new ColorTransform(1.01,1.01,1.1,1,offsetValue,offsetValue,offsetValue,0);
               }
            }
         }
         cloud.x -= 0.2;
         if(cloud.x < -1280)
         {
            cloud.x = 0;
         }
         index = 0;
         for(; index < maxAlly; index++)
         {
            if(player.exist[index] != false)
            {
               if(index == hero && fireAtWill == false)
               {
                  w = weapon(index);
               }
               else
               {
                  if(Boolean(player.optBoss[index]) && targetBoss != undefined && player.onMark[index] == false)
                  {
                     if(targetBoss.isDead())
                     {
                        targetBoss = undefined;
                        clearAiTarget(index);
                     }
                     else
                     {
                        player.shooting[index] = false;
                        player.burst[index] = 0;
                        player.target[index] = targetBoss;
                        player.onMark[index] = true;
                        player.aimCount[index] = startingAim(index,w);
                     }
                     continue;
                  }
                  w = weapon(index);
                  if(player.target[index] == undefined)
                  {
                     player.shooting[index] = false;
                     player.burst[index] = 0;
                     player.onMark[index] = false;
                     if(Math.random() < player.workRate[index])
                     {
                        if(index == hero)
                        {
                           player.target[index] = aiFireAtWill(index,inventory.range[w]);
                        }
                        else
                        {
                           player.target[index] = player.aiFunc[index](index,inventory.range[w]);
                        }
                        if(player.target[index] != undefined)
                        {
                           player.aimCount[index] = startingAim(index,w);
                           continue;
                        }
                        if(inventory.manualReload[w])
                        {
                           if(inventory.ammo[w] < inventory.ammoMax[w] / 1.5)
                           {
                              reload(index,w);
                           }
                        }
                        else if(inventory.ammo[w] < inventory.ammoMax[w] / 3)
                        {
                           reload(index,w);
                        }
                        player.aimCount[index] = int(player.aimTime[index] * 2);
                     }
                     cursor_mc[index].x += (cursorX[inventory.range[w]] - cursor_mc[index].x) / player.aimTime[index] / 3;
                     cursor_mc[index].y += (playerY[index] - cursor_mc[index].y) / player.aimTime[index] / 3;
                  }
                  else
                  {
                     targetEnemy = player.target[index];
                     if(targetEnemy.isDead())
                     {
                        if(Boolean(player.onMark[index]) && Boolean(player.optWall[index]))
                        {
                           searchNextAlert(index);
                        }
                        else
                        {
                           clearAiTarget(index);
                        }
                        continue;
                     }
                     if(targetEnemy.dropping == true)
                     {
                        targetYOffset = targetEnemy.y + targetEnemy.mc.rat.y;
                        if(cursor_mc[index].x != targetEnemy.x)
                        {
                           cursor_mc[index].x += (targetEnemy.x - cursor_mc[index].x) / player.aimTime[index];
                        }
                        if(cursor_mc[index].y != targetYOffset)
                        {
                           cursor_mc[index].y += (targetYOffset - cursor_mc[index].y + 1.5) / player.aimTime[index];
                        }
                     }
                     else
                     {
                        if(cursor_mc[index].x != targetEnemy.x)
                        {
                           cursor_mc[index].x += (targetEnemy.x + targetEnemy.speed * player.aimTime[index] - cursor_mc[index].x) / player.aimTime[index];
                        }
                        if(cursor_mc[index].y != targetEnemy.y)
                        {
                           cursor_mc[index].y += (targetEnemy.y - cursor_mc[index].y) / player.aimTime[index];
                        }
                     }
                     if(player.aimCount[index] > 0)
                     {
                        --player.aimCount[index];
                     }
                     else
                     {
                        player.shooting[index] = true;
                     }
                  }
               }
               if(player.rampage[index] > 0)
               {
                  --player.rampage[index];
                  if(player.rampage[index] == 0)
                  {
                     endRampage(index);
                  }
               }
               if(player.frenzy[index] > 0)
               {
                  if(CALC.DUELIST(index))
                  {
                     if(index == hero)
                     {
                        player.frenzy[index] -= 0.12;
                     }
                     else
                     {
                        player.frenzy[index] -= 0.04;
                     }
                  }
                  if(player.frenzy[index] < 0)
                  {
                     player.frenzy[index] = 0;
                  }
               }
               player.shootTimer[index] -= inventory.shootRate[w];
               if(player.shooting[index])
               {
                  shoot(index);
               }
               else
               {
                  player.idleCount[index] += 0.033;
                  if(inventory.id[w] == 16)
                  {
                     if(chainMode[index] > 1)
                     {
                        chainSoundSeekPos = chainSoundLength - chainSound[index].position;
                        if(chainMode[index] == 3)
                        {
                           chainSoundSeekPos = 0;
                        }
                        if(chainSound[index] != null)
                        {
                           chainSound[index].stop();
                        }
                        chainSound[index] = sound_chain2.play(chainSoundSeekPos,0,trans[index]) as SoundChannel;
                        chainMode[index] = 1;
                     }
                     if(index == hero && fireAtWill == false || Math.abs(chainPos[index] - 62) > 2)
                     {
                        chainPos[index] -= 2;
                     }
                     if(chainPos[index] < 0)
                     {
                        chainPos[index] = 0;
                     }
                  }
                  else
                  {
                     chainPos[index] = 0;
                  }
               }
            }
         }
      }
      
      public function startingAim(playerIndex:int, weaponIndex:int) : *
      {
         var aimMultiplier:* = 0;
         aimMultiplier = Math.abs(500 - inventory.range[weaponIndex] * 200 - player.target[playerIndex].x);
         if(aimMultiplier < 100)
         {
            aimMultiplier = 1;
         }
         else
         {
            aimMultiplier = aimMultiplier / player.rangeFix[playerIndex] + 1;
         }
         if(player.optWall[playerIndex] && player.target[playerIndex].x > 400)
         {
            aimMultiplier *= 3 - player.target[playerIndex].x / 200;
         }
         return Math.max(int(player.aimTime[playerIndex] * aimMultiplier),2);
      }
      
      internal function frame22() : *
      {
         loadIndex();
         versionFixIndex();
         gameMedalBonus();
         gameStage = _stageTitle;
         debugStartDay = 0;
         vol.buttonMode = true;
         kongregateStatsIdx();
         if(idx.mute == true)
         {
            volumeChange(0);
         }
         else
         {
            volumeChange(1);
         }
         if(debugUnlockClass)
         {
            idx.unlocked = [true,true,true,true,true,true,true,true];
         }
         stop();
         if(amb != null)
         {
            amb.stop();
         }
         amb = sound_mute.play();
         if(Boolean(kongregate) && idx.version != _version || Boolean(debugShowUpdate))
         {
            sound_scroll1.play();
            window2_mc = new window();
            window2_mc.x = 600;
            window2_mc.anime = false;
            window2_mc.gotoAndStop("menu_update");
            stage.addChild(window2_mc);
            Tweener.addTween(window2_mc,{
               "x":0,
               "time":1
            });
            showUpdate = true;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procUpdate);
            idx.version = _version;
         }
         if(Boolean(debug) && Boolean(debugMedal))
         {
            i = 0;
            while(i < _maxMedal)
            {
               medal[i] = true;
               ++i;
            }
         }
         if(debugTown)
         {
            debug_town();
            return;
         }
         if(debugBattle)
         {
            debug_battle(debugBattle);
            return;
         }
         root.x = 0;
         root.y = 0;
         shakeCount = 0;
         maxSave = 8;
         if(debug == 0)
         {
            debugId = 0;
         }
         updateSaveSlot();
         runner_mc = [];
         runner_x = [500,480,485,440,405,410,490,400];
         runner_y = [220,225,260,290,175,190,330,320];
         runner_pic = [4,5,2,3,0,1,6,7];
         runner_speed = [4.4,4.6,4,2.3,1.2,1.1,3.2,2.3];
         i = 0;
         while(i < _maxRunner)
         {
            runner_mc[i] = new runner() as MovieClip;
            runner_mc[i].x = runner_x[i];
            runner_mc[i].y = runner_y[i];
            runner_mc[i].pic = runner_pic[i];
            runner_mc[i].dead = false;
            stage.addChild(runner_mc[i]);
            ++i;
         }
         addEventListener(Event.ENTER_FRAME,onEnterFrame_title);
         stage.addEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_title);
         resetBG();
         longest.text = "Most Days Survived: " + idx.day + " / " + idx.dayHC + " (HC)" + " / " + idx.dayCasual + " (Casual)";
         t = 0;
         kong_mc.y = -100;
         kong_mc2.y = -100;
         armorButton.y = -150;
         if(armor)
         {
            Tweener.addTween(armorButton,{
               "delay":1,
               "time":1.2,
               "y":240,
               "transition":"easeOutBounce"
            });
            kong_mc.visible = false;
            kong_mc2.visible = false;
         }
         else if(kongregate)
         {
            Tweener.addTween(kong_mc2,{
               "delay":1,
               "time":1.2,
               "y":300,
               "transition":"easeOutBounce"
            });
         }
         else
         {
            Tweener.addTween(kong_mc,{
               "delay":1,
               "time":1.2,
               "y":260,
               "transition":"easeOutBounce"
            });
         }
      }
      
      public function updateGold() : *
      {
         moneyText.text = "" + player.money[_pc];
      }
      
      public function cancelReload(param1:int, param2:int) : *
      {
         if(inventory.autoReload[param2] == 0)
         {
            if(inventory.id[param2] == 14 || inventory.id[param2] == 15)
            {
               sound_reloaded3.play(0,0,trans[param1]);
            }
            else
            {
               sound_reloaded2.play(0,0,trans[param1]);
            }
            player_mc[param1].gotoAndStop(player_mc[param1].anime2);
         }
         else if(inventory.reloadTime[param2] != 0)
         {
            if(inventory.id[param2] == 14 || inventory.id[param2] == 15)
            {
               sound_reloading3.play(0,0,trans[param1]);
            }
            else
            {
               sound_reloading2.play(0,0,trans[param1]);
            }
         }
         inventory.reloadTime[param2] = 0;
         if(param1 == _pc)
         {
            updateAmmoBar();
         }
      }
      
      internal function frame57() : *
      {
         setChildIndex(gameoverLogo,numChildren - 1);
         stop();
      }
      
      public function exitTown() : *
      {
         if(stage.getChildByName("window3_mc"))
         {
            stage.removeChild(window3_mc);
         }
         stage.removeChild(window2_mc);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
      }
      
      public function updateLevel() : *
      {
         var _loc1_:int = 0;
         var _loc2_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < radioCount)
         {
            if(cs == _loc1_)
            {
               radio_mc[_loc1_].gotoAndStop(2);
            }
            else
            {
               radio_mc[_loc1_].gotoAndStop(1);
            }
            _loc1_++;
         }
         window2_mc.procButton.visible = false;
         if(cs == -1)
         {
            window2_mc.itemDesc.text = "Please choose a skill you want to learn or improve.";
            window2_mc.itemDesc2.text = "";
            window2_mc.now.text = "";
         }
         else
         {
            _loc2_ = REF[ID[radio_mc[cs].id]](_pc);
            window2_mc.now.text = _loc2_[2];
            traitLvFix = 1;
            _loc2_ = REF[ID[radio_mc[cs].id]](_pc);
            window2_mc.itemDesc.text = _loc2_[1];
            window2_mc.itemDesc2.text = _loc2_[2];
            if(radio_mc[cs].alpha == 1)
            {
               window2_mc.procButton.visible = true;
            }
         }
      }
      
      public function spawnEnemy(param1:int) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         _loc2_ = -1;
         _loc3_ = 0;
         while(_loc3_ < maxEnemy)
         {
            if(enemyArray[_loc3_].isFree())
            {
               addChild(enemyArray[_loc3_]);
               enemyArray[_loc3_].init(param1);
               _loc2_ = _loc3_;
               break;
            }
            _loc3_++;
         }
         if(game.day > 40 && Math.random() > 0.95)
         {
            _loc4_ = enemyArray[_loc3_];
            if(_loc4_.id != _ogre && _loc4_.id != _dino && _loc4_.id != _dragon && _loc4_.id != _boss && _loc4_.id != _ratdrop)
            {
               _loc4_.mc.scaleX = 1.25;
               _loc4_.mc.scaleY = 1.25;
               _loc4_.hp *= 3;
               _loc4_.speed *= 0.75;
               _loc4_.speedOrg *= 0.75;
               _loc4_.exp *= 2;
               _loc4_.gold *= 2;
            }
         }
         if(enemyArray[_loc3_].id == _spider)
         {
            _loc4_ = enemyArray[_loc3_];
            Tweener.addTween(_loc4_.mc,{
               "time":0,
               "_hue":int(Math.random() * 360 - 180)
            });
         }
         return _loc2_;
      }
      
      public function rampageRanger(param1:int) : *
      {
         var _loc2_:int = 0;
         if(player.frenzy[param1] < 1000)
         {
            return;
         }
         player.frenzy[param1] = 0;
         _loc2_ == 0;
         while(_loc2_ < maxAlly)
         {
            if(player.exist[_loc2_] != false)
            {
               rampageOn(_loc2_,12 * 30 * (100 + CALC.RANGER(param1)) / 100);
            }
            _loc2_++;
         }
      }
      
      public function resultMedal() : *
      {
         if(mission.noDamage)
         {
            ++game.noDamage;
         }
         if(game.carryOver == true)
         {
            return;
         }
         if(game.noDamage >= 10)
         {
            getMedal(_medalNoDamage4);
         }
         if(game.noDamage >= 7)
         {
            getMedal(_medalNoDamage3);
         }
         if(game.noDamage >= 4)
         {
            getMedal(_medalNoDamage2);
         }
         if(game.noDamage >= 1)
         {
            getMedal(_medalNoDamage1);
         }
         if(player.devType[_pc] == _devHunter && player.lv[_pc] >= 10)
         {
            getMedal(_medalClass1);
         }
         if(player.devType[_pc] == _devRogue && player.lv[_pc] >= 10)
         {
            getMedal(_medalClass2);
         }
         if(player.devType[_pc] == _devSheriff && player.lv[_pc] >= 10)
         {
            getMedal(_medalClass3);
         }
         if(player.devType[_pc] == _devMilitia && player.lv[_pc] >= 10)
         {
            getMedal(_medalClass4);
         }
         if(mission.ragnarok == true)
         {
            getMedal(_medalRagnarok);
         }
      }
      
      public function fireworkMedal() : *
      {
         getMedal(_medalFirework);
      }
      
      public function invDrag() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:Boolean = false;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         if(window2_mc.animeTime)
         {
            return;
         }
         _loc1_ = window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
         _loc2_ = false;
         _loc5_ = 0;
         while(_loc5_ < _loc1_.length)
         {
            _loc6_ = _loc1_[_loc5_].parent;
            if(_loc6_.hasOwnProperty("slot"))
            {
               _loc2_ = true;
               item = _loc6_.item;
               slot = _loc6_.slot;
               if(drag == false)
               {
                  if(equipMode == 1)
                  {
                     if(invSlot_mc[slot].alpha != 1)
                     {
                        endEquipMode();
                        break;
                     }
                     if(menuId == 6)
                     {
                        sound_mod.play();
                        game.ap -= 5;
                        ++game.recycleCount;
                        actionMedal();
                        _loc3_ = invSlot_mc[slot].id;
                        randomStuff(_loc3_,inventory.value[_loc3_] / 2 + 250,3);
                        endEquipMode();
                        break;
                     }
                     upgradeItem = invSlot_mc[slot].id;
                     showDialog(_dialogUpgrade);
                     dialog_mc.question.text = "It costs you " + upgradeWeapon(upgradeItem,1) + " gp. Really upgrade the weapon?";
                     break;
                  }
                  if(equipMode == 2)
                  {
                     if(invSlot_mc[slot].alpha != 1)
                     {
                        endEquipMode();
                        break;
                     }
                     sound_mod.play();
                     game.ap -= 3;
                     _loc3_ = invSlot_mc[slot].id;
                     inventory.ammo[_loc3_] = inventory.ammoMax[_loc3_];
                     endEquipMode();
                     break;
                  }
                  if(item != -1)
                  {
                     sound_reloaded1.play();
                     window2_mc.setChildIndex(invIcon_mc[item],window2_mc.numChildren - 1);
                     invIcon_mc[item].x = mouseX - window2_mc.x - invIcon_mc[item].width / 2;
                     invIcon_mc[item].y = mouseY - window2_mc.y - invIcon_mc[item].height / 2;
                     invIcon_mc[item].startDrag();
                     drag = true;
                     dragItem = item;
                     dragSlot = slot;
                     updateInvSlots(slot);
                  }
                  break;
               }
               if(invSlot_mc[slot].alpha != 1)
               {
                  _loc2_ = false;
                  break;
               }
               if(invSlot_mc[slot].op == 0)
               {
                  _loc3_ = invSlot_mc[slot].id;
                  _loc4_ = invSlot_mc[dragSlot].id;
                  if(inventory.type[_loc4_] == _typeToken)
                  {
                     sound_pay1.play();
                     inventory.value[_loc3_] = limit(inventory.value[_loc3_] - inventory.attack[_loc4_],0,999999999);
                     inventory.num[_loc4_] = 0;
                     invIcon_mc[dragItem].visible = false;
                     invSlot_mc[dragSlot].item = -1;
                     invIcon_mc[dragItem].stopDrag();
                     invIcon_mc[dragItem].x = invSlot_mc[dragSlot].x - (invIcon_mc[dragItem].width - 48) / 2 - 4;
                     invIcon_mc[dragItem].y = invSlot_mc[dragSlot].y;
                     drag = false;
                     break;
                  }
                  _loc2_ = false;
                  break;
               }
               if(invSlot_mc[dragSlot].op == 0)
               {
                  _loc3_ = invSlot_mc[dragSlot].id;
                  if(stuffGetValue(_loc3_,1) > player.money[_pc])
                  {
                     sound_beep.play();
                     _loc2_ = false;
                     break;
                  }
                  sound_pay1.play();
                  player.money[_pc] -= stuffGetValue(_loc3_,1);
                  updateInterface();
               }
               invIcon_mc[dragItem].stopDrag();
               invIcon_mc[dragItem].x = invSlot_mc[slot].x - (invIcon_mc[dragItem].width - 48) / 2 - 4;
               invIcon_mc[dragItem].y = invSlot_mc[slot].y;
               drag = false;
               if(item != -1)
               {
                  _loc3_ = invSlot_mc[slot].id;
                  _loc4_ = invSlot_mc[dragSlot].id;
                  if(inventory.type[_loc4_] == _typeMod && inventory.type[_loc3_] == _typeGun)
                  {
                     showDialog(_dialogMod);
                     dialog_mc.question.text = "Do you really want to mount the mod on this gun?";
                     break;
                  }
                  invSlot_mc[slot].item = dragItem;
                  invSlot_mc[dragSlot].item = item;
                  invIcon_mc[item].x = invSlot_mc[dragSlot].x - (invIcon_mc[item].width - 48) / 2 - 4;
                  invIcon_mc[item].y = invSlot_mc[dragSlot].y;
               }
               else
               {
                  invSlot_mc[slot].item = dragItem;
                  invSlot_mc[dragSlot].item = -1;
               }
               swapStuff(invSlot_mc[dragSlot].id,invSlot_mc[slot].id);
               break;
            }
            _loc5_++;
         }
         if(_loc2_ == false)
         {
            if(drag)
            {
               if(menuId == 4 && invSlot_mc[dragSlot].op == 1)
               {
                  _loc3_ = invSlot_mc[dragSlot].id;
                  showDialog(_dialogSell);
                  dialog_mc.question.text = "Do you really want to sell it for " + stuffGetValue(_loc3_,0) + " gold?";
                  invIcon_mc[dragItem].visible = false;
               }
               invIcon_mc[dragItem].stopDrag();
               invIcon_mc[dragItem].x = invSlot_mc[dragSlot].x - (invIcon_mc[dragItem].width - 48) / 2 - 4;
               invIcon_mc[dragItem].y = invSlot_mc[dragSlot].y;
               drag = false;
               updateInvSlots(-1);
               updateInventory();
            }
         }
         else
         {
            updateSlots();
            updateInventory();
            updateInterface();
            if(drag == false)
            {
               updateInvSlots(-1);
            }
         }
      }
      
      public function explode(param1:*, param2:*, param3:*, param4:*, param5:int, param6:int) : *
      {
         var _loc7_:* = undefined;
         var _loc8_:int = 0;
         var multiplier:Number = 1;
         if(param1 >= 0 && param1 < maxAlly)
         {
            multiplier *= (100 + CALC.DA_BOMB(param1)) / 100;
         }
         if(param5 != -1)
         {
            param5 *= multiplier;
         }
         sound_exp1.play(0,0,soundPos(param3));
         if(param6 == 0)
         {
            _loc7_ = new explosion() as MovieClip;
         }
         else
         {
            _loc7_ = new explosion2() as MovieClip;
            multiplier *= 1.1;
         }
         _loc7_.x = param3;
         _loc7_.y = param4;
         _loc7_.alpha = 0.85;
         _loc7_.scaleX = multiplier;
         _loc7_.scaleY = multiplier;
         stage.addChild(_loc7_);
         shake(10,5,0.9);
         if(param5 == -1)
         {
            return;
         }
         _loc8_ = 0;
         var radiusX:Number = 60 * multiplier;
         var radiusY:Number = 50 * multiplier;
         while(_loc8_ < maxEnemy)
         {
            if(!enemyArray[_loc8_].isDead())
            {
               if(enemyArray[_loc8_].x > param3 - radiusX && enemyArray[_loc8_].x < param3 + radiusX && enemyArray[_loc8_].y > param4 - radiusY && enemyArray[_loc8_].y < param4 + radiusY)
               {
                  enemyArray[_loc8_].damage(param5,param2,enemyArray[_loc8_].x,enemyArray[_loc8_].y,param1,false);
               }
            }
            _loc8_++;
         }
      }
      
      internal function frame65() : *
      {
         stop();
         root.x = 0;
         root.y = 0;
         apText.visible = false;
         frenzyBar.scaleX = 0;
         ci = _invPlayer;
         window2_mc = new window() as MovieClip;
         bottomBar.gotoAndStop(1);
         unlocked = true;
         menuList = [];
         draw_count = 0;
         old_timer = getTimer();
         cancelFirework = false;
         menuList[0] = missionButton;
         menuList[1] = castleButton;
         menuList[2] = charaButton;
         menuList[3] = equipButton;
         menuList[4] = shopButton;
         menuList[5] = medalButton;
         i = 0;
         while(i < menuList.length)
         {
            menuList[i].visible = false;
            menuList[i].x -= 90;
            ++i;
         }
         toTownMenu = false;
         gameStage = _stageResult;
         geneClass = 0;
         ce = -1;
         cs = _pc;
         currentPop = -1;
         currentHint = -1;
         fadeCount = 0;
         eventModeEnabled = false;
         stage.addEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_result);
         addEventListener(Event.ENTER_FRAME,onEnterFrame_result);
         menuButton.mouseEnabled = true;
         customCursor.visible = false;
         updateAmmoBar();
         updateInterface();
         updateInventory();
         stage.addChild(window2_mc);
         exitMenuResult();
         selectEvent();
      }
      
      public function mouseUpFunc(param1:MouseEvent) : *
      {
         player.burst[_pc] = 0;
         if(_pc != hero)
         {
            return;
         }
         if((inventory.id[ci] == 24 || inventory.id[ci] == 25) && chainMode[_pc] == 1)
         {
            shoot(_pc);
         }
         player.shooting[_pc] = false;
      }
      
      internal function frame71() : *
      {
         stop();
         root.x = 0;
         root.y = 0;
         hintCount2 = 0;
         defHint = "";
         upgradeItem = 0;
         if(amb != null)
         {
            amb.stop();
         }
         amb = sound_bg_town.play(0,999999) as SoundChannel;
         startFromTown = false;
         ci = _invPlayer;
         updateFrenzyBar();
         window2_mc.closeButton.visible = true;
         window2_mc.x = 630;
         window2_mc.y = -22;
         stage.addChild(window2_mc);
         if(game.carryOver == true)
         {
            textCarryOver.visible = true;
         }
         else
         {
            textCarryOver.visible = false;
         }
         gameStage = _stageTown;
         if(gameContinued == false)
         {
            if(game.day % 10 == 4)
            {
               game.specialSale = 1;
            }
            else
            {
               game.specialSale = 0;
            }
            generateShop();
            generateCard();
            generateMission(game.day);
            generateRecruit();
            townMedalBonus();
            if(game.chicken > 0)
            {
               game.egg = false;
            }
            else
            {
               game.egg = true;
            }
            game.partyHeld = false;
            game.prayed = false;
            game.robbed = 0;
            game.taunted = 0;
            startTownMedal();
            saveGame();
         }
         else
         {
            if(debugTownDay)
            {
               game.day = debugTownDay;
               generateMission(game.day);
               game.ap += 40;
            }
            gameContinued = false;
         }
         if(game.searched == undefined)
         {
            game.searched = int(Math.random() * 1000);
         }
         kongregateStats();
         initPartySkill();
         actList = [];
         actList[0] = {
            "name":"Pray",
            "cost":2,
            "pic":5,
            "angle":7,
            "desc":"Praying may increase your wall defense.",
            "func":function():*
            {
               showEventDialog(_dialogActPray);
            },
            "method":function():*
            {
               if(game.prayed == false)
               {
                  return true;
               }
               return -1;
            }
         };
         actList[1] = {
            "name":"Have dinner",
            "cost":3,
            "pic":12,
            "angle":-2,
            "desc":"Having dinner will give you an exp bonus.",
            "func":function():*
            {
               showEventDialog(_dialogActEat);
            },
            "method":function():*
            {
               if(mission.expFix == 1)
               {
                  return true;
               }
               return -1;
            }
         };
         actList[2] = {
            "name":"Go searching",
            "cost":1,
            "pic":13,
            "angle":4,
            "desc":"Explore and discover the secrets of your town!",
            "func":function():*
            {
               showEventDialog(_dialogActSearch);
            },
            "method":function():*
            {
               return true;
            }
         };
         actList[3] = {
            "name":"Party",
            "cost":3,
            "pic":15,
            "angle":-3,
            "desc":"Holding a party increases damages your troops deal.",
            "func":function():*
            {
               showEventDialog(_dialogActParty);
            },
            "method":function():*
            {
               if(game.party == 0)
               {
                  return false;
               }
               if(game.partyHeld == false)
               {
                  return true;
               }
               return -1;
            }
         };
         actList[4] = {
            "name":"Collect eggs",
            "cost":1,
            "pic":6,
            "angle":6,
            "desc":"You can collect eggs once in a day if you have chickens.",
            "func":function():*
            {
               showEventDialog(_dialogActEgg);
            },
            "method":function():*
            {
               if(game.chicken == 0)
               {
                  return false;
               }
               if(game.egg == false)
               {
                  return true;
               }
               return -1;
            }
         };
         actList[5] = {
            "name":"Taunt",
            "cost":2,
            "pic":14,
            "angle":-2,
            "desc":"It will make the enemies stronger but you get more reward.",
            "func":function():*
            {
               showEventDialog(_dialogActTaunt);
            },
            "method":function():*
            {
               if(PARTY.TAUNT == 0)
               {
                  return false;
               }
               return true;
            }
         };
         actList[6] = {
            "name":"Train",
            "cost":4,
            "pic":16,
            "angle":6,
            "desc":"SP trainer will train one of your skills.",
            "func":function():*
            {
               showEventDialog(_dialogActTrain);
            },
            "method":function():*
            {
               if(game.spTrainer == 0)
               {
                  return false;
               }
               return true;
            }
         };
         actList[9] = {
            "name":"Claim title",
            "cost":4,
            "pic":3,
            "angle":-9,
            "desc":"You will receive a new title and salary.",
            "func":function():*
            {
               showEventDialog(_dialogActClaim);
            },
            "method":function():*
            {
               if(newTitle(0))
               {
                  return true;
               }
               return -1;
            }
         };
         updateAp();
         delay = 0;
         drag = false;
         eventDialog = 0;
         stage.addEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);
         stage.addEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         addEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         menuButton.mouseEnabled = true;
         customCursor.visible = false;
         updateInterface();
         updateInventory();
         menuId = 1;
         exitMenu();
         sound_scroll1.play();
         window2_mc.alpha = 1;
         window2_mc.anime = false;
         window2_mc.gotoAndPlay("menu_mission");
         window2_mc.addFrameScript(window2_mc.currentFrame - 1,procMissionMenu);
         if(game.day == 1)
         {
            popInfo("Make sure to repair your walls!");
         }
      }
      
      public function renewResult() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         i = 1;
         while(i < maxAlly)
         {
            if(player.exist[i])
            {
               _loc1_ += wage(i);
            }
            ++i;
         }
         mission.wage = _loc1_ * -1;
         mission.unkeep = (calcTax() + calcUnkeep()) * -1;
         if(mission.noDamage)
         {
            news += "You\'ve scored a perfect game! You are given +30% reward bonus.\n";
            mission.reward *= 1.3;
         }
         if(mission.hire)
         {
            mission.hire = false;
            player.exist[maxParty] = false;
            mission.reward /= 2;
         }
         mission.resultCastle = 0;
         if(game.museum)
         {
            mission.resultCastle += calcMuseum();
            news += "Your museum generated " + calcMuseum() + " GP.\n";
         }
         mission.resultCastle += game.titleMoney + int(game.fame * Math.random() * 15);
         if(game.titleMoney)
         {
            news += "You received a salary of " + game.titleMoney + " GP.\n";
         }
         _loc1_ = mission.reward + mission.wage + mission.unkeep + mission.resultCastle;
         player.money[_pc] += _loc1_;
         game.totalMoney += mission.reward + mission.resultCastle;
         mission.resultOther = player.money[_pc] - mission.resultBefore - _loc1_ - mission.resultTaken;
         townEvent();
      }
      
      public function debug_town() : *
      {
         game.apFix = 100;
         game.day = 80;
         game.invSlot = 16;
         game.smith = 7;
         game.spTrainer = 2;
         generatePlayer(0,50,_devSniper);
         generatePlayer(1,50,_devHunter);
         generateStuff(_invPlayer + 0,1);
         inventory.modMax[_invPlayer + 0] = 10;
         generateStuff(_invPlayer + 1,3);
         inventory.modMax[_invPlayer + 1] = 10;
         generateStuff(_invPlayer + 2,16);
         generateStuff(_invPlayer + 3,104);
         generateStuff(_invPlayer + 4,105);
         generateStuff(_invPlayer + 5,106);
         generateStuff(_invPlayer + 6,107);
         generateStuff(_invPlayer + 7,10);
         setMod(_invPlayer + 7,_encDamage);
         generateStuff(_invPlayer + 8,10);
         setMod(_invPlayer + 8,_encDamage);
         generateStuff(_invPlayer + 9,10);
         setMod(_invPlayer + 9,_encDamage);
         generateStuff(_invPlayer + 10,10);
         setMod(_invPlayer + 10,_encDamage);
         generateStuff(_invPlayer + 11,10);
         setMod(_invPlayer + 11,_encDamage);
         player.trait[_pc][TRAIT.BIG_GUN] = 30;
         player.trait[_pc][TRAIT.RIFLE] = 30;
         player.trait[_pc][TRAIT.SHOTGUN] = 30;
         player.trait[_pc][TRAIT.SMALL_GUN] = 30;
         player.money[0] = 10000;
         player.lv[0] = 15;
         game.chicken = 100;
         game.party = 5;
         game.ap = 20;
         gotoAndPlay("town");
      }
      
      public function setGameOption() : *
      {
         game.optionBossDropMod = window2_mc.optDropMod.selected;
         game.MORE = window2_mc.optMore.selected;
         game.optWeaponLevel = window2_mc.optWeaponLevel.selected;
         game.skipHard = window2_mc.optSkipHard.selected;
         game.tight = window2_mc.optTight.selected;
         game.laptop = window2_mc.optLaptop.selected;
         game.comp = window2_mc.optComp.selected;
         game.submit = true;
         if(Boolean(game.skipHard) || Boolean(game.tight) || Boolean(game.laptop) || Boolean(game.comp))
         {
            game.submit = false;
         }
      }
      
      public function procCharaMenu() : *
      {
         window2_mc.stop();
         window2_mc.anime = true;
         window2_mc.hint.visible = false;
         window2_mc.dismissButton.mouseEnabled = true;
         window2_mc.actRef1.mouseEnabled = false;
         orderIsOpen = false;
         updateCharaList();
         updateCharaMenu();
      }
      
      public function createInvSlot(param1:int, param2:int, param3:int, param4:*) : *
      {
         var _loc5_:int = 0;
         _loc5_ = invSlotCount;
         invSlot_mc[_loc5_] = new invSlot() as MovieClip;
         invSlot_mc[_loc5_].x = param2;
         invSlot_mc[_loc5_].y = param3;
         invSlot_mc[_loc5_].slot = _loc5_;
         invSlot_mc[_loc5_].id = param1;
         invSlot_mc[_loc5_].op = param4;
         invSlot_mc[_loc5_].buttonMode = true;
         invSlot_mc[_loc5_].shortNum.mouseEnabled = false;
         invSlot_mc[_loc5_].cost.visible = false;
         invSlot_mc[_loc5_].coin.visible = false;
         invSlot_mc[_loc5_].alpha = 1;
         if(param4 == 0)
         {
            invSlot_mc[_loc5_].cost.visible = true;
            invSlot_mc[_loc5_].coin.visible = true;
            updateSlot(_loc5_);
         }
         if(param4 == -1)
         {
            invSlot_mc[_loc5_].alpha = 0.5;
         }
         if(param1 >= _invPlayer && param1 < _invPlayer + 5)
         {
            invSlot_mc[_loc5_].shortNum.text = param1 - _invPlayer + 1;
         }
         window2_mc.addChild(invSlot_mc[_loc5_]);
         if(inventory.num[param1] > 0 && param4 != -1)
         {
            invSlot_mc[_loc5_].item = createInvIcon(param1,_loc5_);
            invSlot_mc[_loc5_].visible = true;
         }
         else
         {
            invSlot_mc[_loc5_].item = -1;
            if(param4 == 0)
            {
               invSlot_mc[_loc5_].visible = false;
            }
         }
         updateSlot(_loc5_);
         window2_mc.setChildIndex(invSlot_mc[_loc5_],3);
         ++invSlotCount;
      }
      
      public function IF(param1:*) : *
      {
         if(param1 == true)
         {
            return 1;
         }
         return 0;
      }
      
      public function searchProc(param1:*, param2:*, param3:*, param4:*) : *
      {
         param1.title.text = param2;
         param1.text.text = param3;
         return 0;
      }
      
      public function calcTax() : *
      {
         var _loc1_:int = 0;
         if(game.casual == true)
         {
            _loc1_ += game.day * 20 - 400;
         }
         else
         {
            _loc1_ += game.day * 35 - 200;
         }
         if(_loc1_ < 0)
         {
            _loc1_ = 0;
         }
         return _loc1_;
      }
      
      internal function frame81() : *
      {
         stage.addEventListener(MouseEvent.MOUSE_DOWN,MouseLDown_logo3);
      }
      
      public function wage(param1:int) : *
      {
         var _loc2_:* = undefined;
         _loc2_ = player.lv[param1] * 6 + 50 - true_if(player.pic[param1] == 50) * 50;
         if(_loc2_ < 0)
         {
            _loc2_ = 0;
         }
         _loc2_ = _loc2_ * (75 + player.potentialAim[param1] * player.potentialTeam[param1] * 100) / 100;
         _loc2_ = _loc2_ * 100 / (100 + PARTY.ACCOUNTANT + IF(medal[_medalRagnarok]) * 3);
         if(param1 == _pc)
         {
            _loc2_ = 0;
         }
         return int(_loc2_);
      }
      
      public function getAllyNum() : *
      {
         var _loc1_:* = 0;
         if(player.exist[1] == true)
         {
            _loc1_++;
         }
         if(player.exist[2] == true)
         {
            _loc1_++;
         }
         if(player.exist[3] == true)
         {
            _loc1_++;
         }
         return _loc1_;
      }
      
      public function useItem(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         var _loc5_:MovieClip = null;
         var _loc6_:MovieClip = null;
         _loc3_ = 0;
         if(stage.getChildByName("timer" + param2))
         {
            sound_beep.play();
            return;
         }
         if(inventory.id[param2] == 11)
         {
            _loc3_ = 100;
            throwGrenade(_pc,-1,player_mc[_pc].x,player_mc[_pc].y,mouseX,mouseY,12,inventory.attack[param2],-1);
         }
         if(inventory.id[param2] == 12)
         {
            _loc3_ = 2000;
            castleCounter = 15;
            blendType = 1;
            game.castleHP += calcRepair(param2);
            if(game.castleHP >= game.castleMHP)
            {
               game.castleHP = game.castleMHP;
            }
            updateHP();
            sound_repair1.play();
         }
         if(inventory.id[param2] == 37)
         {
            protTime = inventory.attack[param2];
            _loc5_ = new layhand();
            _loc5_.x = 550;
            _loc5_.y = 270;
            stage.addChild(_loc5_);
            sound_pray1.play();
         }
         if(inventory.id[param2] == 38)
         {
            _loc4_ = 0;
            while(_loc4_ < 30)
            {
               spawnEnemy(_dino);
               _loc4_++;
            }
            text_effect("Let\'s Ragnarok!");
            blendType = 0;
            blendCounter += 15;
            shake(150,1.5,1);
            mission.ragnarok = true;
            mission.time += 200;
         }
         --inventory.ammo[param2];
         if(inventory.ammo[param2] <= 0)
         {
            inventory.num[param2] = 0;
         }
         updateInventory();
         if(Boolean(_loc3_) && inventory.ammo[param2] > 0)
         {
            _loc6_ = new itemTimer();
            _loc6_.y = 350;
            _loc6_.x = (param2 - _invPlayer) * 90 - 20;
            _loc6_.timer = int(_loc3_ * 100 / (100 + PARTY.SUPPLIER));
            _loc6_.name = "timer" + param2;
            stage.addChild(_loc6_);
         }
      }
      
      public function startTownMedal() : *
      {
         if(game.carryOver == true)
         {
            return;
         }
         if(game.day >= 40)
         {
            getMedal(_medalElona);
         }
         if(game.HC == true)
         {
            if(game.day >= 40)
            {
               getMedal(_medalHardcore2);
            }
         }
      }
      
      public function clearAiTarget(param1:int) : *
      {
         player.shooting[param1] = false;
         player.burst[param1] = 0;
         player.target[param1] = undefined;
         player.onMark[param1] = false;
      }
      
      public function removeEnemy() : *
      {
         var _loc1_:int = 0;
         _loc1_ = 0;
         while(_loc1_ < maxEnemy)
         {
            if(enemyArray[_loc1_].isFree() == false)
            {
               enemyArray[_loc1_].nullify();
            }
            _loc1_++;
         }
      }
      
      public function stopFire() : *
      {
         var _loc2_:* = undefined;
         var _loc1_:* = stage.numChildren - 1;
         while(_loc1_ >= 0)
         {
            _loc2_ = stage.getChildAt(_loc1_);
            if(_loc2_.name == "fire")
            {
               _loc2_.visible = false;
            }
            _loc1_--;
         }
      }
      
      public function cardEvent(param1:int) : *
      {
         var _loc2_:* = undefined;
         _loc2_ = new cardEffect() as MovieClip;
         _loc2_.x = 360;
         _loc2_.y = 170;
         var _loc3_:Boolean = false;
         switch(game.card[param1])
         {
            case 1:
               _loc3_ = true;
               mission.note += "[GOLD] " + int(mission.reward * 0.25) + "gp added to the reward.\n";
               mission.reward += int(mission.reward * 0.25);
               break;
            case 2:
               _loc3_ = true;
               mission.dmgFix = 1.15 + Math.random() / 3;
               mission.note += "[AXE] You and your troops deal " + (int(mission.dmgFix * 100 - 100)) + "% more damage.\n";
               break;
            case 4:
               mission.note += "[GRAVE] The number of waves is increased by 1.\n";
               ++mission.wave;
               break;
            case 6:
               mission.note += "[SKULL] Enemy level increased by " + (1 + int(mission.strength / 3)) + ".\n";
               mission.strength += 1 + int(mission.strength / 3);
               break;
            case 7:
               mission.hpFix = 1.15 + Math.random() / 5;
               mission.note += "[ARMOR] Enemies have " + (int(mission.hpFix * 100 - 100)) + "% more HP.\n";
         }
      }
      
      public function true_if(param1:*) : *
      {
         if(param1 == true)
         {
            return 1;
         }
         return 0;
      }
      
      public function alert(param1:*) : *
      {
         var _loc2_:* = undefined;
         if(param1.onMark)
         {
            return;
         }
         _loc2_ = 0;
         while(_loc2_ < maxAlly)
         {
            if(!(player.exist[_loc2_] == false || player.optWall[_loc2_] == false || Boolean(player.onMark[_loc2_]) || _loc2_ == hero && fireAtWill == false))
            {
               player.shooting[_loc2_] = false;
               player.burst[_loc2_] = 0;
               player.target[_loc2_] = param1;
               player.onMark[_loc2_] = true;
               param1.onMark = true;
               player.aimCount[_loc2_] = startingAim(_loc2_,weapon(_loc2_));
               return;
            }
            _loc2_++;
         }
         if(param1.x >= _defenseLine - 20)
         {
            nextAlert = param1;
         }
      }
      
      public function generateStuff(param1:int, param2:int) : *
      {
         inventory.num[param1] = 1;
         inventory.id[param1] = param2;
         inventory.graphic[param1] = 10 + param2;
         inventory.type[param1] = _typeGun;
         inventory.reloadTime[param1] = 0;
         inventory.reloadTimeMax[param1] = 0;
         inventory.ammoMax[param1] = 0;
         inventory.value[param1] = 100;
         inventory.mod[param1] = 0;
         inventory.modMax[param1] = 1 + int(limit(Math.random() * Math.random() * 6,0,5));
         if(inventory.modMax[param1] >= 3 && Math.random() > 0.35)
         {
            inventory.modMax[param1] -= 2;
         }
         inventory.shell[param1] = 1;
         inventory.manualReload[param1] = false;
         inventory.automatic[param1] = true;
         inventory.modText[param1] = "";
         inventory.lv[param1] = 1;
         inventory.typeMinor[param1] = _typeNormal;
         inventory.special[param1] = 0;
         inventory.leech[param1] = 0;
         inventory.impact[param1] = 0;
         inventory.shootRate[param1] = 100;
         inventory.rare[param1] = 100;
         inventory.autoReload[param1] = 0;
         inventory.impact[param1] = 0;
         inventory.livingWeapon[param1] = 0;
         if(param2 == 1)
         {
            inventory.name[param1] = "Pistol";
            inventory.reloadTimeMax[param1] = 20;
            inventory.ammoMax[param1] = 10;
            inventory.shootRate[param1] = 100;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 150;
            inventory.accuracyDec[param1] = 0.1;
            inventory.attack[param1] = 20;
            inventory.dmgAir[param1] = 75;
            inventory.dmgArmor[param1] = 35;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 1;
            inventory.range[param1] = 1;
            inventory.value[param1] = 300;
         }
         if(param2 == 2)
         {
            inventory.name[param1] = "Sub Machine Gun";
            inventory.reloadTimeMax[param1] = 60;
            inventory.ammoMax[param1] = 275;
            inventory.shootRate[param1] = 700;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 140;
            inventory.accuracyDec[param1] = 0.05;
            inventory.attack[param1] = 8;
            inventory.dmgAir[param1] = 35;
            inventory.dmgArmor[param1] = 25;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 3;
            inventory.range[param1] = 0;
            inventory.value[param1] = 450;
         }
         if(param2 == 3)
         {
            inventory.name[param1] = "Shotgun";
            inventory.reloadTimeMax[param1] = 6;
            inventory.ammoMax[param1] = 5;
            inventory.shootRate[param1] = 40;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 65;
            inventory.accuracyDec[param1] = 0.24;
            inventory.attack[param1] = 16;
            inventory.dmgAir[param1] = 80;
            inventory.dmgArmor[param1] = 30;
            inventory.reqTrait[param1] = TRAIT.SHOTGUN;
            inventory.reqLv[param1] = 1;
            inventory.range[param1] = 0;
            inventory.shell[param1] = 6;
            inventory.manualReload[param1] = true;
            inventory.value[param1] = 500;
            inventory.typeMinor[param1] = _typeShotgun;
         }
         if(param2 == 4)
         {
            inventory.name[param1] = "Hunter\'s Rifle";
            inventory.reloadTimeMax[param1] = 6;
            inventory.ammoMax[param1] = 10;
            inventory.shootRate[param1] = 30;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 180;
            inventory.accuracyDec[param1] = 0.2;
            inventory.attack[param1] = 55;
            inventory.dmgAir[param1] = 115;
            inventory.dmgArmor[param1] = 55;
            inventory.reqTrait[param1] = TRAIT.RIFLE;
            inventory.reqLv[param1] = 1;
            inventory.range[param1] = 2;
            inventory.manualReload[param1] = true;
            inventory.value[param1] = 400;
         }
         if(param2 == 5)
         {
            inventory.name[param1] = "Assault Rifle";
            inventory.reloadTimeMax[param1] = 55;
            inventory.ammoMax[param1] = 30;
            inventory.shootRate[param1] = 200;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 110;
            inventory.accuracyDec[param1] = 0.08;
            inventory.attack[param1] = 21;
            inventory.dmgAir[param1] = 55;
            inventory.dmgArmor[param1] = 50;
            inventory.reqTrait[param1] = TRAIT.RIFLE;
            inventory.reqLv[param1] = 5;
            inventory.range[param1] = 1;
            inventory.value[param1] = 850;
         }
         if(param2 == 6)
         {
            inventory.name[param1] = "Fur";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 80;
         }
         if(param2 == 7)
         {
            inventory.name[param1] = "Armor";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 290;
         }
         if(param2 == 8)
         {
            setMod(param1,encList[1][int(Math.random() * encList[1].length)]);
         }
         if(param2 == 9)
         {
            setMod(param1,encList[2][int(Math.random() * encList[2].length)]);
         }
         if(param2 == 10)
         {
            setMod(param1,encList[3][int(Math.random() * encList[3].length)]);
         }
         if(param2 == 11)
         {
            inventory.lv[param1] = 1 + int(limit(Math.random() * game.day / 2,0,99));
            inventory.name[param1] = "Grenade Lv." + inventory.lv[param1];
            inventory.type[param1] = _typeUse;
            inventory.attack[param1] = 30 + inventory.lv[param1] * 15;
            inventory.ammo[param1] = 3 + int(Math.random() * 6);
            inventory.ammoMax[param1] = 3 + int(Math.random() * 6);
            inventory.value[param1] = 75 + 60 * inventory.lv[param1] + (20 + inventory.lv[param1] * 3) * inventory.ammoMax[param1];
         }
         if(param2 == 12)
         {
            inventory.lv[param1] = 1 + int(limit(Math.random() * game.day / 5,0,19));
            inventory.name[param1] = "Repair Hammer Lv." + inventory.lv[param1];
            inventory.type[param1] = _typeUse;
            inventory.attack[param1] = 4 + inventory.lv[param1] * 3;
            inventory.ammoMax[param1] = 5;
            inventory.ammo[param1] = 2 + int(Math.random() * 4);
            inventory.value[param1] = 50 + 120 * inventory.lv[param1] + (25 + inventory.lv[param1] * 10) * inventory.ammoMax[param1];
         }
         if(param2 == 13)
         {
            inventory.name[param1] = "Sniper Rifle";
            inventory.reloadTimeMax[param1] = 65;
            inventory.ammoMax[param1] = 8;
            inventory.shootRate[param1] = 20;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 225;
            inventory.accuracyDec[param1] = 0.18;
            inventory.attack[param1] = 100;
            inventory.dmgAir[param1] = 100;
            inventory.dmgArmor[param1] = 90;
            inventory.reqTrait[param1] = TRAIT.RIFLE;
            inventory.reqLv[param1] = 6;
            inventory.range[param1] = 2;
            inventory.value[param1] = 1100;
            inventory.typeMinor[param1] = _typeSniper;
         }
         if(param2 == 14)
         {
            inventory.name[param1] = "Revolver -Sniper-";
            inventory.reloadTimeMax[param1] = 7;
            inventory.ammoMax[param1] = 6;
            inventory.shootRate[param1] = 60;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 160;
            inventory.accuracyDec[param1] = 0.15;
            inventory.attack[param1] = 42;
            inventory.dmgAir[param1] = 70;
            inventory.dmgArmor[param1] = 44;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 6;
            inventory.range[param1] = 2;
            inventory.value[param1] = 900;
            inventory.typeMinor[param1] = _typeSniper;
            inventory.manualReload[param1] = true;
         }
         if(param2 == 15)
         {
            inventory.name[param1] = "Revolver";
            inventory.reloadTimeMax[param1] = 5;
            inventory.ammoMax[param1] = 7;
            inventory.shootRate[param1] = 90;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 80;
            inventory.accuracyDec[param1] = 0.15;
            inventory.attack[param1] = 52;
            inventory.dmgAir[param1] = 20;
            inventory.dmgArmor[param1] = 50;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 4;
            inventory.range[param1] = 1;
            inventory.value[param1] = 750;
            inventory.manualReload[param1] = true;
         }
         if(param2 == 16)
         {
            inventory.name[param1] = "Chain Gun";
            inventory.reloadTimeMax[param1] = 130;
            inventory.ammoMax[param1] = 220;
            inventory.shootRate[param1] = 1000;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 80;
            inventory.accuracyDec[param1] = 0.032;
            inventory.attack[param1] = 12;
            inventory.dmgAir[param1] = 45;
            inventory.dmgArmor[param1] = 50;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 8;
            inventory.range[param1] = 1;
            inventory.value[param1] = 1400;
         }
         if(param2 == 17)
         {
            inventory.name[param1] = "Machine Gun";
            inventory.reloadTimeMax[param1] = 110;
            inventory.ammoMax[param1] = 125;
            inventory.shootRate[param1] = 400;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 60;
            inventory.accuracyDec[param1] = 0.05;
            inventory.attack[param1] = 18;
            inventory.dmgAir[param1] = 40;
            inventory.dmgArmor[param1] = 35;
            inventory.reqTrait[param1] = TRAIT.RIFLE;
            inventory.reqLv[param1] = 7;
            inventory.range[param1] = 2;
            inventory.value[param1] = 980;
         }
         if(param2 == 18)
         {
            inventory.name[param1] = "Laser Pistol";
            inventory.reloadTimeMax[param1] = 55;
            inventory.ammoMax[param1] = 32;
            inventory.shootRate[param1] = 220;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 50;
            inventory.accuracyDec[param1] = 0.08;
            inventory.attack[param1] = 35;
            inventory.dmgAir[param1] = 40;
            inventory.dmgArmor[param1] = 80;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 7;
            inventory.range[param1] = 1;
            inventory.value[param1] = 1300;
         }
         if(param2 == 19)
         {
            inventory.name[param1] = "Combat Shotgun";
            inventory.reloadTimeMax[param1] = 50;
            inventory.ammoMax[param1] = 16;
            inventory.shootRate[param1] = 120;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 65;
            inventory.accuracyDec[param1] = 0.16;
            inventory.attack[param1] = 14;
            inventory.dmgAir[param1] = 70;
            inventory.dmgArmor[param1] = 35;
            inventory.reqTrait[param1] = TRAIT.SHOTGUN;
            inventory.reqLv[param1] = 6;
            inventory.range[param1] = 0;
            inventory.shell[param1] = 4;
            inventory.manualReload[param1] = false;
            inventory.value[param1] = 1100;
            inventory.typeMinor[param1] = _typeShotgun;
         }
         if(param2 == 20)
         {
            inventory.name[param1] = "Auto Shotgun";
            inventory.reloadTimeMax[param1] = 60;
            inventory.ammoMax[param1] = 24;
            inventory.shootRate[param1] = 150;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 25;
            inventory.accuracyDec[param1] = 0.22;
            inventory.attack[param1] = 13;
            inventory.dmgAir[param1] = 80;
            inventory.dmgArmor[param1] = 30;
            inventory.reqTrait[param1] = TRAIT.SHOTGUN;
            inventory.reqLv[param1] = 4;
            inventory.range[param1] = 1;
            inventory.shell[param1] = 10;
            inventory.manualReload[param1] = false;
            inventory.value[param1] = 1400;
            inventory.typeMinor[param1] = _typeShotgun;
         }
         if(param2 == 21)
         {
            inventory.name[param1] = "Grenade Launcher";
            inventory.reloadTimeMax[param1] = 14;
            inventory.ammoMax[param1] = 6;
            inventory.shootRate[param1] = 30;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 40;
            inventory.accuracyDec[param1] = 0.4;
            inventory.attack[param1] = 50;
            inventory.dmgAir[param1] = 90;
            inventory.dmgArmor[param1] = 100;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 3;
            inventory.range[param1] = 1;
            inventory.shell[param1] = 1;
            inventory.manualReload[param1] = true;
            inventory.value[param1] = 1600;
            inventory.special[param1] = 1;
         }
         if(param2 == 22)
         {
            inventory.name[param1] = "Rocket Launcher";
            inventory.reloadTimeMax[param1] = 20;
            inventory.ammoMax[param1] = 3;
            inventory.shootRate[param1] = 18;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 40;
            inventory.accuracyDec[param1] = 0.5;
            inventory.attack[param1] = 110;
            inventory.dmgAir[param1] = 70;
            inventory.dmgArmor[param1] = 150;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 7;
            inventory.range[param1] = 2;
            inventory.shell[param1] = 1;
            inventory.manualReload[param1] = true;
            inventory.value[param1] = 1700;
            inventory.special[param1] = 2;
         }
         if(param2 == 23)
         {
            inventory.name[param1] = "Crossbow";
            inventory.reloadTimeMax[param1] = 0;
            inventory.ammoMax[param1] = 1;
            inventory.shootRate[param1] = 28;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 120;
            inventory.accuracyDec[param1] = 0.35;
            inventory.attack[param1] = 36;
            inventory.dmgAir[param1] = 90;
            inventory.dmgArmor[param1] = 50;
            inventory.reqTrait[param1] = TRAIT.RIFLE;
            inventory.reqLv[param1] = 3;
            inventory.range[param1] = 2;
            inventory.value[param1] = 650;
            inventory.special[param1] = 3;
         }
         if(param2 == 24)
         {
            inventory.name[param1] = "Long Bow";
            inventory.reloadTimeMax[param1] = 0;
            inventory.ammoMax[param1] = 1;
            inventory.shootRate[param1] = 55;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 220;
            inventory.accuracyDec[param1] = 0.4;
            inventory.attack[param1] = 32;
            inventory.dmgAir[param1] = 100;
            inventory.dmgArmor[param1] = 35;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 1;
            inventory.range[param1] = 2;
            inventory.value[param1] = 400;
            inventory.special[param1] = 4;
         }
         if(param2 == 25)
         {
            inventory.name[param1] = "Wind Bow";
            inventory.reloadTimeMax[param1] = 0;
            inventory.ammoMax[param1] = 1;
            inventory.shootRate[param1] = 35;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 130;
            inventory.accuracyDec[param1] = 0.3;
            inventory.attack[param1] = 18;
            inventory.dmgAir[param1] = 110;
            inventory.dmgArmor[param1] = 30;
            inventory.reqTrait[param1] = TRAIT.SMALL_GUN;
            inventory.reqLv[param1] = 5;
            inventory.range[param1] = 2;
            inventory.value[param1] = 1800;
            inventory.special[param1] = 4;
            inventory.shell[param1] = 3;
         }
         if(param2 == 26)
         {
            inventory.name[param1] = "Repeating Crossbow";
            inventory.reloadTimeMax[param1] = 0;
            inventory.ammoMax[param1] = 1;
            inventory.shootRate[param1] = 85;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 90;
            inventory.accuracyDec[param1] = 0.25;
            inventory.attack[param1] = 14;
            inventory.dmgAir[param1] = 90;
            inventory.dmgArmor[param1] = 30;
            inventory.reqTrait[param1] = TRAIT.RIFLE;
            inventory.reqLv[param1] = 6;
            inventory.range[param1] = 2;
            inventory.value[param1] = 1550;
            inventory.special[param1] = 3;
         }
         if(param2 == 27)
         {
            inventory.name[param1] = "Gravity Gun";
            inventory.reloadTimeMax[param1] = 180;
            inventory.ammoMax[param1] = 1;
            inventory.shootRate[param1] = 100;
            inventory.automatic[param1] = false;
            inventory.baseAccuracy[param1] = 120;
            inventory.accuracyDec[param1] = 0.55;
            inventory.attack[param1] = 105;
            inventory.dmgAir[param1] = 100;
            inventory.dmgArmor[param1] = 100;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 11;
            inventory.range[param1] = 2;
            inventory.value[param1] = 2000;
            inventory.special[param1] = 3;
         }
         if(param2 == 28)
         {
            inventory.name[param1] = "Rat Roast";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 50;
         }
         if(param2 == 29)
         {
            inventory.name[param1] = "Helmet";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 80;
         }
         if(param2 == 30)
         {
            inventory.name[param1] = "Feather";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 120;
         }
         if(param2 == 31)
         {
            inventory.name[param1] = "Meat";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 150;
         }
         if(param2 == 32)
         {
            inventory.name[param1] = "Scrap Metal";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 220;
         }
         if(param2 == 33)
         {
            inventory.name[param1] = "Insect Blood";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 95;
         }
         if(param2 == 34)
         {
            inventory.name[param1] = "Dragon Head";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 300;
         }
         if(param2 == 35)
         {
            inventory.name[param1] = "Shop Token";
            inventory.type[param1] = _typeToken;
            inventory.value[param1] = 100;
            inventory.attack[param1] = limit(game.day,0,30) * 75 + 250;
            inventory.rare[param1] = 0;
         }
         if(param2 == 36)
         {
            inventory.name[param1] = "Cheap Worn HMG";
            inventory.reloadTimeMax[param1] = 90;
            inventory.ammoMax[param1] = 80;
            inventory.shootRate[param1] = 250;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 45;
            inventory.accuracyDec[param1] = 0.058;
            inventory.attack[param1] = 25;
            inventory.dmgAir[param1] = 35;
            inventory.dmgArmor[param1] = 90;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 1;
            inventory.range[param1] = 1;
            inventory.value[param1] = 480;
         }
         if(param2 == 37)
         {
            inventory.name[param1] = "Holy Grail of Jure";
            inventory.type[param1] = _typeUse;
            inventory.attack[param1] = 250;
            inventory.ammoMax[param1] = 0;
            inventory.value[param1] = 1500;
            inventory.rare[param1] = 0;
         }
         if(param2 == 38)
         {
            inventory.name[param1] = "Ragnarok";
            inventory.type[param1] = _typeUse;
            inventory.attack[param1] = 200;
            inventory.ammoMax[param1] = 0;
            inventory.value[param1] = 1000;
            inventory.rare[param1] = 0;
         }
         if(param2 == 39)
         {
            inventory.name[param1] = "HMG";
            inventory.reloadTimeMax[param1] = 90;
            inventory.ammoMax[param1] = 80;
            inventory.shootRate[param1] = 250;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 50;
            inventory.accuracyDec[param1] = 0.06;
            inventory.attack[param1] = 29;
            inventory.dmgAir[param1] = 35;
            inventory.dmgArmor[param1] = 90;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 4;
            inventory.range[param1] = 1;
            inventory.value[param1] = 1000;
         }
         if(param2 == 40)
         {
            inventory.name[param1] = "Flame Thrower";
            inventory.reloadTimeMax[param1] = 60;
            inventory.ammoMax[param1] = 4;
            inventory.shootRate[param1] = 25;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 40;
            inventory.accuracyDec[param1] = 0.3;
            inventory.attack[param1] = 12;
            inventory.dmgAir[param1] = 55;
            inventory.dmgArmor[param1] = 80;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 5;
            inventory.range[param1] = 0;
            inventory.value[param1] = 900;
            inventory.special[param1] = 3;
         }
         if(param2 == 101)
         {
            inventory.name[param1] = "Statue of Ogre";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 400;
         }
         if(param2 == 102)
         {
            inventory.name[param1] = "Statue of Archer";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 200;
         }
         if(param2 == 103)
         {
            inventory.name[param1] = "Statue of Sheep";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 150;
         }
         if(param2 == 104)
         {
            inventory.name[param1] = "Statue of Exploder";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 250;
         }
         if(param2 == 105)
         {
            inventory.name[param1] = "Statue of Ballista";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 300;
         }
         if(param2 == 106)
         {
            inventory.name[param1] = "Statue of Crow";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 200;
         }
         if(param2 == 107)
         {
            inventory.name[param1] = "Statue of Barbarian";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 250;
         }
         if(param2 == 108)
         {
            inventory.name[param1] = "Statue of Crusader";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 350;
         }
         if(param2 == 109)
         {
            inventory.name[param1] = "Statue of Spiders";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 200;
         }
         if(param2 == 110)
         {
            inventory.name[param1] = "Statue of Dragonfly";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 150;
         }
         if(param2 == 112)
         {
            inventory.name[param1] = "Statue of Tank";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 450;
         }
         if(param2 == 113)
         {
            inventory.name[param1] = "Statue of Dragon";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 500;
         }
         if(param2 == 114)
         {
            inventory.name[param1] = "Statue of Ghost";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 300;
         }
         if(param2 == 115)
         {
            inventory.name[param1] = "Statue of Dragon";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 600;
         }
         if(param2 == 116)
         {
            inventory.name[param1] = "Statue of Peter";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 400;
         }
         if(param2 == 117)
         {
            inventory.name[param1] = "Statue of Rat";
            inventory.type[param1] = _typeSell;
            inventory.value[param1] = 150;
         }
         if(param2 == 120)
         {
            inventory.name[param1] = "HMG";
            inventory.reloadTimeMax[param1] = 90;
            inventory.ammoMax[param1] = 80;
            inventory.shootRate[param1] = 250;
            inventory.automatic[param1] = true;
            inventory.baseAccuracy[param1] = 50;
            inventory.accuracyDec[param1] = 0.06;
            inventory.attack[param1] = 17;
            inventory.dmgAir[param1] = 25;
            inventory.dmgArmor[param1] = 60;
            inventory.reqTrait[param1] = TRAIT.BIG_GUN;
            inventory.reqLv[param1] = 4;
            inventory.range[param1] = 1;
            inventory.value[param1] = 1000;
         }
         if(param2 == 121)
         {
            setMod(param1,_encLivingWeapon);
         }
         if(inventory.type[param1] != _typeUse || inventory.ammoMax[param1] == 0)
         {
            inventory.ammo[param1] = inventory.ammoMax[param1];
         }
         if(inventory.type[param1] == _typeGun)
         {
            inventory.value[param1] = int(inventory.value[param1] * (100 + inventory.modMax[param1] * inventory.modMax[param1] * 4) / 100);
         }
      }
      
      public function updateEquipSlots() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < game.invSlot)
         {
            createInvSlot(_invPlayer + _loc1_,140 + int(_loc1_ % 8) * 50,250 + int(_loc1_ / 8) * 48,1);
            _loc1_++;
         }
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            if(player.exist[_loc1_] != false)
            {
               player_mc[_loc1_] = new ally2() as MovieClip;
               player_mc[_loc1_].x = 155 + _loc1_ * 80;
               player_mc[_loc1_].y = 195;
               player_mc[_loc1_].pic = player.pic[_loc1_];
               player_mc[_loc1_].gotoAndPlay("stand");
               player_mc[_loc1_].pname.text = player.name[_loc1_];
               if(player.exist[_loc1_])
               {
                  window2_mc.addChild(player_mc[_loc1_]);
                  if(_loc1_ == 0)
                  {
                     createInvSlot(_invAlly + maxAlly + 1,166 + _loc1_ * 80,160,-1);
                  }
                  else
                  {
                     createInvSlot(_invAlly + _loc1_,166 + _loc1_ * 80,160,1);
                  }
               }
            }
            _loc1_++;
         }
      }
      
      public function reload(param1:int, param2:int) : *
      {
         if(inventory.type[param2] != _typeGun)
         {
            return;
         }
         if(inventory.reloadTime[param2])
         {
            return;
         }
         if(inventory.manualReload[param2])
         {
            if(inventory.id[param2] == 14 || inventory.id[param2] == 15)
            {
               sound_reloading3.play(0,0,trans[param1]);
            }
            else
            {
               sound_reloading2.play(0,0,trans[param1]);
            }
         }
         else
         {
            sound_reloading1.play(0,0,trans[param1]);
         }
         inventory.reloadTime[param2] = int(inventory.reloadTimeMax[param2] * 100 / (100 + CALC.RELOADING(param1))) + 1;
         if(inventory.autoReload[param2] == 0)
         {
            player_mc[param1].gotoAndPlay("reload");
         }
      }
      
      public function insertHelp() : *
      {
         window4_mc.help.editable = false;
         window4_mc.help.text = "";
         window4_mc.help.text += "-If you\'re dying playing Sheriff or Militia, try to manually reload your gun after EACH TIME you shoot.\n\n";
         window4_mc.help.text += "-Aim for head shots if you can. You will deal double damage.\n\n";
         window4_mc.help.text += "-Tax will become extremely high at later days. Invest in some economic skills early to secure your finance!\n\n";
         window4_mc.help.text += "-When in the \"Fire at will\" mode, your troops can attack enemies beyond their effective weapon ranges, but they will suffer significant accuracy penalties.\n\n";
         window4_mc.help.text += "-If you tag an ally\'s skills as \"Focused\" there will be a big chance that the ally will develop the skill when he levels.\n\n";
         window4_mc.help.text += "-\"Party\" skills affect all of your troops. It\'s a good idea to have your allies specialize in party skills that will help your team.\n\n";
         window4_mc.help.text += "-If more than two characters have the same party skill, only the character with the highest skill level will be used.\n\n";
         window4_mc.help.text += "-Weapons that have \"Mod\" slots can be modded. Drag a weapon-mod item onto the weapon you want to modify. Be careful, weapon-mod items can only be used once and cannot be removed once applied.\n\n";
         window4_mc.help.text += "-If you score 7 critical kills, you go on a rampage. While you are on a rampage, the damage you deal and the chance that enemies drop money increases.\n\n";
         window4_mc.help.text += "-Weapons have effective range. For instance, shotguns are powerful guns but the accuracy of the gun drastically decreases when you aim at distant targets.\n\n";
         window4_mc.help.text += "-You gain experience in the skill of the weapon you are using every time you kill an enemy. When your weapon experience reaches the amount needed for a level you will gain a weapon skill level.\n\n";
         window4_mc.help.text += "-Weapons have anti-armor/air rating. For instance, shotguns are effective against air creatures and non-armored creatures but not effective against armored creatures.\n\n";
         window4_mc.help.text += "-When a battle ends and if your wall HP was full at the beginning of every wave, you get a perfect game and its bonus! Easier to score with the repair upgrade.\n\n";
      }
      
      public function refreshPlayer(param1:int, param2:int) : *
      {
         var _loc5_:int = 0;
         calcGrenadeCount(param1);
         player.rangeFix[param1] = 1800 + CALC.HUNTER(param1) * 20;
         player.chain[param1] = 0;
         chainMode[param1] = 0;
         chainPos[param1] = 0;
         if(chainSound[param1] != null)
         {
            chainSound[param1].stop();
         }
         chainSound[param1] = null;
         var _loc3_:* = [10,24,10];
         var _loc4_:* = [];
         _loc4_ = getWeaponInfo(inventory.id[param2]);
         gunSound[param1] = _loc4_[0];
         player_mc[param1].anime1 = _loc4_[1];
         player_mc[param1].anime2 = _loc4_[2];
         player_mc[param1].anime3 = _loc4_[3];
         player.burst[param1] = 0;
         player.wexpRef[param1] = 4;
         if(inventory.reqTrait[param2] == wexpList[0])
         {
            player.wexpRef[param1] = 0;
         }
         if(inventory.reqTrait[param2] == wexpList[1])
         {
            player.wexpRef[param1] = 1;
         }
         if(inventory.reqTrait[param2] == wexpList[2])
         {
            player.wexpRef[param1] = 2;
         }
         if(inventory.reqTrait[param2] == wexpList[3])
         {
            player.wexpRef[param1] = 3;
         }
         if(param1 == hero && fireAtWill == false)
         {
            player.accuracyDiv[param1] = inventory.baseAccuracy[param2] * (100 + CALC.ACCURACY(param1) + CALC.NOBLE(param1) - CALC.DR_HOLLIDAY(param1)) / 100;
         }
         else
         {
            player.accuracyDiv[param1] = inventory.baseAccuracy[param2] * (100 + CALC.ACCURACY(param1) + CALC.NOBLE(param1) + CALC.COOL(param1) - CALC.DR_HOLLIDAY(param1)) / 100;
         }
         player.shell[param1] = inventory.shell[param2];
         if(inventory.typeMinor[param2] == _typeShotgun)
         {
            player.shell[param1] += player.trait[param1][TRAIT.DR_HOLLIDAY];
         }
         player.aimTime[param1] = 18 - Math.sqrt(player.trait[param1][TRAIT.BASE_AIMING]) * 1.4 - player.trait[param1][TRAIT.BASE_AIMING] * 0.05;
         player.aimTime[param1] = player.aimTime[param1] * 100 / (100 + PARTY.LEADERSHIP);
         player.workRate[param1] = 0.03 + Math.sqrt(player.trait[param1][TRAIT.BASE_TEAMWORK]) * 0.025;
         if(player.aimTime[param1] < 2)
         {
            player.aimTime[param1] = 2;
         }
         if(player.workRate[param1] > 0.3)
         {
            player.workRate[param1] = 0.3;
         }
      }
      
      public function removeChara() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < maxAlly + 1)
         {
            if(!(menuId == 6 && _loc1_ == maxAlly))
            {
               if(player.exist[_loc1_])
               {
                  window2_mc.removeChild(player_mc[_loc1_]);
               }
            }
            _loc1_++;
         }
      }
      
      public function _if(param1:*) : *
      {
         if(param1)
         {
            return 1;
         }
         return 0;
      }
      
      public function _is(param1:int) : *
      {
         if(param1 == _pc)
         {
            return "are";
         }
         return "is";
      }
      
      public function endPauseMenu() : *
      {
         if(blurMc != undefined)
         {
            stage.removeChild(blurMc);
         }
         game.optionShowDamage = window_mc.options.optShowDamage.selected;
         game.optionShowAllyDamage = window_mc.options.optShowAllyDamage.selected;
         game.optionLowQuality = window_mc.options.optLowQuality.selected;
         game.optionFirework = window_mc.options.optFirework.selected;
         game.optionColor = window_mc.options.optColor.selected;
         game.optionFlashShot = window_mc.options.optFlashShot.selected;
         updateOption();
         stage.removeChild(window_mc);
         gamePaused = false;
         if(gameStage == _stageBattle)
         {
            customCursor.visible = true;
            Mouse.hide();
         }
         else
         {
            menuButton.mouseEnabled = true;
         }
         stage.focus = stage;
      }
      
      public function noAp() : *
      {
         sound_beep.play();
         popInfo("You don\'t have enough action points!");
      }
      
      public function MouseLDown_logo3(param1:MouseEvent) : *
      {
         var request:URLRequest = null;
         var event:MouseEvent = param1;
         if(bt.hitTestPoint(mouseX,mouseY,false))
         {
            request = new URLRequest("http://www.kongregate.com/games/noanoa/elona-shooter");
            try
            {
               navigateToURL(request);
            }
            catch(e:Error)
            {
            }
         }
      }
      
      public function MouseMove(param1:MouseEvent) : *
      {
         customCursor.x = mouseX;
         customCursor.y = mouseY;
      }
      
      public function swapChara(param1:int, param2:int) : *
      {
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         for(_loc3_ in player)
         {
            _loc4_ = player[_loc3_][param1];
            player[_loc3_][param1] = player[_loc3_][param2];
            player[_loc3_][param2] = _loc4_;
         }
         swapStuff(_invAlly + param1,_invAlly + param2);
      }
      
      public function removeMedals() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < medalCount)
         {
            window2_mc.removeChild(medal_mc[_loc1_]);
            _loc1_++;
         }
         medalCount = 0;
      }
      
      public function endDialog(param1:Boolean) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         stage.removeChild(dialog_mc);
         sound_click1.play();
         gameDialog = false;
         if(dialogAction == _dialogHire)
         {
            if(param1)
            {
               mission.hire = true;
               showEventDialog(_dialogActHire);
               window2_mc.act2.visible = false;
               window2_mc.actRef2.visible = false;
            }
         }
         if(dialogAction == _dialogUpgrade)
         {
            if(param1)
            {
               if(player.money[_pc] < upgradeWeapon(upgradeItem,1))
               {
                  sound_beep.play();
                  popInfo("You don\'t have enough money!");
               }
               else
               {
                  sound_mod.play();
                  game.ap -= 4;
                  player.money[_pc] -= upgradeWeapon(upgradeItem,1);
                  swapStuff(upgradeItem,_invRefer);
                  updateInterface();
               }
            }
         }
         if(dialogAction == _dialogQuit)
         {
            if(param1)
            {
               endPauseMenu();
               if(gameStage == _stageResult)
               {
                  stage.removeChild(window2_mc);
                  exitMenuResult();
                  exitResult();
               }
               else
               {
                  exitBattle();
               }
               gotoAndPlay("init");
            }
         }
         if(dialogAction == _dialogMod)
         {
            invIcon_mc[dragItem].visible = true;
            _loc2_ = false;
            if(param1)
            {
               _loc3_ = invSlot_mc[dragSlot].id;
               _loc4_ = invSlot_mc[slot].id;
               if(inventory.mod[_loc4_] >= inventory.modMax[_loc4_])
               {
                  sound_beep.play();
                  _loc2_ = true;
                  popInfo("There\'s no available mod slot on this weapon!");
               }
               if(inventory.ammoMax[_loc4_] == 1 && (inventory.mod[_loc3_] == _encAmmo || inventory.mod[_loc3_] == _encReloading))
               {
                  sound_beep.play();
                  _loc2_ = true;
                  popInfo("This weapon can\'t use ammo/reloading mods.");
               }
               if(inventory.reloadTimeMax[_loc4_] == 0 && (inventory.mod[_loc3_] == _encAmmo || inventory.mod[_loc3_] == _encReloading))
               {
                  sound_beep.play();
                  _loc2_ = true;
                  popInfo("This weapon can\'t use ammo/reloading mods.");
               }
               if(inventory.mod[_loc3_] == _encAutoReload && inventory.manualReload[_loc4_] == false)
               {
                  sound_beep.play();
                  _loc2_ = true;
                  popInfo("This weapon can\'t use Auto Reload mod.");
               }
               if(inventory.mod[_loc3_] == _encLivingWeapon && inventory.livingWeapon[_loc4_] > 0)
               {
                  sound_beep.play();
                  _loc2_ = true;
                  popInfo("This weapon is already alive.");
               }
               if(_loc2_ == false)
               {
                  sound_mod.play();
                  enchant(_loc4_,inventory.mod[_loc3_],inventory.modMax[_loc3_]);
                  inventory.num[_loc3_] = 0;
                  invIcon_mc[dragItem].visible = false;
                  invSlot_mc[dragSlot].item = -1;
               }
            }
            else if(invSlot_mc[slot].id >= _invAlly)
            {
               _loc2_ = true;
            }
            else
            {
               invSlot_mc[slot].item = dragItem;
               invSlot_mc[dragSlot].item = item;
               invIcon_mc[item].x = invSlot_mc[dragSlot].x - (invIcon_mc[item].width - 48) / 2 - 4;
               invIcon_mc[item].y = invSlot_mc[dragSlot].y;
               swapStuff(invSlot_mc[dragSlot].id,invSlot_mc[slot].id);
            }
            if(_loc2_)
            {
               invIcon_mc[dragItem].stopDrag();
               invIcon_mc[dragItem].x = invSlot_mc[dragSlot].x - (invIcon_mc[dragItem].width - 48) / 2 - 4;
               invIcon_mc[dragItem].y = invSlot_mc[dragSlot].y;
            }
            updateInterface();
            updateSlots();
            updateInventory();
         }
         if(dialogAction == _dialogCarryOver)
         {
            if(param1)
            {
               carryOver();
            }
         }
         if(dialogAction == _dialogSell)
         {
            invIcon_mc[dragItem].visible = true;
            if(param1)
            {
               sound_pay1.play();
               _loc3_ = invSlot_mc[dragSlot].id;
               player.money[_pc] += stuffGetValue(_loc3_,0);
               game.totalMoney += stuffGetValue(_loc3_,0);
               inventory.num[_loc3_] = 0;
               invIcon_mc[dragItem].visible = false;
               invSlot_mc[dragSlot].item = -1;
               updateInterface();
               updateSlots();
               updateInventory();
            }
         }
         if(dialogAction == _dialogRecruit)
         {
            if(param1)
            {
               sound_pay1.play();
               player.money[_pc] -= player.cost[maxAlly];
               removeChara();
               cs = getFreeAlly();
               swapChara(maxAlly,getFreeAlly());
               deleteChara(maxAlly);
               delay = 0;
               updateInterface();
               updateCharaList();
               updateCharaMenu();
               kongregateStats();
               initPartySkill();
            }
         }
         if(dialogAction == _dialogDismiss)
         {
            if(param1)
            {
               removeChara();
               deleteChara(cs);
               delay = 0;
               --cs;
               updateCharaList();
               updateCharaMenu();
               initPartySkill();
            }
         }
         if(dialogAction == _dialogTrash)
         {
            if(param1)
            {
               deleteGame();
               updateSaveSlot();
            }
         }
      }
      
      public function loadGame() : *
      {
         var _loc2_:Object = null;
         var _loc1_:* = SharedObject.getLocal("elonas" + idx.slot);
         if(_loc1_)
         {
            _loc2_ = _loc1_.data;
            if(_loc2_.game == undefined || _loc2_.deleted == true)
            {
               return false;
            }
            game = cloneObj(_loc2_.game);
            player = cloneObj(_loc2_.player);
            inventory = cloneObj(_loc2_.inventory);
            mission = cloneObj(_loc2_.mission);
            versionFix();
            updateOption();
            return true;
         }
         return false;
      }
      
      public function onEnterFrame_result(param1:Event) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         draw_count += 1;
         if(cancelFirework == false && ce != _eventClear && getTimer() - old_timer >= 2000)
         {
            if(draw_count < 25)
            {
               stopFire();
               cancelFirework = true;
            }
            old_timer = getTimer();
            draw_count = 0;
         }
         ++delay;
         cloud.x -= 0.2;
         if(cloud.x < -1280)
         {
            cloud.x = 0;
         }
         if(ce == _eventClear)
         {
            --fireworkCount;
            if(fireworkCount < 0)
            {
               fireworkMedal();
            }
         }
         if(startFromTown && toTownMenu)
         {
            if(delay == 30)
            {
               window3_mc.name = "window3_mc";
               window3_mc.x = window2_mc.x;
               window3_mc.y = window2_mc.y;
               window3_mc.gotoAndStop("menu_result");
            }
            if(delay > 30)
            {
               exitResult();
               stage.addChild(window3_mc);
               stage.removeChild(window2_mc);
               if(game.HC == true)
               {
                  idx.dayHC = game.day;
               }
               else
               {
                  idx.day = game.day;
               }
               gotoAndStop("town");
               return;
            }
            _loc2_ = 0;
            while(_loc2_ < menuList.length)
            {
               menuList[_loc2_].visible = true;
               menuList[_loc2_].x += 3;
               _loc2_++;
            }
            window2_mc.x += 1.1;
            bgAlpha.alpha += 0.04;
            return;
         }
         if(toTownMenu)
         {
            if(delay == 30)
            {
               window3_mc.name = "window3_mc";
               window3_mc.x = window2_mc.x;
               window3_mc.y = window2_mc.y;
               window3_mc.gotoAndStop("menu_result");
               window3_mc.addFrameScript(window3_mc.currentFrame - 1,procResult);
            }
            if(delay > 30)
            {
               exitResult();
               stage.addChild(window3_mc);
               stage.removeChild(window2_mc);
               if(game.submit == true || kongregate == 0)
               {
                  if(game.casual == true)
                  {
                     idx.dayCasual = game.day;
                     if(game.day > 40 && game.day % 40 == 1)
                     {
                        ++idx.winCasual;
                     }
                  }
                  else if(game.HC == true)
                  {
                     idx.dayHC = game.day;
                     if(game.day > 40 && game.day % 40 == 1)
                     {
                        ++idx.winHC;
                     }
                  }
                  else
                  {
                     idx.day = game.day;
                     if(game.day > 40 && game.day % 40 == 1)
                     {
                        ++idx.win;
                     }
                  }
               }
               gotoAndStop("town");
               return;
            }
            _loc2_ = 0;
            while(_loc2_ < menuList.length)
            {
               menuList[_loc2_].visible = true;
               menuList[_loc2_].x += 3;
               _loc2_++;
            }
            window2_mc.x += 1.1;
            bgAlpha.alpha += 0.04;
            return;
         }
         if(ce == _eventMode && delay > 3)
         {
            setGameOption();
            if(game.submit == true || kongregate == 0)
            {
               window2_mc.warning.alpha = 0;
            }
            else
            {
               window2_mc.warning.alpha = 1;
            }
         }
         if(ce == _eventGene && delay > 3)
         {
            if(window2_mc.optHC.selected == true)
            {
               window2_mc.extraButton.visible = false;
               window2_mc.optCasual.selected = false;
            }
            else
            {
               window2_mc.extraButton.visible = true;
            }
         }
         if(ce == _eventGene && eventModeEnabled == false || ce == _eventMode)
         {
            if(delay < 41)
            {
               root.transform.colorTransform = new ColorTransform(0.025 * delay,0.025 * delay,0.025 * delay,1,0,0,0,0);
            }
            _loc3_ = false;
            _loc2_ = 0;
            while(_loc2_ < _maxPic)
            {
               if(cs == _loc2_)
               {
                  pic_mc[_loc2_].alpha = 1;
               }
               else
               {
                  pic_mc[_loc2_].alpha = 0.5;
                  if(_loc3_ == false && Boolean(pic_mc[_loc2_].hitTestPoint(mouseX,mouseY,true)))
                  {
                     pic_mc[_loc2_].alpha = 0.8;
                     _loc3_ = true;
                  }
               }
               _loc2_++;
            }
         }
         if(ce == _eventBegin)
         {
            if(delay < 41)
            {
               root.transform.colorTransform = new ColorTransform(0.025 * delay,0.025 * delay,0.025 * delay,1,0,0,0,0);
            }
            if(delay >= 90)
            {
               exitResult();
               stage.removeChild(window2_mc);
               gotoAndStop("battle");
               return;
            }
         }
         if(fadeCount)
         {
            window2_mc.alpha = fadeCount * 0.1 - 0.1;
            --fadeCount;
            if(ce == _eventGene || ce == _eventMode)
            {
               root.transform.colorTransform = new ColorTransform(fadeCount * 0.1,fadeCount * 0.1,fadeCount * 0.1,1,0,0,0,0);
               if(fadeCount == 0)
               {
                  bgAlpha.alpha = 0;
               }
            }
            if(ce != _eventBegin)
            {
               if(fadeCount == 0)
               {
                  exitMenuResult();
                  selectEvent();
               }
            }
         }
         if(window2_mc.anime)
         {
            window2_mc.anime = false;
            window2_mc.animeTime = 16;
            window2_mc.x = 590;
            window2_mc.visible = true;
         }
         if(Boolean(window2_mc.animeTime) && delay > 3)
         {
            --window2_mc.animeTime;
            window2_mc.x -= Math.pow(window2_mc.animeTime,1.7);
            _loc2_ = 0;
            while(_loc2_ < selectID)
            {
               buttonArray[_loc2_].x -= Math.pow(window2_mc.animeTime,1.7);
               _loc2_++;
            }
         }
         if(gamePaused || gameDialog)
         {
            return;
         }
         if(ce == _eventLoot || ce == _eventLootBoss)
         {
            invPopup();
         }
         if(ce == _eventAlly || ce == _eventGene)
         {
            hint();
         }
      }
      
      public function generateShop() : *
      {
         var _loc1_:* = undefined;
         clearGameInv();
         _loc1_ = 0;
         while(_loc1_ < 2 + game.smith)
         {
            randomStuff(_invShop + _loc1_,int(Math.random() * game.day * 250) + 200,0);
            _loc1_++;
         }
         randomStuff(_invShop,int(Math.random() * game.day * 200) + 200,4);
         if(game.specialSale)
         {
            _loc1_ = 0;
            while(_loc1_ < 2 + game.smith)
            {
               randomStuff(_invShop + _loc1_,int(Math.random() * game.day * 75) + 500,3);
               _loc1_++;
            }
            generateStuff(_invShop,8);
            setMod(_invShop,_encAutoReload);
         }
         if(game.comp != true)
         {
            game.specialSale = 0;
         }
      }
      
      public function generateWave(param1:*) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         var _loc5_:int = 0;
         var _loc6_:* = undefined;
         debugGroup = "" + param1 + ":";
         _loc2_ = int(mission.level % lvCycle + int(mission.level / lvCycle) * 3);
         pop[param1] = [];
         popTime[param1] = [];
         eDupe = [];
         mission.power = int(mission.powerOrg - mission.powerOrg / 2.5 * param1 / mission.wave);
         if(1)
         {
            if(mission.bossDay == true)
            {
               if(param1 == mission.bossWave)
               {
                  _loc3_ = 0;
                  while(_loc3_ < int(Math.sqrt(mission.level)))
                  {
                     pop[param1].push(_boss);
                     _loc3_++;
                  }
               }
               else
               {
                  _loc3_ = 0;
                  while(_loc3_ < mission.wave - param1 - 1)
                  {
                     selectEnemy(randLv(_loc2_,1),1,[],param1);
                     _loc3_++;
                  }
               }
            }
            else if(debugBatch)
            {
               debugGroup += "(DBUG BATCH) ";
               selectEnemy(randLv(_loc2_ - 2,0.8),115,["MASS"],param1);
            }
            else if(Math.random() < 0.1 && _loc2_ > 3)
            {
               debugGroup += "(Air   ) ";
               selectEnemy(randLv(_loc2_,0.5),20,["AIR"],param1);
               selectEnemy(randLv(_loc2_,0.8),20,["AIR"],param1);
               selectEnemy(_loc2_,20,["AIR"],param1);
               selectEnemy(_loc2_ + 2,20,["AIR"],param1);
               selectEnemy(randLv(_loc2_,0.2),20,["AIR"],param1);
            }
            else if(Math.random() < 0.1 && _loc2_ > 2 && game.skipHard != true)
            {
               debugGroup += "(BATCH1) ";
               selectEnemy(randLv(_loc2_,0.7),40,["BATCH"],param1);
               selectEnemy(_loc2_ + 2,20,[],param1);
               selectEnemy(randLv(_loc2_,1),60,["BATCH"],param1);
            }
            else if(Math.random() < 0.2 && _loc2_ > 5)
            {
               debugGroup += "(RANGED) ";
               selectEnemy(randLv(_loc2_,0.8),10,[],param1);
               selectEnemy(randLv(_loc2_,1),30,["RANGED"],param1);
               selectEnemy(_loc2_ + 2,20,[],param1);
               selectEnemy(randLv(_loc2_,1),15,[],param1);
               selectEnemy(randLv(_loc2_,1),15,["RANGED"],param1);
            }
            else if(Math.random() < 0.15 && _loc2_ > 10 && game.skipHard != true)
            {
               debugGroup += "(BATCH2) ";
               selectEnemy(randLv(_loc2_ - 2,0.8),100,["MASS"],param1);
            }
            else
            {
               debugGroup += "(RANDOM) ";
               selectEnemy(randLv(_loc2_,0.25),15,["BATCH"],param1);
               if(mission.level > 1)
               {
                  selectEnemy(randLv(_loc2_,0.8),15,[],param1);
               }
               selectEnemy(randLv(_loc2_,0.5),20,["BATCH"],param1);
               selectEnemy(_loc2_ + 2,20,[],param1);
               if(mission.level > 1)
               {
                  selectEnemy(randLv(_loc2_,1),15,[],param1);
               }
               selectEnemy(randLv(_loc2_,0.4),15,["BATCH"],param1);
            }
         }
         if(param1 == mission.bossWave)
         {
            pop[param1].push(_boss);
         }
         _loc3_ = 0;
         while(_loc3_ < pop[param1].length)
         {
            _loc6_ = eRef[eRefId[pop[param1][_loc3_]]].power;
            popTime[param1][_loc3_] = mission.spawnRate + int(_loc6_ / 100) + true_if(_loc6_ >= 300) * 2;
            _loc4_ = int(Math.random() * pop[param1].length);
            _loc5_ = int(pop[param1][_loc3_]);
            pop[param1][_loc3_] = pop[param1][_loc4_];
            pop[param1][_loc4_] = _loc5_;
            _loc3_++;
         }
         popTime[param1][0] += 90 - int(mission.fixedLv * 1.5);
         if(game.day < 10 && game.MORE == false)
         {
            popTime[param1][0] += 20;
         }
         if(param1 == 0)
         {
            popTime[param1][0] += 50;
         }
         mission.group[param1] = pop[param1].length;
      }
      
      public function updateDay() : *
      {
         if(gameStage == _stageTown)
         {
            dayText.text = game.day;
         }
         else
         {
            dayText.text = game.day + "/" + mission.wave;
         }
      }
      
      public function weapon(param1:int) : *
      {
         if(param1 == _pc)
         {
            return ci;
         }
         return _invAlly + param1;
      }
      
      public function generateCard() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         _loc1_ = [1,1,1,2,3,4,5,6,7];
         _loc2_ = 0;
         while(_loc2_ < 5)
         {
            _loc3_ = Math.random() * _loc1_.length;
            if(_loc1_[_loc3_] != 0)
            {
               game.card[_loc2_] = _loc1_[_loc3_] * -1;
               _loc1_[_loc3_] = 0;
               _loc2_++;
            }
         }
      }
      
      public function calcRepair(param1:int) : *
      {
         return inventory.attack[param1];
      }
      
      public function killPop(param1:*) : *
      {
         popList[param1] = 0;
      }
      
      public function stopSound() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            if(chainMode[_loc1_] == 3)
            {
               if(chainSound[_loc1_] != null)
               {
                  chainSound[_loc1_].stop();
               }
            }
            _loc1_++;
         }
      }
      
      public function actionMedal() : *
      {
         if(game.carryOver == true)
         {
            return;
         }
         if(game.prayerCount >= 15)
         {
            getMedal(_medalAction1);
         }
         if(game.tauntCount >= 10)
         {
            getMedal(_medalAction2);
         }
         if(game.partyCount >= 10)
         {
            getMedal(_medalAction3);
         }
         if(game.recycleCount >= 10)
         {
            getMedal(_medalAction4);
         }
         if(game.robCount >= 20)
         {
            getMedal(_medalAction5);
         }
      }
      
      public function procMedalMenu() : *
      {
         museumMedal();
         window2_mc.stop();
         window2_mc.anime = true;
         window2_mc.hint.visible = false;
         window2_mc.actRef1.mouseEnabled = false;
         if(window2_mc.page1.hasEventListener(MouseEvent.MOUSE_DOWN) == false)
         {
            window2_mc.page1.addEventListener(MouseEvent.MOUSE_DOWN,pageChange(0));
         }
         if(window2_mc.page2.hasEventListener(MouseEvent.MOUSE_DOWN) == false)
         {
            window2_mc.page2.addEventListener(MouseEvent.MOUSE_DOWN,pageChange(1));
         }
         if(beta)
         {
            getMedal(_medalBeta);
         }
         if(armor)
         {
            window2_mc.kongMc.visible = false;
         }
         else
         {
            window2_mc.armorbt.visible = false;
         }
         updateMedals();
         defHint = "Medals you won give you various bonuses.\nThey are carried over to the next games.";
      }
      
      public function pauseProc() : *
      {
         if(gameDialog)
         {
            if(dialog_mc.yes.hitTestPoint(mouseX,mouseY,true))
            {
               endDialog(true);
            }
            else
            {
               endDialog(false);
            }
            return;
         }
         if(helpMode)
         {
            procHelp();
            return;
         }
         if(window_mc.returnTitleButton.hitTestPoint(mouseX,mouseY,true))
         {
            if(gameStage == _stageBattle)
            {
               showDialog(_dialogQuit);
               dialog_mc.question.text = "Current game will not be saved. Really quit?";
               return;
            }
            if(gameStage == _stageResult)
            {
               showDialog(_dialogQuit);
               dialog_mc.question.text = "Current game will not be saved. Really quit?";
               return;
            }
            sound_click1.play();
            endPauseMenu();
            if(gameStage == _stageTown)
            {
               if(game.HC == true)
               {
                  saveGame();
               }
               exitMenu();
               exitTown();
            }
            if(amb != null)
            {
               amb.stop();
            }
            gotoAndPlay("init");
            return;
         }
         if(window_mc.helpButton.hitTestPoint(mouseX,mouseY,true))
         {
            openHelp();
            return;
         }
         if(window_mc.saveGameButton.hitTestPoint(mouseX,mouseY,true))
         {
            if(gameStage != _stageTown)
            {
               popInfo("You can only save the game in the town.");
               sound_beep.play();
            }
            else
            {
               saveGame();
               sound_click1.play();
            }
            return;
         }
         if(window_mc.options.hitTestPoint(mouseX,mouseY,true))
         {
            return;
         }
         sound_click1.play();
         endPauseMenu();
      }
      
      public function removeUpgrades() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < upgradeCount)
         {
            window2_mc.removeChild(upgrade_mc[_loc1_]);
            _loc1_++;
         }
      }
      
      public function updateSlot(param1:int) : *
      {
         var _loc2_:int = 0;
         _loc2_ = int(invSlot_mc[param1].id);
         invSlot_mc[param1].cost.text = stuffGetValue(_loc2_,1);
         if(stuffGetValue(_loc2_,1) <= player.money[_pc])
         {
            invSlot_mc[param1].cost.textColor = 204;
         }
         else
         {
            invSlot_mc[param1].cost.textColor = 13369344;
         }
         invSlot_mc[param1].peke.visible = false;
         invSlot_mc[param1].peke.mouseEnabled = false;
         if(_loc2_ >= _invPlayer && _loc2_ < _invPlayer + 5 && inventory.num[_loc2_] > 0)
         {
            if(inventory.type[_loc2_] != _typeGun && inventory.type[_loc2_] != _typeUse || player.trait[_pc][inventory.reqTrait[_loc2_]] < inventory.reqLv[_loc2_])
            {
               invSlot_mc[param1].peke.visible = true;
            }
         }
         if(inventory.num[_loc2_] <= 0)
         {
            if(invSlot_mc[param1].op == 0)
            {
               invSlot_mc[param1].visible = false;
            }
         }
      }
      
      public function updateMedals() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:Array = null;
         _loc1_ = medalPage[page];
         while(_loc1_ < medalPage[page + 1])
         {
            _loc2_ = getMedalInfo(_loc1_);
            if(_loc2_[0] != "null")
            {
               if(!(Boolean(armor) && _loc1_ == _medalKongregate))
               {
                  medal_mc[medalCount] = new medals() as MovieClip;
                  medal_mc[medalCount].x = 145 + int(medalCount / 10) * 130;
                  medal_mc[medalCount].y = 130 + int(medalCount % 10) * 20;
                  if(medalCount / 10 >= 2)
                  {
                     medal_mc[medalCount].y += 20;
                  }
                  medal_mc[medalCount].medalName.text = _loc2_[0];
                  if(medal[_loc1_] == true)
                  {
                     medal_mc[medalCount].hintTxt = [_loc2_[0],_loc2_[2],_loc2_[3],"",""];
                     medal_mc[medalCount].alpha = 1;
                  }
                  else
                  {
                     medal_mc[medalCount].hintTxt = [_loc2_[0],_loc2_[1],"????","",""];
                     medal_mc[medalCount].alpha = 0.3;
                  }
                  window2_mc.addChild(medal_mc[medalCount]);
                  ++medalCount;
               }
            }
            _loc1_++;
         }
      }
      
      public function updateInventory() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:int = 0;
         _loc1_ = 0;
         while(_loc1_ < 5)
         {
            _loc2_ = _invPlayer + _loc1_;
            if(inventory.num[_loc2_] < 1)
            {
               inventory_mc[_loc1_].visible = false;
            }
            else
            {
               inventory_mc[_loc1_].visible = true;
            }
            inventory_mc[_loc1_].num.visible = false;
            if(inventory.type[_loc2_] == _typeUse)
            {
               inventory_mc[_loc1_].num.text = "x " + inventory.ammo[_loc2_];
               inventory_mc[_loc1_].num.y = 20;
               if(inventory.ammoMax[_loc2_] > 0)
               {
                  inventory_mc[_loc1_].num.visible = true;
               }
            }
            inventory_mc[_loc1_].gotoAndStop(inventory.graphic[_invPlayer + _loc1_]);
            setChildIndex(inventory_mc[_loc1_],numChildren - 1);
            _loc1_++;
         }
      }
      
      public function criticalMedal() : *
      {
         if(game.carryOver == true)
         {
            return;
         }
         if(mission.criticalCount >= 10)
         {
            getMedal(_medalCritical1);
         }
         if(mission.criticalCount >= 30)
         {
            getMedal(_medalCritical2);
         }
         if(mission.criticalCount >= 50)
         {
            getMedal(_medalCritical3);
         }
      }
      
      public function updateOption() : *
      {
         if(game.optionLowQuality == true)
         {
            stage.quality = StageQuality.LOW;
         }
         else
         {
            stage.quality = StageQuality.HIGH;
         }
         if(customCursor != undefined)
         {
            if(game.optionColor == true)
            {
               customCursor.gotoAndStop(3);
            }
            else
            {
               customCursor.gotoAndStop(1);
            }
         }
      }
      
      public function popInfo(param1:String) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         _loc3_ = -1;
         _loc2_ = 0;
         while(_loc2_ < popMax)
         {
            if(popList[_loc2_] == 0)
            {
               _loc3_ = _loc2_;
               break;
            }
            _loc2_++;
         }
         if(_loc3_ == -1)
         {
            return;
         }
         ++popList[_loc3_];
         var _loc4_:MovieClip = new infoPop();
         _loc4_.tg = _loc3_;
         _loc4_.kill = killPop;
         _loc4_.x = 200;
         _loc4_.y = _loc3_ * 30;
         if(gameStage == _stageBattle)
         {
            _loc4_.x = 40;
            _loc4_.y += 40;
         }
         _loc4_.pop.infoText.text = param1;
         stage.addChild(_loc4_);
      }
      
      public function showDialog(param1:int) : *
      {
         stage.focus = stage;
         gameDialog = true;
         dialogAction = param1;
         sound_scroll1.play();
         dialog_mc.x = 0;
         dialog_mc.y = 0;
         stage.addChild(dialog_mc);
         stage.setChildIndex(dialog_mc,stage.numChildren - 1);
         if(dialogAction == _dialogUpgrade)
         {
            upgradeWeapon(upgradeItem,0);
            dialog_mc.pop1.visible = true;
            dialog_mc.pop2.visible = true;
            dialog_mc.poparrow.visible = true;
            popupMc = dialog_mc.pop1;
            invPopupUpdate(upgradeItem);
            popupMc = dialog_mc.pop2;
            invPopupUpdate(_invRefer);
            popupMc = undefined;
         }
         else
         {
            dialog_mc.poparrow.visible = false;
            dialog_mc.pop1.visible = false;
            dialog_mc.pop2.visible = false;
         }
      }
      
      public function resetOption() : *
      {
         game.optionBossDropMod = false;
         game.MORE = false;
         game.optWeaponLevel = false;
         game.skipHard = false;
         game.tight = false;
         game.laptop = false;
         game.comp = false;
         game.carryOver = false;
         game.submit = true;
      }
      
      public function versionFixIndex() : *
      {
         if(idx.dayHC == undefined)
         {
            idx.dayHC = 0;
         }
         if(idx.dayCasual == undefined)
         {
            idx.dayCasual = 0;
         }
         if(idx.win == undefined)
         {
            idx.win = 0;
         }
         if(idx.winCasual == undefined)
         {
            idx.winCasual = 0;
         }
         if(idx.winHC == undefined)
         {
            idx.winHC = 0;
         }
      }
      
      public function calcSniperMaxDamage(param1:int) : *
      {
         return int(160 + Math.sqrt(param1) * 2 + param1);
      }
      
      public function soundPos(param1:int) : *
      {
         var _loc2_:int = 0;
         _loc2_ = int(param1 / 25);
         if(_loc2_ <= 0)
         {
            _loc2_ = 0;
         }
         if(_loc2_ > 19)
         {
            _loc2_ = 19;
         }
         return posTrans[_loc2_];
      }
      
      public function updateBG() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:Array = null;
         _loc2_ = [];
         if(bgChange > 0)
         {
            --bgChange;
            _loc1_ = (100 - bgChange) * 0.01;
            _loc2_ = [1,1 - _loc1_ * 0.4,1 - _loc1_ * 0.6];
         }
         else
         {
            ++bgChange;
            _loc1_ = (100 + bgChange) * 0.01;
            _loc2_ = [1 - _loc1_ * 0.9,0.6 - _loc1_ * 0.2,0.4 + _loc1_ * 0.6];
         }
         bg.transform.colorTransform = new ColorTransform(_loc2_[0],_loc2_[1],_loc2_[2],1,0,0,0,0);
         cloud.transform.colorTransform = new ColorTransform(_loc2_[0],_loc2_[1],_loc2_[2],1,0,0,0,0);
      }
      
      public function setTrait(param1:String, param2:int, param3:int, param4:int, param5:String, param6:Array, param7:Function) : *
      {
         var i:* = undefined;
         var s2:String = null;
         var s:String = param1;
         var g:int = param2;
         var maxLv:int = param3;
         var reqLv:int = param4;
         var reqTrait:String = param5;
         var desc:Array = param6;
         var func:Function = param7;
         if(g_count[g] == undefined)
         {
            g_count[g] = 0;
         }
         i = g + g_count[g];
         ID[i] = s;
         TRAIT[s] = i;
         traitRef[i] = {};
         traitRef[i].group = g;
         traitRef[i].maxLv = maxLv;
         traitRef[i].reqLv = reqLv;
         traitRef[i].reqTrait = reqTrait;
         traitRef[i].icon = 0;
         traitRef[i].name = s.substr(0,1) + s.substr(1).toLowerCase();
         if(s.indexOf("_") != -1)
         {
            traitRef[i].name = traitRef[i].name.substr(0,traitRef[i].name.indexOf("_")) + " " + traitRef[i].name.substr(traitRef[i].name.indexOf("_") + 1);
         }
         CALC[s] = function(param1:int):*
         {
            if(player.trait[param1][i] + traitLvFix == 0)
            {
               return 0;
            }
            return func(player.trait[param1][i] + traitLvFix);
         };
         REF[s] = function(param1:int):*
         {
            var _loc2_:String = null;
            var _loc3_:String = null;
            var _loc4_:String = null;
            var _loc5_:int = 0;
            var _loc6_:String = null;
            var _loc7_:String = null;
            if(traitRef[i].maxLv != 999)
            {
               _loc6_ = "" + traitRef[i].maxLv;
            }
            else
            {
               _loc6_ = "";
            }
            _loc7_ = "";
            _loc3_ = desc[0];
            if(PARTY[s] != undefined)
            {
               _loc3_ += " Party Skill.";
               _loc7_ = "Party Skill";
            }
            if(traitRef[i].group == G_BASE || i < G_GEN)
            {
               _loc7_ = "Base Skill";
            }
            _loc5_ = player.trait[param1][i] + traitLvFix;
            _loc2_ = s.substr(0,1) + s.substr(1).toLowerCase();
            var _loc8_:* = 0;
            while(_loc8_ < 2)
            {
               if(_loc2_.indexOf("_") != -1)
               {
                  _loc2_ = _loc2_.substr(0,_loc2_.indexOf("_")) + " " + _loc2_.substr(_loc2_.indexOf("_") + 1,1).toUpperCase() + _loc2_.substr(_loc2_.indexOf("_") + 2);
               }
               _loc8_++;
            }
            if(_loc2_ == "Dr Holiday")
            {
               _loc2_ == "Doc Holiday";
            }
            if(traitRef[i].maxLv > 1 && _loc5_ > 1)
            {
               _loc2_ += " " + _loc5_;
            }
            if(traitLvFix != 0 && _loc5_ == 1)
            {
               _loc2_ += "(New!)";
            }
            _loc4_ = desc[1];
            if(desc[2] == "x")
            {
               _loc4_ += "" + int(CALC[s](param1));
            }
            if(desc[2] == "y")
            {
               _loc4_ += "" + _loc5_;
            }
            _loc4_ += desc[3];
            if(desc[1] == "sniper1")
            {
               _loc4_ = "" + (calcSniperMaxDamage(_loc5_) - 100) + "% damage bonus(max)";
            }
            if(desc[1] == "duelist1")
            {
               _loc4_ = "" + calcDuelistMaxDamage(_loc5_) + "% damage bonus(max)";
            }
            if(traitRef[i].maxLv == _loc5_)
            {
               _loc4_ += " [Maxed]";
            }
            if(_loc5_ == 0)
            {
               _loc4_ = "None";
            }
            traitLvFix = 0;
            return [_loc2_,_loc3_,_loc4_,_loc6_,_loc7_];
         };
         ++g_count[g];
      }
      
      public function orderOpen(param1:Event) : void
      {
         window2_mc.dismissButton.mouseEnabled = false;
      }
      
      public function removeInvIcon() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < invIconCount)
         {
            window2_mc.removeChild(invIcon_mc[_loc1_]);
            _loc1_++;
         }
      }
      
      public function updateAp() : *
      {
         apText.visible = true;
         apText.text = "AP: " + game.ap;
      }
      
      public function updateSlots() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < invSlotCount)
         {
            updateSlot(_loc1_);
            _loc1_++;
         }
      }
      
      public function randomStuff(itemIndex:int, targetValue:int, generationMode:int) : *
      {
         var modSlotIndex:int = 0;
         var attemptCount:int = 0;
         if(targetValue <= 500)
         {
            targetValue = 500;
         }
         while(attemptCount < 300)
         {
            if(++attemptCount >= 200)
            {
               generateStuff(itemIndex,8);
               break;
            }
            generateStuff(itemIndex,1 + int(Math.random() * _maxItem));
            if(inventory.rare[itemIndex] != 0)
            {
               if(generationMode == 0)
               {
                  if(inventory.type[itemIndex] == _typeMod && Math.random() > 0.025)
                  {
                     continue;
                  }
                  if(inventory.type[itemIndex] == _typeGun && Math.random() > 0.25)
                  {
                     continue;
                  }
               }
               if(generationMode == 1)
               {
                  if(inventory.type[itemIndex] == _typeMod && Math.random() > 0.2)
                  {
                     continue;
                  }
                  if(inventory.type[itemIndex] == _typeGun && Math.random() > 0.1)
                  {
                     continue;
                  }
               }
               if(generationMode == 2)
               {
                  if(inventory.type[itemIndex] == _typeMod && Math.random() > 0.2)
                  {
                     continue;
                  }
                  if(inventory.type[itemIndex] != _typeGun && inventory.type[itemIndex] != _typeMod)
                  {
                     continue;
                  }
               }
               if(generationMode == 3)
               {
                  if(inventory.type[itemIndex] != _typeMod)
                  {
                     continue;
                  }
               }
               if(generationMode == 4)
               {
                  if(inventory.type[itemIndex] != _typeGun)
                  {
                     continue;
                  }
               }
               if(inventory.type[itemIndex] != _typeSell)
               {
                  if(inventory.type[itemIndex] == _typeGun)
                  {
                     if(game.optWeaponLevel == true)
                     {
                        if(inventory.reqLv[itemIndex] > getBestSkill(ID[inventory.reqTrait[itemIndex]],1) + 2)
                        {
                           generationMode = 4;
                           continue;
                        }
                     }
                     weaponVariation(itemIndex,-1);
                     if(generationMode == 2 || Math.random() > 0.85)
                     {
                        if(Math.random() > 0.95)
                        {
                           inventory.modMax[itemIndex] = 1;
                           enchant(itemIndex,_encLivingWeapon,1);
                        }
                        else
                        {
                           modSlotIndex = 0;
                           while(modSlotIndex < inventory.modMax[itemIndex])
                           {
                              if(generationMode == 2 && modSlotIndex == 0 || Math.random() < 0.5 - modSlotIndex * 0.15)
                              {
                                 enchant(itemIndex,-1,-1);
                              }
                              modSlotIndex++;
                           }
                        }
                     }
                  }
                  if(inventory.value[itemIndex] <= 500)
                  {
                     break;
                  }
                  if(Math.random() > 0.96 && inventory.value[itemIndex] <= targetValue * 2 + 500)
                  {
                     break;
                  }
                  if(inventory.value[itemIndex] <= targetValue * (100 + attemptCount) / 100)
                  {
                     break;
                  }
               }
            }
         }
      }
      
      public function explode_puls(param1:*, param2:*, param3:*, param4:*, param5:int, param6:int) : *
      {
         var _loc7_:int = 0;
         var multiplier:Number = 1;
         if(param1 >= 0 && param1 < maxAlly)
         {
            multiplier *= (100 + CALC.DA_BOMB(param1)) / 100;
         }
         if(param5 != -1)
         {
            param5 *= multiplier;
         }
         if(param6 == 0)
         {
            sound_puls.play(0,0,soundPos(param3));
         }
         if(param6 == 1)
         {
            multiplier *= 0.9;
         }
         _loc7_ = 0;
         while(_loc7_ < maxEnemy)
         {
            if(!enemyArray[_loc7_].isDead())
            {
               if(enemyArray[_loc7_].x > param3 - 60 * multiplier && enemyArray[_loc7_].x < param3 + 60 * multiplier && enemyArray[_loc7_].y > param4 - 50 * multiplier && enemyArray[_loc7_].y < param4 + 50 * multiplier)
               {
                  enemyArray[_loc7_].damage(param5,param2,enemyArray[_loc7_].x,enemyArray[_loc7_].y,param1,false);
               }
            }
            _loc7_++;
         }
      }
      
      public function selectEvent() : *
      {
         ce = eventList.pop();
         if(ce == _eventClear)
         {
            sound_battleEnd.play();
            window2_mc.gotoAndStop("clear");
         }
         if(ce == _eventLevel)
         {
            sound_scroll1.play();
            window2_mc.gotoAndStop("menu_level");
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procLevel);
         }
         if(ce == _eventEnd)
         {
            renewResult();
            sound_scroll1.play();
            window2_mc.gotoAndStop("menu_result");
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procResult);
         }
         if(ce == _eventGene)
         {
            game.HC = false;
            bgAlpha.alpha = 1;
            frenzyBar.visible = false;
            frenzyBar2.visible = false;
            frenzyText.visible = false;
            sound_scroll1.play();
            window2_mc.gotoAndStop("menu_gene");
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procGeneMenu);
         }
         if(ce == _eventMode)
         {
            bgAlpha.alpha = 1;
            sound_scroll1.play();
            window2_mc.gotoAndStop("menu_mode");
         }
         if(ce == _eventLoot)
         {
            generateLoot();
            sound_scroll1.play();
            window2_mc.gotoAndStop("menu_loot");
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procLootMenu);
         }
         if(ce == _eventLootBoss)
         {
            generateLootBoss();
            sound_scroll1.play();
            window2_mc.gotoAndStop("menu_lootBoss");
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procLootMenu);
         }
         if(ce == _eventBegin)
         {
            stopFire();
            if(player.ai[_pc] == _aiHero)
            {
               hero = _pc;
            }
            else
            {
               hero = -1;
            }
            updateAlly();
            if(amb != null)
            {
               amb.stop();
            }
            amb = sound_bg_forest.play(0,999999) as SoundChannel;
            sound_battleBegin.play();
            window2_mc.gotoAndPlay("beg");
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procBeginMenu);
            fadeCount = 80;
         }
         menuId = 1;
         window2_mc.closeButton.visible = false;
         window2_mc.visible = false;
         window2_mc.x = 0;
         window2_mc.y = -26;
         window2_mc.alpha = 1;
         window2_mc.anime = true;
      }
      
      public function procBeginMenu() : *
      {
         window2_mc.stop();
         window2_mc.dayTxt.text = "Day  " + game.day;
      }
      
      public function procShopMenu() : *
      {
         defHint = "\nDrop an item on an empty space to sell the item.";
         window2_mc.stop();
         window2_mc.anime = true;
         window2_mc.popup.visible = false;
         window2_mc.warning.visible = false;
         window2_mc.actHelp.visible = false;
         window2_mc.actRef1.mouseEnabled = false;
         window2_mc.actRef2.mouseEnabled = false;
         updateShopSlots();
      }
      
      public function updateCi() : *
      {
         i = 0;
         while(i < 5)
         {
            if(i + _invPlayer == ci)
            {
               inventory_mc[i].alpha = 1;
            }
            else
            {
               inventory_mc[i].alpha = 0.6;
            }
            ++i;
         }
      }
      
      public function saveGame() : *
      {
         var so:*;
         var obj:Object = null;
         var s:* = undefined;
         var str:* = undefined;
         game.version = _version;
         so = SharedObject.getLocal("elonas" + idx.slot);
         if(so)
         {
            obj = so.data;
            obj.deleted = false;
            obj.game = cloneObj(game);
            obj.player = cloneObj(player);
            obj.inventory = cloneObj(inventory);
            obj.mission = cloneObj(mission);
            try
            {
               str = so.flush(so.size);
               switch(str)
               {
                  case SharedObjectFlushStatus.FLUSHED:
                  case SharedObjectFlushStatus.PENDING:
               }
            }
            catch(e:*)
            {
               popInfo("Save failed");
            }
            s = getClass(player.devType[_pc]);
            s[0] += "(" + player.lv[_pc] + ") Day." + game.day;
            if(game.HC == true)
            {
               s[0] += " HC";
            }
            idx.saveName[idx.slot] = "" + s[0];
            popInfo("Game Saved.");
         }
         saveIndex();
      }
      
      public function pageChange(param1:int) : Function
      {
         var i:int = param1;
         return function(param1:MouseEvent):void
         {
            sound_scroll1.play();
            page = i;
            if(menuId == 2)
            {
               removeUpgrades();
               updateCastleMenu();
            }
            if(menuId == 5)
            {
               removeMedals();
               updateMedals();
            }
         };
      }
      
      public function changeUnlock() : *
      {
         var _loc1_:Array = null;
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         _loc1_ = ["1","2"];
         if(unlocked)
         {
            _loc2_ = 0;
            unlocked = false;
            window2_mc.unlockButton.unlockText.text = "Next Page";
         }
         else
         {
            _loc2_ = 4;
            unlocked = true;
            window2_mc.unlockButton.unlockText.text = "Previous Page";
         }
         _loc3_ = 0;
         while(_loc3_ < 4)
         {
            _loc1_ = getClass(classList[_loc2_ + _loc3_]);
            if(idx.unlocked[_loc3_ + _loc2_] == true)
            {
               if(_loc2_ + _loc3_ == 3 && (kongregate == 0 && armor == 0) && false)
               {
                  _loc1_ = ["Militia","Playable in the Kongregate Version. Clicking it will open the link.",""];
               }
               radio_mc[_loc3_].alpha = 1;
               radio_mc[_loc3_].mouseEnabled = true;
            }
            else
            {
               radio_mc[_loc3_].alpha = 0.5;
               radio_mc[_loc3_].mouseEnabled = false;
               _loc1_ = ["??????","You need to win a medal to play this class.",""];
            }
            radio_mc[_loc3_].dummy.mouseEnabled = false;
            radio_mc[_loc3_].txt.text = _loc1_[0];
            radio_mc[_loc3_].hintTxt = [_loc1_[0],_loc1_[1],"","",""];
            _loc3_++;
         }
         updateGene();
      }
      
      public function townEvent() : *
      {
         var _loc1_:int = 0;
         _loc1_ = 0;
         if(game.day % 10 == 4)
         {
            news += "It\'s a MOD sales day! You should check the shop.\n";
         }
         if(game.comp == true)
         {
            _loc1_ = int((PARTY.ACTIVE + 1) / 2);
         }
         else
         {
            _loc1_ = int(Math.random() * Math.random() * (PARTY.ACTIVE + 1));
         }
         if(_loc1_)
         {
            news += "Thanks to the Active skill, you gained extra " + _loc1_ + " AP to spend.\n";
         }
         game.ap = 4 + _loc1_ + game.apFix;
         game.apFix = 0;
      }
      
      public function onEnterFrame_town(param1:Event) : *
      {
         var _loc2_:Boolean = false;
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         ++delay;
         if(cardCount > 0)
         {
            if(cardCount == 17)
            {
               cardEvent(tgCard);
            }
            --cardCount;
         }
         if(blendCounter && game.optionFlashShot == false)
         {
            --blendCounter;
            if(blendCounter == 0)
            {
               root.transform.colorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
            }
            else if(blendType == 0)
            {
               _loc3_ = blendCounter * 8;
               root.transform.colorTransform = new ColorTransform(1.01,1.01,1.1,1,_loc3_,_loc3_,_loc3_,0);
            }
            else
            {
               _loc3_ = blendCounter * 8;
               root.transform.colorTransform = new ColorTransform(1.04,1,1,1,_loc3_,_loc3_ / 2,_loc3_ / 2,0);
            }
         }
         if(delay >= 3 && menuId == 3)
         {
            player.optBoss[cs] = window2_mc.optBoss.selected;
            player.optWall[cs] = window2_mc.optWall.selected;
         }
         if(window2_mc.anime)
         {
            window2_mc.anime = false;
            window2_mc.animeTime = 16;
            window2_mc.x = 630;
         }
         if(Boolean(window2_mc.animeTime) && delay > 3)
         {
            --window2_mc.animeTime;
            window2_mc.x -= Math.pow(window2_mc.animeTime,1.7);
            i = 0;
            while(i < selectID)
            {
               buttonArray[i].x -= Math.pow(window2_mc.animeTime,1.7);
               ++i;
            }
         }
         if(eventDialog)
         {
            return;
         }
         _loc2_ = false;
         if(menuId == 3 && delay > 3)
         {
            i = 0;
            while(i < maxAlly + 1)
            {
               if(player.exist[i] != false)
               {
                  if(player_mc[i].bg.hitTestPoint(mouseX,mouseY,true))
                  {
                     _loc2_ = true;
                     player_mc[i].alpha = 1;
                     if(soundCs != i)
                     {
                        sound_pop1.play();
                        soundCs = i;
                     }
                  }
                  else
                  {
                     player_mc[i].alpha = 0.6;
                  }
                  if(cs == i)
                  {
                     player_mc[i].alpha = 1;
                  }
               }
               ++i;
            }
            if(_loc2_ == false)
            {
               soundCs = -1;
            }
         }
         if(gamePaused || gameDialog)
         {
            return;
         }
         if(menuId == 4 || menuId == 6)
         {
            invPopup();
         }
         if(menuId == 2 || menuId == 3 || menuId == 5)
         {
            hint();
         }
         if(delay < 4)
         {
            return;
         }
         window2_mc.hint2.text = defHint;
         if(menuId == 1)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nTo the next day, to the next battle!";
            }
            if(Boolean(window2_mc.act2.visible) && Boolean(window2_mc.act2.hitTestPoint(mouseX,mouseY,true)))
            {
               window2_mc.hint2.text = "\nYou can hire a henchman. Be aware, it\'s costly.";
            }
            _loc4_ = 0;
            i = 0;
            while(i < radioCount)
            {
               if(Boolean(radio_mc[i].avail) && Boolean(radio_mc[i].card.hitTestPoint(mouseX,mouseY,true)))
               {
                  window2_mc.hint2.text = "\n" + actList[i].desc;
               }
               ++i;
            }
         }
         if(menuId == 2)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nIt will completely repair you wall.";
            }
         }
         if(menuId == 3)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nYou will get a new recruit.";
            }
         }
         if(menuId == 4)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nThe blacksmith will refresh his inventory.";
            }
            if(window2_mc.act2.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nThe blacksmith will upgrade your weapon.";
            }
         }
         if(menuId == 5)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nRobbing visitors gives you some blood money.";
            }
            if(Boolean(window2_mc.kongMc.visible) && Boolean(window2_mc.kongMc.kongButton.hitTestPoint(mouseX,mouseY,true)))
            {
               window2_mc.hint2.text = "\nThe link to Kongregate is here for a reason!";
            }
         }
         if(menuId == 6)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nYou can turn a weapon into a random Mod.";
            }
            if(window2_mc.act2.hitTestPoint(mouseX,mouseY,true))
            {
               window2_mc.hint2.text = "\nYou can recharge item like grenades and repair kits.";
            }
         }
         if(equipMode)
         {
            window2_mc.hint2.text = "\nClick an item to apply.";
         }
      }
      
      public function procEventDialog(param1:*) : *
      {
         if(menuId == 1)
         {
            updateMissionMenu();
         }
         sound_click1.play();
         if(eventDialog == _dialogActSleep)
         {
            root.transform.colorTransform = new ColorTransform(0,0,0,1,0,0,0,0);
            select_end();
            sound_click1.play();
            exitMenu();
            exitTown();
            if(game.HC == true)
            {
               deleteGame();
            }
            if(mission.hire)
            {
               generateHenchman();
            }
            ++game.day;
            eventList.push(_eventBegin);
            gotoAndStop("event");
         }
         eventDialog = 0;
         stage.removeChild(param1);
      }
      
      public function upgradeWeapon(sourceItemIndex:int, isCheckOnly:int) : *
      {
         var modId:* = undefined;
         var modIndex:* = 0;
         var modTextSegments:* = [];
         var levelSplitResult:* = [];
         if(isCheckOnly)
         {
            return int(inventory.value[sourceItemIndex] * 1.2) + 500;
         }
         generateStuff(_invRefer,inventory.id[sourceItemIndex]);
         weaponVariation(_invRefer,inventory.lv[sourceItemIndex] + 1);
         inventory.modMax[_invRefer] = inventory.modMax[sourceItemIndex];
         modTextSegments = inventory.modText[sourceItemIndex].split(") ");
         if(modTextSegments.length >= 3)
         {
            modIndex = 0;
            while(modIndex < modTextSegments.length - 2)
            {
               levelSplitResult = modTextSegments[modIndex].split("(Lv.");
               if(levelSplitResult.length >= 2)
               {
                  modId = 0;
                  while(modId < encRef.length)
                  {
                     if(levelSplitResult[0].indexOf(encRef[modId].name) != -1)
                     {
                        enchant(_invRefer,modId,int(levelSplitResult[1]));
                        if(modId == _encLivingWeapon)
                        {
                           inventory.livingWeapon[_invRefer] = inventory.livingWeapon[sourceItemIndex];
                        }
                     }
                     modId++;
                  }
               }
               modIndex++;
            }
         }
      }
      
      public function calcGrenadeCount(param1:int) : *
      {
         var _loc2_:int = 0;
         _loc2_ = 325 - player.trait[param1][TRAIT.MILITIA] * 4;
         if(_loc2_ < 100)
         {
            _loc2_ = 100;
         }
         player.grenadeCount[param1] = _loc2_;
      }
      
      public function calcLivingWeaponExp(itemIndex:int) : int
      {
         return int(25 * Math.pow(2,inventory.modMax[itemIndex]));
      }
      
      public function endEquipMode() : *
      {
         equipMode = 0;
         window2_mc.actHelp.visible = false;
         updateInvSlots(-1);
         updateAp();
         removeInvIcon();
         removeInvSlot();
         invSlotCount = 0;
         invIconCount = 0;
         if(menuId == 4)
         {
            updateShopSlots();
         }
         if(menuId == 6)
         {
            removeChara();
            updateEquipSlots();
         }
      }
      
      public function startBattleMedal() : *
      {
         if(game.carryOver == true)
         {
            return;
         }
         getMedal(_medalDay1);
         if(game.day >= 10)
         {
            getMedal(_medalDay2);
         }
         if(game.day >= 20)
         {
            getMedal(_medalDay3);
         }
         if(game.day >= 35)
         {
            getMedal(_medalDay4);
         }
         if(game.day >= 50)
         {
            getMedal(_medalDay5);
         }
         if(game.day >= 80)
         {
            getMedal(_medalDay6);
         }
         if(game.day >= 150)
         {
            getMedal(_medalDay7);
         }
         if(game.HC == true)
         {
            if(game.day >= 20)
            {
               getMedal(_medalHardcore1);
            }
            if(game.day >= 80)
            {
               getMedal(_medalHardcore3);
            }
         }
      }
      
      public function updateAlly() : *
      {
         var _loc1_:* = undefined;
         nextAlert = undefined;
         i = 0;
         while(i < maxAlly)
         {
            w = weapon(i);
            player.idleCount[i] = 0;
            player.frenzy[i] = 0;
            player_mc[i] = new ally1() as MovieClip;
            player_mc[i].x = 510 + i * 2;
            if(i == 3)
            {
               player_mc[i].x -= 8;
            }
            player_mc[i].y = playerY[i];
            player_mc[i].name = "player" + i;
            cursor_mc[i] = new cursor2() as MovieClip;
            cursor_mc[i].name = "cursor" + i;
            clearAiTarget(i);
            player.rampage[i] = 0;
            refreshPlayer(i,w);
            if(player.exist[i])
            {
               player_mc[i].visible = true;
               player_mc[i].pic = player.pic[i];
               player_mc[i].gotoAndPlay(player_mc[i].anime2);
               player.shooting[i] = false;
               player.shootTimer[i] = 0;
               player.accuracyFix[i] = 0;
               if(i == _pc)
               {
                  _loc1_ = _invPlayer;
                  while(_loc1_ < game.invSlot + _invPlayer)
                  {
                     if(inventory.type[_loc1_] != _typeUse)
                     {
                        inventory.ammo[_loc1_] = inventory.ammoMax[_loc1_];
                     }
                     inventory.reloadTime[_loc1_] = 0;
                     _loc1_++;
                  }
               }
               if(i != hero)
               {
                  player.aiFunc[i] = aiNormal;
                  if(player.ai[i] == _aiFireAtWill)
                  {
                     player.aiFunc[i] = aiFireAtWill;
                  }
                  if(player.ai[i] == _aiAir)
                  {
                     player.aiFunc[i] = aiAir;
                  }
                  if(player.ai[i] == _aiArmor)
                  {
                     player.aiFunc[i] = aiArmor;
                  }
                  cursor_mc[i].x = 480 + i * 2;
                  cursor_mc[i].y = playerY[i];
                  cursor_mc[i].visible = true;
                  player.target[i] = undefined;
                  player.aimCount[i] = 100;
                  stage.addChild(cursor_mc[i]);
                  inventory.ammo[w] = inventory.ammoMax[w];
                  inventory.reloadTime[w] = 0;
               }
            }
            else
            {
               player_mc[i].gotoAndStop(player_mc[i].anime2);
               player_mc[i].visible = false;
            }
            stage.addChild(player_mc[i]);
            ++i;
         }
      }
      
      public function getNews() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = news;
         if(_loc1_ == "")
         {
            _loc1_ = "No news today.";
         }
         return _loc1_;
      }
      
      public function createInvIcon(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         _loc3_ = invIconCount;
         invIcon_mc[_loc3_] = new itemPicture() as MovieClip;
         invIcon_mc[_loc3_].gotoAndStop(inventory.graphic[param1]);
         invIcon_mc[_loc3_].x = invSlot_mc[param2].x - (invIcon_mc[_loc3_].width - 48) / 2 - 4;
         invIcon_mc[_loc3_].y = invSlot_mc[param2].y;
         window2_mc.addChild(invIcon_mc[_loc3_]);
         invIcon_mc[_loc3_].filters = [filterDrop];
         invIcon_mc[_loc3_].visible = true;
         invIcon_mc[_loc3_].mouseEnabled = false;
         invIcon_mc[_loc3_].num.y = 2;
         if(inventory.type[param1] == _typeUse && inventory.ammoMax[param1] > 0)
         {
            invIcon_mc[_loc3_].num.text = "x " + inventory.ammo[param1];
            invIcon_mc[_loc3_].num.visible = true;
         }
         else
         {
            invIcon_mc[_loc3_].num.visible = false;
         }
         ++invIconCount;
         return invIconCount - 1;
      }
      
      public function volumeChange(param1:*) : *
      {
         var _loc2_:SoundTransform = SoundMixer.soundTransform;
         _loc2_.volume = param1;
         SoundMixer.soundTransform = _loc2_;
         if(param1 == 0)
         {
            vol.gotoAndStop(2);
         }
         else
         {
            vol.gotoAndStop(1);
         }
      }
      
      public function wexpUp(param1:int) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         _loc2_ = 0;
         while(_loc2_ < _maxWeaponSkill - 1)
         {
            _loc3_ = int(wexpList[_loc2_]);
            _loc4_ = player.trait[param1][_loc3_] * 12 + 20;
            if(param1 == _pc)
            {
               _loc6_ = 1;
            }
            else
            {
               _loc6_ = 0.5;
            }
            if(player.wexp[param1][_loc2_] > int(_loc4_ * _loc6_))
            {
               ++player.trait[param1][_loc3_];
               _loc5_ = REF[ID[_loc3_]](param1);
               if(param1 == _pc)
               {
                  news += "You have earned total of " + _loc4_ + " weapon exp and gain " + _loc5_[0] + ".\n";
               }
               else
               {
                  news += player.name[param1] + " has earned total of " + _loc4_ + " weapon exp and gains " + _loc5_[0] + ".\n";
               }
               player.wexp[param1][_loc2_] = 0;
            }
            _loc2_++;
         }
      }
      
      public function kongregateStats() : *
      {
         kongregateStatsIdx();
         if(kongregate == 0 || game.submit != true || Boolean(kongregateEmu))
         {
            return;
         }
         kongAPI.stats.submit("TotalKills",game.totalKill);
         kongAPI.stats.submit("TotalMoney",game.totalMoney);
         kongSubmit2("PcLevelReached",player.lv[_pc]);
         kongSubmit2("AlliesRecruited",getAllyNum());
         kongSubmit2("PerfectGames",game.noDamage);
         kongSubmit2("EggsCollected",game.eggsCollected);
      }
      
      public function procGeneMenu() : *
      {
         var _loc1_:int = 0;
         resetOption();
         statsCount = 0;
         window2_mc.stop();
         window2_mc.hint.visible = false;
         window2_mc.optHC.label = "Hardcore Mode";
         window2_mc.optHC.selected = game.HC;
         window2_mc.optHint.hintTxt = ["Hardcore Mode","In Hardcore Mode, your save file is deleted at the start of each battle. Pray to the RNG and prepare to throw your keyboard!","","",""];
         window2_mc.optCasual.label = "Casual Mode";
         window2_mc.optCasual.selected = game.casual;
         window2_mc.optHint3.hintTxt = ["Casual Mode","If the game is too hard, enabling this option makes it a lot easier. Hardcore Mode will be disabled if you choose this option.","","",""];
         _loc1_ = 0;
         while(_loc1_ < _maxPic)
         {
            pic_mc[_loc1_] = new ally4() as MovieClip;
            pic_mc[_loc1_].x = _loc1_ % 11 * 32 + 176;
            pic_mc[_loc1_].y = int(_loc1_ / 11) * 30 + 157;
            pic_mc[_loc1_].pic = _loc1_;
            pic_mc[_loc1_].gotoAndPlay("stand");
            pic_mc[_loc1_].alpha = 0.7;
            pic_mc[_loc1_].chara1.mouseEnabled = false;
            window2_mc.addChild(pic_mc[_loc1_]);
            _loc1_++;
         }
         _loc1_ = 0;
         while(_loc1_ < 4)
         {
            radio_mc[_loc1_] = new radioButton() as MovieClip;
            radio_mc[_loc1_].x = 180;
            radio_mc[_loc1_].y = 240 + _loc1_ * 20;
            window2_mc.addChild(radio_mc[_loc1_]);
            ++radioCount;
            _loc1_++;
         }
         ci = _invPlayer;
         changeUnlock();
      }
      
      public function loadIndex() : *
      {
         var _loc2_:Object = null;
         var _loc1_:SharedObject = SharedObject.getLocal("elonas_idx");
         if(_loc1_)
         {
            _loc2_ = _loc1_.data;
            if(_loc2_.idx == undefined)
            {
               return false;
            }
            idx = cloneObj(_loc2_.idx);
            medal = cloneObj(_loc2_.medal);
            if(idx.slot == undefined)
            {
               idx.slot = 0;
            }
         }
      }
      
      public function updateGene() : *
      {
         var _loc1_:Array = null;
         var _loc2_:* = undefined;
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         _loc1_ = ["1","2","3"];
         generatePlayer(0,1,classList[geneClass]);
         player.pic[0] = cs;
         _loc1_ = getClass(classList[geneClass]);
         window2_mc.desc2.text = "" + _loc1_[2];
         window2_mc.classPic.gotoAndStop(geneClass % 4 + 1);
         updateInterface();
         updateInventory();
         if(unlocked)
         {
            _loc2_ = 4;
         }
         else
         {
            _loc2_ = 0;
         }
         _loc3_ = 0;
         while(_loc3_ < 4)
         {
            if(_loc3_ + _loc2_ == 3 && (kongregate == 0 && armor == 0) && false)
            {
               radio_mc[_loc3_].gotoAndStop(3);
            }
            else if(geneClass == _loc3_ + _loc2_)
            {
               radio_mc[_loc3_].gotoAndStop(2);
            }
            else
            {
               radio_mc[_loc3_].gotoAndStop(1);
            }
            _loc3_++;
         }
         removeStats();
         _loc4_ = [];
         _loc5_ = _pc;
         _loc3_ = 0;
         while(_loc3_ < _maxTrait)
         {
            if(player.trait[_loc5_][_loc3_] != 0)
            {
               if(!(_loc5_ == _pc && player.ai[_loc5_] == _aiHero && (_loc3_ == TRAIT.BASE_AIMING || _loc3_ == TRAIT.BASE_TEAMWORK)))
               {
                  _loc2_ = 50000 - _loc3_;
                  if(PARTY[ID[_loc3_]] != undefined)
                  {
                     _loc2_ = 10000 + _loc3_;
                  }
                  if(traitRef[_loc3_].group == G_BASE)
                  {
                     _loc2_ = 70000 + _loc3_;
                  }
                  if(_loc3_ < G_GEN)
                  {
                     _loc2_ = 100000 + _loc3_;
                  }
                  _loc4_[_loc4_.length] = {
                     "id":_loc3_,
                     "sort":_loc2_
                  };
               }
            }
            _loc3_++;
         }
         _loc4_.sortOn("sort",Array.NUMERIC | Array.DESCENDING);
         statsCount = 0;
         i2 = 0;
         while(i2 < _loc4_.length)
         {
            _loc3_ = int(_loc4_[i2].id);
            _loc2_ = statsCount;
            _loc1_ = REF[ID[_loc3_]](_pc);
            stats_mc[_loc2_] = new trait() as MovieClip;
            stats_mc[_loc2_].x = 271 + int(_loc2_ / 4) * 130;
            stats_mc[_loc2_].y = 244 + _loc2_ % 4 * 18;
            stats_mc[_loc2_].traitName.text = _loc1_[0];
            stats_mc[_loc2_].hintTxt = _loc1_;
            if(traitRef[_loc3_].group == G_BASE || _loc3_ < G_GEN)
            {
               Tweener.addTween(stats_mc[_loc2_].traitName,{
                  "time":0,
                  "_color":278544
               });
               stats_mc[_loc2_].icon.gotoAndStop(2);
            }
            else if(PARTY[ID[_loc3_]] != undefined)
            {
               stats_mc[_loc2_].icon.gotoAndStop(3);
            }
            else
            {
               stats_mc[_loc2_].icon.gotoAndStop(1);
            }
            window2_mc.addChild(stats_mc[_loc2_]);
            ++statsCount;
            ++i2;
         }
      }
      
      public function updateHP() : *
      {
         castleHPText.text = "" + game.castleHP + "/" + game.castleMHP;
      }
      
      public function townMedalBonus() : *
      {
         if(medal[_medalAction1])
         {
            if(Math.random() > 0.6)
            {
               ++game.ap;
            }
         }
         if(medal[_medalAction2])
         {
            if(Math.random() > 0.6)
            {
               ++game.ap;
            }
         }
         if(medal[_medalAction3])
         {
            if(Math.random() > 0.6)
            {
               ++game.ap;
            }
         }
      }
      
      public function exitMenu() : *
      {
         var _loc1_:* = undefined;
         defHint = "";
         stage.focus = stage;
         currentPop = -1;
         currentHint = -1;
         delay = 0;
         cs = _pc;
         drag = false;
         equipMode = 0;
         select_end();
         if(menuId == 1)
         {
            _loc1_ = 0;
            while(_loc1_ < radioCount)
            {
               radio_mc[_loc1_].removeEvent();
               _loc1_++;
            }
            removeRadio();
         }
         if(menuId == 2)
         {
            removeUpgrades();
            window2_mc.page1.removeEventListener(MouseEvent.MOUSE_DOWN,pageChange);
            window2_mc.page2.removeEventListener(MouseEvent.MOUSE_DOWN,pageChange);
            window2_mc.hint.visible = false;
         }
         if(menuId == 3 || menuId == 6)
         {
            removeChara();
         }
         if(menuId == 6)
         {
            removeInvSlot();
            removeInvIcon();
            window2_mc.popup.visible = false;
         }
         if(menuId == 3)
         {
            window2_mc.order.removeEventListener(Event.OPEN,orderOpen);
            window2_mc.order.removeEventListener(Event.CLOSE,orderClose);
            window2_mc.order.removeEventListener(Event.CHANGE,orderClick);
            window2_mc.order.removeEventListener(ListEvent.ITEM_ROLL_OVER,orderRollOver);
            removeStats();
            window2_mc.hint.visible = false;
         }
         if(menuId == 4)
         {
            removeInvSlot();
            removeInvIcon();
            window2_mc.popup.visible = false;
         }
         if(menuId == 5)
         {
            removeMedals();
            window2_mc.page1.removeEventListener(MouseEvent.MOUSE_DOWN,pageChange);
            window2_mc.page2.removeEventListener(MouseEvent.MOUSE_DOWN,pageChange);
            window2_mc.hint.visible = false;
         }
         radioCount = 0;
         invSlotCount = 0;
         invIconCount = 0;
         statsCount = 0;
         medalCount = 0;
         upgradeCount = 0;
         page = 0;
      }
      
      public function dbg(param1:*) : *
      {
         if(dbgMode == 0)
         {
            return;
         }
         dbgWin.info.text += "" + param1 + " ";
      }
      
      public function debug_survival(param1:*) : *
      {
         game.day = 10;
         generatePlayer(_pc,param1 + 1,-1);
         generatePlayer(1,param1 + 1,-1);
         generatePlayer(2,param1 * 1,-1);
         generatePlayer(3,param1 + 1,-1);
         player.trait[_pc][TRAIT.BIG_GUN] = 30;
         player.trait[_pc][TRAIT.RIFLE] = 30;
         player.trait[_pc][TRAIT.SHOTGUN] = 30;
         player.trait[_pc][TRAIT.SMALL_GUN] = 30;
         generateStuff(_invPlayer + 1,19);
         generateStuff(_invPlayer + 2,20);
         generateStuff(_invPlayer + 3,1);
         generateStuff(_invPlayer + 4,26);
         generateMission(param1);
         game.castleMHP = 40 + param1 * 5;
         game.castleHP = game.castleMHP;
         game.sister = 500;
      }
      
      public function exclusiveLink() : *
      {
         var request:URLRequest;
         sound_click1.play();
         popInfo("A Webpage has been opend in your browser.");
         request = new URLRequest(urlExclusive);
         try
         {
            navigateToURL(request);
         }
         catch(e:Error)
         {
         }
      }
      
      public function limit(param1:*, param2:*, param3:*) : *
      {
         if(param1 < param2)
         {
            return param2;
         }
         if(param1 > param3)
         {
            return param3;
         }
         return param1;
      }
      
      public function rampage(param1:int) : *
      {
         if(player.rampage[param1] > 0)
         {
            return;
         }
         --player.rampage[param1];
         if(player.rampage[param1] == -7)
         {
            rampageOn(param1,10 * 30);
         }
         else if(param1 == _pc)
         {
            text_effect(text_rampage[Math.abs(player.rampage[param1])]);
         }
      }
      
      public function upgradeDone(param1:int) : *
      {
         var _loc2_:String = null;
         _loc2_ = upgradeRef[param1];
         ++game[_loc2_];
         if(_loc2_ == "wallFix")
         {
            game.castleHP = game.castleMHP;
         }
         if(_loc2_ == "wallUpgrade")
         {
            game.castleHP += 5;
            game.castleMHP += 5;
         }
         if(_loc2_ == "storage")
         {
            ++game.invSlot;
         }
         if(_loc2_ == "smith")
         {
            generateShop();
         }
         upgradeMedal();
      }
      
      public function reloading(param1:int, param2:int) : *
      {
         --inventory.reloadTime[param2];
         if(player.rampage[param1] > 0)
         {
            if(inventory.reloadTime[param2] % 3 == 2)
            {
               --inventory.reloadTime[param2];
            }
         }
         if(inventory.manualReload[param2])
         {
            if(inventory.reloadTime[param2] <= 0)
            {
               ++inventory.ammo[param2];
               if(inventory.ammo[param2] == inventory.ammoMax[param2])
               {
                  cancelReload(param1,param2);
               }
               else
               {
                  reload(param1,param2);
               }
               if(param1 == _pc)
               {
                  updateAmmoBar();
               }
            }
         }
         else
         {
            if(param1 == _pc)
            {
               ammobar.scaleX = 1 - inventory.reloadTime[param2] / (int(inventory.reloadTimeMax[param2] * 100 / (100 + CALC.RELOADING(param1)) + 1));
            }
            if(inventory.reloadTime[param2] <= 0)
            {
               inventory.ammo[param2] = inventory.ammoMax[param2];
               if(param1 == _pc)
               {
                  updateAmmoBar();
               }
               sound_reloaded1.play(0,0,trans[param1]);
               player_mc[param1].gotoAndStop(player_mc[param1].anime2);
            }
         }
      }
      
      public function MouseLDownFunc_title(param1:MouseEvent) : *
      {
         var f:* = undefined;
         var request:URLRequest = null;
         var event:MouseEvent = param1;
         var hitX:int = stage.mouseX;
         var hitY:int = stage.mouseY;
         if(showUpdate == true)
         {
            if(window2_mc.procButton.hitTestPoint(hitX,hitY,true))
            {
               stage.removeChild(window2_mc);
               sound_click1.play();
               showUpdate = false;
            }
            return;
         }
         if(gameDialog)
         {
            if(dialog_mc.yes.hitTestPoint(hitX,hitY,true))
            {
               endDialog(true);
            }
            else
            {
               endDialog(false);
            }
            return;
         }
         if(vol.hitTestPoint(hitX,hitY,true))
         {
            toggleMute();
            return;
         }
         if(helpMode)
         {
            procHelp();
            return;
         }
         if(armor == 0 && Boolean(kong_mc.exclusiveButton.hitTestPoint(hitX,hitY,true)))
         {
            exclusiveLink();
         }
         if(armor == 0 && Boolean(kong_mc2.bt.hitTestPoint(hitX,hitY,true)))
         {
            kongregateLink();
         }
         if(armorButton.hitTestPoint(hitX,hitY,true))
         {
            armorLink();
         }
         if(newGameButton.hitTestPoint(hitX,hitY,true))
         {
            root.transform.colorTransform = new ColorTransform(0,0,0,1,0,0,0,0);
            sound_click1.play();
            saveBox.visible = false;
            saveBox.enabled = false;
            stage.focus = stage;
            exitTitle();
            eventList.push(_eventBegin);
            eventList.push(_eventGene);
            generateMission(0);
            gotoAndPlay("event");
            return;
         }
         if(continueButton.hitTestPoint(hitX,hitY,true))
         {
            sound_click1.play();
            f = loadGame();
            if(f == false)
            {
               sound_beep.play();
               popInfo("Save Game not found.");
               return;
            }
            saveBox.visible = false;
            saveBox.enabled = false;
            stage.focus = stage;
            gameContinued = true;
            exitTitle();
            gotoAndStop("town");
            return;
         }
         if(helpButton.hitTestPoint(hitX,hitY,true))
         {
            openHelp();
         }
         if(elonaButton.hitTestPoint(hitX,hitY,true))
         {
            sound_click1.play();
            popInfo("A Webpage has been opend in your browser.");
            request = new URLRequest(_elonaUrl);
            try
            {
               navigateToURL(request);
            }
            catch(e:Error)
            {
            }
         }
         if(trash.hitTestPoint(hitX,hitY,true))
         {
            showDialog(_dialogTrash);
            dialog_mc.question.text = "Really delete\n" + idx.saveName[idx.slot] + "?";
            return;
         }
      }
      
      public function procHelp() : *
      {
         if(helpMode == 4)
         {
            if(window4_mc.help.hitTestPoint(mouseX,mouseY,true))
            {
               return;
            }
         }
         if(helpMode == 3)
         {
            if(window4_mc.link1.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(1);
               return;
            }
            if(window4_mc.link2.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(2);
               return;
            }
            if(window4_mc.link3.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(3);
               return;
            }
            if(window4_mc.link4.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(4);
               return;
            }
            if(window4_mc.link5.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(5);
               return;
            }
            if(window4_mc.link6.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(6);
               return;
            }
            if(window4_mc.link7.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(7);
               return;
            }
            if(window4_mc.link8.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(8);
               return;
            }
            if(window4_mc.link10.hitTestPoint(mouseX,mouseY,true))
            {
               procLink(10);
               return;
            }
         }
         if(window4_mc.help1.hitTestPoint(mouseX,mouseY,true))
         {
            window4_mc.gotoAndStop("help1");
            sound_scroll1.play();
            helpMode = 1;
            return;
         }
         if(window4_mc.help2.hitTestPoint(mouseX,mouseY,true))
         {
            window4_mc.gotoAndStop("help2");
            sound_scroll1.play();
            helpMode = 2;
            return;
         }
         if(window4_mc.help3.hitTestPoint(mouseX,mouseY,true))
         {
            window4_mc.gotoAndStop("help3");
            sound_scroll1.play();
            helpMode = 3;
            return;
         }
         if(window4_mc.help4.hitTestPoint(mouseX,mouseY,true))
         {
            window4_mc.gotoAndStop("help4");
            window4_mc.addFrameScript(window4_mc.currentFrame - 1,insertHelp);
            sound_scroll1.play();
            helpMode = 4;
            return;
         }
         sound_click1.play();
         if(gameStage != _stageTitle)
         {
            window_mc.saveGameButton.mouseEnabled = true;
            window_mc.helpButton.mouseEnabled = true;
            window_mc.returnTitleButton.mouseEnabled = true;
         }
         else
         {
            elonaButton.mouseEnabled = true;
         }
         if(blurMcHelp != undefined)
         {
            stage.removeChild(blurMcHelp);
         }
         window4_mc.removeEventListener(Event.ENTER_FRAME,onEnterFrame_help);
         stage.removeChild(window4_mc);
         helpMode = 0;
      }
      
      public function exitTitle() : *
      {
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_title);
         removeEventListener(Event.ENTER_FRAME,onEnterFrame_title);
         i = 0;
         while(i < _maxRunner)
         {
            stage.removeChild(runner_mc[i]);
            ++i;
         }
      }
      
      public function aiAir(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         _loc3_ = 0;
         while(_loc3_ < 3)
         {
            _loc4_ = aiTarget[_air][weaponRange[param2][_loc3_]][0];
            if(_loc4_ != undefined)
            {
               aiTarget[_air][weaponRange[param2][_loc3_]] = [undefined,1000];
               _loc4_.tag = _defTag;
               return _loc4_;
            }
            _loc3_++;
         }
         return undefined;
      }
      
      public function invPopupUpdate(param1:int) : *
      {
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc2_:* = 0;
         if(popupMc == undefined)
         {
            if(param1 == currentPop)
            {
               return;
            }
            currentPop = param1;
            _loc3_ = window2_mc.popup;
         }
         else
         {
            _loc3_ = popupMc;
         }
         _loc3_.itemName.text = inventory.name[param1];
         _loc3_.priceText.text = stuffGetValue(param1,1);
         _loc3_.detailText.textColor = 0;
         _loc3_.itemName.textColor = 0;
         if(inventory.lv[param1] > 1)
         {
            _loc3_.itemName.textColor = 204;
         }
         if(inventory.type[param1] == _typeGun)
         {
            _loc3_.modTxt.text = inventory.mod[param1] + "/" + inventory.modMax[param1];
            _loc4_ = "" + inventory.attack[param1];
            if(inventory.shell[param1] > 1)
            {
               _loc4_ += " x" + inventory.shell[param1];
            }
            _loc3_.dmgText.text = _loc4_;
            _loc3_.dmgAirText.text = inventory.dmgAir[param1] + "%";
            _loc3_.dmgArmorText.text = inventory.dmgArmor[param1] + "%";
            _loc3_.accuracyText.text = inventory.baseAccuracy[param1];
            _loc3_.reloadText.text = int(inventory.reloadTimeMax[param1] * 1000 / 30) + "ms";
            if(inventory.manualReload[param1])
            {
               _loc3_.reloadText.text += "(M)";
            }
            _loc3_.ammoText.text = inventory.ammoMax[param1];
            _loc3_.rateText.text = int(300 / (1000 / inventory.shootRate[param1])) / 10 + "/sec";
            if(inventory.modText[param1] == "")
            {
               _loc3_.detailText.text = "No Modification";
            }
            else
            {
               _loc3_.detailText.textColor = 204;
               _loc3_.detailText.text = inventory.modText[param1];
            }
            if(inventory.livingWeapon[param1] > 0)
            {
               _loc3_.detailText.text += "\nIt\'s alive(Exp: " + int((1 - inventory.livingWeapon[param1] / calcLivingWeaponExp(param1)) * 100) + "%)";
            }
            if(inventory.ammoMax[param1] == 1 && inventory.id[param1] != 27)
            {
               _loc3_.ammoText.text = "-";
               _loc3_.reloadText.text = "-";
            }
            _loc3_.reqText.text = traitRef[inventory.reqTrait[param1]].name + " " + inventory.reqLv[param1];
            if(player.trait[_pc][inventory.reqTrait[param1]] < inventory.reqLv[param1])
            {
               _loc3_.reqText.textColor = 13369344;
            }
            else
            {
               _loc3_.reqText.textColor = 204;
            }
         }
         else
         {
            _loc3_.modTxt.text = "-";
            _loc3_.dmgText.text = "-";
            _loc3_.dmgAirText.text = "-";
            _loc3_.dmgArmorText.text = "-";
            _loc3_.accuracyText.text = "-";
            _loc3_.reloadText.text = "-";
            _loc3_.ammoText.text = "-";
            _loc3_.rateText.text = "-";
            _loc3_.reqText.text = "-";
            _loc3_.reqText.textColor = 0;
            _loc3_.detailText.text = getItemDetail(param1);
         }
         _loc3_.visible = true;
      }
      
      public function generateRecruit() : *
      {
         generatePlayer(_nc,int(Math.random() * game.day * 0.3) + int(game.day / 5) + 1,-1);
      }
      
      public function listTrait(characterIndex:int) : *
      {
         var availableTraits:* = [];
         var characterDevType:* = player.devType[characterIndex];
         var traitIndex:int = 0;
         var traitId:int = 0;
         var resultIndex:int = 0;
         var totalOwnedTraits:int = 0;
         traitIndex = 0;
         while(traitIndex < _maxTrait)
         {
            if(!(player.trait[characterIndex][traitIndex] == undefined || player.trait[characterIndex][traitIndex] == 0))
            {
               totalOwnedTraits++;
            }
            traitIndex++;
         }
         traitIndex = 0;
         for(; traitIndex < devGroup[characterDevType].length; traitIndex++)
         {
            traitId = int(TRAIT[devGroup[characterDevType][traitIndex]]);
            if(traitRef[traitId] == undefined)
            {
               break;
            }
            if(traitRef[traitId].maxLv >= player.trait[characterIndex][traitId] + 1)
            {
               if(traitRef[traitId].reqLv <= player.lv[characterIndex])
               {
                  if(traitRef[traitId].reqTrait != "")
                  {
                     if(player.trait[characterIndex][ID(traitRef[traitId].reqTrait)] == 0)
                     {
                        continue;
                     }
                  }
                  if(!(totalOwnedTraits > 17 && (player.trait[characterIndex][traitId] == undefined || player.trait[characterIndex][traitId] == 0)))
                  {
                     availableTraits[resultIndex] = traitId;
                     resultIndex++;
                  }
               }
            }
         }
         return availableTraits;
      }
      
      public function getBestSkill(param1:String, param2:* = 0) : *
      {
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         var _loc5_:int = 0;
         _loc3_ = 0;
         while(_loc3_ < maxAlly)
         {
            if(player.exist[_loc3_] != false)
            {
               if(CALC[param1](_loc3_) > _loc4_)
               {
                  _loc4_ = int(CALC[param1](_loc3_));
                  _loc5_ = int(player.trait[_loc3_][TRAIT[param1]]);
               }
            }
            _loc3_++;
         }
         if(param2 == 1)
         {
            return _loc4_;
         }
         PARTY[param1] = _loc4_;
         PARTYLV[param1] = _loc5_;
      }
      
      public function shoot(param1:int) : *
      {
         var baseDamage:int = 0;
         var projectileIndex:int = 0;
         var enemyIndex:int = 0;
         var aimX:int = 0;
         var aimY:int = 0;
         var hitX:int = 0;
         var hitY:int = 0;
         var spreadRadius:* = undefined;
         var hasHitAnything:Boolean = false;
         var hasHitAnyEnemy:Boolean = false;
         var hasKillAnyEnemy:Boolean = false;
         var hasCritHit:Boolean = false;
         var weaponIndex:int = 0;
         var specialHitType:int = 0;
         var targetEnemy:* = undefined;
         var chainSoundSeekPos:* = undefined;
         var sniperDamageMultiplier:* = undefined;
         var missEffect:MovieClip = null;
         if(player.shootTimer[param1] > 0)
         {
            return;
         }
         specialHitType = 0;
         if(param1 == hero && fireAtWill == false)
         {
            weaponIndex = weapon(param1);
            if(inventory.num[weaponIndex] == 0 || inventory.type[weaponIndex] != _typeGun)
            {
               sound_beep.play();
               popInfo("You need a gun to shoot!");
               player.shooting[param1] = false;
               return;
            }
            if(player.trait[_pc][inventory.reqTrait[weaponIndex]] < inventory.reqLv[weaponIndex])
            {
               sound_beep.play();
               popInfo("You don\'t have the required weapon skill!");
               player.shooting[param1] = false;
               return;
            }
            spreadRadius = 13 * (100 + player.accuracyFix[param1] * player.accuracyFix[param1] * 1000) / player.accuracyDiv[param1];
            if(game.tight == true)
            {
               spreadRadius *= 0.75;
            }
            aimY = mouseY;
            aimX = mouseX;
         }
         else
         {
            weaponIndex = weapon(param1);
            if(player.trait[param1][inventory.reqTrait[weaponIndex]] < inventory.reqLv[weaponIndex])
            {
               return;
            }
            targetEnemy = player.target[param1];
            if(targetEnemy.isDead() == true || targetEnemy.x < -10)
            {
               if(Boolean(player.onMark[param1]) && Boolean(player.optWall[param1]))
               {
                  searchNextAlert(param1);
               }
               else
               {
                  clearAiTarget(param1);
               }
               return;
            }
            if(inventory.num[weaponIndex] == 0)
            {
               return;
            }
            spreadRadius = 13 * (100 + inventory.accuracyDec[weaponIndex] * inventory.accuracyDec[weaponIndex] * 500) / player.accuracyDiv[param1];
            if(param1 == hero && fireAtWill || player.ai[param1] == _aiFireAtWill)
            {
               spreadRadius = spreadRadius * (100 + 50 * 100 / (100 + CALC.HUNTER(param1) * 2)) / 100;
            }
            aimX = int(targetEnemy.x);
            aimY = int(targetEnemy.y);
         }
         if(Boolean(inventory.reloadTime[weaponIndex]) && inventory.autoReload[weaponIndex] == 0)
         {
            return;
         }
         if(inventory.ammo[weaponIndex] <= 0)
         {
            player.shooting[param1] = false;
            player.burst[param1] = 0;
            reload(param1,weaponIndex);
            return;
         }
         player.shootTimer[param1] = 1000 + player.trait[param1][TRAIT.AIMED_SHOT] * 70;
         if(inventory.automatic[weaponIndex] == false)
         {
            if(param1 != hero || fireAtWill)
            {
               player.shootTimer[param1] += int(Math.random() * (inventory.shootRate[weaponIndex] / 1.5 / player.workRate[param1]));
            }
            else
            {
               player.shooting[param1] = false;
            }
         }
         if(inventory.autoReload[weaponIndex] == 0)
         {
            inventory.reloadTime[weaponIndex] = 0;
         }
         if(inventory.id[weaponIndex] == 16)
         {
            chainSoundSeekPos = 0;
            if(chainMode[param1] != 3)
            {
               if(chainMode[param1] != 2)
               {
                  if(chainMode[param1] == 1)
                  {
                     chainSoundSeekPos = chainSoundLength - chainSound[param1].position;
                     if(chainSound[param1] != null)
                     {
                        chainSound[param1].stop();
                     }
                  }
                  chainMode[param1] = 2;
                  chainSound[param1] = sound_chain1.play(chainSoundSeekPos,0,trans[param1]) as SoundChannel;
               }
               if(chainPos[param1] > 82 || chainSound[param1].position + 400 >= chainSoundLength)
               {
                  chainMode[param1] = 3;
                  chainSound[param1] = sound_chain3.play(0,999999,trans[param1]) as SoundChannel;
               }
               chainPos[param1] += 2;
               return;
            }
            chainPos[param1] = 82;
         }
         if(inventory.id[weaponIndex] == 24 || inventory.id[weaponIndex] == 25)
         {
            if(chainMode[param1] == 0)
            {
               if(param1 == hero && fireAtWill == false)
               {
                  player.shootTimer[param1] = 0;
               }
               player_mc[param1].gotoAndPlay(player_mc[param1].anime3);
               chainMode[param1] = 1;
               chainSound[param1] = sound_bow2.play(chainSoundSeekPos,0,trans[param1]) as SoundChannel;
               player.accuracyFix[param1] += inventory.accuracyDec[weaponIndex];
               return;
            }
            chainMode[param1] = 0;
            if(chainSound[param1] != null)
            {
               chainSound[param1].stop();
            }
         }
         else
         {
            player.accuracyFix[param1] += inventory.accuracyDec[weaponIndex] / (1 + IF(game.tight == true));
         }
         if(inventory.reloadTimeMax[weaponIndex] != 0)
         {
            --inventory.ammo[weaponIndex];
            if(param1 == _pc)
            {
               if(inventory.ammo[weaponIndex] == 0 && game.hintReload == false)
               {
                  game.hintReload = true;
                  popInfo("Reload your gun by pressing Space Key!");
               }
               updateAmmoBar();
            }
         }
         if(player_mc[param1].currentFrame > player_mc[param1].anime1 + 3)
         {
            player_mc[param1].gotoAndPlay(player_mc[param1].anime1);
         }
         if(inventory.id[weaponIndex] != 16)
         {
            gunSound[param1].play(0,0,trans[param1]);
         }
         baseDamage = int(inventory.attack[weaponIndex] * mission.dmgFix * (100 + CALC.AIMED_SHOT(param1) + CALC.NOBLE(param1)) / 100);
         if(player.trait[param1][TRAIT.DUELIST] > 0)
         {
            baseDamage = int(baseDamage * (100 + player.frenzy[param1]) / 100);
         }
         if(player.trait[param1][TRAIT.SNIPER] > 0)
         {
            sniperDamageMultiplier = 100 + CALC.SNIPER(param1) * player.idleCount[param1];
            if(sniperDamageMultiplier >= calcSniperMaxDamage(player.trait[param1][TRAIT.SNIPER]))
            {
               sniperDamageMultiplier = calcSniperMaxDamage(player.trait[param1][TRAIT.SNIPER]);
            }
            baseDamage = int(baseDamage * sniperDamageMultiplier / 100);
         }
         if(player.rampage[param1] > 0)
         {
            baseDamage *= 1.5;
         }
         if(inventory.special[weaponIndex])
         {
            hitX = aimX + Math.random() * spreadRadius - Math.random() * spreadRadius;
            hitY = aimY + Math.random() * spreadRadius - Math.random() * spreadRadius;
            if(inventory.id[weaponIndex] == 21)
            {
               throwGrenade(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,12,baseDamage,1);
               return;
            }
            if(inventory.id[weaponIndex] == 22)
            {
               throwRocket(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,10,baseDamage,1);
               return;
            }
            if(inventory.id[weaponIndex] == 23 || inventory.id[weaponIndex] == 26)
            {
               player.idleCount[param1] *= 0.5;
               throwGrenade(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,20,baseDamage,3);
               return;
            }
            if(inventory.id[weaponIndex] == 24)
            {
               player.idleCount[param1] *= 0.5;
               throwGrenade(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,10,baseDamage,2);
               return;
            }
            if(inventory.id[weaponIndex] == 25)
            {
               player.idleCount[param1] *= 0.5;
               throwGrenade(param1,weaponIndex,player_mc[param1].x + 5,player_mc[param1].y,hitX + 20,hitY,10,baseDamage,2);
               throwGrenade(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,10,baseDamage,2);
               throwGrenade(param1,weaponIndex,player_mc[param1].x - 5,player_mc[param1].y,hitX - 20,hitY,10,baseDamage,2);
               return;
            }
            if(inventory.id[weaponIndex] == 27)
            {
               if(param1 != hero)
               {
                  hitX -= 200;
               }
               throwGrenade(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,10,baseDamage,4);
               reload(param1,weaponIndex);
               return;
            }
            if(inventory.id[weaponIndex] == 40)
            {
               throwGrenade(param1,weaponIndex,player_mc[param1].x,player_mc[param1].y,hitX,hitY,10,baseDamage,5);
               return;
            }
         }
         if(player.trait[param1][TRAIT.BURST] > 0 && inventory.automatic[weaponIndex] == true && inventory.reqTrait[weaponIndex] == TRAIT.RIFLE)
         {
            ++player.burst[param1];
            if(player.burst[param1] <= CALC.BURST(param1))
            {
               player.accuracyFix[param1] -= inventory.accuracyDec[weaponIndex];
               baseDamage *= 1.25;
            }
         }
         if(inventory.automatic[weaponIndex] == false && player.trait[param1][TRAIT.POWER_SHOT] > 0 && CALC.POWER_SHOT(param1) > Math.random() * 100)
         {
            baseDamage *= 1.5;
            specialHitType = 1;
         }
         if(inventory.manualReload[weaponIndex] == false && inventory.ammo[weaponIndex] == 0 && player.trait[param1][TRAIT.ONE_SHOT] > 0 && (inventory.reqTrait[weaponIndex] == TRAIT.SMALL_GUN || inventory.id[weaponIndex] == 13))
         {
            baseDamage = int(baseDamage * (100 + CALC.ONE_SHOT(param1)) / 100);
            blendType = 0;
            blendCounter += 15;
            shake(5,1.5,1);
            specialHitType = 2;
         }
         projectileIndex = 0;
         while(projectileIndex < player.shell[param1])
         {
            hitX = aimX + Math.random() * spreadRadius - Math.random() * spreadRadius;
            hitY = aimY + Math.random() * spreadRadius - Math.random() * spreadRadius;
            if(sister.hitTestPoint(hitX,hitY,true) && sister.dead == false)
            {
               sound_killed.play(0,0,trans[9]);
               sister.gotoAndPlay("dead");
               sister.dead = true;
            }
            enemyIndex = 0;
            for(; enemyIndex < maxEnemy; enemyIndex++)
            {
               if(enemyArray[enemyIndex].isFree() == false)
               {
                  if(enemyArray[enemyIndex].mc.shadowHit == false)
                  {
                     if(enemyArray[enemyIndex].mc.shadow.hitTestPoint(hitX,hitY,true))
                     {
                        continue;
                     }
                  }
                  if(enemyArray[enemyIndex].mc.hitTestPoint(hitX,hitY,true))
                  {
                     var critType:int = 0;
                     if(Math.random() * 100 * player.shell[param1] < CALC.SENSE(param1))
                     {
                        critType = 2;
                     }
                     if(hitY > enemyArray[enemyIndex].crit[2] + enemyArray[enemyIndex].y && hitY < enemyArray[enemyIndex].crit[3] + enemyArray[enemyIndex].y)
                     {
                        if(hitX > enemyArray[enemyIndex].crit[0] + enemyArray[enemyIndex].x && hitX < enemyArray[enemyIndex].crit[1] + enemyArray[enemyIndex].x)
                        {
                           if(enemyArray[enemyIndex].isDead() == false)
                           {
                              critType = 1;
                           }
                        }
                     }
                     if(Math.random() * 100 < CALC.ONE_HIT_KILL(param1) && inventory.typeMinor[weaponIndex] == _typeSniper && enemyArray[enemyIndex].id != _boss)
                     {
                        baseDamage = 999999;
                        specialHitType = 3;
                        critType = 3;
                     }
                     if(enemyArray[enemyIndex].isDead() == false)
                     {
                        hasHitAnyEnemy = true;
                     }
                     if(critType)
                     {
                        hasCritHit = true;
                     }
                     if(player.trait[param1][TRAIT.DUELIST] > 0)
                     {
                        player.frenzy[param1] += CALC.DUELIST(param1) / (inventory.shootRate[weaponIndex] * 0.02) + 0.05;
                        if(player.frenzy[param1] > calcDuelistMaxDamage(player.trait[param1][TRAIT.DUELIST]))
                        {
                           player.frenzy[param1] = calcDuelistMaxDamage(player.trait[param1][TRAIT.DUELIST]);
                        }
                     }
                     hasHitAnything = true;
                     enemyArray[enemyIndex].damage(baseDamage,weaponIndex,hitX,hitY,param1,critType);
                     if(hasHitAnyEnemy && enemyArray[enemyIndex].isDead())
                     {
                        hasKillAnyEnemy = true;
                     }
                  }
               }
            }
            if(specialHitType)
            {
               drawTrail(hitX,hitY,player_mc[param1].x - 10,player_mc[param1].y,specialHitType);
            }
            if(hasHitAnything == false)
            {
               player.idleCount[param1] = 0;
               if(hitY > 150)
               {
                  missEffect = new effect();
                  missEffect.x = hitX;
                  missEffect.y = hitY + 4;
                  missEffect.gotoAndPlay("impact1");
                  stage.addChild(missEffect);
               }
            }
            projectileIndex++;
         }
         if(hasCritHit && hasKillAnyEnemy)
         {
            player.shootTimer[param1] = int(player.shootTimer[param1] * (100 - CALC.KILLER(param1)) / 100);
         }
         player.idleCount[param1] *= 0.8;
      }
      
      public function updateLv() : *
      {
         lvText.text = "" + player.lv[_pc];
         expText.text = "" + player.exp[_pc] / 10;
      }
      
      public function debug_battle(param1:int) : *
      {
         game.day = param1 + 1;
         generatePlayer(_pc,1,_devSheriff);
         player.exp[_pc] = 200;
         generatePlayer(1,150,_devMilitia);
         generatePlayer(2,150,_devMilitia);
         generatePlayer(3,150,_devMilitia);
         generateStuff(_invAlly + 0,26);
         generateStuff(_invAlly + 1,26);
         generateStuff(_invAlly + 2,26);
         generateStuff(_invAlly + 3,26);
         player.ai[1] = _aiNoAir;
         player.ai[2] = _aiNoAir;
         player.ai[3] = _aiNoAir;
         enchant(_invAlly,_encAutoReload,3);
         enchant(_invAlly + 1,_encAutoReload,3);
         player.optWall[1] = true;
         player.trait[_pc][TRAIT.CAPABLE] = 8;
         player.trait[_pc][TRAIT.BIG_GUN] = 30;
         player.trait[_pc][TRAIT.RIFLE] = 30;
         player.trait[_pc][TRAIT.SHOTGUN] = 30;
         player.trait[_pc][TRAIT.SMALL_GUN] = 30;
         player.trait[_pc][TRAIT.POWER_SHOT] = 5;
         player.trait[_pc][TRAIT.ONE_SHOT] = 10;
         player.trait[_pc][TRAIT.ONE_HIT_KILL] = 20;
         player.trait[_pc][TRAIT.COOL] = 10;
         generateStuff(_invPlayer,16);
         generateStuff(_invPlayer + 1,20);
         generateStuff(_invPlayer + 2,35);
         generateStuff(_invPlayer + 3,27);
         enchant(_invPlayer,-1,3);
         enchant(_invPlayer,-1,3);
         enchant(_invPlayer,-1,3);
         enchant(_invPlayer,-1,3);
         enchant(_invPlayer,-1,3);
         enchant(_invPlayer,-1,3);
         game.day = 35;
         generateMission(game.day);
         game.castleMHP = 40 + param1 * 10;
         game.castleHP = game.castleMHP;
         game.castleHP *= 20;
         player.exp[_pc] = 2000;
         gameStart();
         gotoAndPlay("battle");
      }
      
      public function updateFrenzyBar() : *
      {
         frenzyMode = 0;
         if(CALC.DUELIST(_pc))
         {
            frenzyMode = 1;
         }
         if(CALC.SNIPER(_pc))
         {
            frenzyMode = 2;
         }
         if(CALC.RANGER(_pc))
         {
            frenzyMode = 3;
         }
         if(frenzyMode)
         {
            frenzyBar.visible = true;
            frenzyBar2.visible = true;
            frenzyText.visible = true;
            frenzyBar.scaleX = 0;
         }
         else
         {
            frenzyBar.visible = false;
            frenzyBar2.visible = false;
            frenzyText.visible = false;
         }
      }
      
      public function onTick(param1:TimerEvent) : void
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         if(gamePaused)
         {
            return;
         }
         if(game.castleHP <= 0)
         {
            customCursor.visible = false;
            Mouse.show();
            gamePaused = true;
            gameOver = true;
            gotoAndPlay("dead");
            return;
         }
         _loc2_ = 0;
         while(_loc2_ < maxAlly)
         {
            if(player.exist[_loc2_] != false)
            {
               w = weapon(_loc2_);
               if(Boolean(inventory.autoReload[w]) && inventory.reloadTime[w] == 0 && inventory.ammo[w] < inventory.ammoMax[w])
               {
                  if(player.shootTimer[_loc2_] <= inventory.shootRate[w] * -3)
                  {
                     reload(_loc2_,w);
                  }
               }
               if(inventory.reloadTime[w])
               {
                  reloading(_loc2_,w);
                  if(Boolean(inventory.autoReload[w]) == false)
                  {
                     player.idleCount[_loc2_] -= 0.15;
                     if(player.idleCount[_loc2_] < 0)
                     {
                        player.idleCount[_loc2_] = 0;
                     }
                  }
               }
               if(player.trait[_loc2_][TRAIT.MILITIA])
               {
                  --player.grenadeCount[_loc2_];
                  if(player.grenadeCount[_loc2_] < 0)
                  {
                     _loc4_ = aiFireAtWill(_loc2_,2);
                     if(_loc4_ == undefined)
                     {
                        player.grenadeCount[_loc2_] += 10;
                     }
                     else if(_loc4_.x > player_mc[_loc2_].x)
                     {
                        player.grenadeCount[_loc2_] += 10;
                     }
                     else
                     {
                        throwGrenade(_loc2_,-1,player_mc[_loc2_].x,player_mc[_loc2_].y,_loc4_.x + _loc4_.speed * (15 + Math.random() * 20),_loc4_.y,12,CALC.MILITIA(_loc2_),0);
                        calcGrenadeCount(_loc2_);
                     }
                  }
               }
            }
            _loc2_++;
         }
         --soundCounter;
         if(mission.newWave)
         {
            if(sisterList[mission.wave])
            {
               sound_launch.play(0,0,soundPos(640));
               _loc2_ = 0;
               while(_loc2_ < sisterList[mission.wave])
               {
                  spawnEnemy(_bomb);
                  _loc2_++;
               }
            }
            mission.newWave = false;
            if(mission.wave == 3)
            {
               if(game.optionColor != true)
               {
                  customCursor.gotoAndStop(2);
               }
               bgChange = 100;
            }
            if(mission.wave == 1)
            {
               bgChange = -100;
            }
            if(mission.wave <= 0)
            {
               if(game.castleHP < game.castleMHP)
               {
                  mission.noDamage = false;
               }
               mission.wave = 0;
               gamePaused = true;
               immune = true;
               stopSound();
               startFire();
               exitBattle2();
               eventAfterBattle();
               gotoAndStop("event");
               return;
            }
            --mission.wave;
            if(game.day == 1)
            {
               if(mission.wave == 3)
               {
                  popInfo("You can throw a powerful grenade by pressing 2.");
               }
               if(mission.wave == 2)
               {
                  popInfo("Throw grenades at the boss to deal major damage!");
               }
            }
            if(mission.wave == mission.bossWave)
            {
               text_effect("Incoming Boss!!");
            }
            updateDay();
            if(game.repair)
            {
               game.castleHP += castleRepair();
               if(game.castleHP > game.castleMHP)
               {
                  game.castleHP = game.castleMHP;
               }
               updateHP();
            }
            if(game.castleHP < game.castleMHP)
            {
               mission.noDamage = false;
            }
         }
         else
         {
            --mission.time;
            if(mission.time < 0)
            {
               if(pop[mission.wave].length <= 0)
               {
                  mission.newWave = true;
               }
               else
               {
                  _loc2_ = 0;
                  while(_loc2_ < pop[mission.wave].length)
                  {
                     _loc5_ = pop[mission.wave].pop();
                     spawnEnemy(_loc5_);
                     mission.time = popTime[mission.wave].pop() + _loc2_ * 4;
                     if(eRef[eRefId[_loc5_]].lv > Math.random() * mission.level - 6 || Math.random() > 0.8)
                     {
                        break;
                     }
                     _loc2_++;
                  }
               }
            }
         }
         if(bgChange)
         {
            updateBG();
         }
         if(_pc == hero)
         {
            if(player.accuracyFix[_pc] > 0)
            {
               player.accuracyFix[_pc] -= 0.02 * (100 + CALC.COOL(_pc)) / 100;
            }
            if(game.tight == true)
            {
               _loc3_ = 0;
            }
            else
            {
               _loc3_ = Math.abs(500 - inventory.range[ci] * 200 - mouseX);
            }
            if(_loc3_ < 100)
            {
               _loc3_ = 0;
            }
            else
            {
               _loc3_ /= player.rangeFix[_pc];
            }
            if(player.accuracyFix[_pc] < _loc3_)
            {
               player.accuracyFix[_pc] = _loc3_;
            }
            if(player.shootTimer[_pc] > 0 && inventory.automatic[ci] == false)
            {
               customCursor.alpha = 0.7;
            }
            else
            {
               customCursor.alpha = 1;
            }
            if(player.accuracyFix[_pc] > 0.6)
            {
               player.accuracyFix[_pc] = 0.6;
            }
            customCursor.scaleX = 0.3 + player.accuracyFix[_pc];
            customCursor.scaleY = 0.3 + player.accuracyFix[_pc];
         }
         else
         {
            customCursor.scaleX = 0.3;
            customCursor.scaleY = 0.3;
         }
         if(frenzyMode)
         {
            if(frenzyMode == 1)
            {
               frenzyBar.scaleX = player.frenzy[_pc] / calcDuelistMaxDamage(player.trait[_pc][TRAIT.DUELIST]);
            }
            if(frenzyMode == 2)
            {
               _loc6_ = CALC.SNIPER(_pc) * player.idleCount[_pc] / (calcSniperMaxDamage(player.trait[_pc][TRAIT.SNIPER]) - 100);
               if(_loc6_ > 1)
               {
                  _loc6_ = 1;
                  player.idleCount[_pc] = (calcSniperMaxDamage(player.trait[_pc][TRAIT.SNIPER]) - 100) / CALC.SNIPER(_pc);
               }
               frenzyBar.scaleX = _loc6_;
            }
            if(frenzyMode == 3)
            {
               frenzyBar.scaleX = player.frenzy[_pc] / 1000;
            }
         }
      }
      
      public function initPartySkill() : *
      {
         getBestSkill("SCAVENGER");
         getBestSkill("THREAT");
         getBestSkill("DEFENDER");
         getBestSkill("LEADERSHIP");
         getBestSkill("NEGOTIATOR");
         getBestSkill("INSURANCE");
         getBestSkill("ENGINEER");
         getBestSkill("ROBBER");
         getBestSkill("ACTIVE");
         getBestSkill("BREEDER");
         getBestSkill("TAUNT");
         getBestSkill("COOK");
         getBestSkill("ACCOUNTANT");
         getBestSkill("QUICK_EYED");
         getBestSkill("LOVE");
         getBestSkill("SUPPLIER");
         var _loc1_:int = 0;
         var _loc2_:int = 0;
         PARTY.GUARDIAN = 0;
         PARTY.GUARDIAN_LIST = [];
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            if(player.exist[_loc1_] != false)
            {
               PARTY.GUARDIAN += CALC.GUARDIAN(_loc1_);
               PARTY.GUARDIAN_LIST[_loc2_] = _loc1_;
               _loc2_++;
            }
            _loc1_++;
         }
      }
      
      public function makeBlurScreen() : *
      {
         var _loc1_:BitmapData = new BitmapData(640,380,true,4294967295);
         var _loc2_:Matrix = new Matrix(1,0,0,1,0,0);
         var _loc3_:ColorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
         var _loc4_:Rectangle = new Rectangle(0,0,640,380);
         _loc1_.draw(stage,_loc2_,_loc3_,BlendMode.NORMAL,_loc4_,true);
         var _loc5_:* = new MovieClip();
         stage.addChild(_loc5_);
         var _loc6_:Bitmap = new Bitmap(_loc1_);
         _loc5_.addChild(_loc6_);
         Tweener.addTween(_loc5_,{
            "_Blur_blurX":3,
            "_Blur_blurY":3,
            "time":1
         });
         return _loc5_;
      }
      
      public function preGenerateWave() : *
      {
         if(game.optionAltStart == 2)
         {
            mission.wave = 100;
            mission.waveMax = mission.wave;
         }
         i = 0;
         while(i < mission.wave)
         {
            if(game.optionAltStart == 2)
            {
               mission.level = 108 - i;
               mission.fixedLv = mission.level;
               mission.strength = 0;
               mission.power = 450 + mission.level * 140;
               mission.powerOrg = mission.power;
            }
            generateWave(i);
            ++i;
         }
      }
      
      public function checkPaused() : *
      {
         if(gamePaused)
         {
            return true;
         }
         return false;
      }
      
      public function initEnemy() : *
      {
         var _loc1_:enemy = null;
         i = 0;
         while(i < maxEnemy)
         {
            _loc1_ = new enemy();
            enemyArray[i] = _loc1_;
            ++i;
         }
      }
      
      public function enchant(itemIndex:int, modId:int, modLevel:int) : *
      {
         if(modLevel == -1)
         {
            modLevel = 1 + int(Math.random() * 3);
         }
         if(modId == -1)
         {
            modId = int(encList[modLevel][int(Math.random() * encList[modLevel].length)]);
         }
         var enchantEfficiency:* = 1.1 + PARTY.ENGINEER / 100;
         if(medal[_medalAction4])
         {
            enchantEfficiency += 0.15;
         }
         var existingModTexts:* = inventory.modText[itemIndex].split(") ");
         var modIndex:* = 0;
         while(modIndex < existingModTexts.length)
         {
            if(existingModTexts[modIndex].indexOf(encRef[modId].name) != -1)
            {
               enchantEfficiency *= 0.65;
            }
            modIndex++;
         }
         if(modId == _encAutofire)
         {
            inventory.automatic[itemIndex] = true;
            inventory.shootRate[itemIndex] = modLevel + int(inventory.shootRate[itemIndex] * (100 + modLevel * 10 * enchantEfficiency) / 100);
         }
         if(modId == _encDamage)
         {
            inventory.attack[itemIndex] = int(modLevel * 1.5) + int(inventory.attack[itemIndex] * (100 + modLevel * 8 * enchantEfficiency) / 100);
         }
         if(modId == _encFireRate)
         {
            inventory.shootRate[itemIndex] = modLevel + int(inventory.shootRate[itemIndex] * (100 + modLevel * 12 * enchantEfficiency) / 100);
         }
         if(modId == _encAccuracy)
         {
            inventory.baseAccuracy[itemIndex] = modLevel + int(inventory.baseAccuracy[itemIndex] * (100 + modLevel * 5 * enchantEfficiency) / 100);
         }
         if(modId == _encAmmo)
         {
            if(inventory.ammoMax[itemIndex] == 1)
            {
               return;
            }
            inventory.ammoMax[itemIndex] = modLevel + int(inventory.ammoMax[itemIndex] * (100 + modLevel * 10 * enchantEfficiency) / 100);
         }
         if(modId == _encReloading)
         {
            if(inventory.reloadTimeMax[itemIndex] == 0)
            {
               return;
            }
            inventory.reloadTimeMax[itemIndex] = int(inventory.reloadTimeMax[itemIndex] * 100 / (100 + modLevel * 7 * enchantEfficiency));
            if(inventory.reloadTimeMax[itemIndex] < 2)
            {
               inventory.reloadTimeMax[itemIndex] = 2;
            }
         }
         if(modId == _encLeech)
         {
            inventory.leech[itemIndex] += int((modLevel + 1) * enchantEfficiency);
         }
         if(modId == _encImpact)
         {
            if(inventory.impact[itemIndex] < 1)
            {
               inventory.impact[itemIndex] = 1;
            }
            inventory.impact[itemIndex] += modLevel * 2;
         }
         if(modId == _encAir)
         {
            inventory.dmgAir[itemIndex] += int(modLevel * 11 * enchantEfficiency);
         }
         if(modId == _encArmor)
         {
            inventory.dmgArmor[itemIndex] += int(modLevel * 11 * enchantEfficiency);
         }
         if(modId == _encAutoReload)
         {
            if(inventory.manualReload[itemIndex] == false)
            {
               return;
            }
            inventory.autoReload[itemIndex] = modLevel;
         }
         if(modId == _encLivingWeapon)
         {
            if(inventory.livingWeapon[itemIndex] > 0)
            {
               return;
            }
            inventory.livingWeapon[itemIndex] = calcLivingWeaponExp(itemIndex);
         }
         if(modId == _encMuzzleBrake)
         {
            inventory.accuracyDec[itemIndex] = inventory.accuracyDec[itemIndex] * 100 / (100 + modLevel * 8 * enchantEfficiency);
         }
         ++inventory.mod[itemIndex];
         inventory.modText[itemIndex] += encRef[modId].name;
         inventory.value[itemIndex] += encRef[modId].cost * modLevel * modLevel / 3;
         inventory.modText[itemIndex] += "(Lv." + modLevel + ") ";
         inventory.ammo[itemIndex] = inventory.ammoMax[itemIndex];
      }
      
      public function initButton() : *
      {
         var _loc1_:MovieClip = null;
         i = 0;
         while(i < maxButton)
         {
            _loc1_ = new selectButton();
            buttonArray[i] = _loc1_;
            ++i;
         }
      }
      
      public function procLink(param1:int) : *
      {
         var request:URLRequest;
         var i:int = param1;
         var url:* = [];
         url[1] = "http://www.s-t-t.com/wwl/";
         url[2] = "http://zodiacfragment.sakura.ne.jp/hp_00_mainpage_f.html";
         url[3] = "http://www.tekepon.net/fsm/";
         url[4] = "http://reinerstileset.4players.de/englisch.html";
         url[5] = "http://lostgarden.com/";
         url[6] = "http://shass.sakura.ne.jp/";
         url[7] = "http://www.freesound.org/";
         url[8] = "http://www14.big.or.jp/~amiami/happy/";
         url[9] = "";
         url[10] = "http://www.freedigitalphotos.net/";
         sound_click1.play();
         popInfo("A Webpage has been opend in your browser.");
         request = new URLRequest(url[i]);
         try
         {
            navigateToURL(request);
         }
         catch(e:Error)
         {
         }
      }
      
      internal function frame7() : *
      {
      }
      
      public function pauseMenu() : *
      {
         var _loc1_:String = null;
         blurMc = makeBlurScreen();
         stage.focus = stage;
         menuButton.mouseEnabled = false;
         sound_scroll1.play();
         gamePaused = true;
         window_mc.x = 0;
         window_mc.y = 0;
         stage.addChild(window_mc);
         customCursor.visible = false;
         Mouse.show();
         helpMode = 0;
         if(game.optionColor == undefined)
         {
            game.optionColor = false;
         }
         window_mc.options.optShowDamage.selected = game.optionShowDamage;
         window_mc.options.optShowAllyDamage.selected = game.optionShowAllyDamage;
         window_mc.options.optLowQuality.selected = game.optionLowQuality;
         window_mc.options.optFirework.selected = game.optionFirework;
         window_mc.options.optColor.selected = game.optionColor;
         window_mc.options.optFlashShot.selected = game.optionFlashShot;
         window_mc.options.stats.editable = false;
         _loc1_ = "Elona Shooter Stactics  Day " + game.day + "\n";
         if(game.casual == true)
         {
            _loc1_ += "You are playing Casual Mode.\n";
         }
         if(game.HC == true)
         {
            _loc1_ += "You are playing Hardcore Mode.\n";
         }
         if(game.optionBossDropMod == true)
         {
            _loc1_ += "Mod(Bosses drop Mod) is on.\n";
         }
         if(game.MORE == true)
         {
            _loc1_ += "Mod(Intense Start) is on.\n";
         }
         if(game.tight == true)
         {
            _loc1_ += "Mod(Tighter crosshair) is on.\n";
         }
         if(game.optWeaponLevel == true)
         {
            _loc1_ += "Mod(Limit high level weapons) is on.\n";
         }
         if(game.laptop == true)
         {
            _loc1_ += "Mod(Laptop difficulty) is on.\n";
         }
         if(game.comp == true)
         {
            _loc1_ += "Mod(Community Compilation) is on.\n";
         }
         if(game.skipHard == true)
         {
            _loc1_ += "Mod(Skip hard waves) is on.\n";
         }
         if(game.carryOver == true)
         {
            _loc1_ += "You\'ve used Carry Over Option.\n";
         }
         _loc1_ += game.noDamage + " Perfect Games scored.\n";
         _loc1_ += game.eggsCollected + " eggs collected.\n";
         _loc1_ += "Exploded " + game.sistersExploded + " sisters.\n";
         _loc1_ += "Robbed " + game.childrenRobbed + " children.\n";
         _loc1_ += "Total of " + game.totalKill + " enemies killed.\n";
         _loc1_ += "Total of " + game.totalMoney + " GP earned.\n";
         _loc1_ += "This game modded by Alfred.\n";
         _loc1_ += "\n";
         window_mc.options.stats.text = _loc1_;
         window_mc.gotoAndPlay("menu_pause");
      }
      
      public function geneMedalBonus() : *
      {
         if(medal[_medalHardcore3])
         {
            player.trait[_pc][TRAIT.LUCK] += 3;
         }
         if(medal[_medalRagnarok])
         {
            player.trait[_pc][TRAIT.LUCK] += 1;
         }
         if(medal[_medalCritical1])
         {
            player.trait[_pc][TRAIT.LUCK] += 1;
         }
         if(medal[_medalCritical2])
         {
            player.trait[_pc][TRAIT.SENSE] += 1;
         }
         if(medal[_medalHardcore1])
         {
            player.trait[_pc][TRAIT.SENSE] += 1;
         }
         if(medal[_medalCritical3])
         {
            player.trait[_pc][TRAIT.ACCURACY] += 2;
         }
         if(medal[_medalBadge1])
         {
            ++game.invSlot;
            ++game.storage;
         }
         if(medal[_medalBadge2])
         {
            game.fame += 20;
         }
         if(debugStartDay)
         {
            return;
         }
         if(medal[_medalDay1])
         {
            player.money[_pc] += 0;
         }
         if(medal[_medalDay2])
         {
            player.money[_pc] += 100;
         }
         if(medal[_medalDay3])
         {
            player.money[_pc] += 200;
         }
         if(medal[_medalDay4])
         {
            player.money[_pc] += 300;
         }
         if(medal[_medalDay5])
         {
            player.money[_pc] += 500;
         }
         if(medal[_medalDay6])
         {
            player.money[_pc] += 750;
         }
         if(medal[_medalDay7])
         {
            player.money[_pc] += 1000;
         }
      }
      
      internal function frame1() : *
      {
         skipLoader = 0;
         skipAd = 0;
         dbgMode = 0;
         debug = 0;
         kongregateEmu = 0;
         armorEmu = 0;
         beta = 0;
         toBlackScreen = 0;
         debugShowUpdate = 0;
         debugMedal = 0;
         debugUnlockClass = 0;
         debugBattle = 0;
         debugTown = 0;
         debugId = 0;
         debugBatch = 0;
         debugTownDay = 0;
         debugStartDay = 0;
         debugEnemyNum = 0;
         debugLoader = 0;
         this.contextMenu = new ContextMenu();
         this.contextMenu.hideBuiltInItems();
         Tweener.init();
         ColorShortcuts.init();
         FilterShortcuts.init();
         kongregate = 0;
         armor = 0;
         info = root.loaderInfo;
         loaded = 0;
         sound_click1 = new soundClick1();
         if(info.url.indexOf("armorgames.com") != -1 || Boolean(armorEmu))
         {
            armor = 1;
         }
         else
         {
            armor = 0;
         }
         if(info.url.indexOf("kongregate.com") != -1 || Boolean(kongregateEmu))
         {
            kongregate = 1;
         }
         else
         {
            kongregate = 0;
         }
         if(kongregate)
         {
            kongAPI = new KongregateAPI();
            this.addChild(kongAPI);
         }
         if(dbgMode == 1)
         {
            dbgWin = new dbgWindow();
            dbgWin.y = 0;
            stage.addChild(dbgWin);
         }
         if(kongregate == 0 && armor == 0 && skipAd == 0 && toBlackScreen == 0)
         {
            MochiAd.showPreGameAd({
               "clip":root,
               "id":"f9e95432841094cb",
               "res":"620x380"
            });
         }
      }
      
      public function procTownMenu() : *
      {
         window2_mc.stop();
         select_init(720,300);
         select_add("what");
         select_add("hey");
      }
      
      public function updateMissionMenu() : *
      {
         var _loc1_:int = 0;
         _loc1_ = 0;
         while(_loc1_ < radioCount)
         {
            radio_mc[_loc1_].removeEvent();
            _loc1_++;
         }
         removeRadio();
         radioCount = 0;
         _loc1_ = 0;
         while(_loc1_ < 10)
         {
            radio_mc[_loc1_] = new actions() as MovieClip;
            radio_mc[_loc1_]._root = root as MovieClip;
            radio_mc[_loc1_].x = 145 + _loc1_ % 5 * 80;
            radio_mc[_loc1_].y = 150 + int(_loc1_ / 5) * 105;
            if(actList[_loc1_] != undefined && actList[_loc1_].method() != false)
            {
               radio_mc[_loc1_].card.gotoAndStop(actList[_loc1_].pic);
               if(actList[_loc1_].method() == true)
               {
                  radio_mc[_loc1_].avail = true;
                  radio_mc[_loc1_].card.buttonMode = true;
               }
               else
               {
                  radio_mc[_loc1_].avail = false;
                  radio_mc[_loc1_].alpha = 0.5;
               }
               radio_mc[_loc1_].card.rotation = actList[_loc1_].angle;
               radio_mc[_loc1_].text.text = actList[_loc1_].cost + " AP\n" + actList[_loc1_].name;
            }
            else
            {
               radio_mc[_loc1_].card.gotoAndStop(1);
               radio_mc[_loc1_].avail = false;
               radio_mc[_loc1_].text.text = "";
               radio_mc[_loc1_].alpha = 0.5;
            }
            radio_mc[_loc1_].text.mouseEnabled = false;
            radio_mc[_loc1_].pin.mouseEnabled = false;
            window2_mc.addChild(radio_mc[_loc1_]);
            ++radioCount;
            _loc1_++;
         }
         updateInterface();
      }
      
      internal function frame6() : *
      {
         allRemoveChild(root as MovieClip);
         stage.quality = StageQuality.HIGH;
         chainPos = [];
         soundCs = -1;
         hero = -1;
         weaponRange = [];
         showUpdate = false;
         popupMc = undefined;
         weaponRange[0] = [2,1,0];
         weaponRange[1] = [1,2,0];
         weaponRange[2] = [0,1,2];
         cursorX = [375,225,75];
         cursorY = [250,265,220];
         aiTarget = [];
         i = 0;
         while(i < _maxTarget)
         {
            aiTarget[i] = [];
            i2 = 0;
            while(i2 < 3)
            {
               aiTarget[i][i2] = [undefined,1000];
               ++i2;
            }
            ++i;
         }
         clearTarget();
         fireAtWill = false;
         playerY = [245,215,275,185,305,335];
         filter1a = new GlowFilter(3394815,0);
         filter2a = new GlowFilter(16777215);
         filterDrop = new DropShadowFilter();
         filter1 = new Array();
         filter2 = new Array();
         filter1.push(filter1a);
         filter2.push(filter2a);
         player_mc = [];
         inventory_mc = [];
         stats_mc = [];
         medal_mc = [];
         upgrade_mc = [];
         enemyArray = [];
         buttonArray = [];
         invSlot_mc = [];
         invIcon_mc = [];
         pic_mc = [];
         cursor_mc = [];
         radio_mc = [];
         window_mc = new window();
         window2_mc = new window();
         window3_mc = new window();
         window4_mc = new window();
         sound_mute = new soundMute();
         sound_defend = new soundDefend();
         sound_drop = new soundDrop();
         sound_launch = new soundLaunch();
         sound_party = new soundParty();
         sound_search = new soundSearch();
         sound_night = new soundNight();
         sound_pray1 = new soundPray1();
         sound_eat1 = new soundEat1();
         sound_dead1 = new soundDead1();
         sound_dead2 = new soundDead2();
         sound_dead3 = new soundDead3();
         sound_dead4 = new soundDead4();
         sound_dead5 = new soundDead5();
         sound_dead6 = new soundDead6();
         sound_dead7 = new soundDead7();
         sound_dead8 = new soundDead8();
         sound_dead9 = new soundDead9();
         sound_deadChicken = new soundDeadChicken();
         sound_chicken = new soundChicken();
         sound_chickenAttack = new soundChickenAttack();
         sound_fireball = new soundFireball();
         sound_lightning = new soundLightning();
         sound_puls = new soundPuls();
         sound_exp1 = new soundExp1();
         sound_bow1 = new soundBow1();
         sound_gun1 = new soundGun1();
         sound_gun2 = new soundGun2();
         sound_gun3 = new soundGun3();
         sound_gun4 = new soundGun4();
         sound_gun5 = new soundGun5();
         sound_gun6 = new soundGun6();
         sound_gun7 = new soundGun7();
         sound_gun8 = new soundGun8();
         sound_gun9 = new soundGun9();
         sound_gun10 = new soundGun10();
         sound_gun11 = new soundGun11();
         sound_gun12 = new soundGun12();
         sound_gun13 = new soundGun13();
         sound_gun14 = new soundGun14();
         sound_gun15 = new soundGun15();
         sound_card1 = new soundCard1();
         sound_deadBoss1 = new soundDeadBoss1();
         sound_deadBoss2 = new soundDeadBoss2();
         sound_beep = new soundBeep();
         sound_bad = new soundBad();
         sound_good = new soundGood();
         sound_mod = new soundMod();
         sound_rampage = new soundRampage();
         sound_rampageEnemy = new soundRampageEnemy();
         sound_reloading1 = new soundReloading1();
         sound_reloaded1 = new soundReloaded1();
         sound_reloading2 = new soundReloading2();
         sound_reloaded2 = new soundReloaded2();
         sound_reloading3 = new soundReloading3();
         sound_reloaded3 = new soundReloaded3();
         sound_damage1 = new soundDamage1();
         sound_impact1 = new soundImpact1();
         sound_scroll1 = new soundScroll1();
         sound_pay1 = new soundPay1();
         sound_crow = new soundCrow();
         sound_cata = new soundCata();
         sound_killed = new soundKilled();
         sound_complete = new soundComplete();
         sound_battleBegin = new soundBattleBegin();
         sound_battleEnd = new soundBattleEnd();
         sound_award = new soundAward();
         sound_gold1 = new soundGold1();
         sound_bag1 = new soundBag1();
         sound_pop1 = new soundPop1();
         sound_medal = new soundMedal();
         sound_throw1 = new soundThrow1();
         sound_repair1 = new soundRepair1();
         sound_chain1 = new soundChain1();
         sound_chain2 = new soundChain2();
         sound_chain3 = new soundChain3();
         sound_bow2 = new soundBow2();
         sound_bg_forest = new soundBgForest();
         sound_bg_town = new soundBgTown();
         sound_low = new soundLow();
         sound_tank = new soundTank();
         sound_tank2 = new soundTank2();
         sound_firework = new soundFirework();
         sound_goodshot = [];
         sound_goodshot[0] = new soundGoodshot0() as Sound;
         sound_goodshot[1] = new soundGoodshot1() as Sound;
         sound_goodshot[2] = new soundGoodshot2() as Sound;
         sound_goodshot[3] = new soundGoodshot3() as Sound;
         sound_goodshot[4] = new soundGoodshot4() as Sound;
         trans = [];
         trans[0] = new SoundTransform(0.9,0) as SoundTransform;
         trans[1] = new SoundTransform(0.2,0.8) as SoundTransform;
         trans[2] = new SoundTransform(0.3,0.7) as SoundTransform;
         trans[3] = new SoundTransform(0.1,0.9) as SoundTransform;
         trans[4] = new SoundTransform(0.2,0.85) as SoundTransform;
         trans[5] = new SoundTransform(0.3,0.75) as SoundTransform;
         trans[6] = new SoundTransform(0.3,0.75) as SoundTransform;
         trans[9] = new SoundTransform(0.5,0.8) as SoundTransform;
         posTrans = [];
         i = 0;
         while(i < 20)
         {
            posTrans[i] = new SoundTransform(0.9,i * 0.08 - 0.8) as SoundTransform;
            ++i;
         }
         frenzyMode = 0;
         menuLine = 400;
         defenseLine = 455;
         groundLine = 170;
         groundWidth = 155;
         airLine = 40;
         airWidth = 70;
         maxEnemy = 200;
         maxAlly = 5;
         maxParty = 4;
         maxChara = 7;
         maxButton = 8;
         eventList = [];
         timer = new Timer(50,0);
         idx = new Object();
         idx.day = 0;
         idx.dayHC = 0;
         idx.dayCasual = 0;
         idx.unlocked = [true,true,true,true,false,false,false,false];
         idx.slot = 0;
         idx.beta = beta;
         idx.saveName = ["Empty Save","Empty Save","Empty Save","Empty Save","Empty Save","Empty Save"];
         idx.mute = false;
         idx.version = _version;
         upgradeRefStr = ["Fix Wall","Wall","Sandbag","Storage","House","Looter","Repairman","Trainer","Smith","Museum","Chicken","Sister","Villa","Sp.Trainer","N/A","N/A"];
         upgradeRef = ["wallFix","wallUpgrade","sandbag","storage","house","looter","repair","trainer","smith","museum","chicken","sister","party","spTrainer","na","na"];
         upgradeHint = [];
         upgradeMax = [];
         game = new Object();
         popList = [];
         popMax = 10;
         i = 0;
         while(i < popMax)
         {
            popList[i] = 0;
            ++i;
         }
         game.optionFirework = false;
         game.optionBossDropMod = false;
         game.optionAltStart = 0;
         game.optionShowDamage = true;
         game.optionShowAllyDamage = false;
         game.optionLowQuality = false;
         game.optionFlashShot = false;
         game.submit = true;
         game.apFix = 0;
         game.day = 1;
         game.castleHP = 40;
         game.castleMHP = 40;
         game.invSlot = 6;
         game.ap = 0;
         game.apMax = 5;
         game.card = [];
         game.noDamage = 0;
         game.prayerCount = 0;
         game.tauntCount = 0;
         game.partyCount = 0;
         game.recycleCount = 0;
         game.robCount = 0;
         newTitle(1);
         game.fame = 0;
         game.train = 0;
         game.boss = 0;
         game.hintReload = false;
         game.prayed = false;
         game.HC = false;
         game.MORE = false;
         game.casual = false;
         game.carryOver = false;
         game.eggsCollected = 0;
         game.childrenRobbed = 0;
         game.sistersExploded = 0;
         game.totalKill = 0;
         game.totalMoney = 0;
         fixedLvMax = 30;
         lvCycle = 40;
         i = 0;
         while(i < upgradeRef.length)
         {
            game[upgradeRef[i]] = 0;
            ++i;
         }
         game.wallUpgrade = 1;
         game.storage = 1;
         game.house = 1;
         upgradeMax = ["","","10","11","3","","","","6","","","","",""];
         titleList = ["Newcomer","Honorary Citizen","Private","Knight Apprentice","Knight","Baron","Duke","Prince","King"];
         medalPage = [0,85,150];
         medal = new Array(_maxMedal);
         gunSound = [];
         inventory = new Object();
         inventory.num = [];
         inventory.id = [];
         inventory.graphic = [];
         inventory.type = [];
         inventory.text = [];
         inventory.reloadTime = [];
         inventory.reloadTimeMax = [];
         inventory.ammo = [];
         inventory.ammoMax = [];
         inventory.shootRate = [];
         inventory.automatic = [];
         inventory.baseAccuracy = [];
         inventory.accuracyDec = [];
         inventory.attack = [];
         inventory.value = [];
         inventory.reqTrait = [];
         inventory.reqLv = [];
         inventory.mod = [];
         inventory.modMax = [];
         inventory.shell = [];
         inventory.range = [];
         inventory.name = [];
         inventory.manualReload = [];
         inventory.modText = [];
         inventory.lv = [];
         inventory.typeMinor = [];
         inventory.special = [];
         inventory.dmgAir = [];
         inventory.dmgArmor = [];
         inventory.leech = [];
         inventory.impact = [];
         inventory.rare = [];
         inventory.autoReload = [];
         inventory.livingWeapon = [];
         i = 0;
         while(i < _maxInv)
         {
            inventory.num[i] = 0;
            inventory.value[i] = 0;
            ++i;
         }
         encRef = [];
         encRef[0] = {
            "name":"NullEnc",
            "cost":100,
            "detail":"This mod increases the base accuracy of a weapon."
         };
         encRef[1] = {
            "name":"Accuracy",
            "cost":100,
            "detail":"This mod increases the base accuracy of a weapon."
         };
         encRef[2] = {
            "name":"Reloading",
            "cost":120,
            "detail":"This mod speeds up the reloading time of a weapon."
         };
         encRef[3] = {
            "name":"Fire Rate",
            "cost":130,
            "detail":"This mod improves the firing rate of a weapon. For weapons with a very high firing rate, its effect may be less than satisfactory."
         };
         encRef[4] = {
            "name":"Damage",
            "cost":140,
            "detail":"This mod enchances the damage output of a weapon."
         };
         encRef[5] = {
            "name":"Anti Air",
            "cost":80,
            "detail":"This mod adds anti-air capability to a weapon."
         };
         encRef[6] = {
            "name":"Anti Armor",
            "cost":80,
            "detail":"This mod adds anti-armor capability to a weapon."
         };
         encRef[7] = {
            "name":"Ammo",
            "cost":140,
            "detail":"This mod inreases the ammo capacity of a weapon."
         };
         encRef[8] = {
            "name":"Impact",
            "cost":160,
            "detail":"This mod grants a weapon an ability to knock back enemies."
         };
         encRef[9] = {
            "name":"Leech",
            "cost":200,
            "detail":"This mod grants a weapon an ability to convert inflicted damage to the castle HP."
         };
         encRef[10] = {
            "name":"Auto Reload",
            "cost":100,
            "detail":"This handy mod automatically refills your ammo when you\'re not shooting. Only works on manual reloading guns."
         };
         encRef[11] = {
            "name":"Living Weapon",
            "cost":300,
            "detail":"Once mounted, your weapon will be parasitized by this rare creature and slowly develop unique powers."
         };
         encRef[12] = {
            "name":"Auto Fire",
            "cost":110,
            "detail":"This handy mod gives auto-fire function to a weapon when mounted. It also boosts the firing rate. For weapons with a very high firing rate, its effect may be less than satisfactory."
         };
         encRef[13] = {
            "name":"Muzzle Brake",
            "cost":130,
            "detail":"This mod reduces the impact of weapon recoil on accuracy."
         };
         encList = [];
         encList[0] = [_encDamage,_encAccuracy,_encMuzzleBrake,_encAmmo,_encAmmo,_encAmmo,_encAmmo,_encReloading,_encFireRate,_encAir,_encArmor,_encImpact,_encLeech,_encAutoReload,_encAutofire];
         encList[1] = [_encDamage,_encAccuracy,_encMuzzleBrake,_encAmmo,_encAmmo,_encAmmo,_encAmmo,_encReloading,_encFireRate,_encAir,_encArmor,_encImpact,_encLeech,_encAutoReload,_encAutofire];
         encList[2] = [_encDamage,_encAccuracy,_encMuzzleBrake,_encAmmo,_encAmmo,_encAmmo,_encAmmo,_encReloading,_encFireRate,_encAir,_encArmor,_encImpact,_encLeech,_encAutoReload,_encAutofire];
         encList[3] = [_encDamage,_encAccuracy,_encMuzzleBrake,_encAmmo,_encAmmo,_encAmmo,_encAmmo,_encReloading,_encFireRate,_encAir,_encArmor,_encImpact,_encLeech,_encAutoReload,_encAutofire];
         nameBoy = ["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","García","Rodriguez","Wilson","Martinez","Anderson","Taylor","Thomas","Moore","Martin","Jackson","Thompson","White","Lee","Harris","Clark","Lewis","Robinson","Walker","Hall","Young","Allen","Wright","Scott","Adams","Nelson","Hill","Campbell","Mitchell","Roberts","Carter","Phillips","Evans","Turner","Torres","Parker","Collins","Edwards","Stewart","Flores","Morris","Nguyen","Murphy","Rivera","Rogers","Morgan","Peterson","Cooper","Reed","Bailey","Bell","Kelly","Howard","Cox","Wood","Watson","Brooks","Bennett","Gray","James","Reyes","Cruz","Hughes","Myers","Foster","Sanders","Ross","Powell","Sullivan","Russell","Ortiz","Jenkins","Perry","Barnes","Silva","Santos","Oliveira","Souza","Pereira","Costa","Carvalho","Almeida","Ferreira","Ribeiro","Janssens","Maes","Svoboda","Jensen","Nielsen","Larsen","Olsen","Tamm","Korhonen","Laine","Martin","Bernard","Dubois","Robert","Petit","Durand","Leroy","Laurent","David","Roux","Vincent"
         ,"Fournier","Girard","Beridze","Schmidt","Fischer","Meyer","Weber","Schulz","Wagner","Koch","Varga","Lakatos","Murphy","Lynch","Rossi","Russo","Ferrari","Bianchi","Rizzo","Vella","Grech"];
         devGroup = [];
         g_count = [];
         TRAIT = {};
         CALC = {};
         REF = {};
         ID = {};
         traitRef = [];
         PARTY = [];
         PARTYLV = [];
         setTrait("HUNTER",_devHunter,999,1,"",["A hunter receives reduced range penalty and can fire a gun beyond its effective range.","-","x","% range penalty"],function(param1:int):*
         {
            return 25 + param1 + Math.sqrt(param1) * 5;
         });
         setTrait("ROGUE",_devRogue,999,1,"",["When a rogue scores a critical kill, the enemy drops money. Guaranteed! She even gets more than normal amount.","","x","% more money"],function(param1:int):*
         {
            return 20 + param1 + Math.sqrt(param1) * 15;
         });
         setTrait("SHERIFF",_devSheriff,999,1,"",["Enemies shot by a sheriff will be knocked back and slowed down, making them easy targets.","+","x"," knock back"],function(param1:int):*
         {
            return 5 + Math.sqrt(param1);
         });
         setTrait("MILITIA",_devMilitia,999,1,"",["A militia can occasionally throw a grenade at a random enemy. The throwing rate also increases as he levels.","","x"," grenade damage"],function(param1:int):*
         {
            return 25 + param1 * 2;
         });
         setTrait("SNIPER",_devSniper,999,1,"",["While a sniper is not firing or reloading, his adrenalin and the damage bonus go up. Adrenalin diminishes once he misses a shot.","sniper1","",""],function(param1:int):*
         {
            return Math.sqrt(param1) * 3 + 4;
         });
         setTrait("RANGER",_devRanger,999,1,"",["A ranger gains adrenalin every time he kills an enemy. When it\'s full, all the troops go rampage and his adrenalin diminishes.","","x","% more rampage duration"],function(param1:int):*
         {
            return 7 + Math.sqrt(param1) * 5;
         });
         setTrait("DUELIST",_devDuelist,999,1,"",["When a Duelist shoots an enemy, her adrenalin and the damage bonus go up. Adrenalin diminishes quickly when not firing.","duelist1","",""],function(param1:int):*
         {
            return 7;
         });
         setTrait("NOBLE",_devNoble,999,1,"",["A noble gains 40% more exp from killing enemies. Also rewarded slight bonuses to damage and accuracy per level.","","x","% more damage and accuracy"],function(param1:int):*
         {
            return 5 + param1 / 2 + Math.sqrt(param1) * 2;
         });
         setTrait("GUARDIAN",_devGuard,999,1,"",["When an enemy attacks the castle, a guardian can inflict certain damage back to the enemy.","","x"," damage to the attacker"],function(param1:int):*
         {
            return 4 + int(param1 / 2);
         });
         setTrait("COOL",G_GEN,999,1,"",["Makes you calm and recover quicikly from gun recoil. For NPCs, it directly increases accuracy.","","x","% faster recovery"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 11;
         });
         setTrait("ACCURACY",G_GEN,999,1,"",["Decreases the bullet spread, making it fly to just where you aim at.","","x","% less bullet spread"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 10;
         });
         setTrait("CAPABLE",G_GEN,2,1,"",["You will be able to see more skill options when leveling up.","+","x"," option(s) availabe when leveled"],function(param1:int):*
         {
            return param1;
         });
         setTrait("SMALL_GUN",G_GEN,999,2,"",["The skill is required to handle small weapons such as pistols and sub machine gun.","You can equip Lv.","x"," small guns"],function(param1:int):*
         {
            return param1;
         });
         setTrait("RIFLE",G_GEN,999,2,"",["The skill is required to handle rifles such as assault rifles and sniper rifles.","You can equip Lv.","x"," rifles"],function(param1:int):*
         {
            return param1;
         });
         setTrait("SHOTGUN",G_GEN,999,2,"",["The skill is required to handle shotguns.","You can equip Lv.","x"," shotguns"],function(param1:int):*
         {
            return param1;
         });
         setTrait("BIG_GUN",G_GEN,999,2,"",["The skill is required to handle big guns such as Rockets and Flame throwers.","You can equip Lv.","x"," big guns"],function(param1:int):*
         {
            return param1;
         });
         setTrait("RELOADING",G_GEN,999,1,"",["Reloading! Faster reloading is all you need!","","x","% faster reloading"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 10;
         });
         setTrait("LUCK",G_GEN,10,1,"",["Increases the chance that the killed enemy drops gold pieces. When stacked on the rogue\'s critical kill bonus, she gets double the money.","","x","% more chance"],function(param1:int):*
         {
            return param1 * 2 + Math.sqrt(param1) * 12;
         });
         setTrait("SCAVENGER",G_GEN,10,1,"",["Enemies killed by your troops drop items more often with the skill.","","x","% extra chance of item drop"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 8;
         });
         setTrait("DR_HOLLIDAY",G_GEN,5,1,"",["When equipped with a shotgun, each level of the skill increases the number of shells shot but decreases accuracy.","+","y"," shot(s) fired"],function(param1:int):*
         {
            return param1 * 7 + 3;
         });
         setTrait("SENSE",G_GEN,10,1,"",["It gives you a small chance of critical shot even when you don\'t hit the enemy\'s weak spot.","","x","% chance of critical hit"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 6;
         });
         setTrait("THREAT",G_GEN,10,1,"",["Threaten the enemies to reduce their speed.","Enemies move ","x","% slower"],function(param1:int):*
         {
            return param1 * 2 + 1;
         });
         setTrait("DEFENDER",G_GEN,10,1,"",["Occasionally, you will be able to completely nullify the damage done to the castle. ","","x","% nullify chance"],function(param1:int):*
         {
            return param1 * 2 + 3;
         });
         setTrait("ONE_HIT_KILL",G_GEN,10,1,"",["When equipped with a sniper rifle, you can sometimes kill an enemy in 1 shot no matter how much HP it has. Doesn\'t work on bosses though.","","x","% chance of 1 hit kill"],function(param1:int):*
         {
            return param1 * 3 + 2;
         });
         setTrait("AIMED_SHOT",G_GEN,10,1,"",["Each level invested in the skill increases the damage but decreases fire rate.","","x","% more damage"],function(param1:int):*
         {
            return param1 * 7;
         });
         setTrait("LEADERSHIP",G_GEN,10,1,"",["Leadership raises the morale of the team, making your troops aim faster.","","x","% faster aiming"],function(param1:int):*
         {
            return param1 * 5 + 2;
         });
         setTrait("NEGOTIATOR",G_GEN,10,1,"",["Enables you to negotiate a better reward price.","","x","% better reward"],function(param1:int):*
         {
            return param1 * 4 + 5;
         });
         setTrait("INSURANCE",G_GEN,10,1,"",["You receive the insurance EVERY TIME an enemy hits the castle!","You get ","x"," gp"],function(param1:int):*
         {
            return 1 + param1;
         });
         setTrait("KILLER",G_GEN,10,1,"",["You are a real killer. When you score a critical kill, your shot cooldown is greatly reduced.","","x","% cooldown reduction"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 20;
         });
         setTrait("ENGINEER",G_GEN,10,1,"",["You know how to build a good gun. When adding a modification to a gun, the effect increases.","","x","% bonus to the effect"],function(param1:int):*
         {
            return 2 + param1 * 5;
         });
         setTrait("FURY",G_GEN,10,1,"",["Everyone should just make sure not to piss you off. Your rampage duration lasts longer than normal. Stacks on the ranger\'s bonus.","","x","% more rampage duration"],function(param1:int):*
         {
            return param1 + Math.sqrt(param1) * 12;
         });
         setTrait("ROBBER",G_GEN,10,1,"",["You can slaugher more people and get more money in the museum!","+","x"," more people killed"],function(param1:int):*
         {
            return param1 * 7;
         });
         setTrait("ACTIVE",G_GEN,10,1,"",["You become a hyperactive person. You get a small chance of gaining extra AP after each battle.","+","x"," AP (random)"],function(param1:int):*
         {
            return param1;
         });
         setTrait("BREEDER",G_GEN,10,1,"",["You know how to encourage the egg production of chickens. Your lovely chickens will give you more eggs!","","x","% more eggs"],function(param1:int):*
         {
            return param1 * 6 + 3;
         });
         setTrait("TAUNT",G_GEN,5,1,"",["Taunting enemies makes them angry and stronger. But it will increase the mission reward money somehow.","","x","% more reward"],function(param1:int):*
         {
            return param1 * 10 + 10;
         });
         setTrait("COOK",G_GEN,5,1,"",["Increases the benefit of having dinner. In short, you get more exp after dinner.","+","x"," base exp bonus"],function(param1:int):*
         {
            return param1 * 5 + 2;
         });
         setTrait("ACCOUNTANT",G_GEN,10,1,"",["Think the wages you pay are too much? Have an accountant and hold down the wages!","-","x","% cheaper wages"],function(param1:int):*
         {
            return param1 * 4 + 3;
         });
         setTrait("BOW_MASTER",G_GEN,10,1,"",["You\'ve mastered the art of the bow. Your arrows and bolts penetrate through enemies.","+","x"," penetrations"],function(param1:int):*
         {
            return param1;
         });
         setTrait("CRIPPLE_SHOT",G_GEN,10,1,"",["Slows down the shot enemy so you can dish it anyway you want.","","x","% slow down per hit"],function(param1:int):*
         {
            return 2 + param1 * 3;
         });
         setTrait("DISARM",G_GEN,10,1,"",["Lowers the damage dealt by the shot enemy. Very effective against tough creatures.","","x","% reduced damage"],function(param1:int):*
         {
            return param1 * 20;
         });
         setTrait("ANTI_AIR",G_GEN,10,1,"",["You know weak spots of air creatures.","","x","% more damage vs Air"],function(param1:int):*
         {
            return 2 + param1 * 7;
         });
         setTrait("ANTI_ARMOR",G_GEN,10,1,"",["You know weak spots of armored creatures.","","x","% more damage vs Armor"],function(param1:int):*
         {
            return 2 + param1 * 7;
         });
         setTrait("DA_BOMB",G_GEN,10,1,"",["Explosive weapons such as rockets, grenades, flame thrower and gravity gun have an additional explode radius.","","x","% extra radius"],function(param1:int):*
         {
            return 3 + param1 * 3;
         });
         setTrait("LAST_HOPE",G_GEN,10,1,"",["When the castle is attacked while the wall is heavily damaged, you get a fair chance of going rampage.","When the wall HP is less than","x","%"],function(param1:int):*
         {
            return 15 + param1 * 4;
         });
         setTrait("BURST",G_GEN,5,1,"",["When firing an automatic rifle or machine gun, bullets don\'t spread and do 25% more damage for a certain period.","Applied to first ","x"," shots"],function(param1:int):*
         {
            return int(1 + param1);
         });
         setTrait("ONE_SHOT",G_GEN,10,1,"",["When equipped with a pistol or a sniper rifle, the last bullet of the magazine will deal massive damage.","","x","% increased damage"],function(param1:int):*
         {
            return 300 + param1 * 70;
         });
         setTrait("QUICK_EYED",G_GEN,10,1,"",["The feat increases the chance you get good events while searching in the town.","","x","% more good events"],function(param1:int):*
         {
            return 5 + param1 * 10;
         });
         setTrait("LOVE",G_GEN,10,1,"",["With the feat, you are awarded compensation every time you explode your little sister!","","x"," gold per sister"],function(param1:int):*
         {
            return 5 + param1 * 5;
         });
         setTrait("SUPPLIER",G_GEN,10,1,"",["You are a respected supplier. Recharge time of all usable items are reduced.","","x","% faster recharge"],function(param1:int):*
         {
            return param1 * 20;
         });
         setTrait("POWER_SHOT",G_GEN,10,1,"",["When equipped with a non-autofire gun, you sometimes do 1.5x damage. Never ask why!","","x","% chance"],function(param1:int):*
         {
            return param1 * 10;
         });
         setTrait("BASE_AIMING",G_BASE,999,999,"",["Indicates how fast he can aim at his target. Base skills can\'t be focused. He will gradually develop them depending on his potential.","Aiming Speed +","x",""],function(param1:int):*
         {
            return param1;
         });
         setTrait("BASE_TEAMWORK",G_BASE,999,999,"",["Indicates his workrate. Base skills can\'t be focused. He will gradually develop them depending on his potential.","Work Rate +","x",""],function(param1:int):*
         {
            return param1;
         });
         devGroup[_devHunter] = ["RIFLE","SMALL_GUN","SHOTGUN","COOL","ACCURACY","RELOADING","CAPABLE","POWER_SHOT","SCAVENGER","AIMED_SHOT","ENGINEER","BREEDER","COOK","BOW_MASTER","CRIPPLE_SHOT","ANTI_AIR","BURST"];
         devGroup[_devRogue] = ["SMALL_GUN","RIFLE","COOL","ACCURACY","RELOADING","CAPABLE","POWER_SHOT","LUCK","THREAT","AIMED_SHOT","NEGOTIATOR","SENSE","KILLER","ROBBER","ACTIVE","BURST","ONE_SHOT","QUICK_EYED"];
         devGroup[_devSheriff] = ["SHOTGUN","COOL","ACCURACY","RELOADING","CAPABLE","DR_HOLLIDAY","DEFENDER","LEADERSHIP","INSURANCE","FURY","TAUNT","LAST_HOPE","CRIPPLE_SHOT","QUICK_EYED","ANTI_ARMOR"];
         devGroup[_devMilitia] = ["BIG_GUN","RIFLE","COOL","ACCURACY","RELOADING","CAPABLE","KILLER","FURY","TAUNT","CRIPPLE_SHOT","ANTI_ARMOR","DA_BOMB","BURST","LOVE","SUPPLIER"];
         devGroup[_devSniper] = ["RIFLE","COOL","ACCURACY","RELOADING","CAPABLE","POWER_SHOT","SENSE","ONE_HIT_KILL","AIMED_SHOT","KILLER","DISARM","ANTI_AIR","ONE_SHOT"];
         devGroup[_devRanger] = ["BIG_GUN","SMALL_GUN","COOL","ACCURACY","RELOADING","CAPABLE","SCAVENGER","LEADERSHIP","BREEDER","ANTI_ARMOR","DA_BOMB","LAST_HOPE","BOW_MASTER","ACTIVE","SUPPLIER"];
         devGroup[_devDuelist] = ["SMALL_GUN","COOL","ACCURACY","RELOADING","CAPABLE","POWER_SHOT","SENSE","AIMED_SHOT","NEGOTIATOR","LUCK","KILLER","ENGINEER","FURY","ONE_SHOT"];
         devGroup[_devNoble] = ["SMALL_GUN","RIFLE","SHOTGUN","BIG_GUN","COOL","ACCURACY","RELOADING","CAPABLE","LUCK","INSURANCE","ACTIVE","TAUNT","COOK","ACCOUNTANT","BOW_MASTER","BURST","ANTI_AIR","ANTI_ARMOR"];
         devGroup[_devGuard] = ["SHOTGUN","SMALL_GUN","COOL","ACCURACY","RELOADING","CAPABLE","DR_HOLLIDAY","THREAT","DEFENDER","LEADERSHIP","INSURANCE","ACCOUNTANT","DISARM","LAST_HOPE","LOVE","SUPPLIER"];
         i = 1;
         while(i < _maxDev + 1)
         {
            p = 0;
            while(p < devGroup[i].length)
            {
               if(TRAIT[devGroup[i][p]] == undefined)
               {
               }
               ++p;
            }
            ++i;
         }
         classList = [3,1,6,4,2,5,7,8];
         wexpList = [TRAIT.SMALL_GUN,TRAIT.BIG_GUN,TRAIT.RIFLE,TRAIT.SHOTGUN,-1];
         chainMode = [];
         chainSound = [];
         player = new Object();
         player.money = [200];
         player.accuracyFix = [];
         player.shooting = [];
         player.shootTimer = [];
         player.exist = [];
         player.target = [];
         player.pic = [];
         player.name = [];
         player.sex = [];
         player.lv = [];
         player.exp = [];
         player.devType = [];
         player.sp = [];
         player.kill = [];
         player.earn = [];
         player.trait = [];
         player.cost = [];
         player.nextTrait = [];
         player.ai = [];
         player.aiFunc = [];
         player.aimCount = [];
         player.aimTime = [];
         player.forcus = [];
         player.workRate = [];
         player.potentialAim = [];
         player.potentialTeam = [];
         player.accuracyDiv = [];
         player.shell = [];
         player.idleCount = [];
         player.rangeFix = [];
         player.grenadeCount = [];
         player.frenzy = [];
         player.rampage = [];
         player.chain = [];
         player.trained = [];
         player.burst = [];
         player.wexpRef = [];
         player.wexp = [];
         player.optBoss = [];
         player.optWall = [];
         player.onMark = [];
         i = 0;
         while(i < maxChara)
         {
            player.optBoss[i] = false;
            player.optWall[i] = false;
            player.exist[i] = false;
            player.pic[i] = 0 + int(Math.random() * _maxPic);
            player.target[i] = maxEnemy;
            player.trait[i] = [];
            ++i;
         }
         generatePlayer(0,1,-1);
         mission = new Object();
         mission.time = 0;
         mission.endTime = 1000;
         mission.level = 1;
         mission.spawnRate = 20;
         mission.spawnInterval = 220;
         mission.spawnDuration = 120;
         initEnemy();
         initButton();
         dialog_mc = new dialog();
         i = 0;
         while(i < 5)
         {
            inventory_mc[i] = new itemPicture() as MovieClip;
            if(inventory.num[_invPlayer + i] < 1)
            {
               inventory_mc[i].visible = false;
            }
            inventory_mc[i].x = 25 + i * 90;
            inventory_mc[i].y = 343;
            inventory_mc[i].gotoAndStop(inventory.graphic[_invPlayer + i]);
            inventory_mc[i].filters = [filterDrop];
            inventory_mc[i].name = "invmc" + i;
            inventory_mc[i].visible = false;
            addChild(inventory_mc[i]);
            ++i;
         }
         gotoAndPlay("title");
      }
      
      public function carryOver() : *
      {
         var _loc1_:* = undefined;
         sound_click1.play();
         gameOver = false;
         gamePaused = false;
         exitBattle();
         if(amb != null)
         {
            amb.stop();
         }
         stage.focus = stage;
         gameContinued = true;
         _loc1_ = player.money[_pc] - mission.resultBefore;
         if(_loc1_ < 200)
         {
            _loc1_ = 200;
         }
         loadGame();
         player.money[_pc] += _loc1_;
         game.carryOver = true;
         ++game.ap;
         removeChild(gameoverLogo);
         gotoAndStop("town");
      }
      
      public function KeyDown_town(param1:KeyboardEvent) : *
      {
         if(gamePaused)
         {
            return;
         }
         if(debug)
         {
            game.ap += 10;
         }
      }
      
      public function kongSubmit(param1:*, param2:*, param3:*, param4:*) : *
      {
         var _loc5_:* = [param2,param3,param4];
         if(_loc5_[1] < _loc5_[2])
         {
            _loc5_[1] = _loc5_[2];
         }
         if(_loc5_[0] < _loc5_[1])
         {
            _loc5_[0] = _loc5_[1];
         }
         kongAPI.stats.submit(param1 + "OnCasual",_loc5_[0]);
         kongAPI.stats.submit(param1,_loc5_[1]);
         kongAPI.stats.submit(param1 + "OnHardcore",_loc5_[2]);
      }
      
      public function newTitle(param1:*) : *
      {
         if(game.day <= 5)
         {
            game.title = 0;
            game.titleMoney = 0;
            return false;
         }
         if(game.title < 1 && game.day > 5)
         {
            if(param1 == 1)
            {
               game.title = 1;
               game.titleMoney = 100;
            }
            return true;
         }
         if(game.title < 2 && game.day > 10)
         {
            if(param1 == 1)
            {
               game.title = 2;
               game.titleMoney = 200;
            }
            return true;
         }
         if(game.title < 3 && game.day > 15)
         {
            if(param1 == 1)
            {
               game.title = 3;
               game.titleMoney = 400;
            }
            return true;
         }
         if(game.title < 4 && game.day > 25)
         {
            if(param1 == 1)
            {
               game.title = 4;
               game.titleMoney = 700;
            }
            return true;
         }
         if(game.title < 5 && game.day > 40)
         {
            if(param1 == 1)
            {
               game.title = 5;
               game.titleMoney = 1000;
            }
            return true;
         }
         if(game.title < 6 && game.day > 60)
         {
            if(param1 == 1)
            {
               game.title = 6;
               game.titleMoney = 1500;
            }
            return true;
         }
         if(game.title < 7 && game.day > 80)
         {
            if(param1 == 1)
            {
               game.title = 7;
               game.titleMoney = 2000;
            }
            return true;
         }
         if(game.title < 8 && game.day > 100)
         {
            if(param1 == 1)
            {
               game.title = 8;
               game.titleMoney = 3000;
            }
            return true;
         }
         return false;
      }
      
      public function kongregateStatsIdx() : *
      {
         saveIndex();
         if(kongregate == 0 || Boolean(kongregateEmu))
         {
            return;
         }
         kongAPI.stats.submit("MedalsEarned",medalNum());
         kongSubmit("MostDaysSurvived",idx.dayCasual,idx.day,idx.dayHC);
      }
      
      internal function frame3() : *
      {
         if(skipLoader)
         {
            stop();
            gotoAndStop("init");
            return;
         }
         if(armor)
         {
            gotoAndStop("logo2");
            return;
         }
         if(toBlackScreen)
         {
            gotoAndStop("black");
            return;
         }
         gotoAndStop("logo");
      }
      
      internal function frame9() : *
      {
         stage.addEventListener(Event.ENTER_FRAME,EnterFrame_logo);
         stage.addEventListener(MouseEvent.MOUSE_DOWN,MouseLDown_logo);
      }
      
      public function openHelp() : *
      {
         if(gameStage != _stageTitle)
         {
            window_mc.saveGameButton.mouseEnabled = false;
            window_mc.helpButton.mouseEnabled = false;
            window_mc.returnTitleButton.mouseEnabled = false;
         }
         else
         {
            elonaButton.mouseEnabled = false;
         }
         blurMcHelp = makeBlurScreen();
         sound_scroll1.play();
         helpMode = 4;
         window4_mc.visible = false;
         window4_mc.animeTime = 16;
         window4_mc.x = 600;
         window4_mc.y = -20;
         window4_mc.addEventListener(Event.ENTER_FRAME,onEnterFrame_help);
         window4_mc.gotoAndStop("help4");
         window4_mc.addFrameScript(window4_mc.currentFrame - 1,insertHelp);
         window4_mc.closeButton.visible = false;
         stage.addChild(window4_mc);
      }
      
      public function calcMuseum() : *
      {
         return 50 + int(medalNum() * 6 * museumFix());
      }
      
      public function select_proc() : *
      {
         select = -1;
         i = 0;
         while(i < selectID)
         {
            if(buttonArray[i].hitTestPoint(mouseX,mouseY,true))
            {
               buttonArray[i].filters = filter2;
               select = i;
            }
            else
            {
               buttonArray[i].filters = filter1;
            }
            ++i;
         }
      }
      
      public function sortChara() : *
      {
         var _loc1_:int = 0;
         var _loc2_:* = 0;
         while(_loc2_ < maxAlly - 1)
         {
            _loc1_ = _loc2_ + 1;
            if(player.exist[_loc2_] == false && player.exist[_loc1_] == true)
            {
               swapChara(_loc2_,_loc1_);
            }
            _loc2_++;
         }
      }
      
      public function getWeaponInfo(param1:int) : *
      {
         var _loc2_:* = [sound_gun1,10,24,10];
         if(param1 == 1)
         {
            _loc2_ = [sound_gun6,10,24,10,1,3 * 30,4];
         }
         if(param1 == 2)
         {
            _loc2_ = [sound_gun2,10,24,10,5,5,1];
         }
         if(param1 == 3)
         {
            _loc2_ = [sound_gun3,95,109,95];
         }
         if(param1 == 4)
         {
            _loc2_ = [sound_gun4,95,109,95];
         }
         if(param1 == 5)
         {
            _loc2_ = [sound_gun7,120,134,120];
         }
         if(param1 == 13)
         {
            _loc2_ = [sound_gun5,120,134,120];
         }
         if(param1 == 14 || param1 == 15)
         {
            _loc2_ = [sound_gun1,10,24,10];
         }
         if(param1 == 16)
         {
            _loc2_ = [sound_gun2,145,159,145];
         }
         if(param1 == 17)
         {
            _loc2_ = [sound_gun8,120,134,120];
         }
         if(param1 == 18)
         {
            _loc2_ = [sound_gun9,10,24,10];
         }
         if(param1 == 19)
         {
            _loc2_ = [sound_gun10,95,109,95];
         }
         if(param1 == 20)
         {
            _loc2_ = [sound_gun12,95,109,95];
         }
         if(param1 == 21)
         {
            _loc2_ = [sound_gun11,170,184,184];
         }
         if(param1 == 22)
         {
            _loc2_ = [sound_gun13,170,184,184];
         }
         if(param1 == 23)
         {
            _loc2_ = [sound_gun14,70,84,86];
         }
         if(param1 == 24)
         {
            _loc2_ = [sound_gun15,70,84,86];
         }
         if(param1 == 25)
         {
            _loc2_ = [sound_gun15,70,84,86];
         }
         if(param1 == 26)
         {
            _loc2_ = [sound_gun14,70,84,86];
         }
         if(param1 == 27)
         {
            _loc2_ = [sound_fireball,70,84,86];
         }
         if(param1 == 36)
         {
            _loc2_ = [sound_gun1,120,134,120];
         }
         if(param1 == 40)
         {
            _loc2_ = [sound_rampageEnemy,70,84,86];
         }
         return _loc2_;
      }
      
      public function text_effect(param1:String) : *
      {
         var _loc2_:* = undefined;
         _loc2_ = new textEffect() as MovieClip;
         _loc2_.x = -180;
         _loc2_.y = 320;
         _loc2_.wait = "textEff" + textCount;
         ++textCount;
         _loc2_.name = "textEff" + textCount;
         _loc2_.msg.msg.text = param1;
         stage.addChild(_loc2_);
      }
      
      public function deleteChara(param1:int) : *
      {
         player.exist[param1] = false;
         sortChara();
      }
      
      public function getFreeAlly() : *
      {
         var _loc1_:* = 0;
         while(_loc1_ < maxAlly)
         {
            if(player.exist[_loc1_] == false)
            {
               return _loc1_;
            }
            _loc1_++;
         }
         return -1;
      }
      
      public function gameMedalBonus() : *
      {
         if(medal[_medalClass1])
         {
            idx.unlocked[5] = true;
         }
         if(medal[_medalClass2])
         {
            idx.unlocked[6] = true;
         }
         if(medal[_medalClass3])
         {
            idx.unlocked[7] = true;
         }
         if(medal[_medalClass4])
         {
            idx.unlocked[4] = true;
         }
      }
      
      public function updateSaveSlot() : *
      {
         var _loc1_:* = undefined;
         saveBox.visible = true;
         saveBox.enabled = true;
         saveBox.removeAll();
         i = 0;
         while(i < maxSave)
         {
            _loc1_ = SharedObject.getLocal("elonas" + i);
            if(_loc1_.data.deleted == true || idx.saveName[i] == undefined)
            {
               idx.saveName[i] = _strEmptySave;
            }
            saveBox.addItem({
               "data":i,
               "label":"" + idx.saveName[i]
            });
            ++i;
         }
         saveBox.selectedItem = saveBox.getItemAt(idx.slot);
      }
      
      public function updateCharaMenu() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:int = 0;
         var _loc5_:* = undefined;
         stage.focus = stage;
         removeStats();
         _loc1_ = getClass(player.devType[cs]);
         window2_mc.classText.text = _loc1_[0];
         statsCount = 0;
         _loc2_ = [];
         _loc3_ = 0;
         _loc4_ = 0;
         while(_loc4_ < _maxTrait)
         {
            if(player.trait[cs][_loc4_] != 0)
            {
               if(!(cs == _pc && player.ai[cs] == _aiHero && (_loc4_ == TRAIT.BASE_AIMING || _loc4_ == TRAIT.BASE_TEAMWORK)))
               {
                  _loc3_ = 50000 - _loc4_;
                  if(PARTY[ID[_loc4_]] != undefined)
                  {
                     _loc3_ = 10000 + _loc4_;
                  }
                  if(traitRef[_loc4_].group == G_BASE)
                  {
                     _loc3_ = 70000 + _loc4_;
                  }
                  if(_loc4_ < G_GEN)
                  {
                     _loc3_ = 100000 + _loc4_;
                  }
                  _loc2_[_loc2_.length] = {
                     "id":_loc4_,
                     "sort":_loc3_
                  };
               }
            }
            _loc4_++;
         }
         _loc2_.sortOn("sort",Array.NUMERIC | Array.DESCENDING);
         _loc5_ = 0;
         while(_loc5_ < _loc2_.length)
         {
            _loc4_ = int(_loc2_[_loc5_].id);
            _loc3_ = statsCount;
            _loc1_ = REF[ID[_loc4_]](cs);
            stats_mc[_loc3_] = new trait() as MovieClip;
            stats_mc[_loc3_].x = 150 + int(_loc3_ / 6) * 130;
            stats_mc[_loc3_].y = 232 + _loc3_ % 6 * 18;
            stats_mc[_loc3_].traitName.text = _loc1_[0];
            stats_mc[_loc3_].hintTxt = _loc1_;
            stats_mc[_loc3_].id = _loc4_;
            if(player.forcus[cs] == _loc4_)
            {
               window2_mc.fo.x = stats_mc[_loc3_].x - 22;
               window2_mc.fo.y = stats_mc[_loc3_].y + 2;
            }
            if(traitRef[stats_mc[_loc3_].id].group == G_BASE || stats_mc[_loc3_].id < G_GEN)
            {
               Tweener.addTween(stats_mc[_loc3_].traitName,{
                  "time":0,
                  "_color":278544
               });
               stats_mc[_loc3_].icon.gotoAndStop(2);
            }
            else if(PARTY[ID[_loc4_]] != undefined)
            {
               stats_mc[_loc3_].icon.gotoAndStop(3);
            }
            else
            {
               stats_mc[_loc3_].icon.gotoAndStop(1);
            }
            window2_mc.addChild(stats_mc[_loc3_]);
            ++statsCount;
            _loc5_++;
         }
         window2_mc.costText.visible = false;
         window2_mc.order.visible = true;
         window2_mc.order.removeAll();
         if(cs == _pc)
         {
            window2_mc.order.addItem({
               "data":_aiHero,
               "label":"Hero Mode"
            });
         }
         window2_mc.order.addItem({
            "data":_aiNormal,
            "label":"Attack mobs in weapon range"
         });
         window2_mc.order.addItem({
            "data":_aiNoAir,
            "label":"  +don\'t attack air mobs"
         });
         window2_mc.order.addItem({
            "data":_aiNoArmor,
            "label":"  +don\'t attack armored mobs"
         });
         window2_mc.order.addItem({
            "data":_aiNeither,
            "label":"  +don\'t attack either"
         });
         window2_mc.order.addItem({
            "data":_aiAir,
            "label":"Attack air mobs"
         });
         window2_mc.order.addItem({
            "data":_aiArmor,
            "label":"Attack armored mobs"
         });
         window2_mc.order.addItem({
            "data":_aiFireAtWill,
            "label":"Always fire at will"
         });
         _loc4_ = 0;
         while(_loc4_ < _aiFireAtWill + 1 + _if(cs == _pc))
         {
            if(player.ai[cs] == window2_mc.order.getItemAt(_loc4_).data)
            {
               window2_mc.order.selectedItem = window2_mc.order.getItemAt(_loc4_);
            }
            _loc4_++;
         }
         window2_mc.order.dropdownWidth = 190;
         window2_mc.order.rowCount = 7;
         window2_mc.order.addEventListener(Event.OPEN,orderOpen);
         window2_mc.order.addEventListener(Event.CLOSE,orderClose);
         window2_mc.order.addEventListener(Event.CHANGE,orderClick);
         window2_mc.order.addEventListener(ListEvent.ITEM_ROLL_OVER,orderRollOver);
         window2_mc.fo.visible = false;
         window2_mc.optBoss.visible = false;
         window2_mc.optWall.visible = false;
         window2_mc.optBoss.label = "Boss";
         window2_mc.optWall.label = "Defend";
         window2_mc.optBoss.selected = player.optBoss[cs];
         window2_mc.optWall.selected = player.optWall[cs];
         window2_mc.optHint.visible = false;
         defHint = "\nClick \"Recruit\" to hire this person.";
         if(cs != maxAlly)
         {
            if(player.forcus[cs] != -1)
            {
               window2_mc.fo.visible = true;
            }
            if(cs == _pc)
            {
               defHint = "Click a skill to set it as a focused skill.\nIt will appear on the list more frequently when leveling.";
            }
            else
            {
               defHint = "Click a skill to set it as a focused skill.\nYour ally will likely gain the skill when leveling.";
            }
         }
         if(cs == _pc)
         {
            window2_mc.dismissText.visible = false;
            window2_mc.dismissButton.visible = false;
            if(player.ai[_pc] != _aiHero)
            {
               window2_mc.optBoss.visible = true;
               window2_mc.optWall.visible = true;
               window2_mc.optHint.visible = true;
            }
         }
         else
         {
            if(cs == maxAlly)
            {
               window2_mc.costText.visible = true;
               window2_mc.costText.text = "" + player.cost[cs];
               if(player.cost[cs] > player.money[_pc])
               {
                  window2_mc.costText.textColor = 13369344;
               }
               else
               {
                  window2_mc.costText.textColor = 204;
               }
               window2_mc.orderText.text = "COST.";
               window2_mc.dismissText.text = "RECRUIT";
               window2_mc.order.visible = false;
            }
            else
            {
               window2_mc.orderText.text = "ORDER.";
               window2_mc.dismissText.text = "DISMISS";
               window2_mc.optBoss.visible = true;
               window2_mc.optWall.visible = true;
               window2_mc.optHint.visible = true;
               window2_mc.order.enabled = true;
            }
            window2_mc.dismissText.visible = true;
            window2_mc.dismissButton.visible = true;
         }
         window2_mc.killText.text = player.kill[cs];
         window2_mc.earnText.text = player.earn[cs];
         if(window2_mc.optHint.visible == false)
         {
            window2_mc.optHint.hintTxt = undefined;
         }
         else
         {
            window2_mc.optHint.hintTxt = ["Options","When \"Boss\" is checked, the character will go for the boss when a boss appears.\nWhen \"Defend\" is checked, the character will go for the enemies attacking your wall.","","",""];
         }
         if(cs == _pc)
         {
            window2_mc.wageText.text = titleList[game.title];
            window2_mc.wage.visible = false;
            window2_mc.titleText.visible = true;
         }
         else
         {
            window2_mc.wage.visible = true;
            window2_mc.titleText.visible = false;
            if(wage(cs) == 0)
            {
               window2_mc.wageText.text = "Free";
            }
            else
            {
               window2_mc.wageText.text = "" + wage(cs) + " GP";
            }
         }
      }
      
      public function medalNum() : *
      {
         var _loc2_:int = 0;
         var _loc1_:int = 0;
         _loc2_ = 0;
         while(_loc2_ < _maxMedal)
         {
            if(medal[_loc2_] > 0)
            {
               _loc1_++;
            }
            _loc2_++;
         }
         return _loc1_;
      }
      
      public function getItemDetail(param1:int) : *
      {
         var _loc2_:* = inventory.id[param1];
         var _loc3_:String = "";
         if(_loc2_ == 6)
         {
            _loc3_ = "Fur skinned from a dead animal. You can sell it for money.";
         }
         if(_loc2_ == 7)
         {
            _loc3_ = "An armor looted from a dead soldier. You can sell it for some money.";
         }
         if(_loc2_ >= 8 && _loc2_ <= 10 || _loc2_ == 121)
         {
            _loc3_ = "A modification device that can be mounted on a weapon. " + encRef[inventory.mod[param1]].detail;
         }
         if(_loc2_ == 11)
         {
            _loc3_ = "[Usable] When thrown to the ground, it exlodes and deals " + inventory.attack[param1] + " damage to all enemies surrounding it.";
         }
         if(_loc2_ == 12)
         {
            _loc3_ = "[Usable] Repairs " + calcRepair(param1) + " points of castle HP when used. It\'s a life saver but has long recharge time.";
         }
         if(_loc2_ == 28)
         {
            _loc3_ = "Yummy rat roast. You can sell it for money.";
         }
         if(_loc2_ == 29)
         {
            _loc3_ = "A helmet looted from a dead soldier. You can sell it for some money.";
         }
         if(_loc2_ == 30)
         {
            _loc3_ = "A beautiful feather of some bird. You can sell it for some money.";
         }
         if(_loc2_ == 31)
         {
            _loc3_ = "A piece of meat of some animal or whatever. You can sell it for some money.";
         }
         if(_loc2_ == 32)
         {
            _loc3_ = "Taken from a destroyed machine. Contains some rare metals. You can sell it for some money.";
         }
         if(_loc2_ == 33)
         {
            _loc3_ = "A bottle of insect blood. You can sell it for some money.";
         }
         if(_loc2_ == 34)
         {
            _loc3_ = "Carefully taken from a dead dragon. You can sell it for some money.";
         }
         if(_loc2_ == 35)
         {
            _loc3_ = "A special token. When dragged onto a shop item, the item get discounted by " + inventory.attack[param1] + " gp. Use it wisely!";
         }
         if(_loc2_ == 37)
         {
            _loc3_ = "[Usable] A special artifact of Jure, Goddess of Healing. Her blessing protects your castle from enemies for a short period.";
         }
         if(_loc2_ == 38)
         {
            _loc3_ = "[Usable] A special artifact. The ancient sword is called Ragnarok for a reason.";
         }
         if(_loc2_ == 101)
         {
            _loc3_ = "\"These guy\'s do two thing\'s well, feasting on food bought with their hard earned gold... And earning their gold.\"";
         }
         if(_loc2_ == 102)
         {
            _loc3_ = "\"One day these guy\'s just showed up shooting... That make\'s them party crashers and they must be treated accordingly!\"";
         }
         if(_loc2_ == 103)
         {
            _loc3_ = "\"Something seems to have scared the sheep all in your direction, they are not damaging \"Your castle\" intentionally but... You don\'t care you kill them anyway.\"";
         }
         if(_loc2_ == 104)
         {
            _loc3_ = "\"One night you saw one trip on a rock and then blow up... Now there\'s a whole army of them!\"";
         }
         if(_loc2_ == 105)
         {
            _loc3_ = "\"Unfortunately you do not carry insurance against damage from these weapons, also unfortunate is the fact that during your recent tax audit they were mistaken as yours and your taxes have been raised accordingly.\"";
         }
         if(_loc2_ == 106)
         {
            _loc3_ = "\"They eat Dragonflies, Dragonflies have taken up residence in your castle...\"";
         }
         if(_loc2_ == 107)
         {
            _loc3_ = "\"Apparently the rat\'s came over in ships... From the stench you can guess why they left.\"";
         }
         if(_loc2_ == 108)
         {
            _loc3_ = "\"Oddly enough these zealots just showed up and attacked you, you just assume they want to meet their maker sooner.\"";
         }
         if(_loc2_ == 109)
         {
            _loc3_ = "\"An underground spider known to like peace and quiet, how sad for it because you produce neither.\"";
         }
         if(_loc2_ == 110)
         {
            _loc3_ = "\"These insects are in brooding season and are looking for a place to nest... Apparently they\'ve taken a liking to your younger sister.\"";
         }
         if(_loc2_ == 112)
         {
            _loc3_ = "\"You don\'t know where these came from but by the look\'s of them it\'s probably safe to say you\'ve ticked off Mani of Machine.\"";
         }
         if(_loc2_ == 113)
         {
            _loc3_ = "\"Some guy from Vernis showed up the other night and killed a Bard...\"";
         }
         if(_loc2_ == 114)
         {
            _loc3_ = "\"Well with as much killing as you have been doing lately Someone was bound to hold a grudge.\"";
         }
         if(_loc2_ == 115)
         {
            _loc3_ = "\"Some guy from Vernis showed up the other night and killed a Bard...\"";
         }
         if(_loc2_ == 116)
         {
            _loc3_ = "\"Apparently this is just a Juere prototype related to a bigger project, the fact that it\'s causing you nuisance is purely coincidental.\"";
         }
         if(_loc2_ == 117)
         {
            _loc3_ = "\"These monster\'s chew through anything. Seems they\'ve eaten everything on the way and the castle food supplies are kinda low...\"";
         }
         return _loc3_;
      }
      
      public function levelUp(param1:int, param2:Boolean) : *
      {
         var _loc3_:MovieClip = null;
         player.exp[param1] %= 1000;
         ++player.lv[param1];
         ++player.sp[param1];
         player.trait[param1][player.devType[param1]] = player.lv[param1];
         if(Math.random() < player.potentialAim[param1])
         {
            ++player.trait[param1][TRAIT.BASE_AIMING];
         }
         if(Math.random() < player.potentialTeam[param1])
         {
            ++player.trait[param1][TRAIT.BASE_TEAMWORK];
         }
         if(param2)
         {
            news += player.name[param1] + " " + _is(param1) + " now level " + player.lv[param1] + "!\n";
            sound_complete.play(0,0,trans[param1]);
            _loc3_ = new effect2();
            _loc3_.x = player_mc[param1].x;
            _loc3_.y = player_mc[param1].y;
            _loc3_.gotoAndPlay("lvup");
            stage.addChild(_loc3_);
         }
         if(param1 == _pc)
         {
            kongregateStats();
         }
      }
      
      public function getMedal(param1:int) : *
      {
         if(medal[param1] == true)
         {
            return;
         }
         var _loc2_:* = getMedalInfo(param1);
         if(_loc2_[0] == "null")
         {
            return;
         }
         medal[param1] = true;
         sound_medal.play();
         popInfo("You\'ve been awarded <" + _loc2_[0] + "> Medal!");
         kongregateStatsIdx();
      }
      
      public function showEventDialog(param1:*) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         var _loc6_:String = null;
         var _loc7_:* = undefined;
         var _loc8_:* = undefined;
         var _loc9_:* = undefined;
         var _loc10_:* = undefined;
         var _loc11_:String = null;
         if(param1 == _dialogNewRecruit)
         {
            if(game.ap < 2)
            {
               noAp();
               return;
            }
            sound_good.play();
            game.ap -= 2;
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(7);
            _loc2_.title.text = "New Recruit!";
            _loc2_.text.text = "As you review the list of recruits with no real prospects, one of the guards says, \"Some traveler just arrived at the inn...looks quite capable in my opinion.\" Finally, a new recruit!";
            exitMenu();
            generateRecruit();
            sound_scroll1.play();
            menuId = 3;
            window2_mc.gotoAndPlay("menu_chara");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procCharaMenu);
         }
         if(param1 == _dialogFreeRepair)
         {
            if(game.castleHP == game.castleMHP)
            {
               sound_beep.play();
               popInfo("The castle is not damaged!");
               return;
            }
            if(game.ap < 2)
            {
               noAp();
               return;
            }
            sound_repair1.play();
            game.ap -= 2;
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(2);
            _loc2_.title.text = "Free Repair!";
            _loc2_.text.text = "Citizens acknowledge your hard work and decided to rebuild the castle walls for free!";
            game.castleHP = game.castleMHP;
            removeUpgrades();
            updateCastleMenu();
            updateInterface();
         }
         if(param1 == _dialogActSearch)
         {
            if(game.ap < 1)
            {
               noAp();
               return;
            }
            --game.ap;
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(13);
            search(_loc2_);
         }
         if(param1 == _dialogActParty)
         {
            if(game.ap < 3)
            {
               noAp();
               return;
            }
            game.ap -= 3;
            ++game.partyCount;
            game.partyHeld = true;
            sound_party.play();
            _loc2_ = new eventWindow();
            mission.dmgFix += calcParty() / 100;
            _loc2_.card.gotoAndStop(15);
            _loc2_.title.text = "Party";
            _loc2_.text.text = "You hold a party and celebrate the victory today. Everyone seems to be enjoying it! You and your troops deal " + calcParty() + "% more damage tomorrow.";
         }
         if(param1 == _dialogActPray)
         {
            if(game.ap < 2)
            {
               noAp();
               return;
            }
            game.ap -= 2;
            game.prayed = true;
            ++game.prayerCount;
            sound_pray1.play();
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(5);
            mission.absorbFix += (int(Math.random() * 15 + 5)) / 100;
            _loc2_.title.text = "Prayer";
            _loc2_.text.text = "A holy aura surrounds your castle as you say grace to your God. The castle wall will absorb " + int(mission.absorbFix * 100) + "% damage during the next battle.";
         }
         if(param1 == _dialogActClaim)
         {
            if(game.ap < 4)
            {
               noAp();
               return;
            }
            game.ap -= 4;
            sound_award.play();
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(3);
            newTitle(1);
            _loc2_.title.text = "New Title!";
            _loc2_.text.text = "Your remarkable achievements have been acknowledged and you are granted a new title, " + titleList[game.title] + "! You will receive " + game.titleMoney + " gold pieces every day as a salary.";
         }
         if(param1 == _dialogActEat)
         {
            if(game.ap < 3)
            {
               noAp();
               return;
            }
            game.ap -= 3;
            sound_eat1.play();
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(12);
            mission.expFix = 1.05 + Math.random() / 4 + PARTY.COOK / 100;
            _loc2_.title.text = "Dinner";
            _loc2_.text.text = "You and your troops enjoy a meal and some drinks with some of the soldiers. You are refreshed! You and your troops will get " + (int(mission.expFix * 100 - 100)) + "% more exp in the next battle.";
         }
         if(param1 == _dialogActEgg)
         {
            if(game.ap < 1)
            {
               noAp();
               return;
            }
            sound_gold1.play();
            --game.ap;
            game.egg = true;
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(1);
            _loc2_.title.text = "Eggs";
            _loc4_ = 2 + (int(game.chicken / 2 + int(Math.random() * game.chicken / 2) * (100 + PARTY.BREEDER) / 100));
            game.eggsCollected += _loc4_;
            _loc7_ = 1;
            if(medal[_medalChicken1])
            {
               _loc7_ += 0.05;
            }
            if(medal[_medalChicken2])
            {
               _loc7_ += 0.15;
            }
            if(medal[_medalChicken3])
            {
               _loc7_ += 0.3;
            }
            _loc8_ = _loc4_ * 12 * _loc7_;
            _loc8_ = int(_loc8_);
            _loc2_.text.text = "Your lovely chickens produced " + _loc4_ + " eggs today! You sold them and received " + _loc8_ + " gold pieces.";
            player.money[_pc] += _loc8_;
            game.totalMoney += _loc8_;
         }
         if(param1 == _dialogActTrain)
         {
            _loc3_ = 0;
            while(_loc3_ < 10)
            {
               _loc5_ = int(Math.random() * getFreeAlly());
               if(player.trained[_loc5_] >= game.spTrainer)
               {
               }
               _loc3_++;
            }
            if(player.trained[_loc5_] >= game.spTrainer)
            {
               _loc5_ = -1;
               _loc3_ = 0;
               while(_loc3_ < getFreeAlly())
               {
                  if(player.trained[_loc3_] < game.spTrainer)
                  {
                     _loc5_ = _loc3_;
                     break;
                  }
                  _loc3_++;
               }
               if(_loc5_ == -1)
               {
                  sound_beep.play();
                  popInfo("For more training, you need an upgrade.");
                  return;
               }
            }
            if(game.ap < 4)
            {
               noAp();
               return;
            }
            sound_complete.play();
            game.ap -= 4;
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(16);
            _loc9_ = listTrait(_loc5_);
            _loc4_ = _loc9_[int(Math.random() * _loc9_.length)];
            ++player.trait[_loc5_][_loc4_];
            ++player.trained[_loc5_];
            _loc10_ = REF[ID[_loc4_]](_loc5_);
            if(_loc5_ == _pc)
            {
               _loc6_ = "you gain ";
            }
            else
            {
               _loc6_ = player.name[_loc5_] + " gains ";
            }
            _loc11_ = player.name[_loc5_] + " ";
            if(player.trained[_loc5_] < game.spTrainer)
            {
               _loc11_ += "can still take the training " + (game.spTrainer - player.trained[_loc5_]) + " time(s).";
            }
            else
            {
               _loc11_ += "reached maximum training limit.";
            }
            _loc2_.title.text = "Training";
            _loc2_.text.text = "The special trainer picks " + player.name[_loc5_] + ". After hours of training, " + _loc6_ + _loc10_[0] + "! " + _loc11_;
         }
         if(param1 == _dialogActTaunt)
         {
            if(game.ap < 2)
            {
               noAp();
               return;
            }
            sound_gold1.play();
            game.ap -= 2;
            ++game.tauntCount;
            ++game.taunted;
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(14);
            _loc2_.title.text = "Taunt!";
            _loc3_ = 0.3 + Math.random() / 4;
            mission.hpFix += _loc3_;
            _loc6_ = "You taunt the enemies outside the castle. They will have " + int(_loc3_ * 100) + "% more HP tomorrow.";
            _loc4_ = mission.reward;
            mission.reward = int(mission.reward * (100 + PARTY.TAUNT / game.taunted) / 100);
            _loc2_.text.text = _loc6_ + " Your King decided to increase your reward from " + _loc4_ + " to " + mission.reward + " gold pieces!";
         }
         if(param1 == _dialogActSleep)
         {
            sound_night.play();
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(11);
            _loc2_.title.text = "Resting";
            _loc2_.text.text = "The day is finally over! You relax for the first time today and settle down to enjoy the warm, cozy bed.";
         }
         if(param1 == _dialogActHire)
         {
            sound_good.play();
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(7);
            _loc2_.title.text = "Hired Gun";
            _loc2_.text.text = "You\'ve hired a henchman for this mission. Is it really worth the money? You\'ll find out soon!";
         }
         if(param1 == _dialogRefreshStock)
         {
            if(game.ap < 2)
            {
               noAp();
               return;
            }
            game.ap -= 2;
            sound_good.play();
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(8);
            _loc2_.title.text = "New Goods!";
            _loc2_.text.text = "You start complaining how the selection of goods is limited. After much fussing, the blacksmith finally gets off his lazy butt, \"Alright, alright, lad. Here\'re our special stocks.\" They have new goods now!";
            exitMenu();
            generateShop();
            sound_scroll1.play();
            menuId = 4;
            window2_mc.gotoAndPlay("menu_shop");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procShopMenu);
         }
         if(param1 == _dialogRobVisitor)
         {
            if(game.ap < 2)
            {
               noAp();
               return;
            }
            game.ap -= 2;
            ++game.robbed;
            ++game.robCount;
            sound_gun2.play(0,8);
            _loc2_ = new eventWindow();
            _loc2_.card.gotoAndStop(6);
            _loc2_.title.text = "Slaughter!";
            _loc8_ = (1 + game.day * 5 + Math.random() * limit(game.day * 10 + 100,0,600 + PARTY.ROBBER * 10)) * (100 + PARTY.ROBBER) / 100 / game.robbed;
            if(medal[_medalAction5])
            {
               _loc8_ *= 1.25;
            }
            if(game.robbed == 1)
            {
               _loc2_.text.text = "You start firing a gun at women and children. After you have slaughtered them all, you search the ground for money and collect " + int(_loc8_) + " gold pieces!";
            }
            else
            {
               _loc2_.text.text = "You start firing a gun at women and children AGAIN! There\'re only few people left in the museum but you manage to collect " + int(_loc8_) + " gold pieces.";
            }
            game.childrenRobbed += int(_loc8_ / 10) + 1;
            player.money[_pc] += int(_loc8_);
            game.totalMoney += int(_loc8_);
            updateInterface();
         }
         actionMedal();
         updateAp();
         _loc2_.name = "eventWindow";
         eventDialog = param1;
         initPartySkill();
         kongregateStats();
         stage.addChild(_loc2_);
      }
      
      public function damageCastle(param1:*, param2:int) : *
      {
         var _loc3_:int = 0;
         if(immune)
         {
            return;
         }
         if(protTime > 0)
         {
            sound_defend.play(0,0,soundPos(640));
            return;
         }
         if(param1 != undefined && Boolean(PARTY.GUARDIAN))
         {
            param1.damage(PARTY.GUARDIAN,-1,param1.x,param1.y,PARTY.GUARDIAN_LIST[int(Math.random() * PARTY.GUARDIAN_LIST.length)],false);
         }
         if(PARTY.INSURANCE)
         {
            player.money[_pc] += PARTY.INSURANCE;
            game.totalMoney += PARTY.INSURANCE;
            updateGold();
         }
         if(Math.random() * 100 < PARTY.DEFENDER)
         {
            sound_defend.play(0,0,soundPos(640));
            return;
         }
         if(Boolean(sister.free) && sister.dead == false)
         {
            sister.gotoAndPlay("damage");
         }
         castleCounter = 10;
         blendType = 0;
         param2 *= castleAbsorb() - mission.absorbFix;
         if(param2 < 1)
         {
            param2 = 1;
         }
         game.castleHP -= param2;
         castleHPText.text = game.castleHP + "/" + game.castleMHP;
         if(Math.random() > 0.6)
         {
            _loc3_ = int(Math.random() * maxAlly);
            if(player.exist[_loc3_] == true && player.rampage[_loc3_] <= 0 && CALC.LAST_HOPE(_loc3_) != 0 && CALC.LAST_HOPE(_loc3_) < game.castleHP / game.castleMHP * 100)
            {
               rampageOn(_loc3_,10 * 30);
            }
         }
      }
      
      public function saveIndex() : *
      {
         var _loc2_:Object = null;
         var _loc1_:SharedObject = SharedObject.getLocal("elonas_idx");
         if(_loc1_)
         {
            _loc2_ = _loc1_.data;
            _loc2_.idx = cloneObj(idx);
            _loc2_.medal = cloneObj(medal);
         }
      }
      
      public function throwRocket(shooterIndex:*, weaponIndex:*, startX:*, startY:*, targetX:*, targetY:*, speedBase:*, baseDamage:int, param9:int) : *
      {
         var _loc10_:* = undefined;
         speedBase = speedBase * Math.atan2(Math.abs(targetX - startX) * 2,Math.abs(targetY - startY)) * 2 / Math.PI + 1.5;
         _loc10_ = new bullet_rocket() as MovieClip;
         if(shooterIndex != hero && shooterIndex != -1)
         {
            targetX += player.target[shooterIndex].speed * ((startX - targetX) / (speedBase * 0.9));
         }
         _loc10_.x = startX;
         _loc10_.y = 0;
         _loc10_.a = 0;
         _loc10_.speed = speedBase;
         _loc10_.x2 = startX;
         _loc10_.y2 = startY;
         _loc10_.x1 = targetX;
         _loc10_.y1 = targetY;
         _loc10_.dmg = baseDamage;
         _loc10_.chara = shooterIndex;
         _loc10_.w = weaponIndex;
         _loc10_.explode = explode;
         stage.addChild(_loc10_);
      }
      
      public function searchNextAlert(param1:*) : *
      {
         var _loc2_:* = undefined;
         if(nextAlert != undefined && nextAlert.isDead() == false)
         {
            _loc2_ = nextAlert;
            player.shooting[param1] = false;
            player.burst[param1] = 0;
            player.target[param1] = _loc2_;
            player.onMark[param1] = true;
            _loc2_.onMark = true;
            player.aimCount[param1] = startingAim(param1,weapon(param1));
         }
         else
         {
            clearAiTarget(param1);
         }
      }
      
      public function updateAmmoBar() : *
      {
         if(inventory.num[ci] > 0)
         {
            ammobar.scaleX = inventory.ammo[ci] / inventory.ammoMax[ci];
            ammoText.text = "" + inventory.ammo[ci] + "/" + inventory.ammoMax[ci];
         }
         else
         {
            ammobar.scaleX = 0;
            ammoText.text = "";
         }
      }
      
      public function max(param1:*, param2:*) : *
      {
         if(param1 < param2)
         {
            return param1;
         }
         return param2;
      }
      
      public function getMedalInfo(param1:int) : *
      {
         var _loc2_:Array = ["null","null"];
         if(param1 == _medalDay1)
         {
            _loc2_ = ["Newcomer","Just play!","Given when you first play Elona Shooter. It\'s a free medal!","No Bonus"];
         }
         if(param1 == _medalDay2)
         {
            _loc2_ = ["Experienced","Survive 10 days.","You\'ve survived 10 days. It\'s not that hard to accomplish it but well.","+100 GP Starting Money"];
         }
         if(param1 == _medalDay3)
         {
            _loc2_ = ["Survivor","Survive 20 days.","You\'ve survived 20 days. You sure know how to kill sheep!","+200 GP Starting Money"];
         }
         if(param1 == _medalDay4)
         {
            _loc2_ = ["Veteran","Survive 35 days.","You\'ve survived 35 days. This is something.","+300 GP Starting Money"];
         }
         if(param1 == _medalDay5)
         {
            _loc2_ = ["Elite","Survive 50 days.","You\'ve survived 50 days! Nice!","+500 GP Starting Money"];
         }
         if(param1 == _medalDay6)
         {
            _loc2_ = ["Savior","Survive ?? days.","You\'ve survived 80 days! You are the savior.","+750 GP Starting Money"];
         }
         if(param1 == _medalDay7)
         {
            _loc2_ = ["Choosen one","Survive, survive!","You\'ve survived 150 days! I don\'t believe it!","+1000 GP Starting Money"];
         }
         if(param1 == _medalChicken1)
         {
            _loc2_ = ["Chicken Lover","Buy 30 chickens.","You\'ve bought 30 chickens. You love chickens, chickens love you!","+5% Egg Revenue"];
         }
         if(param1 == _medalChicken2)
         {
            _loc2_ = ["Chicken Prince","Buy 60 chickens.","You\'ve bought 60 chickens. You love chickens, chickens love you!","+15% Egg Revenue"];
         }
         if(param1 == _medalChicken3)
         {
            _loc2_ = ["Chicken King","Buy lots of chickens!","You\'ve bought 120 chickens. You love chickens, chickens love you!","+30% Egg Revenue"];
         }
         if(param1 == _medalSister1)
         {
            _loc2_ = ["Sister Lover","Get 10 younger sisters.","You\'ve convinced 10 of your younger sisters to commit suicide bombing. Keep going!","+10% Bomb Damage"];
         }
         if(param1 == _medalSister2)
         {
            _loc2_ = ["Sister Mania","Get 20 younger sisters.","You\'ve convinced 20 of your younger sisters to commit suicide bombing. More sisters!","+20% Bomb Damage"];
         }
         if(param1 == _medalSister3)
         {
            _loc2_ = ["Sister Master","You need to become a beast.","You\'ve convinced 30 of your younger sisters to commit suicide bombing. You are nasty!","+30% Bomb Damage"];
         }
         if(param1 == _medalNoDamage1)
         {
            _loc2_ = ["Novice Defender","Score a perfect game.","You\'ve marked 1 perfect game. Good.","+1% Castle Wall Absorption"];
         }
         if(param1 == _medalNoDamage2)
         {
            _loc2_ = ["Skilled Defender","Score 4 perfect games.","You\'ve marked 4 perfect games. Good good.","+1% Castle Wall Absorption"];
         }
         if(param1 == _medalNoDamage3)
         {
            _loc2_ = ["Adept Defender","Score 7 perfect games.","You\'ve marked 7 perfect games. Great!","+1% Castle Wall Absorption"];
         }
         if(param1 == _medalNoDamage4)
         {
            _loc2_ = ["Master Defender","Score perfect games like hell!","You\'ve marked 10 perfect games. Great! I mean it...really!","+1% Castle Wall Absorption"];
         }
         if(param1 == _medalClass1)
         {
            _loc2_ = ["Hunter\'s Award","Grow your hunter.","You\'ve made a level 10 hunter.","Unlocks Ranger Class"];
         }
         if(param1 == _medalClass2)
         {
            _loc2_ = ["Rogue\'s Award","Grow your rogue.","You\'ve made a level 10 rogue.","Unlocks Duelist Class"];
         }
         if(param1 == _medalClass3)
         {
            _loc2_ = ["Sheriff\'s Award","Grow your sheriff.","You\'ve made a level 10 sheriff.","Unlocks Noble Class"];
         }
         if(param1 == _medalClass4)
         {
            _loc2_ = ["Militia\'s Award","Grow your militia.","You\'ve made a level 10 militia.","Unlocks Sniper Class"];
         }
         if(param1 == _medalCritical1)
         {
            _loc2_ = ["Killer","Score 10 critical hits in one battle.","You\'ve scored 10 critical kills in a battle. Lucky shots maybe?","Starting Bonus skill:Luck +1"];
         }
         if(param1 == _medalCritical2)
         {
            _loc2_ = ["Assassin","Score 30 critical hits in one battle.","You\'ve scored 30 critical kills in a battle. Fear the assassin!","Starting Bonus skill:Sense +1"];
         }
         if(param1 == _medalCritical3)
         {
            _loc2_ = ["Unseen Hand","Critical hits? You wonder what\'s so special about them.","You\'ve scored 50 critical kills in a battle. Be thankful you don\'t have to clean up the mess.","Starting Bonus skill:Accuracy +2"];
         }
         if(param1 == _medalAction1)
         {
            _loc2_ = ["Prayer","Pray to your God! (15 times)","You\'ve prayed 15 times. You must be a religious person.","+1 AP chance"];
         }
         if(param1 == _medalAction2)
         {
            _loc2_ = ["Provoker","Taunt\'em! (10 times)","You\'ve taunted 10 times. You know lots of slang!","+1 AP chance"];
         }
         if(param1 == _medalAction3)
         {
            _loc2_ = ["Boomer","Hold parties. Lots of parties. (10 times)","You\'ve held 10 parties. Don\'t you ever get tired?","+1 AP chance"];
         }
         if(param1 == _medalAction4)
         {
            _loc2_ = ["Gun Mania","Don\'t forget to recycle your gun. (10 times)\t","You\'ve recycled 10 guns. A true ecologist!?","+15% Modding Bonus"];
         }
         if(param1 == _medalAction5)
         {
            _loc2_ = ["Robber","Guess what? Rob some people! (20 times)","You\'ve robbed 20 times. Everyone hates you!","+25% robbery money"];
         }
         if(param1 == _medalBadge1)
         {
            _loc2_ = ["Hard Badge","The name tells eveything. It is hard to get, but not impossible.","You\'ve achieved the Hard Badge! Dare to challenge the impossible badge?","+1 Starting Inventory Slot"];
         }
         if(param1 == _medalBadge2)
         {
            _loc2_ = ["Impossible Badge","And this is impossible!","You\'ve achieved the Impossible Badge! After all, it wasn\'t that impossible.","+20 Starting Fame"];
         }
         if(param1 == _medalKongregate)
         {
            _loc2_ = ["Kongregate","Isn\'t there a banner somewhere?","You\'ve visited the Kongregate Web. Good for you!","3% Wage discount"];
         }
         if(param1 == _medalRagnarok)
         {
            _loc2_ = ["Ragnarok Surviver","Ragnarok is an ancient sword you will find eventually.","You\'ve survivied Ragnarok. Just unbelievable.","Starting Bonus skill:Luck +1"];
         }
         if(param1 == _medalFirework)
         {
            _loc2_ = ["Ha-na-bi","Ha-na-bi means fireworks.","You\'ve watched fireworks long enough. I hope you had a good relief.","+25 Fireworks"];
         }
         if(param1 == _medalElona)
         {
            _loc2_ = ["Elonian","Given when you win the first round.","You\'ve successfully won the first round of the game. Congratulations!","You will be able to import weapons to Elona, someday!"];
         }
         if(param1 == _medalHardcore1)
         {
            _loc2_ = ["Hardcore","Survive 20 days in Hardcore mode.","You\'ve survived 20 days in Hardcore Mode. Way to go!","Starting Bonus skill:Sense +1"];
         }
         if(param1 == _medalHardcore2)
         {
            _loc2_ = ["Ultimate Hardcore","Survive 40 days in Hardcore mode.","You\'ve won the first round of the game in Hardcore Mode. You\'re not a human.","Starting Bonus Weapon:GravityGun"];
         }
         if(param1 == _medalHardcore3)
         {
            _loc2_ = ["RNG Award","Survive, survive! And survive in Hardcore mode!","You\'ve survived 80 days in Hardcore Mode. RNG loves you.","Starting Bonus skill:Luck +3"];
         }
         if(game.carryOver == true)
         {
            _loc2_[1] += "\nYou don\'t receive some medals in Carry Over Mode.";
         }
         return _loc2_;
      }
      
      public function calcParty() : *
      {
         return game.party * 10;
      }
      
      public function fixedRnd() : *
      {
         var _loc1_:* = 0.753624683711678;
         var _loc2_:* = game.searched;
         ++game.searched;
         var _loc3_:Number = 3.14159265358979;
         var _loc4_:Number = 2.71828182845905;
         var _loc5_:Number = _loc3_ * (_loc1_ + 0.5);
         var _loc6_:Number = 173 * _loc2_ * _loc2_ * _loc2_;
         return (_loc2_ * _loc4_ + _loc6_) * _loc5_ % 1;
      }
      
      public function procLootMenu() : *
      {
         var _loc1_:* = undefined;
         window2_mc.stop();
         window2_mc.popup.visible = false;
         window2_mc.warning.visible = false;
         if(ce == _eventLootBoss)
         {
            window2_mc.lootText.text = "You\'ve successfully killed " + mission.bossKilled + " boss(es) therefore received some prizes!";
         }
         _loc1_ = 0;
         while(_loc1_ < 8)
         {
            createInvSlot(_invShop + _loc1_,140 + _loc1_ * 50,155,1);
            _loc1_++;
         }
         _loc1_ = 0;
         while(_loc1_ < game.invSlot)
         {
            createInvSlot(_invPlayer + _loc1_,140 + int(_loc1_ % 8) * 50,224 + int(_loc1_ / 8) * 48,1);
            _loc1_++;
         }
      }
      
      public function search(param1:*) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:String = null;
         var _loc5_:int = 0;
         var _loc6_:* = undefined;
         var _loc7_:* = undefined;
         var _loc8_:* = undefined;
         if(fixedRnd() * (100 + PARTY.QUICK_EYED) < 35)
         {
            if(fixedRnd() < 0.15)
            {
               _loc3_ = 0.1 + fixedRnd() / 5;
               mission.hpFix + _loc3_;
               sound_search.play();
               searchProc(param1,"Trouble","A fool taunted the enemies and rose their morale. The enemies will have " + int(_loc3_ * 100) + "% more HP tomorrow.",[]);
               return;
            }
            if(fixedRnd() < 0.2)
            {
               sound_search.play();
               searchProc(param1,"Chatterbox","An old lady stops you and delays you with deadly endless chatter. You lose 2 action point.",[]);
               game.ap -= 2;
               if(game.ap < 0)
               {
                  game.ap = 0;
               }
               return;
            }
            if(fixedRnd() < 0.05 && game.chicken > 2)
            {
               sound_search.play();
               _loc2_ = int(fixedRnd() * 4 + 2);
               if(game.chicken <= _loc2_)
               {
                  _loc2_ = game.chicken - 1;
               }
               searchProc(param1,"Chickens gone","Some crazy chickens broke out of the cage. You lost " + _loc2_ + " chickens!",[]);
               game.chicken -= _loc2_;
               return;
            }
            if(fixedRnd() < 0.3 && game.castleHP > 1)
            {
               sound_search.play();
               _loc2_ = int(fixedRnd() * game.castleMHP / 4 + 1);
               if(game.castleHP <= _loc2_)
               {
                  _loc2_ = game.castleHP - 1;
               }
               searchProc(param1,"Disaster","A cloud of pessimistic mobs gone nuts and destroyed the walls. You need to repair them at once.",[]);
               game.castleHP -= _loc2_;
               return;
            }
            if(fixedRnd() < 0.3 && player.money[_pc] > 0)
            {
               sound_gold1.play();
               _loc6_ = int(fixedRnd() * 30 * game.day + 40) + 2;
               if(_loc6_ > player.money[_pc])
               {
                  _loc6_ = player.money[_pc];
               }
               searchProc(param1,"Thief!","You were pickpocketed while you were shopping. You lost " + _loc6_ + " gold pieces!",[]);
               player.money[_pc] -= _loc6_;
               return;
            }
            if(fixedRnd() < 0.4)
            {
               sound_search.play();
               searchProc(param1,"Ouch...","You trip over a stone and lose 1 action point.",[]);
               --game.ap;
               if(game.ap < 0)
               {
                  game.ap = 0;
               }
               return;
            }
            sound_search.play();
            searchProc(param1,"Fruitless","You were unable to find anything useful in the town.",[]);
            return;
         }
         if(fixedRnd() < 0.15)
         {
            ++game.train;
            if(game.train < 3)
            {
               sound_search.play();
               searchProc(param1,"Talent","While taking a walk, you suddenly realize your hidden potential. You start to develop one of your skills. [Progress:" + game.train + "/3]",[]);
               return;
            }
            game.train = 0;
            _loc5_ = _pc;
            _loc7_ = listTrait(_loc5_);
            _loc2_ = int(_loc7_[int(fixedRnd() * _loc7_.length)]);
            ++player.trait[_loc5_][_loc2_];
            _loc8_ = REF[ID[_loc2_]](_loc5_);
            sound_search.play();
            searchProc(param1,"Talent Flowered!","It seems you\'ve finally unfolded the potential for one of your skills. You\'ve gained " + _loc8_[0] + "!",[]);
            return;
         }
         if(fixedRnd() < 0.15)
         {
            sound_search.play();
            ++game.fame;
            searchProc(param1,"Popularity","It seems you are edging up in popularity. Your fame has been increased by 1.",[]);
            return;
         }
         if(fixedRnd() < 0.22)
         {
            sound_search.play();
            ++game.castleMHP;
            searchProc(param1,"Good news","One of the engineers succeeded to fortify the caste walls. The walls now have +1 max HP.",[]);
            return;
         }
         if(fixedRnd() < 0.12)
         {
            sound_search.play();
            _loc2_ = int(fixedRnd() * 4) + 2;
            searchProc(param1,"Free Chicken","You find stray chickens. You carefully look around and steal " + _loc2_ + " chickens.",[]);
            game.chicken += _loc2_;
            return;
         }
         if(fixedRnd() < 0.2)
         {
            sound_search.play();
            _loc2_ = int(fixedRnd() * 10) + 5;
            searchProc(param1,"Sales Time","You hear bells. Looking around, you notice that the shops in the plaza are all thronged with customers. It\'s sale time! The shop\'s inventory has been restocked.",[]);
            generateShop();
            return;
         }
         if(fixedRnd() < 0.15)
         {
            sound_search.play();
            _loc2_ = int(fixedRnd() * 10) + 5;
            _loc4_ = "You pick up something valuable on the ground. ";
            _loc2_ = getEmptyInventory(_invPlayer);
            if(_loc2_ == -1)
            {
               _loc4_ += "But your inventory is full...";
            }
            else
            {
               randomStuff(_loc2_,game.day * 100 + 1000,3);
               _loc4_ += "" + inventory.name[_loc2_] + " added to your inventory!";
            }
            searchProc(param1,"Gift?",_loc4_,[]);
            return;
         }
         if(fixedRnd() < 0.25)
         {
            sound_search.play();
            _loc2_ = int(fixedRnd() * 10) + 5;
            searchProc(param1,"Training","You come upon a bounch of militias jogging for a training drill. You decided to join up with them. Your party gains " + _loc2_ + " exp.",[]);
            _loc3_ = 0;
            while(_loc3_ < maxAlly)
            {
               player.exp[_loc3_] += _loc2_ * 10;
               _loc3_++;
            }
            return;
         }
         if(fixedRnd() < 0.3)
         {
            sound_search.play();
            searchProc(param1,"Rejoice!","A group of soldiers celebrate you and buy you a drink at the bar. It made you even more determined to win the battle tomorrow. You gain 2 action points.",[]);
            game.ap += 2;
            return;
         }
         if(fixedRnd() < 0.15)
         {
            sound_search.play();
            searchProc(param1,"Hero","As you walk up to the plaza, children and women gather around you to applaud your effort. You gain 3 action points.",[]);
            game.ap += 3;
            return;
         }
         if(fixedRnd() < 0.65)
         {
            sound_gold1.play();
            _loc6_ = int(fixedRnd() * 10 * limit(game.day,0,40) + 100) + 2;
            searchProc(param1,"Look!","You found a wallet at the side of the road. You look cautiously round and open the wallet. You get " + _loc6_ + " gold pieces!",[]);
            player.money[_pc] += _loc6_;
            game.totalMoney += _loc6_;
            return;
         }
         sound_search.play();
         searchProc(param1,"Nothing Found","You wander around the town looking for something but in vain.",[]);
      }
      
      public function startFire() : *
      {
         var _loc3_:* = undefined;
         if(game.optionFirework == true)
         {
            return;
         }
         var _loc1_:* = 0;
         var _loc2_:* = 0;
         while(_loc2_ < 48 + IF(medal[_medalClass1]) * 12)
         {
            _loc3_ = new fireWork1();
            _loc3_.x = 50 + Math.random() * 550;
            _loc3_.y = 10 + Math.random() * 40;
            _loc3_.delay = _loc1_;
            _loc3_.name = "fire";
            _loc1_ += int(Math.random() * 3) + 2;
            stage.addChild(_loc3_);
            _loc2_++;
         }
         sound_firework.play(0,4 + IF(medal[_medalClass1]) * 1);
         fireworkCount = 650;
      }
      
      public function generateLoot() : *
      {
         var _loc1_:int = 0;
         var _loc2_:int = 0;
         clearGameInv();
         _loc2_ = 0;
         while(_loc2_ < mission.loot.length)
         {
            if(_loc2_ > 7)
            {
               break;
            }
            if(Math.random() > 0.2 || mission.loot[_loc2_] > 1000)
            {
               if(mission.loot[_loc2_] > 1000)
               {
                  mission.loot[_loc2_] -= 1000;
               }
               generateStuff(_invShop + _loc2_,mission.loot[_loc2_]);
            }
            else
            {
               _loc1_ = game.day * 40 + 250;
               _loc1_ *= looterFix();
               randomStuff(_invShop + _loc2_,_loc1_,1);
            }
            _loc2_++;
         }
      }
      
      public function procLevel() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         cs = -1;
         _loc1_ = listTrait2(_pc);
         window2_mc.stop();
         i = 0;
         while(i < _loc1_.length)
         {
            radio_mc[i] = new radioButton() as MovieClip;
            radio_mc[i].x = 158;
            radio_mc[i].y = 206 + i * 20;
            radio_mc[i].id = _loc1_[i];
            traitLvFix = 1;
            _loc2_ = REF[ID[radio_mc[i].id]](_pc);
            radio_mc[i].alpha = 1;
            radio_mc[i].txt.text = _loc2_[0];
            radio_mc[i].dummy.mouseEnabled = false;
            window2_mc.addChild(radio_mc[i]);
            radio_mc[i].gotoAndStop(1);
            if(traitRef[_loc1_[i]].maxLv < player.trait[_pc][_loc1_[i]] + 1)
            {
               radio_mc[i].alpha = 0.5;
            }
            ++radioCount;
            ++i;
         }
         updateLevel();
      }
      
      public function removeAlly() : *
      {
         i = 0;
         while(i < maxAlly)
         {
            player.target[i] = undefined;
            player.aiFunc[i] = undefined;
            if(stage.getChildByName(player_mc[i].name))
            {
               stage.removeChild(player_mc[i]);
            }
            if(stage.getChildByName(cursor_mc[i].name))
            {
               stage.removeChild(cursor_mc[i]);
            }
            ++i;
         }
      }
      
      public function stuffGetValue(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         _loc3_ = int(inventory.value[param1]);
         if(!param2)
         {
            if(inventory.type[param1] != _typeSell)
            {
               _loc3_ /= 5;
            }
         }
         return _loc3_;
      }
      
      public function armorLink() : *
      {
         var request:URLRequest;
         sound_click1.play();
         popInfo("A Webpage has been opend in your browser.");
         request = new URLRequest("http://armorgames.com/");
         try
         {
            navigateToURL(request);
         }
         catch(e:Error)
         {
         }
      }
      
      public function resetBG() : *
      {
         bg.transform.colorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
         cloud.transform.colorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
      }
      
      public function gainTrait(characterIndex:int, showNews:Boolean) : *
      {
         var loopCounter:int = 0;
         var candidateTraitId:int = 0;
         var traitName:String = null;
         var availableTraitIds:* = listTrait(characterIndex);
         var selectedTraitId:int = 0;
         var traitResultInfo:* = [];
         var hasForcedFocus:Boolean = false;
         var bestWeight:int = 0;
         var currentWeight:int = 0;
         selectedTraitId = int(TRAIT.ACCURACY);
         loopCounter = 0;
         while(loopCounter < 10)
         {
            candidateTraitId = int(availableTraitIds[int(Math.random() * availableTraitIds.length)]);
            traitName = ID[candidateTraitId];
            if(traitRef[candidateTraitId].maxLv != 999)
            {
               if(player.trait[characterIndex][candidateTraitId] == 0)
               {
                  currentWeight = 250;
               }
               else
               {
                  currentWeight = 100 + player.trait[characterIndex][candidateTraitId] * 50;
               }
            }
            else
            {
               if(traitRef[candidateTraitId].reqLv == 2)
               {
                  currentWeight = 0;
               }
               if(Math.random() > 0.75)
               {
                  currentWeight += 500;
               }
            }
            if(characterIndex < maxParty)
            {
               if(PARTY[traitName] != undefined)
               {
                  if(PARTYLV[traitName] - 1 <= player.trait[characterIndex][candidateTraitId])
                  {
                     currentWeight = 110 + player.trait[characterIndex][candidateTraitId] * 50;
                  }
                  else
                  {
                     currentWeight = 10;
                  }
               }
            }
            if(candidateTraitId == TRAIT.CAPABLE)
            {
               currentWeight = 0;
            }
            currentWeight *= Math.random();
            if(currentWeight > bestWeight)
            {
               selectedTraitId = candidateTraitId;
               bestWeight = currentWeight;
            }
            loopCounter++;
         }
         if(player.forcus[characterIndex] != -1)
         {
            loopCounter = 0;
            while(loopCounter < availableTraitIds.length)
            {
               if(player.forcus[characterIndex] == availableTraitIds[loopCounter])
               {
                  hasForcedFocus = true;
                  if(int(Math.random() * 3) == 0)
                  {
                     break;
                  }
                  selectedTraitId = int(availableTraitIds[loopCounter]);
                  break;
               }
               loopCounter++;
            }
         }
         if(player.devType[characterIndex] == _devNoble || player.devType[characterIndex] == _devRogue || player.devType[characterIndex] == _devRanger)
         {
            if(PARTY.ACTIVE < 2 && CALC.ACTIVE(characterIndex) == 0)
            {
               selectedTraitId = int(TRAIT.ACTIVE);
            }
         }
         if(hasForcedFocus == false)
         {
            player.forcus[characterIndex] = -1;
         }
         ++player.trait[characterIndex][selectedTraitId];
         player.nextTrait[characterIndex] = int(Math.random() * 100);
         traitResultInfo = REF[ID[selectedTraitId]](characterIndex);
         if(showNews)
         {
            news += player.name[characterIndex] + " gains " + traitResultInfo[0] + ".\n";
         }
      }
      
      public function deleteIndex() : *
      {
         var _loc1_:SharedObject = SharedObject.getLocal("elonas_idx");
         _loc1_.clear();
      }
      
      public function mouseOverHandler(param1:MouseEvent) : void
      {
         if(gamePaused)
         {
            return;
         }
         Mouse.hide();
      }
      
      public function removeRadio() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < radioCount)
         {
            window2_mc.removeChild(radio_mc[_loc1_]);
            _loc1_++;
         }
      }
      
      public function calcDuelistMaxDamage(param1:int) : *
      {
         return int(40 + Math.sqrt(param1) * 1.6 + param1);
      }
      
      public function shakeFrame() : *
      {
         --shakeCount;
         shakeRange *= shakeDec;
         if(shakeDirX == 1)
         {
            shakeStrX += shakeRange / 4;
         }
         else
         {
            shakeStrX -= shakeRange / 4;
         }
         if(shakeDirY == 1)
         {
            shakeStrY += shakeRange / 4;
         }
         else
         {
            shakeStrY -= shakeRange / 4;
         }
         shakeX += shakeStrX * shakeDirX;
         if(shakeX > shakeRange)
         {
            shakeX = shakeRange;
            shakeDirX *= -1;
         }
         if(shakeX < shakeRange * -1)
         {
            shakeX = shakeRange * -1;
            shakeDirX *= -1;
         }
         shakeY += shakeStrY * shakeDirY;
         if(shakeY > shakeRange)
         {
            shakeY = shakeRange;
            shakeDirY *= -1;
         }
         if(shakeY < shakeRange * -1)
         {
            shakeY = shakeRange * -1;
            shakeDirY *= -1;
         }
         root.x = shakeX;
         root.y = shakeY;
         if(shakeCount <= 0)
         {
            root.x = 0;
            root.y = 0;
         }
      }
      
      public function aiArmor(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         _loc3_ = 0;
         while(_loc3_ < 3)
         {
            _loc4_ = aiTarget[_armor][weaponRange[param2][_loc3_]][0];
            if(_loc4_ != undefined)
            {
               aiTarget[_armor][weaponRange[param2][_loc3_]] = [undefined,1000];
               _loc4_.tag = _defTag;
               return _loc4_;
            }
            _loc3_++;
         }
         return undefined;
      }
      
      public function EnterFrame_logo(param1:*) : *
      {
         if(logo.currentFrame > 170)
         {
            stage.removeEventListener(Event.ENTER_FRAME,EnterFrame_logo);
            stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDown_logo);
            gotoAndStop("init");
            return;
         }
      }
      
      public function updateShopSlots() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < 8)
         {
            createInvSlot(_invShop + _loc1_,140 + _loc1_ * 50,160,0);
            _loc1_++;
         }
         _loc1_ = 0;
         while(_loc1_ < game.invSlot)
         {
            createInvSlot(_invPlayer + _loc1_,140 + int(_loc1_ % 8) * 50,250 + int(_loc1_ / 8) * 48,1);
            _loc1_++;
         }
      }
      
      public function exitMenuResult() : *
      {
         var _loc1_:int = 0;
         stage.focus = stage;
         currentPop = -1;
         currentHint = -1;
         delay = 0;
         if(ce != _eventMode && ce != _eventGene)
         {
            cs = _pc;
         }
         drag = false;
         equipMode = 0;
         if(ce == _eventClear)
         {
            removeEnemy();
            gamePaused = false;
            immune = false;
            resultMedal();
         }
         if(ce == _eventLoot || ce == _eventLootBoss)
         {
            removeInvSlot();
            removeInvIcon();
            window2_mc.popup.visible = false;
         }
         if(ce == _eventMode)
         {
            gameStart();
            updateInterface();
         }
         if(ce == _eventGene)
         {
            game.casual = window2_mc.optCasual.selected;
            game.HC = window2_mc.optHC.selected;
            if(game.HC == true)
            {
               game.casual = false;
            }
            removeStats();
            _loc1_ = 0;
            while(_loc1_ < _maxPic)
            {
               window2_mc.removeChild(pic_mc[_loc1_]);
               _loc1_++;
            }
            window2_mc.hint.visible = false;
            removeRadio();
            if(eventModeEnabled == false)
            {
               gameStart();
            }
            updateInterface();
         }
         if(ce == _eventLevel)
         {
            removeRadio();
         }
         radioCount = 0;
         invSlotCount = 0;
         invIconCount = 0;
         statsCount = 0;
         medalCount = 0;
         upgradeCount = 0;
         radioCount = 0;
         page = 0;
      }
      
      public function listTrait2(param1:int) : *
      {
         var _loc7_:* = undefined;
         var _loc2_:* = [];
         var _loc3_:* = listTrait(param1);
         var _loc4_:* = 0;
         var _loc5_:int = 0;
         var _loc6_:int = 0;
         _loc4_ = 0;
         while(_loc4_ < 3 + CALC.CAPABLE(param1))
         {
            _loc5_ = -1;
            if(_loc4_ == 0 && param1 == _pc && player.forcus[param1] != -1)
            {
               _loc7_ = 0;
               while(_loc7_ < _loc3_.length)
               {
                  if(player.forcus[param1] == _loc3_[_loc7_])
                  {
                     if(Math.random() > 0.5)
                     {
                        break;
                     }
                     _loc5_ = _loc7_;
                  }
                  _loc7_++;
               }
            }
            if(_loc5_ == -1)
            {
               _loc5_ = int(Math.random() * _loc3_.length);
            }
            if(++_loc6_ > 2000)
            {
               _loc2_[_loc4_] = TRAIT[devGroup[player.devType[param1]][_loc4_]];
            }
            else if(_loc3_[_loc5_] == -1)
            {
               _loc4_--;
            }
            else if(traitRef[_loc3_[_loc5_]].maxLv < player.trait[param1][_loc3_[_loc5_]] + 1)
            {
               _loc4_--;
            }
            else
            {
               _loc2_[_loc4_] = _loc3_[_loc5_];
               _loc3_[_loc5_] = -1;
            }
            _loc4_++;
         }
         return _loc2_;
      }
      
      public function updateUpgradeHint() : *
      {
         var _loc2_:String = null;
         upgradeHint[0] = ["This will completely fix the castle wall.",""];
         upgradeHint[1] = ["Each level of the wall upgrade gives you +5 more max hit points.","(Currently, " + game.castleMHP + " MHP)"];
         upgradeHint[2] = ["Stronger sandbags will absorb more damage done to the wall.","(Currently, sandbag will absorb " + (int(100 - castleAbsorb() * 100)) + "% damage)"];
         upgradeHint[3] = ["Buying this upgrade gives you +1 extra inventory slot.","(Currently, you have " + game.invSlot + " inventory slots)"];
         upgradeHint[4] = ["For each house built, you can hire +1 more troop.","(Currently, you can hire " + game.house + " people)"];
         upgradeHint[5] = ["The more looters you have the, the more valuable stuff you find will be.","(Currently, looted items\'s value will be " + (int(looterFix() * 100 - 100)) + "% higher)"];
         upgradeHint[6] = ["Repairers will slowly fix the castle wall during a battle between waves.","(Currently, they can fix " + castleRepair() + " HP per wave)"];
         upgradeHint[7] = ["With more trainers, your troops will gain experience a lot faster.","(Currently, your troops get " + (int(trainerFix() * 100 - 100)) + "% more EXP)"];
         upgradeHint[8] = ["The shop will show more items with each upgrade.","(Currently, the shop will produce +" + game.smith + " more stuff)"];
         upgradeHint[9] = ["If upgraded, the museum will produce money each day depending on the No. of medals you have.","(Currently, the museum produces " + (int(museumFix() * 100 - 100)) + "% more money)"];
         upgradeHint[10] = ["Chickens will produce some eggs! You can collect them and sell them each day.","(Currently, you have " + game.chicken + " chickens)"];
         upgradeHint[11] = ["Terror from the sky! You can convince some of your younger sisters into suicide bombing.","(Currently, you have " + game.sister + " sisters to launch)"];
         upgradeHint[12] = ["When purchased, you will be able to hold a party after a battle to gain a damage bonus for the next day.","(Currently, " + calcParty() + "% damage bonus)"];
         upgradeHint[13] = ["These special trainers can improve your skills. Number of sessions you can take depends on the upgrade level.","(Currently, " + game.spTrainer + " sessions per unit)"];
         if(kongregate == 0 && false)
         {
            upgradeHint[7] = ["Upgradable in Kongregate Version. Clicking it will open the link.","(Currently, your troops get " + (int(trainerFix() * 100 - 100)) + "% more EXP)"];
         }
         var _loc1_:* = 1;
         while(_loc1_ < 16)
         {
            _loc2_ = upgradeRef[_loc1_];
            if(_loc1_ > 13)
            {
               upgradeHint[_loc1_] = ["[ Not available yet ]",""];
            }
            else if(game[_loc2_] == 0)
            {
               upgradeHint[_loc1_] = [upgradeHint[_loc1_][0],"[ You haven\'t acquired this upgrade yet ]"];
            }
            _loc1_++;
         }
      }
      
      public function upgradeMedal() : *
      {
         if(game.carryOver == true)
         {
            return;
         }
         if(game.chicken >= 30)
         {
            getMedal(_medalChicken1);
         }
         if(game.chicken >= 60)
         {
            getMedal(_medalChicken2);
         }
         if(game.chicken >= 120)
         {
            getMedal(_medalChicken3);
         }
         if(game.sister >= 10)
         {
            getMedal(_medalSister1);
         }
         if(game.sister >= 20)
         {
            getMedal(_medalSister2);
         }
         if(game.sister >= 30)
         {
            getMedal(_medalSister3);
         }
      }
      
      public function kongSubmit2(param1:*, param2:*) : *
      {
         if(game.HC == true)
         {
            kongAPI.stats.submit(param1 + "OnCasual",param2);
            kongAPI.stats.submit(param1,param2);
            kongAPI.stats.submit(param1 + "OnHardcore",param2);
            return;
         }
         if(game.casual == true)
         {
            kongAPI.stats.submit(param1 + "OnCasual",param2);
            return;
         }
         kongAPI.stats.submit(param1 + "OnCasual",param2);
         kongAPI.stats.submit(param1,param2);
      }
      
      public function clearTarget() : *
      {
         var _loc1_:int = 0;
         var _loc2_:int = 0;
         _loc1_ = 0;
         while(_loc1_ < _maxTarget)
         {
            _loc2_ = 0;
            while(_loc2_ < 3)
            {
               aiTarget[_loc1_][_loc2_] = [undefined,1000];
               _loc2_++;
            }
            _loc1_++;
         }
      }
      
      public function mouseDownFunc(param1:MouseEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         _loc2_ = stage.mouseX;
         _loc3_ = stage.mouseY;
         stage.focus = stage;
         if(vol.hitTestPoint(_loc2_,_loc3_,true))
         {
            toggleMute();
            return;
         }
         if(gamePaused)
         {
            if(gameDialog)
            {
               if(dialog_mc.yes.hitTestPoint(mouseX,mouseY,true))
               {
                  endDialog(true);
               }
               else
               {
                  endDialog(false);
               }
               return;
            }
            if(gameOver)
            {
               if(Boolean(gameoverLogo.playMoreButton.hitTestPoint(_loc2_,_loc3_,true)) && gameoverLogo.alpha > 0.8)
               {
                  if(armor)
                  {
                     armorLink();
                     return;
                  }
                  kongregateLink();
                  return;
               }
               if(Boolean(gameoverLogo.gameoverButton.hitTestPoint(_loc2_,_loc3_,true)) && gameoverLogo.alpha > 0.8)
               {
                  sound_click1.play();
                  gameOver = false;
                  gamePaused = false;
                  exitBattle();
                  if(amb != null)
                  {
                     amb.stop();
                  }
                  gotoAndPlay("init");
                  return;
               }
               if(game.HC == false && gameoverLogo.carryOver.visible == true && Boolean(gameoverLogo.carryOver.carryOverButton.hitTestPoint(_loc2_,_loc3_,true)) && gameoverLogo.alpha > 0.8)
               {
                  if(game.carryOver == true)
                  {
                     carryOver();
                  }
                  else
                  {
                     showDialog(_dialogCarryOver);
                     dialog_mc.question.text = "Do you really want to use Carry Over option?";
                  }
               }
               return;
            }
            pauseProc();
            return;
         }
         if(menuButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            pauseMenu();
            return;
         }
         if(mouseY > menuLine)
         {
            return;
         }
         if(_pc != hero)
         {
            return;
         }
         if(Boolean(inventory.reloadTime[ci]) && Boolean(inventory.manualReload[ci]) && inventory.autoReload[ci] == 0)
         {
            cancelReload(_pc,ci);
            return;
         }
         player.shooting[_pc] = true;
      }
      
      public function generateSpecialLoot() : *
      {
         if(Math.random() > 0.97)
         {
            mission.loot.push(38 + 1000);
         }
         if(game.day % 8 == 5)
         {
            mission.loot.push(37 + 1000);
         }
         if(game.day % 6 == 3)
         {
            mission.loot.push(35 + 1000);
         }
         if(game.day % 40 == 1)
         {
            mission.loot.push(_rat + 1100);
         }
         if(game.day % 40 == 2)
         {
            mission.loot.push(_sheep + 1100);
         }
         if(game.day % 40 == 4)
         {
            mission.loot.push(_archer + 1100);
         }
         if(game.day % 40 == 6)
         {
            mission.loot.push(_crow + 1100);
         }
         if(game.day % 40 == 9)
         {
            mission.loot.push(_fly + 1100);
         }
         if(game.day % 40 == 11)
         {
            mission.loot.push(_barb + 1100);
         }
         if(game.day % 40 == 14)
         {
            mission.loot.push(_lava + 1100);
         }
         if(game.day % 40 == 17)
         {
            mission.loot.push(_cata + 1100);
         }
         if(game.day % 40 == 20)
         {
            mission.loot.push(_spider + 1100);
         }
         if(game.day % 40 == 23)
         {
            mission.loot.push(_ghost + 1100);
         }
         if(game.day % 40 == 26)
         {
            mission.loot.push(_ogre + 1100);
         }
         if(game.day % 40 == 29)
         {
            mission.loot.push(_knight + 1100);
         }
         if(game.day % 40 == 32)
         {
            mission.loot.push(_bird + 1100);
         }
         if(game.day % 40 == 35)
         {
            mission.loot.push(_tank + 1100);
         }
         if(game.day % 40 == 38)
         {
            mission.loot.push(_dino + 1100);
         }
         if(game.day % 40 == 39)
         {
            mission.loot.push(_dragon + 1100);
         }
      }
      
      public function generateMission(param1:int) : *
      {
         var _loc2_:* = undefined;
         _loc2_ = int(param1 % lvCycle + int(param1 / lvCycle) * 3);
         initPartySkill();
         mission.level = param1;
         mission.fixedLv = _loc2_;
         mission.strength = 0 + int(param1 / lvCycle) * 200;
         if(game.casual == true)
         {
            mission.power = 500 + _loc2_ * 30 + param1 * 60;
         }
         else
         {
            mission.power = 800 + _loc2_ * 50 + param1 * 70;
         }
         if(game.MORE == true && game.day < 10)
         {
            mission.power += 400 - game.day * 25;
         }
         mission.powerOrg = mission.power;
         mission.reward = int((600 + param1 * 20) * (100 + PARTY.NEGOTIATOR) / 100);
         mission.hire = false;
         mission.ragnarok = false;
         mission.wave = 5;
         if(_loc2_ > 10)
         {
            ++mission.wave;
         }
         if(_loc2_ > 20)
         {
            ++mission.wave;
         }
         if(_loc2_ > 30)
         {
            ++mission.wave;
         }
         if(_loc2_ > 35)
         {
            ++mission.wave;
         }
         mission.spawnRate = limit(15 - _loc2_ / 5,5,15);
         mission.group = [];
         mission.waveType = _waveNormal;
         mission.loot = [];
         generateSpecialLoot();
         mission.newWave = true;
         mission.time = 30;
         if(_loc2_ % 10 == 9 && _loc2_ > 8)
         {
            mission.wave = 6 + int(_loc2_ / 10);
            mission.bossDay = true;
            mission.bossWave = mission.wave - 1;
         }
         else
         {
            mission.bossDay = false;
            mission.bossWave = 2 + int(Math.random() * mission.wave / 3);
            if(param1 == 0)
            {
               mission.bossWave = 2;
            }
         }
         mission.note = "";
         mission.hpFix = 1;
         mission.dmgFix = 1;
         mission.expFix = 1;
         mission.absorbFix = 0;
         mission.bossKilled = 0;
         mission.noDamage = true;
         mission.criticalCount = 0;
         mission.resultOther = 0;
         if(medal[_medalNoDamage1])
         {
            mission.absorbFix += 0.01;
         }
         if(medal[_medalNoDamage2])
         {
            mission.absorbFix += 0.01;
         }
         if(medal[_medalNoDamage3])
         {
            mission.absorbFix += 0.01;
         }
         if(medal[_medalNoDamage4])
         {
            mission.absorbFix += 0.01;
         }
      }
      
      public function cloneObj(param1:*) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         if(param1.length != undefined)
         {
            _loc2_ = new Array();
            _loc3_ = 0;
            while(_loc3_ < param1.length)
            {
               if(typeof param1[_loc3_] == "object")
               {
                  _loc2_[_loc3_] = cloneObj(param1[_loc3_]);
               }
               else
               {
                  _loc2_[_loc3_] = param1[_loc3_];
               }
               _loc3_++;
            }
         }
         else
         {
            _loc2_ = new Object();
            for(_loc4_ in param1)
            {
               if(typeof param1[_loc4_] == "object")
               {
                  _loc2_[_loc4_] = cloneObj(param1[_loc4_]);
               }
               else
               {
                  _loc2_[_loc4_] = param1[_loc4_];
               }
            }
         }
         return _loc2_;
      }
      
      public function procCastleMenu() : *
      {
         defHint = "\nYou can change pages by cliking the side tab.";
         window2_mc.stop();
         window2_mc.anime = true;
         window2_mc.hint.visible = false;
         window2_mc.actRef1.mouseEnabled = false;
         updateCastleMenu();
         if(window2_mc.page1.hasEventListener(MouseEvent.MOUSE_DOWN) == false)
         {
            window2_mc.page1.addEventListener(MouseEvent.MOUSE_DOWN,pageChange(0));
         }
         if(window2_mc.page2.hasEventListener(MouseEvent.MOUSE_DOWN) == false)
         {
            window2_mc.page2.addEventListener(MouseEvent.MOUSE_DOWN,pageChange(1));
         }
      }
      
      public function select_init(param1:int, param2:int) : *
      {
         selectBaseX = param1;
         selectBaseY = param2;
         selectID = 0;
      }
      
      public function rampageOn(param1:int, param2:int) : *
      {
         var _loc3_:* = undefined;
         if(param1 == _pc)
         {
            text_effect("Rampage!!");
            blendType = 0;
            blendCounter += 15;
            bottomBar.gotoAndStop(2);
            shake(40,1.5,1);
         }
         sound_rampage.play(0,0,trans[param1]);
         player.rampage[param1] = int(param2 * (100 + CALC.FURY(param1)) / 100);
         _loc3_ = new ef_rampage() as MovieClip;
         _loc3_.name = "rampage";
         _loc3_.y = 18;
         if(player_mc[param1].getChildByName("rampage") == null)
         {
            player_mc[param1].addChild(_loc3_);
         }
      }
      
      public function looterFix() : *
      {
         return game.looter == 0 ? 1 : 1.05 + game.looter * 0.08;
      }
      
      public function MouseLDown_logo(param1:MouseEvent) : *
      {
         var request:URLRequest = null;
         var event:MouseEvent = param1;
         if(logo.bt.hitTestPoint(mouseX,mouseY,false))
         {
            request = new URLRequest("http://kongregate.com/");
            try
            {
               navigateToURL(request);
            }
            catch(e:Error)
            {
            }
         }
      }
      
      public function hint() : *
      {
         var _loc1_:Boolean = false;
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         if(orderIsOpen)
         {
            return;
         }
         if(window2_mc.animeTime)
         {
            return;
         }
         if(delay < 5)
         {
            return;
         }
         _loc1_ = false;
         _loc2_ = window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
         _loc3_ = 0;
         while(_loc3_ < _loc2_.length)
         {
            _loc4_ = _loc2_[_loc3_].parent;
            if(_loc4_ != null && _loc4_.hasOwnProperty("hintTxt"))
            {
               _loc5_ = window2_mc.hint;
               _loc1_ = true;
               _loc5_.alpha = 1;
               hintCount = 20;
               if(currentHint == _loc4_)
               {
                  break;
               }
               currentHint = _loc4_;
               if(_loc4_.hintTxt[3] == "")
               {
                  _loc5_.maxText.visible = false;
               }
               else
               {
                  _loc5_.maxText.visible = true;
                  _loc5_.maxText.text = "Maxed at " + _loc4_.hintTxt[3];
               }
               if(_loc4_.hintTxt[4] == "")
               {
                  _loc5_.typeText.visible = false;
               }
               else
               {
                  _loc5_.typeText.visible = true;
                  _loc5_.typeText.text = _loc4_.hintTxt[4];
               }
               _loc5_.itemName.text = _loc4_.hintTxt[0];
               _loc5_.itemDesc.text = _loc4_.hintTxt[1];
               _loc5_.itemDesc2.text = _loc4_.hintTxt[2];
               window2_mc.setChildIndex(window2_mc.hint,window2_mc.numChildren - 1);
               window2_mc.hint.visible = true;
            }
            _loc3_++;
         }
         if(_loc1_ == false)
         {
            --hintCount;
            if(hintCount < 0)
            {
               window2_mc.hint.visible = false;
               currentHint = -1;
            }
            else if(hintCount < 10)
            {
               window2_mc.hint.alpha -= 0.1;
            }
         }
      }
      
      public function updateInterface() : *
      {
         updateAmmoBar();
         updateGold();
         updateLv();
         updateDay();
         updateHP();
         updateCi();
         if(gameStage == _stageTown)
         {
            updateAp();
         }
      }
      
      public function allRemoveChild(param1:MovieClip) : void
      {
         var _loc4_:* = undefined;
         var _loc2_:uint = uint(param1.numChildren);
         var _loc3_:uint = 0;
         while(_loc3_ < _loc2_)
         {
            _loc2_ = uint(param1.numChildren);
            if(_loc3_ >= _loc2_)
            {
               break;
            }
            _loc4_ = param1.getChildAt(_loc3_);
            if(_loc4_ is MovieClip)
            {
               param1.removeChild(_loc4_);
               _loc3_ = 0;
            }
            _loc3_++;
         }
      }
      
      public function removeStats() : *
      {
         var _loc1_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < statsCount)
         {
            window2_mc.removeChild(stats_mc[_loc1_]);
            _loc1_++;
         }
      }
      
      public function castleRepair() : *
      {
         return game.repair * 2;
      }
      
      public function endRampage(param1:int) : *
      {
         if(param1 == _pc)
         {
            bottomBar.gotoAndStop(1);
         }
         if(player_mc[param1].getChildByName("rampage") != null)
         {
            player_mc[param1].removeChild(player_mc[param1].getChildByName("rampage"));
         }
      }
      
      public function eventAfterBattle() : *
      {
         var _loc1_:int = 0;
         eventList.push(_eventEnd);
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            if(player.exist[_loc1_] != false)
            {
               player.exp[_loc1_] += 250;
               if(player.exp[_loc1_] >= 1000)
               {
                  levelUp(_loc1_,true);
               }
            }
            _loc1_++;
         }
         news += "\n";
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            if(player.exist[_loc1_] != false)
            {
               wexpUp(_loc1_);
               while(player.sp[_loc1_] > 0)
               {
                  if(_loc1_ == _pc)
                  {
                     eventList.push(_eventLevel);
                  }
                  else
                  {
                     gainTrait(_loc1_,true);
                  }
                  --player.sp[_loc1_];
               }
            }
            _loc1_++;
         }
         if(mission.bossKilled)
         {
            eventList.push(_eventLootBoss);
         }
         if(mission.loot.length > 0)
         {
            eventList.push(_eventLoot);
         }
         eventList.push(_eventClear);
         gamePaused = false;
         news += "\n";
      }
      
      public function generateLootBoss() : *
      {
         var _loc1_:int = 0;
         clearGameInv();
         var _loc2_:* = 0;
         while(_loc2_ < int(mission.bossKilled / 2) + 1)
         {
            if(_loc2_ > 7)
            {
               break;
            }
            _loc1_ = game.day * 60 + 500;
            _loc1_ *= looterFix();
            if(game.optionBossDropMod == true || Math.random() > 0.8)
            {
               randomStuff(_invShop + _loc2_,_loc1_,3);
            }
            else
            {
               randomStuff(_invShop + _loc2_,_loc1_,2);
            }
            _loc2_++;
         }
      }
      
      public function aiFireAtWill(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         var _loc5_:* = undefined;
         _loc4_ = 0;
         loop0:
         while(_loc4_ < 3)
         {
            _loc3_ = 0;
            while(true)
            {
               if(_loc3_ >= 3)
               {
                  _loc4_++;
                  continue loop0;
               }
               if(aiTarget[_loc4_][weaponRange[param2][_loc3_]][0] != undefined)
               {
                  break;
               }
               _loc3_++;
            }
            _loc5_ = aiTarget[_loc4_][weaponRange[param2][_loc3_]][0];
            aiTarget[_loc4_][weaponRange[param2][_loc3_]] = [undefined,1000];
            _loc5_.tag = _defTag;
            return _loc5_;
         }
         return undefined;
      }
      
      public function getUpgradeCost(param1:int) : *
      {
         var _loc2_:String = null;
         var _loc3_:int = 0;
         _loc2_ = upgradeRef[param1];
         _loc3_ = 150;
         if(_loc2_ == "wallFix")
         {
            _loc3_ = 8 * (game.castleMHP - game.castleHP);
         }
         if(_loc2_ == "wallUpgrade")
         {
            _loc3_ = game.castleMHP * game.castleMHP / 2.5 - 400;
         }
         if(_loc2_ == "storage")
         {
            _loc3_ = (game.invSlot - 4) * (game.invSlot - 4) * 30 + 250;
         }
         if(_loc2_ == "house")
         {
            _loc3_ = game.house * game.house * 1000 + 1000;
         }
         if(_loc2_ == "looter")
         {
            _loc3_ = game.looter * game.looter * 125 + 300;
         }
         if(_loc2_ == "repair")
         {
            _loc3_ = game.repair * game.repair * 250 + 700;
         }
         if(_loc2_ == "trainer")
         {
            _loc3_ = game.trainer * game.trainer * 180 + 250;
         }
         if(_loc2_ == "smith")
         {
            _loc3_ = game.smith * game.smith * 80 + 200;
         }
         if(_loc2_ == "sandbag")
         {
            _loc3_ = game.sandbag * game.sandbag * 240 + 1000;
         }
         if(_loc2_ == "museum")
         {
            _loc3_ = game.museum * 150 + 2000;
         }
         if(_loc2_ == "chicken")
         {
            _loc3_ = int(Math.sqrt(game.chicken * game.chicken * 20)) + 20 + game.chicken * 2.5;
         }
         if(_loc2_ == "sister")
         {
            _loc3_ = game.sister * 100 + 250;
         }
         if(_loc2_ == "party")
         {
            _loc3_ = game.party * game.party * 180 + 2500;
         }
         if(_loc2_ == "spTrainer")
         {
            _loc3_ = game.spTrainer * game.spTrainer * 400 + 2500;
         }
         if(_loc2_ == "na")
         {
            _loc3_ = 0;
         }
         if(_loc2_ == "trainer" && (kongregate == 0 && armor == 0 && false))
         {
            _loc3_ = -1;
         }
         if(_loc2_ == "storage" && game.invSlot >= 16)
         {
            _loc3_ = 0;
         }
         if(_loc2_ == "house" && game.house >= 3)
         {
            _loc3_ = 0;
         }
         if(_loc2_ == "smith" && game.smith >= 6)
         {
            _loc3_ = 0;
         }
         if(_loc2_ == "sandbag" && game.sandbag >= 10)
         {
            _loc3_ = 0;
         }
         if(_loc2_ == "spTrainer" && game.spTrainer >= 9)
         {
            _loc3_ = 0;
         }
         return _loc3_;
      }
      
      public function select_add(param1:String) : *
      {
         var _loc2_:MovieClip = buttonArray[selectID];
         _loc2_.x = selectBaseX;
         _loc2_.y = selectBaseY + selectID * 26;
         _loc2_.selectText.text = param1;
         _loc2_.transButton.x = 0;
         _loc2_.transButton.y = 0;
         stage.addChild(_loc2_);
         ++selectID;
      }
      
      public function exitResult() : *
      {
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_result);
         removeEventListener(Event.ENTER_FRAME,onEnterFrame_result);
         if(ce != _eventGene && ce != _eventMode)
         {
            removeAlly();
         }
      }
      
      public function fillAmmo() : *
      {
         var _loc1_:int = 0;
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            _loc2_ = weapon(_loc1_);
            if(_loc1_ == _pc)
            {
               _loc3_ = _invPlayer;
               while(_loc3_ < game.invSlot + _invPlayer)
               {
                  if(inventory.type[_loc3_] != _typeUse)
                  {
                     inventory.reloadTime[_loc3_] = 0;
                     inventory.ammo[_loc3_] = inventory.ammoMax[_loc3_];
                  }
                  _loc3_++;
               }
            }
            else if(inventory.type[_loc2_] != _typeUse)
            {
               inventory.reloadTime[_loc2_] = 0;
               inventory.ammo[_loc2_] = inventory.ammoMax[_loc2_];
            }
            _loc1_++;
         }
      }
      
      public function generateHenchman() : *
      {
         var _loc1_:* = maxParty;
         var _loc2_:* = _invAlly + maxParty;
         generatePlayer(_loc1_,10 + game.day,_devMilitia);
         generateStuff(_loc2_,21);
         player.trait[_loc1_][TRAIT.BIG_GUN] = 40;
         player.ai[_loc1_] = _aiFireAtWill;
         player.optBoss[_loc1_] = false;
         player.optWall[_loc1_] = true;
      }
      
      public function procEquipMenu() : *
      {
         defHint = "\nDrag & drop to move items or change equipment.";
         window2_mc.stop();
         window2_mc.anime = true;
         window2_mc.popup.visible = false;
         window2_mc.warning.visible = false;
         window2_mc.actRef1.mouseEnabled = false;
         window2_mc.actRef2.mouseEnabled = false;
         window2_mc.actHelp.visible = false;
         updateEquipSlots();
      }
      
      public function shake(param1:int, param2:int, param3:*) : *
      {
         shakeCount = param1;
         shakeRange = param2;
         shakeDec = param3;
         shakeX = 0;
         shakeY = 0;
         shakeStrX = shakeRange / 2;
         shakeStrY = shakeRange / 2;
         shakeDirX = 1;
         shakeDirY = 1;
         if(Math.random() > 0.5)
         {
            shakeDirX *= -1;
         }
         if(Math.random() > 0.5)
         {
            shakeDirY *= -1;
         }
      }
      
      public function onEnterFrame_title(param1:Event) : *
      {
         var _loc2_:MovieClip = null;
         idx.slot = saveBox.selectedItem.data;
         if(shakeCount)
         {
            shakeFrame();
         }
         cloud.x -= 0.5;
         if(cloud.x < -1280)
         {
            cloud.x = 0;
         }
         ++t;
         if(t >= 20 && t <= 30)
         {
            newGameButton.y += 25;
            newGameButtonOrgX = newGameButton.x;
         }
         if(t >= 29 && t <= 39)
         {
            _loc2_ = new effect();
            _loc2_.x = Math.random() * 100 + 250;
            _loc2_.y = Math.random() * 10 + 245;
            _loc2_.gotoAndPlay("impact1");
            stage.addChild(_loc2_);
            newGameButton.x = newGameButtonOrgX + Math.random() * 2 - Math.random() * 2;
            if(t == 29)
            {
               sound_impact1.play();
               shake(20,5,0.9);
            }
         }
         if(t >= 25 && t <= 39)
         {
            continueButton.y += 25;
            continueButtonOrgX = continueButton.x;
         }
         if(t >= 38 && t <= 48)
         {
            _loc2_ = new effect();
            _loc2_.x = Math.random() * 100 + 250;
            _loc2_.y = Math.random() * 10 + 295;
            _loc2_.gotoAndPlay("impact1");
            stage.addChild(_loc2_);
            continueButton.x = continueButtonOrgX + Math.random() * 2 - Math.random() * 2;
            if(t == 38)
            {
               sound_impact1.play();
               shake(20,5,0.9);
            }
         }
         if(t >= 30 && t <= 48)
         {
            helpButton.y += 25;
            helpButtonOrgX = helpButton.x;
         }
         if(t >= 47 && t <= 57)
         {
            _loc2_ = new effect();
            _loc2_.x = Math.random() * 80 + 250;
            _loc2_.y = Math.random() * 10 + 345;
            _loc2_.gotoAndPlay("impact1");
            stage.addChild(_loc2_);
            helpButton.x = helpButtonOrgX + Math.random() * 2 - Math.random() * 2;
            if(t == 47)
            {
               sound_impact1.play();
               shake(30,5,0.9);
            }
         }
         i = 0;
         while(i < _maxRunner)
         {
            if(t == 50)
            {
               runner_mc[i].gotoAndPlay("run");
            }
            if(t >= 50 && t < 95)
            {
               runner_mc[i].x += 0.25 + runner_speed[i] / 8;
            }
            if(t == 98 + i)
            {
               runner_mc[i].gotoAndPlay("notice");
            }
            if(t == 130)
            {
               runner_mc[i].gotoAndPlay("run");
            }
            if(t >= 130)
            {
               if(runner_mc[i].dead == false)
               {
                  runner_mc[i].x -= runner_speed[i];
               }
            }
            if(t > 150)
            {
               if(runner_mc[i].x > 480 - (t - 150) * 5)
               {
                  if(runner_mc[i].dead == false)
                  {
                     _loc2_ = new effect();
                     _loc2_.x = runner_mc[i].x;
                     _loc2_.y = runner_mc[i].y - 5;
                     _loc2_.gotoAndPlay("blood1");
                     stage.addChild(_loc2_);
                     runner_mc[i].dead = true;
                     runner_mc[i].gotoAndPlay("dead");
                  }
               }
            }
            ++i;
         }
         if(t >= 150 && t < 230 && int(t % 2) == 0)
         {
            _loc2_ = new effect();
            _loc2_.x = 480 - (t - 150) * 5 + Math.random() * 15;
            _loc2_.y = Math.random() * 200 + 160;
            _loc2_.gotoAndPlay("impact1");
            stage.addChild(_loc2_);
         }
         if(showUpdate == true)
         {
            stage.setChildIndex(window2_mc,stage.numChildren - 1);
         }
      }
      
      public function procResult() : *
      {
         var _loc1_:* = undefined;
         if(toTownMenu)
         {
            _loc1_ = window3_mc;
            _loc1_.procButton.visible = false;
            _loc1_.mc_playMore.visible = false;
            _loc1_.mc_playMore.mouseEnabled = false;
         }
         else
         {
            _loc1_ = window2_mc;
            _loc1_.procButton.visible = true;
            _loc1_.mc_playMore.visible = true;
            _loc1_.mc_playMore.mouseEnabled = true;
         }
         if(armor)
         {
            _loc1_.mc_playMore.visible = false;
            _loc1_.procButton.x = 280;
         }
         _loc1_.stop();
         _loc1_.field.text = getNews();
         _loc1_.field.editable = false;
         _loc1_.before.text = "" + mission.resultBefore;
         _loc1_.taken.text = "" + mission.resultTaken;
         _loc1_.reward.text = "" + mission.reward;
         _loc1_.castle.text = "" + mission.resultCastle;
         _loc1_.other.text = "" + mission.resultOther;
         _loc1_.wage.text = "" + mission.wage;
         _loc1_.tax.text = "" + mission.unkeep;
         _loc1_.now.text = "" + player.money[_pc];
         updateInterface();
      }
      
      public function trainerFix() : *
      {
         return game.trainer == 0 ? 1 : 1.03 + game.trainer * 0.04;
      }
      
      public function drawTrail(param1:*, param2:*, param3:*, param4:*, param5:*) : *
      {
         var _loc6_:MovieClip = null;
         var _loc7_:* = undefined;
         var _loc8_:* = undefined;
         if(param5 == 1)
         {
            _loc6_ = new trail1() as MovieClip;
         }
         if(param5 == 2)
         {
            _loc6_ = new trail2() as MovieClip;
         }
         if(param5 == 3)
         {
            _loc6_ = new trail3() as MovieClip;
         }
         _loc7_ = param1 - param3;
         _loc8_ = param2 - param4;
         _loc6_.x = param3;
         _loc6_.y = param4;
         _loc6_.width = Math.sqrt(_loc7_ * _loc7_ + _loc8_ * _loc8_);
         _loc6_.rotation = Math.atan2(param1 - param3,param2 - param4) * -180 / Math.PI + 90;
         stage.addChild(_loc6_);
      }
      
      public function select_end() : *
      {
         select = -1;
         if(selectID == 0)
         {
            return;
         }
         i = 0;
         while(i < selectID)
         {
            stage.removeChild(buttonArray[i]);
            ++i;
         }
         selectID = 0;
      }
      
      public function orderClick(param1:Event) : void
      {
         sound_click1.play();
         player.ai[cs] = window2_mc.order.selectedItem.data;
         updateCharaMenu();
      }
      
      public function aiNormal(param1:int, param2:int) : *
      {
         var _loc3_:int = 0;
         var _loc4_:int = 0;
         var _loc5_:* = undefined;
         _loc4_ = 0;
         while(_loc4_ < 2)
         {
            if(aiTarget[0][weaponRange[param2][_loc4_]][0] != undefined)
            {
               _loc5_ = aiTarget[0][weaponRange[param2][_loc4_]][0];
               aiTarget[0][weaponRange[param2][_loc4_]] = [undefined,1000];
               _loc5_.tag = _defTag;
               return _loc5_;
            }
            if(player.ai[param1] == _aiNeither)
            {
               return undefined;
            }
            if(aiTarget[_armor][weaponRange[param2][_loc4_]][0] != undefined)
            {
               _loc5_ = aiTarget[_armor][weaponRange[param2][_loc4_]][0];
               aiTarget[_armor][weaponRange[param2][_loc4_]] = [undefined,1000];
               _loc5_.tag = _defTag;
               return _loc5_;
            }
            if(player.ai[param1] == _aiNoAir)
            {
               return undefined;
            }
            if(aiTarget[_air][weaponRange[param2][_loc4_]][0] != undefined)
            {
               _loc5_ = aiTarget[_air][weaponRange[param2][_loc4_]][0];
               aiTarget[_air][weaponRange[param2][_loc4_]] = [undefined,1000];
               _loc5_.tag = _defTag;
               return _loc5_;
            }
            _loc4_++;
         }
         return undefined;
      }
      
      public function setMod(param1:int, param2:int) : *
      {
         inventory.mod[param1] = param2;
         if(inventory.id[param1] == 8)
         {
            inventory.modMax[param1] = 1;
            inventory.lv[param1] = 1;
            inventory.name[param1] = encRef[inventory.mod[param1]].name + " Mod Lv.1";
            inventory.type[param1] = _typeMod;
            inventory.value[param1] = 200 + 2 * encRef[inventory.mod[param1]].cost;
         }
         if(inventory.id[param1] == 9)
         {
            inventory.modMax[param1] = 2;
            inventory.lv[param1] = 2;
            inventory.name[param1] = encRef[inventory.mod[param1]].name + " Mod Lv.2";
            inventory.type[param1] = _typeMod;
            inventory.value[param1] = 600 + 4 * encRef[inventory.mod[param1]].cost;
         }
         if(inventory.id[param1] == 10 || inventory.id[param1] == 121)
         {
            inventory.modMax[param1] = 3;
            inventory.lv[param1] = 3;
            inventory.name[param1] = encRef[inventory.mod[param1]].name + " Mod Lv.3";
            inventory.type[param1] = _typeMod;
            inventory.value[param1] = 1200 + 8 * encRef[inventory.mod[param1]].cost;
         }
      }
      
      public function invPopup() : *
      {
         var _loc1_:Boolean = false;
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         if(window2_mc.animeTime)
         {
            return;
         }
         if(delay < 5)
         {
            return;
         }
         _loc1_ = false;
         if(drag)
         {
            invPopupUpdate(invSlot_mc[dragSlot].id);
            return;
         }
         _loc2_ = window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
         _loc3_ = 0;
         while(_loc3_ < _loc2_.length)
         {
            _loc4_ = _loc2_[_loc3_].parent;
            if(_loc4_ != null && _loc4_.hasOwnProperty("slot"))
            {
               if(_loc4_.item != -1)
               {
                  _loc1_ = true;
                  hintCount = 20;
                  window2_mc.popup.alpha = 1;
                  invPopupUpdate(_loc4_.id);
               }
            }
            _loc3_++;
         }
         if(_loc1_ == false)
         {
            --hintCount;
            if(hintCount < 0)
            {
               window2_mc.popup.visible = false;
               currentPop = -1;
            }
            else if(hintCount < 10)
            {
               window2_mc.popup.alpha -= 0.1;
            }
         }
      }
      
      public function weaponVariation(param1:int, param2:int) : *
      {
         var _loc3_:* = undefined;
         if(param2 == -1)
         {
            if(game.optWeaponLevel == true)
            {
               _loc3_ = getBestSkill(ID[inventory.reqTrait[param1]],1);
               _loc3_ = int((_loc3_ + 3 - inventory.reqLv[param1]) / 2.5 + 1);
               param2 = int(Math.random() * _loc3_);
            }
            else
            {
               param2 = limit(1 + int(Math.random() * (game.day / 5 + 2)),1,2 + game.day / 8);
            }
         }
         if(param2 <= 1)
         {
            return;
         }
         inventory.attack[param1] = int(inventory.attack[param1] * (100 + param2 * 15) / 100);
         inventory.shootRate[param1] = int(inventory.shootRate[param1] * (100 + param2 * 5) / 100);
         inventory.name[param1] += " Mk-" + param2;
         inventory.value[param1] = int(inventory.value[param1] * param2 / 1.5) + param2 * 300;
         inventory.reqLv[param1] += int(param2 * 2.5);
         inventory.ammo[param1] = inventory.ammoMax[param1];
         inventory.lv[param1] = param2;
      }
      
      public function orderClose(param1:Event) : void
      {
         window2_mc.dismissButton.mouseEnabled = true;
         window2_mc.hint.visible = false;
         orderIsOpen = false;
      }
      
      public function exitBattle() : *
      {
         stopSound();
         exitBattle2();
         removeAlly();
         removeEnemy();
      }
      
      public function KeyDown(param1:KeyboardEvent) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:int = 0;
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         if(gamePaused)
         {
            if(gameDialog || gameOver)
            {
               return;
            }
            if(param1.keyCode == 27 || param1.keyCode == Keyboard.SPACE)
            {
               sound_click1.play();
               endPauseMenu();
            }
            return;
         }
         if(param1.keyCode == 70)
         {
            sound_reloaded2.play();
            if(fireAtWill == false)
            {
               blendCounter = 8;
               fireAtWill = true;
               sister.sisterFire.visible = true;
               _loc3_ = new ef_rampage() as MovieClip;
               _loc3_.name = "rampage";
               _loc3_.y = 16;
               if(sister.getChildByName("rampage") == null)
               {
                  sister.addChild(_loc3_);
               }
            }
            else
            {
               fireAtWill = false;
               sister.sisterFire.visible = false;
               if(sister.getChildByName("rampage") != null)
               {
                  sister.removeChild(sister.getChildByName("rampage"));
               }
            }
            return;
         }
         if(param1.keyCode == 27)
         {
            pauseMenu();
            return;
         }
         if(param1.keyCode == Keyboard.SPACE)
         {
            if(inventory.ammo[ci] != inventory.ammoMax[ci] && inventory.autoReload[ci] == 0 && player.shootTimer[_pc] <= 0)
            {
               reload(_pc,ci);
            }
            return;
         }
         _loc2_ = 0;
         while(_loc2_ < 5)
         {
            if(param1.keyCode == 49 + _loc2_)
            {
               _loc4_ = _invPlayer + _loc2_;
               if(inventory.num[_loc4_] > 0)
               {
                  if(inventory.type[_loc4_] == _typeUse)
                  {
                     useItem(_pc,_loc4_);
                     return;
                  }
                  inventory.reloadTime[ci] = 0;
                  ci = _loc4_;
                  refreshPlayer(_pc,ci);
                  sound_reloaded1.play();
                  updateAmmoBar();
                  updateCi();
                  player_mc[_pc].gotoAndStop(player_mc[_pc].anime2);
                  return;
               }
               sound_beep.play();
               return;
            }
            _loc2_++;
         }
         if(debug)
         {
            if(param1.keyCode == Keyboard.UP)
            {
               customCursor.visible = false;
               Mouse.show();
               gamePaused = true;
               gameOver = true;
               gotoAndPlay("dead");
               return;
            }
            if(param1.keyCode == Keyboard.RIGHT)
            {
               text_effect("AAAAAAAAAAAAA");
               return;
            }
            if(param1.keyCode == Keyboard.LEFT)
            {
               bgChange = 100;
               _loc5_ = (100 + bgChange) * 0.01;
               _loc6_ = [1 - _loc5_ * 0.9,0.6 - _loc5_ * 0.2,0.4 + _loc5_ * 0.6];
               bg.transform.colorTransform = new ColorTransform(_loc6_[0],_loc6_[1],_loc6_[2],1,0,0,0,0);
               cloud.transform.colorTransform = new ColorTransform(_loc6_[0],_loc6_[1],_loc6_[2],1,0,0,0,0);
               startFire();
               exitBattle2();
               eventAfterBattle();
               gotoAndStop("event");
               return;
            }
            if(param1.keyCode == Keyboard.DOWN)
            {
               spawnEnemy(1);
               return;
            }
            if(param1.keyCode == 16)
            {
               return;
            }
         }
      }
      
      public function exitBattle2() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         _loc1_ = _invPlayer;
         while(_loc1_ < _invPlayer + 5)
         {
            if(stage.getChildByName("timer" + _loc1_))
            {
               _loc2_ = stage.getChildByName("timer" + _loc1_);
               _loc2_.timer = 0;
            }
            _loc1_++;
         }
         fillAmmo();
         _loc1_ = 0;
         while(_loc1_ < maxAlly)
         {
            endRampage(_loc1_);
            if(stage.getChildByName(cursor_mc[_loc1_].name))
            {
               cursor_mc[_loc1_].visible = false;
            }
            _loc1_++;
         }
         blendCounter = 0;
         castleCounter = 0;
         root.transform.colorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
         removeChild(customCursor);
         timer.removeEventListener(TimerEvent.TIMER,onTick);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown);
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,mouseDownFunc);
         stage.removeEventListener(MouseEvent.MOUSE_UP,mouseUpFunc);
         stage.removeEventListener(MouseEvent.MOUSE_MOVE,MouseMove);
         stage.removeEventListener(MouseEvent.MOUSE_OVER,mouseOverHandler);
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         Mouse.show();
      }
      
      public function getEmptyInventory(param1:int) : *
      {
         var _loc3_:* = undefined;
         var _loc2_:int = -1;
         if(param1 == _invPlayer)
         {
            _loc3_ = _invPlayer;
            while(_loc3_ < game.invSlot + _invPlayer)
            {
               if(inventory.num[_loc3_] == 0 || inventory.num[_loc3_] == undefined)
               {
                  _loc2_ = _loc3_;
                  break;
               }
               _loc3_++;
            }
         }
         return _loc2_;
      }
      
      public function throwGrenade(param1:*, param2:*, param3:*, param4:*, param5:*, param6:*, param7:*, param8:int, param9:int) : *
      {
         var _loc10_:* = undefined;
         param7 = param7 * Math.atan2(Math.abs(param5 - param3) * 2,Math.abs(param6 - param4)) * 2 / Math.PI + 0.1;
         if(param9 == 0 || param9 == -1)
         {
            sound_throw1.play(0,0,soundPos(param3));
            _loc10_ = new bullet_grenade() as MovieClip;
         }
         if(param9 == 1)
         {
            _loc10_ = new bullet_grenade2() as MovieClip;
         }
         if(param9 == 2)
         {
            _loc10_ = new bullet_arrow2() as MovieClip;
            if(param6 < 150)
            {
               param7 *= 1.5;
            }
            param6 += 6;
         }
         if(param9 == 3)
         {
            _loc10_ = new bullet_arrow3() as MovieClip;
            param6 += 4;
         }
         if(param9 == 4)
         {
            _loc10_ = new bullet_puls() as MovieClip;
            param7 /= 4;
         }
         if(param9 == 5)
         {
            _loc10_ = new bullet_fire() as MovieClip;
            param7 *= 0.75;
         }
         if(param1 != hero && param9 != -1 && param1 != -1 && param9 != 4)
         {
            if(player.target[param1] != undefined)
            {
               param5 += player.target[param1].speed * ((param3 - param5) / (param7 * 1.1));
            }
         }
         _loc10_.x = param3;
         _loc10_.y = 0;
         _loc10_.a = 0.003;
         _loc10_.speed = param7;
         _loc10_.x2 = param3;
         _loc10_.y2 = param4;
         _loc10_.x1 = param5;
         _loc10_.y1 = param6;
         _loc10_.dmg = param8;
         _loc10_.chara = param1;
         _loc10_.w = param2;
         _loc10_.explode = explode;
         _loc10_.checkPaused = checkPaused;
         if(param9 == 2 || param9 == 3)
         {
            _loc10_.penetrate = player.trait[param1][TRAIT.BOW_MASTER];
            if(inventory.id[param2] == 23)
            {
               ++_loc10_.penetrate;
            }
            _loc10_.explode = procHit;
         }
         if(param9 == 4 || param9 == 5)
         {
            var multiplier:Number = (100 + CALC.DA_BOMB(param1)) / 100;
            _loc10_.mc.scaleX = multiplier;
            _loc10_.mc.scaleY = multiplier;
            _loc10_.explode = explode_puls;
         }
         stage.addChild(_loc10_);
      }
      
      public function toggleMute() : *
      {
         if(idx.mute == true)
         {
            idx.mute = false;
            volumeChange(1);
         }
         else
         {
            idx.mute = true;
            volumeChange(0);
         }
      }
      
      public function clearGameInv() : *
      {
         var _loc1_:int = 0;
         while(_loc1_ < _invPlayer)
         {
            inventory.num[_loc1_] = 0;
            _loc1_++;
         }
      }
      
      public function MouseLDownFunc_town(param1:MouseEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         var _loc5_:int = 0;
         _loc2_ = stage.mouseX;
         _loc3_ = stage.mouseY;
         if(orderIsOpen)
         {
            return;
         }
         if(cardCount)
         {
            return;
         }
         if(vol.hitTestPoint(_loc2_,_loc3_,true))
         {
            toggleMute();
            return;
         }
         if(gameDialog)
         {
            if(dialog_mc.yes.hitTestPoint(_loc2_,_loc3_,true))
            {
               endDialog(true);
            }
            else
            {
               endDialog(false);
            }
            return;
         }
         if(gamePaused)
         {
            pauseProc();
            return;
         }
         _loc4_ = stage.getChildByName("eventWindow");
         if(_loc4_ != null)
         {
            procEventDialog(_loc4_);
            return;
         }
         if(menuId == 1)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               showEventDialog(_dialogActSleep);
               return;
            }
            if(Boolean(window2_mc.act2.visible) && Boolean(window2_mc.act2.hitTestPoint(mouseX,mouseY,true)))
            {
               showDialog(_dialogHire);
               dialog_mc.question.text = "The henchman demands half the mission reward. Accept?";
               return;
            }
            _loc5_ = 0;
            i = 0;
            while(i < radioCount)
            {
               if(Boolean(radio_mc[i].avail) && Boolean(radio_mc[i].card.hitTestPoint(mouseX,mouseY,true)))
               {
                  actList[i].func();
                  return;
               }
               ++i;
            }
         }
         if(menuId == 2 && delay > 3)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               showEventDialog(_dialogFreeRepair);
               return;
            }
            i = 0;
            while(i < upgradeCount)
            {
               if(upgrade_mc[i].hitTestPoint(mouseX,mouseY,true))
               {
                  if(upgrade_mc[i].possible == false)
                  {
                     sound_beep.play();
                     return;
                  }
                  if(getUpgradeCost(i + page * 8) == -1)
                  {
                     exclusiveLink();
                     return;
                  }
                  sound_pay1.play();
                  player.money[_pc] -= getUpgradeCost(i + page * 8);
                  upgradeDone(i + page * 8);
                  removeUpgrades();
                  updateCastleMenu();
                  updateInterface();
                  return;
               }
               ++i;
            }
         }
         if(menuId == 3 && delay > 3)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               showEventDialog(_dialogNewRecruit);
               return;
            }
            i = 0;
            while(i < maxAlly + 1)
            {
               if(player.exist[i] != false)
               {
                  if(player_mc[i].bg.hitTestPoint(mouseX,mouseY,true))
                  {
                     sound_click1.play();
                     cs = i;
                     updateCharaMenu();
                     return;
                  }
               }
               ++i;
            }
         }
         if(menuId == 3 && cs != maxAlly)
         {
            i = 0;
            while(i < statsCount)
            {
               if(stats_mc[i].hitTestPoint(mouseX,mouseY,true))
               {
                  if(traitRef[stats_mc[i].id].group == G_BASE || stats_mc[i].id < G_GEN)
                  {
                     sound_beep.play();
                     popInfo("Base skills can\'t be focused.");
                     return;
                  }
                  sound_click1.play();
                  if(player.forcus[cs] == stats_mc[i].id)
                  {
                     player.forcus[cs] = -1;
                  }
                  else
                  {
                     player.forcus[cs] = stats_mc[i].id;
                  }
                  updateCharaMenu();
                  return;
               }
               ++i;
            }
         }
         if(menuId == 3 && cs != _pc && window2_mc.dismissButton.mouseEnabled == true)
         {
            if(window2_mc.dismissButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               if(cs != maxAlly)
               {
                  showDialog(_dialogDismiss);
                  dialog_mc.question.text = "Do you really want to dismiss " + player.name[cs] + "?";
               }
               else
               {
                  if(player.exist[3] == true)
                  {
                     sound_beep.play();
                     popInfo("You have reached the limit of recruits.");
                     return;
                  }
                  if(getFreeAlly() > game.house)
                  {
                     sound_beep.play();
                     popInfo("You need to upgrade the house!");
                     return;
                  }
                  if(player.money[_pc] < player.cost[cs])
                  {
                     sound_beep.play();
                     popInfo("You don\'t have enough money!");
                     return;
                  }
                  showDialog(_dialogRecruit);
                  dialog_mc.question.text = "Do you really want to recruit " + player.name[cs] + " for " + player.cost[cs] + " gp?";
               }
            }
         }
         if(menuId == 4)
         {
            if(drag == false && Boolean(window2_mc.act2.hitTestPoint(mouseX,mouseY,true)))
            {
               if(game.ap < 4)
               {
                  noAp();
                  return;
               }
               sound_click1.play();
               window2_mc.actHelp.visible = true;
               equipMode = 1;
               updateInvSlots(-1);
               return;
            }
            if(drag == false && Boolean(window2_mc.act1.hitTestPoint(mouseX,mouseY,true)))
            {
               showEventDialog(_dialogRefreshStock);
               return;
            }
         }
         if(menuId == 5)
         {
            if(window2_mc.act1.hitTestPoint(mouseX,mouseY,true))
            {
               showEventDialog(_dialogRobVisitor);
               return;
            }
            if(Boolean(window2_mc.kongMc.visible) && Boolean(window2_mc.kongMc.kongButton.hitTestPoint(mouseX,mouseY,true)))
            {
               kongregateLink();
               return;
            }
            if(Boolean(window2_mc.armorbt.visible) && Boolean(window2_mc.armorbt.hitTestPoint(mouseX,mouseY,true)))
            {
               armorLink();
               return;
            }
         }
         if(menuId == 6)
         {
            if(drag == false && Boolean(window2_mc.act1.hitTestPoint(mouseX,mouseY,true)))
            {
               if(game.ap < 5)
               {
                  noAp();
                  return;
               }
               sound_click1.play();
               window2_mc.actHelp.visible = true;
               equipMode = 1;
               updateInvSlots(-1);
               return;
            }
            if(drag == false && Boolean(window2_mc.act2.hitTestPoint(mouseX,mouseY,true)))
            {
               if(game.ap < 3)
               {
                  noAp();
                  return;
               }
               sound_click1.play();
               window2_mc.actHelp.visible = true;
               equipMode = 2;
               updateInvSlots(-1);
               return;
            }
         }
         if(equipButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            exitMenu();
            sound_scroll1.play();
            menuId = 6;
            window2_mc.gotoAndPlay("menu_equip");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procEquipMenu);
            return;
         }
         if(missionButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            exitMenu();
            sound_scroll1.play();
            menuId = 1;
            window2_mc.gotoAndPlay("menu_mission");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procMissionMenu);
            return;
         }
         if(castleButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            exitMenu();
            sound_scroll1.play();
            menuId = 2;
            window2_mc.gotoAndPlay("menu_castle");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procCastleMenu);
            return;
         }
         if(charaButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            exitMenu();
            sound_scroll1.play();
            menuId = 3;
            window2_mc.gotoAndPlay("menu_chara");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procCharaMenu);
            return;
         }
         if(shopButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            exitMenu();
            sound_scroll1.play();
            menuId = 4;
            window2_mc.gotoAndPlay("menu_shop");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procShopMenu);
            return;
         }
         if(medalButton.hitTestPoint(_loc2_,_loc3_,true))
         {
            exitMenu();
            sound_scroll1.play();
            menuId = 5;
            window2_mc.gotoAndPlay("menu_medal");
            window2_mc.x = 1000;
            window2_mc.addFrameScript(window2_mc.currentFrame - 1,procMedalMenu);
            return;
         }
         if(drag == false)
         {
            if(menuButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               pauseMenu();
               return;
            }
            if(window2_mc.closeButton.hitTestPoint(_loc2_,_loc3_,true))
            {
               exitMenu();
               sound_scroll1.play();
               menuId = 0;
               window2_mc.x = 1000;
               return;
            }
         }
         if(menuId == 4 || menuId == 6)
         {
            invDrag();
            if(equipMode)
            {
               endEquipMode();
            }
         }
      }
      
      public function gameStart() : *
      {
         if(player.devType[_pc] == _devHunter || player.devType[_pc] == _devRogue)
         {
            generatePlayer(1,1,_devGuard);
            player.name[1] = "Little Girl";
            player.potentialAim[1] = 0.7;
            player.potentialTeam[1] = 0.8;
            player.trait[1][TRAIT.BASE_AIMING] = 1;
            player.trait[1][TRAIT.BASE_TEAMWORK] = 1;
            player.pic[1] = 50;
            player.ai[1] = _aiFireAtWill;
            player.optBoss[1] = true;
            player.optWall[1] = true;
         }
         geneMedalBonus();
         if(medal[_medalHardcore2])
         {
            generateStuff(_invPlayer + 2,27);
         }
         if(game.optionAltStart == 1)
         {
            player.money[_pc] += 20000;
            game.apFix = 100;
            game.day = 10;
         }
         if(game.optionAltStart == 3)
         {
            game.invSlot = 16;
            generateStuff(_invPlayer + 0,101);
            generateStuff(_invPlayer + 8,121);
            generateStuff(_invPlayer + 1,102);
            generateStuff(_invPlayer + 2,103);
            generateStuff(_invPlayer + 3,104);
            generateStuff(_invPlayer + 4,105);
            generateStuff(_invPlayer + 5,106);
            generateStuff(_invPlayer + 6,107);
            generateStuff(_invPlayer + 7,108);
            generateStuff(_invPlayer + 9,110);
            generateStuff(_invPlayer + 10,117);
            generateStuff(_invPlayer + 11,112);
            generateStuff(_invPlayer + 12,113);
            generateStuff(_invPlayer + 13,114);
            generateStuff(_invPlayer + 14,115);
            generateStuff(_invPlayer + 15,116);
            player.trait[_pc][TRAIT.BIG_GUN] = 30;
            player.trait[_pc][TRAIT.RIFLE] = 30;
            player.trait[_pc][TRAIT.SHOTGUN] = 30;
            player.trait[_pc][TRAIT.SMALL_GUN] = 30;
         }
         if(debugStartDay)
         {
            game.day = debugStartDay;
            player.money[_pc] += debugStartDay * 1000;
         }
         if(game.optionAltStart == 2)
         {
            debug_survival(11);
         }
      }
      
      public function procUpdate() : *
      {
         window2_mc.titleText.text = "You game has been updated!\n[Last Update] 11/27 (Release 21)";
         window2_mc.updateText.editable = false;
         window2_mc.updateText.text += "* Experinces needed to gain weapon skills have been reduced.\n\n";
         window2_mc.updateText.text += "* Each spider will have different color variation.\n\n";
         window2_mc.updateText.text += "* Starting from day 40, there\'s a small chance an enemy will spawn bigger and tougher than normal.\n\n";
         window2_mc.updateText.text += "* Overal, enemies have slightly less HP than before after day 40.\n\n";
         window2_mc.updateText.text += "* When mounting a Mod on a weapon that already has the same kind of Mod, the effect will be reduced.\n\n";
         window2_mc.updateText.text += "* Inventory slots gained by medals will no longer require unkeep costs.\n\n";
         window2_mc.updateText.text += "* Fixed a bug where you could improve skills beyond their caps when playing certain classes.\n\n";
         window2_mc.updateText.text += "* Reloading to get different results for searching no longer works.\n\n";
         window2_mc.updateText.text += "* Arrows will not hit \"blood\" any more.\n\n";
         window2_mc.updateText.text += "* Some other fixes and balance adjustments.\n\n";
         window2_mc.updateText.text += "[Previous Update(11/24 release 20]\n\n";
         window2_mc.updateText.text += "This is a fix for the save-system. The next update will have some new features and should be released tomorrow.\n\n";
         window2_mc.updateText.text += "* Taunting will increase enemy HP intended now.\n\n";
         window2_mc.updateText.text += "* Changed the save system so that save-failure should no longer occur.\n\n";
         window2_mc.updateText.text += "* Party skill will be re-calculated after dismissing a friendly NPC.\n\n";
         window2_mc.updateText.text += "* Fixed some bugs and exploits.\n\n";
         window2_mc.updateText.text += "* Some balance adjustments.\n\n";
      }
      
      public function getClass(param1:int) : *
      {
         var _loc2_:Array = ["1","2","3","4"];
         if(param1 == _devHunter)
         {
            _loc2_ = ["Hunter","Hunters do not confine themselves to a single field. They aim at developing all around skills and receive many skills to choose from. ","Starts with Little Girl."];
         }
         if(param1 == _devRogue)
         {
            _loc2_ = ["Rogue","Rogues are the best money winners and also learn many useful skills that benefit the entire party.","Starts with Little Girl."];
         }
         if(param1 == _devSheriff)
         {
            _loc2_ = ["Sheriff","Sheriffs are the experts of shotgun. Though they somewhat lack teamwork, they are deadly at close range combat.","Starts with a shotgun."];
         }
         if(param1 == _devMilitia)
         {
            _loc2_ = ["Militia","Militia can use both rifles and big guns well. A militia can learn a wide variety of combat skills and a few party skills.","Starts with a rifle."];
         }
         if(param1 == _devSniper)
         {
            _loc2_ = ["Sniper","Snipers are simply the best damage dealers. They don\'t get any party skill nor are they good at shooting at crowds, but they can take out the enemies one by one pretty quickly.","Starts with a rifle."];
         }
         if(param1 == _devRanger)
         {
            _loc2_ = ["Ranger","Rangers use big guns effectively and are also good natural leaders. They can take out big crowds and raise the morale of the party with their party skills.","Starts with cheap worn HMG."];
         }
         if(param1 == _devDuelist)
         {
            _loc2_ = ["Duelist","Duelists are the specialists of small guns. They learn various tactics and skills to adapt to any combat situation.","Starts with a modified pistol."];
         }
         if(param1 == _devNoble)
         {
            _loc2_ = ["Noble","Nobles start with only few basic skills and no unique skills. However, they have the biggest potentials and possibilities.","Starts with a modified smg."];
         }
         if(param1 == _devGuard)
         {
            _loc2_ = ["Guardian","",""];
         }
         return _loc2_;
      }
      
      public function procMissionMenu() : *
      {
         window2_mc.stop();
         window2_mc.anime = true;
         window2_mc.actRef1.mouseEnabled = false;
         defHint = "\nRoll your mouse over an action to see details.";
         if(mission.hire == true)
         {
            window2_mc.act2.visible = false;
            window2_mc.actRef2.visible = false;
         }
         else
         {
            window2_mc.act2.visible = true;
            window2_mc.actRef2.visible = true;
         }
         window2_mc.actRef2.mouseEnabled = false;
         updateMissionMenu();
      }
   }
}

