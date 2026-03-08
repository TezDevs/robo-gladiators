import { UPGRADE_COSTS } from "../core/constants.js";

export class UISystem {
  constructor(elements) {
    this.elements = elements;
  }

  showScreen(name) {
    const screens = {
      start: this.elements.startScreen,
      upgrade: this.elements.upgradeScreen,
      gameOver: this.elements.gameOverScreen
    };

    Object.values(screens).forEach((screen) => screen.classList.add("hidden"));

    if (screens[name]) {
      screens[name].classList.remove("hidden");
    }
  }

  setHudVisible(visible) {
    this.elements.hud.classList.toggle("hidden", !visible);
    this.elements.mobileControls.classList.toggle("hidden", !visible || !this.isTouchPreferred());
  }

  isTouchPreferred() {
    return window.matchMedia("(pointer: coarse)").matches;
  }

  updateHud(state) {
    this.elements.hudName.textContent = state.name;
    this.elements.hudHealth.textContent = `${Math.ceil(state.health)} / ${Math.ceil(state.maxHealth)}`;
    this.elements.hudScrap.textContent = `${state.scrap}`;
    this.elements.hudRound.textContent = `${state.round}`;
    this.elements.hudStatus.textContent = state.status;
  }

  renderUpgradeSummary(player, scrap, round) {
    this.elements.upgradeSummary.textContent = `${player.name} | Scrap: ${scrap} | Entering Round ${round}`;

    this.elements.upgChassis.textContent = `Chassis Lv.${player.levels.chassis} (+max health) - ${UPGRADE_COSTS.chassis} scrap`;
    this.elements.upgWeapon.textContent = `Weapon Lv.${player.levels.weapon} (+damage) - ${UPGRADE_COSTS.weapon} scrap`;
    this.elements.upgSensor.textContent = `Sensor Lv.${player.levels.sensor} (+crit +dodge) - ${UPGRADE_COSTS.sensor} scrap`;
  }

  renderGameOver(victory, summary) {
    this.elements.gameOverTitle.textContent = victory ? "Arena Cleared" : "Robot Destroyed";
    this.elements.gameOverSummary.textContent = summary;
  }
}
