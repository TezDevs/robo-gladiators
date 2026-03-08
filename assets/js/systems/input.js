import { normalize } from "../core/utils.js";

export class InputManager {
  constructor(canvas, movePadEl, fireBtnEl) {
    this.canvas = canvas;
    this.movePadEl = movePadEl;
    this.fireBtnEl = fireBtnEl;

    this.keys = new Set();
    this.touchDirections = new Set();
    this.pointer = { x: canvas.width / 2, y: canvas.height / 2 };
    this.pointerActive = false;
    this.fireRequested = false;
    this.pauseRequested = false;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
      if (key === "p") {
        this.pauseRequested = true;
      }
      this.keys.add(key);
      if (key === " ") {
        this.fireRequested = true;
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    const updatePointer = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.pointer.x = (event.clientX - rect.left) * scaleX;
      this.pointer.y = (event.clientY - rect.top) * scaleY;
    };

    this.canvas.addEventListener("mousemove", (event) => {
      updatePointer(event);
      this.pointerActive = true;
    });

    this.canvas.addEventListener("mousedown", (event) => {
      updatePointer(event);
      this.pointerActive = true;
      this.fireRequested = true;
    });

    this.canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      updatePointer(touch);
      this.pointerActive = true;
      this.fireRequested = true;
    }, { passive: false });

    this.bindTouchControls();
  }

  bindTouchControls() {
    if (!this.movePadEl || !this.fireBtnEl) {
      return;
    }

    const setDirection = (dir, active) => {
      if (active) {
        this.touchDirections.add(dir);
      } else {
        this.touchDirections.delete(dir);
      }
    };

    this.movePadEl.querySelectorAll("button").forEach((button) => {
      const { dir } = button.dataset;
      const onDown = (event) => {
        event.preventDefault();
        setDirection(dir, true);
      };
      const onUp = (event) => {
        event.preventDefault();
        setDirection(dir, false);
      };
      button.addEventListener("touchstart", onDown, { passive: false });
      button.addEventListener("touchend", onUp, { passive: false });
      button.addEventListener("touchcancel", onUp, { passive: false });
      button.addEventListener("mousedown", onDown);
      button.addEventListener("mouseup", onUp);
      button.addEventListener("mouseleave", onUp);
    });

    const triggerFire = (event) => {
      event.preventDefault();
      this.fireRequested = true;
      this.pointerActive = false;
    };

    this.fireBtnEl.addEventListener("touchstart", triggerFire, { passive: false });
    this.fireBtnEl.addEventListener("mousedown", triggerFire);
  }

  consumePauseRequest() {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }

  consumeFireRequest() {
    const requested = this.fireRequested;
    this.fireRequested = false;
    return requested;
  }

  getMovementVector() {
    let x = 0;
    let y = 0;

    if (this.keys.has("w") || this.keys.has("arrowup") || this.touchDirections.has("up")) {
      y -= 1;
    }
    if (this.keys.has("s") || this.keys.has("arrowdown") || this.touchDirections.has("down")) {
      y += 1;
    }
    if (this.keys.has("a") || this.keys.has("arrowleft") || this.touchDirections.has("left")) {
      x -= 1;
    }
    if (this.keys.has("d") || this.keys.has("arrowright") || this.touchDirections.has("right")) {
      x += 1;
    }

    return normalize(x, y);
  }
}
