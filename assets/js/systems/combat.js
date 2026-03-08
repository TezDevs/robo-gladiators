import { Projectile, Spark, circleIntersects } from "../entities/entities.js";
import { normalize } from "../core/utils.js";

export class CombatSystem {
  constructor(world) {
    this.world = world;
    this.projectiles = [];
    this.sparks = [];
    this.screenShake = 0;
  }

  update(dt) {
    this.projectiles.forEach((projectile) => projectile.update(dt, this.world));
    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);

    this.sparks.forEach((spark) => spark.update(dt));
    this.sparks = this.sparks.filter((spark) => spark.alive);

    this.screenShake = Math.max(0, this.screenShake - dt * 18);
  }

  fireProjectile(player, target, enemies) {
    if (!player.canFire()) {
      return false;
    }

    let aimVector;

    if (target) {
      aimVector = normalize(target.x - player.x, target.y - player.y);
    } else {
      const nearest = this.findNearestEnemy(player, enemies);
      if (nearest) {
        aimVector = normalize(nearest.x - player.x, nearest.y - player.y);
      } else {
        aimVector = player.lastAim;
      }
    }

    const hit = player.computeHit();
    const projectile = new Projectile(player.x, player.y, aimVector.x, aimVector.y, 520, hit.damage, hit.crit);

    this.projectiles.push(projectile);
    player.fireTimer = player.fireCooldown;
    return true;
  }

  findNearestEnemy(player, enemies) {
    let best = null;
    let bestDistance = Infinity;

    enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDistance) {
        bestDistance = dist;
        best = enemy;
      }
    });

    return best;
  }

  resolveProjectileHits(enemies, onEnemyHit) {
    this.projectiles.forEach((projectile) => {
      if (!projectile.alive) {
        return;
      }

      for (const enemy of enemies) {
        if (!enemy.alive) {
          continue;
        }

        if (circleIntersects(projectile, enemy)) {
          enemy.takeDamage(projectile.damage);
          projectile.alive = false;
          this.emitSparks(projectile.x, projectile.y, projectile.crit ? "#ffe16a" : "#d2efff");
          this.screenShake = Math.max(this.screenShake, projectile.crit ? 8 : 4);
          onEnemyHit(enemy, projectile.damage, projectile.crit);
          break;
        }
      }
    });
  }

  resolveEnemyContact(player, enemies, onPlayerHit) {
    enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }

      if (!circleIntersects(player, enemy, 1.2) || !enemy.canContactHit()) {
        return;
      }

      enemy.contactCooldown = 0.7;
      const baseDamage = enemy.damage;
      const dodged = player.shouldDodge();
      const finalDamage = dodged ? 0 : baseDamage;

      if (!dodged) {
        player.takeDamage(finalDamage);
      }

      this.emitSparks(player.x, player.y, dodged ? "#8bf5c4" : "#ff806b");
      this.screenShake = Math.max(this.screenShake, dodged ? 2 : 7);
      onPlayerHit(finalDamage, dodged, enemy);
    });
  }

  emitSparks(x, y, color) {
    for (let i = 0; i < 8; i += 1) {
      this.sparks.push(new Spark(x, y, color));
    }
  }

  getRenderState() {
    return {
      projectiles: this.projectiles,
      sparks: this.sparks,
      screenShake: this.screenShake
    };
  }
}
