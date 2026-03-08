import { clamp } from "../core/utils.js";

export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.world = world;
    this.flashTimer = 0;
  }

  triggerFlash() {
    this.flashTimer = 0.09;
  }

  renderFrame(state, dt) {
    const { ctx } = this;
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    const shake = state.screenShake || 0;
    const offsetX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const offsetY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    this.drawBackground(state.round);
    this.drawHazards(state.hazardState);
    this.drawEntities(state);
    this.drawEffects(state);

    ctx.restore();

    if (this.flashTimer > 0) {
      const alpha = clamp(this.flashTimer * 6, 0, 0.3);
      ctx.fillStyle = `rgba(255, 80, 60, ${alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawBackground(round) {
    const { ctx } = this;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#15233f");
    gradient.addColorStop(1, "#0b1220");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = `rgba(90, 180, 255, ${0.08 + round * 0.01})`;
    for (let x = 0; x < this.canvas.width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  drawHazards(hazardState) {
    const { ctx } = this;

    hazardState.tiles.forEach((tile) => {
      if (!tile.charged) {
        return;
      }
      const alpha = tile.timer < 0.2 ? 0.65 : 0.28;
      ctx.fillStyle = `rgba(84, 201, 255, ${alpha})`;
      ctx.fillRect(tile.x + 2, tile.y + 2, tile.size - 4, tile.size - 4);
    });

    const sweepLength = 320;
    const sx = hazardState.sweep.center.x;
    const sy = hazardState.sweep.center.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(hazardState.sweep.angle);
    ctx.fillStyle = `rgba(255, 70, 90, ${0.26 + hazardState.sweep.pulse * 0.35})`;
    ctx.fillRect(-sweepLength, -hazardState.sweep.width / 2, sweepLength * 2, hazardState.sweep.width);
    ctx.restore();

    hazardState.rotators.forEach((rotator) => {
      const x = sx + Math.cos(rotator.angle) * rotator.radius;
      const y = sy + Math.sin(rotator.angle) * rotator.radius;
      ctx.fillStyle = "#ffd15f";
      ctx.beginPath();
      ctx.arc(x, y, rotator.size, 0, Math.PI * 2);
      ctx.fill();
    });

    const bounds = hazardState.safeBounds;
    ctx.strokeStyle = "rgba(255, 102, 90, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  drawEntities(state) {
    const { ctx } = this;

    state.enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      this.drawHealthBar(enemy.x, enemy.y - enemy.radius - 10, 34, enemy.health / enemy.maxHealth, "#ff5e66");
    });

    const player = state.player;
    if (player.alive) {
      ctx.fillStyle = player.invulnTimer > 0 ? "#9ff8ff" : player.color;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      this.drawHealthBar(player.x, player.y - player.radius - 12, 40, player.health / player.maxHealth, "#58e8bf");
    }

    state.projectiles.forEach((projectile) => {
      ctx.fillStyle = projectile.crit ? "#ffe870" : "#ffffff";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawEffects(state) {
    const { ctx } = this;

    state.sparks.forEach((spark) => {
      ctx.globalAlpha = spark.life * 2;
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    state.floatingTexts.forEach((item) => {
      ctx.globalAlpha = clamp(item.life * 1.4, 0, 1);
      ctx.fillStyle = item.color;
      ctx.font = "bold 15px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(item.text, item.x, item.y);
      ctx.globalAlpha = 1;
    });
  }

  drawHealthBar(x, y, width, ratio, color) {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x - width / 2, y, width, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y, width * clamp(ratio, 0, 1), 6);
  }
}
