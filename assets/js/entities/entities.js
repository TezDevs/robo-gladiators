import { ENEMY_RADIUS, PLAYER_RADIUS, PROJECTILE_RADIUS } from "../core/constants.js";
import { clamp, distance, normalize, randomBetween, randomInt } from "../core/utils.js";

class Entity {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.maxHealth = 100;
    this.health = 100;
    this.alive = true;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
    }
  }
}

export class Player extends Entity {
  constructor(name, stats, world) {
    super(world.width / 2, world.height / 2, PLAYER_RADIUS, "#5cd8ff");
    this.name = name;
    this.world = world;
    this.baseStats = stats;

    this.maxHealth = stats.maxHealth;
    this.health = stats.maxHealth;
    this.damage = stats.damage;
    this.moveSpeed = stats.moveSpeed;
    this.critChance = stats.critChance;
    this.dodgeChance = stats.dodgeChance;
    this.fireCooldown = stats.fireCooldown;

    this.fireTimer = 0;
    this.invulnTimer = 0;
    this.lastAim = { x: 1, y: 0 };

    this.levels = {
      chassis: 0,
      weapon: 0,
      sensor: 0
    };
  }

  resetForNewRun() {
    this.maxHealth = this.baseStats.maxHealth;
    this.health = this.maxHealth;
    this.damage = this.baseStats.damage;
    this.moveSpeed = this.baseStats.moveSpeed;
    this.critChance = this.baseStats.critChance;
    this.dodgeChance = this.baseStats.dodgeChance;
    this.fireCooldown = this.baseStats.fireCooldown;
    this.fireTimer = 0;
    this.invulnTimer = 0;
    this.alive = true;
    this.levels = { chassis: 0, weapon: 0, sensor: 0 };
    this.x = this.world.width / 2;
    this.y = this.world.height / 2;
  }

  update(dt, movement) {
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    this.x += movement.x * this.moveSpeed * dt;
    this.y += movement.y * this.moveSpeed * dt;

    const minX = this.world.safeBounds.x + this.radius;
    const maxX = this.world.safeBounds.x + this.world.safeBounds.width - this.radius;
    const minY = this.world.safeBounds.y + this.radius;
    const maxY = this.world.safeBounds.y + this.world.safeBounds.height - this.radius;

    this.x = clamp(this.x, minX, maxX);
    this.y = clamp(this.y, minY, maxY);

    if (movement.x !== 0 || movement.y !== 0) {
      this.lastAim = normalize(movement.x, movement.y);
    }
  }

  canFire() {
    return this.fireTimer <= 0;
  }

  applyUpgrade(type) {
    if (type === "chassis") {
      this.levels.chassis += 1;
      this.maxHealth += 28;
      this.health = Math.min(this.maxHealth, this.health + 28);
      return;
    }

    if (type === "weapon") {
      this.levels.weapon += 1;
      this.damage += 8;
      return;
    }

    if (type === "sensor") {
      this.levels.sensor += 1;
      this.critChance = Math.min(0.55, this.critChance + 0.04);
      this.dodgeChance = Math.min(0.45, this.dodgeChance + 0.035);
      this.fireCooldown = Math.max(0.14, this.fireCooldown - 0.012);
    }
  }

  shouldDodge() {
    return Math.random() < this.dodgeChance;
  }

  computeHit() {
    const crit = Math.random() < this.critChance;
    const baseDamage = randomInt(Math.max(8, this.damage - 6), this.damage + 3);
    return {
      damage: crit ? Math.floor(baseDamage * 1.75) : baseDamage,
      crit
    };
  }
}

export class Enemy extends Entity {
  constructor(archetype, round, world, boss = false) {
    const spawnX = randomBetween(world.safeBounds.x + ENEMY_RADIUS, world.safeBounds.x + world.safeBounds.width - ENEMY_RADIUS);
    const spawnY = randomBetween(world.safeBounds.y + ENEMY_RADIUS, world.safeBounds.y + world.safeBounds.height - ENEMY_RADIUS);

    super(spawnX, spawnY, boss ? ENEMY_RADIUS * 1.5 : ENEMY_RADIUS, archetype.color);

    this.name = archetype.name;
    this.world = world;
    this.speed = archetype.speed + round * 4;
    this.damage = archetype.damage + Math.floor(round * 1.35);
    this.maxHealth = boss ? archetype.health + round * 38 : archetype.health + round * 16;
    this.health = this.maxHealth;
    this.contactCooldown = randomBetween(0, 0.25);
    this.reward = boss ? 120 : 26;
    this.boss = boss;
  }

  update(dt, player) {
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);

    const vector = normalize(player.x - this.x, player.y - this.y);
    this.x += vector.x * this.speed * dt;
    this.y += vector.y * this.speed * dt;

    const minX = this.world.safeBounds.x + this.radius;
    const maxX = this.world.safeBounds.x + this.world.safeBounds.width - this.radius;
    const minY = this.world.safeBounds.y + this.radius;
    const maxY = this.world.safeBounds.y + this.world.safeBounds.height - this.radius;

    this.x = clamp(this.x, minX, maxX);
    this.y = clamp(this.y, minY, maxY);
  }

  canContactHit() {
    return this.contactCooldown <= 0;
  }
}

export class Projectile {
  constructor(x, y, dirX, dirY, speed, damage, crit = false) {
    this.x = x;
    this.y = y;
    this.radius = PROJECTILE_RADIUS;
    this.dx = dirX;
    this.dy = dirY;
    this.speed = speed;
    this.damage = damage;
    this.crit = crit;
    this.alive = true;
    this.life = 1.2;
  }

  update(dt, world) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;

    if (
      this.x < world.safeBounds.x ||
      this.x > world.safeBounds.x + world.safeBounds.width ||
      this.y < world.safeBounds.y ||
      this.y > world.safeBounds.y + world.safeBounds.height
    ) {
      this.alive = false;
    }
  }
}

export class FloatingText {
  constructor(text, x, y, color = "#ffffff") {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 0.8;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    this.y -= 34 * dt;
    if (this.life <= 0) {
      this.alive = false;
    }
  }
}

export class Spark {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.dx = randomBetween(-1, 1);
    this.dy = randomBetween(-1, 1);
    this.speed = randomBetween(60, 130);
    this.life = randomBetween(0.18, 0.35);
    this.radius = randomBetween(1.5, 3.2);
    this.color = color;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
  }
}

export function circleIntersects(a, b, bonus = 0) {
  return distance(a, b) < a.radius + b.radius + bonus;
}
