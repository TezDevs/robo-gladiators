import {
  BASE_PLAYER_STATS,
  BOSS_ARCHETYPE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ENEMY_ARCHETYPES,
  MAX_ROUNDS,
  ROUND_CONFIG,
  UPGRADE_COSTS
} from "./constants.js";
import { randomInt } from "./utils.js";
import { Enemy, FloatingText, Player } from "../entities/entities.js";
import { AudioSystem } from "../systems/audio.js";
import { CombatSystem } from "../systems/combat.js";
import { HazardSystem } from "../systems/hazards.js";
import { InputManager } from "../systems/input.js";
import { Renderer } from "../systems/renderer.js";
import { UISystem } from "../systems/ui.js";

const GameState = {
  START: "start",
  RUNNING: "running",
  UPGRADE: "upgrade",
  GAME_OVER: "game_over",
  PAUSED: "paused"
};

export class RoboGladiatorGame {
  constructor(elements) {
    this.elements = elements;
    this.canvas = elements.canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.world = {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      safeBounds: {
        x: 30,
        y: 30,
        width: CANVAS_WIDTH - 60,
        height: CANVAS_HEIGHT - 60
      }
    };

    this.ui = new UISystem(elements);
    this.input = new InputManager(this.canvas, elements.movePad, elements.fireBtn);
    this.renderer = new Renderer(this.canvas, this.world);
    this.audio = new AudioSystem();
    this.combat = new CombatSystem(this.world);
    this.hazards = new HazardSystem(this.world);

    this.state = GameState.START;
    this.previousState = GameState.START;

    this.player = null;
    this.enemies = [];
    this.floatingTexts = [];

    this.round = 1;
    this.scrap = 0;
    this.highScore = Number(localStorage.getItem("robo_highscore") || 0);

    this.lastFrame = performance.now();
    this.bindUI();

    this.ui.showScreen("start");
    this.ui.setHudVisible(false);
    this.resizeCanvasDisplay();
    window.addEventListener("resize", () => this.resizeCanvasDisplay());
    window.addEventListener("blur", () => this.pause());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      }
    });
  }

  bindUI() {
    this.elements.startBtn.addEventListener("click", () => {
      if (this.state === GameState.PAUSED) {
        this.resume();
        return;
      }
      const name = this.elements.robotName.value.trim() || "Robo-Unit";
      this.startNewRun(name);
    });

    this.elements.restartBtn.addEventListener("click", () => {
      this.ui.showScreen("start");
      this.ui.setHudVisible(false);
      this.state = GameState.START;
    });

    this.elements.nextRoundBtn.addEventListener("click", () => {
      this.state = GameState.RUNNING;
      this.ui.showScreen(null);
      this.spawnRoundEnemies();
      this.hazards.startRound(this.round);
      this.ui.setHudVisible(true);
      this.audio.play("roundStart");
    });

    this.elements.upgChassis.addEventListener("click", () => this.buyUpgrade("chassis"));
    this.elements.upgWeapon.addEventListener("click", () => this.buyUpgrade("weapon"));
    this.elements.upgSensor.addEventListener("click", () => this.buyUpgrade("sensor"));
  }

  start() {
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastFrame) / 1000, 0.033);
    this.lastFrame = timestamp;

    if (this.state === GameState.RUNNING) {
      this.updateRunning(dt);
    }
    if (this.state === GameState.PAUSED && this.input.consumePauseRequest()) {
      this.resume();
    }

    this.updateEffects(dt);
    this.render(dt);
    this.updateHud();

    requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
  }

  updateRunning(dt) {
    if (this.input.consumePauseRequest()) {
      this.pause();
      return;
    }

    const movement = this.input.getMovementVector();
    this.player.update(dt, movement);

    const fired = this.input.consumeFireRequest();
    if (fired) {
      const target = this.input.pointerActive ? this.input.pointer : null;
      const didShoot = this.combat.fireProjectile(this.player, target, this.enemies);
      if (didShoot) {
        this.audio.play("fire");
      }
    }

    this.enemies.forEach((enemy) => enemy.update(dt, this.player));

    this.combat.update(dt);
    this.combat.resolveProjectileHits(this.enemies, (enemy, damage, crit) => {
      this.floatingTexts.push(new FloatingText(`${crit ? "CRIT " : ""}-${damage}`, enemy.x, enemy.y - enemy.radius, crit ? "#ffe17b" : "#ecf6ff"));
      this.audio.play(crit ? "crit" : "hit");
      if (!enemy.alive) {
        this.scrap += enemy.reward;
        this.floatingTexts.push(new FloatingText(`+${enemy.reward} scrap`, enemy.x, enemy.y - 16, "#86ffc9"));
        this.audio.play("destroy");
      }
    });

    this.combat.resolveEnemyContact(this.player, this.enemies, (damage, dodged, enemy) => {
      if (dodged) {
        this.floatingTexts.push(new FloatingText("DODGE", this.player.x, this.player.y - 22, "#8bf5c4"));
      } else {
        this.floatingTexts.push(new FloatingText(`-${damage}`, this.player.x, this.player.y - 20, "#ffaf9f"));
        this.renderer.triggerFlash();
        this.audio.play("hurt");
      }

      if (!enemy.alive) {
        this.scrap += enemy.reward;
      }
    });

    this.hazards.update(dt, this.player, (damage, source) => {
      this.handlePlayerDamage(damage, source);
    });

    this.enemies = this.enemies.filter((enemy) => enemy.alive);

    if (!this.player.alive) {
      this.endRun(false);
      return;
    }

    if (this.enemies.length === 0) {
      if (this.round >= MAX_ROUNDS) {
        this.endRun(true);
      } else {
        this.round += 1;
        const reward = ROUND_CONFIG.rewardBase + this.round * ROUND_CONFIG.rewardStep;
        this.scrap += reward;
        this.openUpgradeScreen(reward);
      }
    }
  }

  updateEffects(dt) {
    this.floatingTexts.forEach((item) => item.update(dt));
    this.floatingTexts = this.floatingTexts.filter((item) => item.alive);
  }

  render(dt) {
    this.renderer.renderFrame({
      player: this.player || { alive: false },
      enemies: this.enemies,
      projectiles: this.combat.getRenderState().projectiles,
      sparks: this.combat.getRenderState().sparks,
      floatingTexts: this.floatingTexts,
      hazardState: this.hazards.getRenderState(),
      screenShake: this.combat.getRenderState().screenShake,
      round: this.round
    }, dt);
  }

  updateHud() {
    if (!this.player) {
      return;
    }

    const status = this.state === GameState.RUNNING
      ? "Combat"
      : this.state === GameState.UPGRADE
        ? "Upgrade"
        : this.state === GameState.PAUSED
          ? "Paused"
          : "Standby";

    this.ui.updateHud({
      name: this.player.name,
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      scrap: this.scrap,
      round: this.round,
      status
    });
  }

  startNewRun(name) {
    this.player = new Player(name, BASE_PLAYER_STATS, this.world);
    this.player.resetForNewRun();
    this.round = 1;
    this.scrap = 18;
    this.enemies = [];
    this.floatingTexts = [];
    this.combat.projectiles = [];
    this.combat.sparks = [];

    this.state = GameState.RUNNING;
    this.ui.showScreen(null);
    this.ui.setHudVisible(true);
    this.spawnRoundEnemies();
    this.hazards.startRound(this.round);
    this.audio.play("start");
  }

  spawnRoundEnemies() {
    this.enemies = [];

    if (this.round === MAX_ROUNDS) {
      this.enemies.push(new Enemy(BOSS_ARCHETYPE, this.round, this.world, true));
      for (let i = 0; i < 2; i += 1) {
        const archetype = ENEMY_ARCHETYPES[randomInt(0, ENEMY_ARCHETYPES.length - 1)];
        this.enemies.push(new Enemy(archetype, this.round, this.world));
      }
      return;
    }

    const enemyCount = ROUND_CONFIG.baseEnemies + (this.round - 1) * ROUND_CONFIG.perRoundIncrease;
    for (let i = 0; i < enemyCount; i += 1) {
      const archetype = ENEMY_ARCHETYPES[randomInt(0, ENEMY_ARCHETYPES.length - 1)];
      this.enemies.push(new Enemy(archetype, this.round, this.world));
    }
  }

  openUpgradeScreen(roundReward) {
    this.state = GameState.UPGRADE;
    this.ui.showScreen("upgrade");
    this.ui.renderUpgradeSummary(this.player, this.scrap, this.round);
    this.elements.upgradeSummary.textContent += ` | Round clear bonus: +${roundReward} scrap`;
    this.audio.play("upgradeOpen");
  }

  buyUpgrade(type) {
    if (this.state !== GameState.UPGRADE) {
      return;
    }

    const cost = UPGRADE_COSTS[type];
    if (this.scrap < cost) {
      this.floatingTexts.push(new FloatingText("Not enough scrap", this.world.width / 2, this.world.height / 2, "#ffd17d"));
      return;
    }

    this.scrap -= cost;
    this.player.applyUpgrade(type);
    this.ui.renderUpgradeSummary(this.player, this.scrap, this.round);
    this.audio.play("upgradeBuy");
  }

  handlePlayerDamage(amount, source) {
    if (this.player.invulnTimer > 0) {
      return;
    }

    if (this.player.shouldDodge() && source !== "boundary") {
      this.floatingTexts.push(new FloatingText("DODGE", this.player.x, this.player.y - 18, "#8bf5c4"));
      this.player.invulnTimer = 0.15;
      return;
    }

    this.player.takeDamage(amount);
    this.player.invulnTimer = source === "boundary" ? 0.09 : 0.2;
    this.renderer.triggerFlash();
    this.floatingTexts.push(new FloatingText(`-${amount}`, this.player.x, this.player.y - 16, "#ff9b8b"));
    this.audio.play("hazard");
  }

  pause() {
    if (this.state !== GameState.RUNNING) {
      return;
    }
    this.previousState = this.state;
    this.state = GameState.PAUSED;
    this.ui.showScreen("start");
    this.elements.startBtn.textContent = "Resume";
    this.ui.setHudVisible(true);
  }

  resume() {
    if (this.state !== GameState.PAUSED) {
      return;
    }
    this.elements.startBtn.textContent = "Start Arena";
    this.ui.showScreen(null);
    this.state = this.previousState;
  }

  endRun(victory) {
    this.state = GameState.GAME_OVER;
    this.ui.showScreen("gameOver");
    this.ui.setHudVisible(false);

    if (this.scrap > this.highScore) {
      this.highScore = this.scrap;
      localStorage.setItem("robo_highscore", String(this.highScore));
      localStorage.setItem("robo_name", this.player.name);
    }

    const summary = `${this.player.name} reached round ${this.round}, finished with ${this.scrap} scrap. High score: ${this.highScore}.`;
    this.ui.renderGameOver(victory, summary);
    this.audio.play(victory ? "victory" : "defeat");
  }

  resizeCanvasDisplay() {
    // Keep an exact 16:9 playfield for consistent collision and future touch mapping.
    const parentWidth = this.canvas.parentElement.clientWidth;
    this.canvas.style.width = `${Math.min(parentWidth, 1040)}px`;
  }
}
