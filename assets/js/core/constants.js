export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;
export const PLAYER_RADIUS = 16;
export const ENEMY_RADIUS = 14;
export const PROJECTILE_RADIUS = 4;

export const MAX_ROUNDS = 6;

export const BASE_PLAYER_STATS = {
  maxHealth: 120,
  moveSpeed: 220,
  damage: 18,
  critChance: 0.08,
  dodgeChance: 0.05,
  fireCooldown: 0.3
};

export const ENEMY_ARCHETYPES = [
  { name: "Scrap Scout", speed: 95, health: 60, damage: 10, color: "#ff7b5f" },
  { name: "Rust Bruiser", speed: 70, health: 100, damage: 16, color: "#ff5f5f" },
  { name: "Volt Hunter", speed: 115, health: 70, damage: 12, color: "#ff9f45" }
];

export const BOSS_ARCHETYPE = {
  name: "Titan Overcore",
  speed: 82,
  health: 400,
  damage: 24,
  color: "#ff2f64"
};

export const ROUND_CONFIG = {
  baseEnemies: 3,
  perRoundIncrease: 1,
  rewardBase: 35,
  rewardStep: 14
};

export const UPGRADE_COSTS = {
  chassis: 45,
  weapon: 45,
  sensor: 55
};

export const SAFE_BOUNDS_SHRINK_PER_SECOND = 8;
