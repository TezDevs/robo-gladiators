import { SAFE_BOUNDS_SHRINK_PER_SECOND } from "../core/constants.js";
import { clamp, distance, randomBetween, randomInt } from "../core/utils.js";

export class HazardSystem {
  constructor(world) {
    this.world = world;
    this.activeRound = 1;

    this.sweep = {
      angle: 0,
      speed: 1.65,
      width: 22,
      pulse: 0,
      hitCooldown: 0
    };

    this.tiles = [];
    this.tileTimer = 0;
    this.tileSize = 96;

    this.rotators = [];

    this.boundaryDamageTick = 0;
    this.shrinkMinPadding = 58;
  }

  startRound(round) {
    this.activeRound = round;
    this.sweep.angle = randomBetween(0, Math.PI * 2);
    this.sweep.speed = 1.1 + round * 0.17;
    this.sweep.width = Math.max(14, 24 - round);
    this.sweep.hitCooldown = 0;

    this.tileTimer = 0.6;
    this.tiles = this.buildTiles();

    this.rotators = [];
    const rotatorCount = Math.min(4, 1 + Math.floor(round / 2));
    for (let i = 0; i < rotatorCount; i += 1) {
      this.rotators.push({
        angle: (Math.PI * 2 * i) / rotatorCount,
        radius: 90 + i * 32,
        speed: 0.8 + round * 0.1 + i * 0.04,
        size: 10 + i * 1.5,
        damage: 9 + round * 2
      });
    }

    this.boundaryDamageTick = 0;
    this.resetSafeBounds();
  }

  resetSafeBounds() {
    this.world.safeBounds.x = 30;
    this.world.safeBounds.y = 30;
    this.world.safeBounds.width = this.world.width - 60;
    this.world.safeBounds.height = this.world.height - 60;
  }

  buildTiles() {
    const tiles = [];
    const cols = Math.floor(this.world.width / this.tileSize);
    const rows = Math.floor(this.world.height / this.tileSize);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        tiles.push({
          x: x * this.tileSize,
          y: y * this.tileSize,
          size: this.tileSize,
          charged: false,
          timer: randomBetween(0.2, 1.2)
        });
      }
    }

    return tiles;
  }

  update(dt, player, onHit) {
    this.sweep.angle += this.sweep.speed * dt;
    this.sweep.pulse = Math.abs(Math.sin(this.sweep.angle * 1.7));
    this.sweep.hitCooldown = Math.max(0, this.sweep.hitCooldown - dt);

    this.tileTimer -= dt;
    if (this.tileTimer <= 0) {
      this.tileTimer = clamp(1.3 - this.activeRound * 0.07, 0.55, 1.15);
      this.tiles.forEach((tile) => {
        tile.charged = false;
      });

      const targetTiles = 4 + Math.floor(this.activeRound * 0.7);
      for (let i = 0; i < targetTiles; i += 1) {
        const tile = this.tiles[randomInt(0, this.tiles.length - 1)];
        tile.charged = true;
        tile.timer = 0.45;
      }
    }

    this.tiles.forEach((tile) => {
      if (tile.charged) {
        tile.timer -= dt;
      }
    });

    this.rotators.forEach((rotator) => {
      rotator.angle += rotator.speed * dt;
    });

    this.shrinkBounds(dt);
    this.applyDamageChecks(dt, player, onHit);
  }

  shrinkBounds(dt) {
    const maxPaddingX = (this.world.width / 2) - this.shrinkMinPadding;
    const maxPaddingY = (this.world.height / 2) - this.shrinkMinPadding;
    const maxPadding = Math.min(maxPaddingX, maxPaddingY);

    const nextPadding = clamp(
      this.world.safeBounds.x + SAFE_BOUNDS_SHRINK_PER_SECOND * dt,
      30,
      maxPadding
    );

    this.world.safeBounds.x = nextPadding;
    this.world.safeBounds.y = nextPadding * (this.world.height / this.world.width);
    this.world.safeBounds.width = this.world.width - this.world.safeBounds.x * 2;
    this.world.safeBounds.height = this.world.height - this.world.safeBounds.y * 2;
  }

  applyDamageChecks(dt, player, onHit) {
    this.checkLaser(player, onHit);
    this.checkElectricTiles(player, onHit);
    this.checkRotators(player, onHit);
    this.checkBoundary(player, dt, onHit);
  }

  checkLaser(player, onHit) {
    const centerX = this.world.width / 2;
    const centerY = this.world.height / 2;
    const dx = player.x - centerX;
    const dy = player.y - centerY;

    const projection = Math.abs(dx * Math.sin(this.sweep.angle) - dy * Math.cos(this.sweep.angle));
    const radial = Math.hypot(dx, dy);

    if (radial < 260 && projection < this.sweep.width && this.sweep.hitCooldown <= 0) {
      this.sweep.hitCooldown = 0.45;
      onHit(7 + this.activeRound, "laser");
    }
  }

  checkElectricTiles(player, onHit) {
    const tile = this.tiles.find((candidate) => (
      candidate.charged &&
      player.x > candidate.x && player.x < candidate.x + candidate.size &&
      player.y > candidate.y && player.y < candidate.y + candidate.size &&
      candidate.timer < 0.2
    ));

    if (tile) {
      tile.timer = 0.85;
      onHit(10 + this.activeRound, "electric");
    }
  }

  checkRotators(player, onHit) {
    const center = { x: this.world.width / 2, y: this.world.height / 2 };

    for (const rotator of this.rotators) {
      const hitPoint = {
        x: center.x + Math.cos(rotator.angle) * rotator.radius,
        y: center.y + Math.sin(rotator.angle) * rotator.radius
      };

      if (distance(hitPoint, player) < rotator.size + player.radius) {
        onHit(rotator.damage, "rotator");
        break;
      }
    }
  }

  checkBoundary(player, dt, onHit) {
    const bounds = this.world.safeBounds;
    const outside = (
      player.x < bounds.x ||
      player.x > bounds.x + bounds.width ||
      player.y < bounds.y ||
      player.y > bounds.y + bounds.height
    );

    if (!outside) {
      this.boundaryDamageTick = 0;
      return;
    }

    this.boundaryDamageTick += dt;
    if (this.boundaryDamageTick > 0.25) {
      this.boundaryDamageTick = 0;
      onHit(8 + this.activeRound, "boundary");
    }
  }

  getRenderState() {
    const center = { x: this.world.width / 2, y: this.world.height / 2 };
    return {
      sweep: {
        angle: this.sweep.angle,
        width: this.sweep.width,
        pulse: this.sweep.pulse,
        center
      },
      tiles: this.tiles,
      rotators: this.rotators,
      safeBounds: this.world.safeBounds
    };
  }
}
