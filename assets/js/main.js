import { RoboGladiatorGame } from "./core/game.js";

const elements = {
  canvas: document.getElementById("game-canvas"),
  startScreen: document.getElementById("start-screen"),
  upgradeScreen: document.getElementById("upgrade-screen"),
  gameOverScreen: document.getElementById("game-over-screen"),
  hud: document.getElementById("hud"),
  mobileControls: document.getElementById("mobile-controls"),

  robotName: document.getElementById("robot-name"),
  startBtn: document.getElementById("start-btn"),
  restartBtn: document.getElementById("restart-btn"),

  upgradeSummary: document.getElementById("upgrade-summary"),
  nextRoundBtn: document.getElementById("next-round-btn"),
  upgChassis: document.getElementById("upg-chassis"),
  upgWeapon: document.getElementById("upg-weapon"),
  upgSensor: document.getElementById("upg-sensor"),

  gameOverTitle: document.getElementById("game-over-title"),
  gameOverSummary: document.getElementById("game-over-summary"),

  hudName: document.getElementById("hud-name"),
  hudHealth: document.getElementById("hud-health"),
  hudScrap: document.getElementById("hud-scrap"),
  hudRound: document.getElementById("hud-round"),
  hudStatus: document.getElementById("hud-status"),

  movePad: document.getElementById("move-pad"),
  fireBtn: document.getElementById("fire-btn")
};

const game = new RoboGladiatorGame(elements);
game.start();
