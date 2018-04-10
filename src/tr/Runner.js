import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { getFPS } from './RuntimeConfig';
import { getImageSprite, setImageSprite, loadImageSprite } from './ImageSprite';
import { getTimeStamp } from './utils';
import DistanceMeter from './DistanceMeter';
import Horizon from './Horizon';
import Trex, { checkForCollision } from './Trex';

/**
 * T-Rex runner.
 * @param {string} outerContainerId Outer containing element id.
 * @param {Object} options
 * @constructor
 * @export
 */
export default class Runner {
  static config = {
    ACCELERATION: 0.001,
    BG_CLOUD_SPEED: 0.2,
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_BLINK_COUNT: 3,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_SPEED: 13,
    MIN_JUMP_HEIGHT: 35,
    RESOURCE_TEMPLATE_ID: 'audio-resources',
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3
  };

  static classes = {
    CANVAS: 'runner-canvas',
    CONTAINER: 'runner-container',
    CRASHED: 'crashed',
    ICON: 'icon-offline',
    SNACKBAR: 'snackbar',
    SNACKBAR_SHOW: 'snackbar-show'
  };

  static spriteDefinition = {
    CACTUS_LARGE: { x: 332, y: 2 },
    CACTUS_SMALL: { x: 228, y: 2 },
    CLOUD: { x: 86, y: 2 },
    HORIZON: { x: 2, y: 54 },
    MOON: { x: 484, y: 2 },
    PTERODACTYL: { x: 134, y: 2 },
    RESTART: { x: 2, y: 2 },
    TEXT_SPRITE: { x: 655, y: 2 },
    TREX: { x: 848, y: 2 },
    STAR: { x: 645, y: 2 }
  };

  /**
   * Key code mapping.
   * @enum {Object}
   */
  static keycodes = {
    JUMP: { 38: 1, 32: 1 }, // Up, spacebar
    DUCK: { 40: 1 } // Down
  };

  /**
   * Runner event names.
   * @enum {string}
   */
  static events = {
    ANIM_END: 'webkitAnimationEnd',
    CLICK: 'click',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    RESIZE: 'resize',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
    FOCUS: 'focus',
    LOAD: 'load'
  };

  constructor(outerContainerId, options) {
    // Singleton
    if (Runner.instance_) {
      return Runner.instance_;
    }
    Runner.instance_ = this;

    this.outerContainerEl = document.querySelector(outerContainerId);
    this.containerEl = null;
    this.snackbarEl = null;
    this.detailsButton = this.outerContainerEl.querySelector('#details-button');

    this.config = options || Runner.config;

    this.dimensions = {
      WIDTH: CANVAS_WIDTH,
      HEIGHT: CANVAS_HEIGHT
    };

    this.canvas = null;
    this.canvasCtx = null;

    this.tRex = null;

    this.distanceMeter = null;
    this.distanceRan = 0;

    this.highestScore = 0;

    this.time = 0;
    this.runningTime = 0;
    this.msPerFrame = 1000 / getFPS();
    this.currentSpeed = this.config.SPEED;

    this.obstacles = [];

    this.activated = false; // Whether the easter egg has been activated.
    this.playing = false; // Whether the game is currently in play state.
    this.crashed = false;
    this.paused = false;
    this.resizeTimerId_ = null;

    this.playCount = 0;

    // Images.
    this.images = {};
    this.imagesLoaded = 0;
  }

  async init() {
    await loadImageSprite();
    this.spriteDef = Runner.spriteDefinition;
    // Hide the static icon.
    document.querySelector(`.${Runner.classes.ICON}`).style.visibility =
      'hidden';

    this.adjustDimensions();
    this.setSpeed();

    this.containerEl = document.createElement('div');
    this.containerEl.className = Runner.classes.CONTAINER;

    // Player canvas container.
    this.canvas = createCanvas(
      this.containerEl,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT,
      Runner.classes.PLAYER
    );

    this.canvasCtx = this.canvas.getContext('2d');
    this.canvasCtx.fillStyle = '#f7f7f7';
    this.canvasCtx.fill();
    Runner.updateCanvasScaling(this.canvas);

    // Horizon contains clouds, obstacles and the ground.
    this.horizon = new Horizon(
      this.canvas,
      this.spriteDef,
      this.dimensions,
      this.config.GAP_COEFFICIENT
    );

    // Distance meter
    this.distanceMeter = new DistanceMeter(
      this.canvas,
      this.spriteDef.TEXT_SPRITE,
      this.dimensions.WIDTH
    );

    // Draw t-rex
    this.tRex = new Trex(this.canvas, this.spriteDef.TREX);

    this.outerContainerEl.appendChild(this.containerEl);

    this.startListening();
    this.update();

    window.addEventListener(
      Runner.events.RESIZE,
      this.debounceResize.bind(this)
    );
  }

  /**
   * Setting individual settings for debugging.
   * @param {string} setting
   * @param {*} value
   */
  updateConfigSetting(setting, value) {
    if (setting in this.config && value !== undefined) {
      this.config[setting] = value;

      switch (setting) {
        case 'GRAVITY':
        case 'MIN_JUMP_HEIGHT':
        case 'SPEED_DROP_COEFFICIENT':
          this.tRex.config[setting] = value;
          break;
        case 'INITIAL_JUMP_VELOCITY':
          this.tRex.setJumpVelocity(value);
          break;
        case 'SPEED':
          this.setSpeed(value);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Debounce the resize event.
   */
  debounceResize() {
    if (!this.resizeTimerId_) {
      this.resizeTimerId_ = setInterval(this.adjustDimensions.bind(this), 250);
    }
  }

  /**
   * Adjust game space dimensions on resize.
   */
  adjustDimensions() {
    clearInterval(this.resizeTimerId_);
    this.resizeTimerId_ = null;

    const boxStyles = window.getComputedStyle(this.outerContainerEl);
    const padding = Number(
      boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2)
    );

    this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;

    // Redraw the elements back onto the canvas.
    if (this.canvas) {
      this.canvas.width = this.dimensions.WIDTH;
      this.canvas.height = this.dimensions.HEIGHT;

      Runner.updateCanvasScaling(this.canvas);

      this.distanceMeter.calcXPos(this.dimensions.WIDTH);
      this.clearCanvas();
      this.horizon.update(0, 0, true);
      this.tRex.update(0);

      // Outer container and distance meter.
      if (this.playing || this.crashed || this.paused) {
        this.containerEl.style.width = `${this.dimensions.WIDTH}px`;
        this.containerEl.style.height = `${this.dimensions.HEIGHT}px`;
        this.distanceMeter.update(0, Math.ceil(this.distanceRan));
        this.stop();
      } else {
        this.tRex.draw(0, 0);
      }
    }
  }

  /**
   * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
   * @param {number} speed
   */
  setSpeed(speed) {
    this.currentSpeed = speed || this.currentSpeed;
  }

  /**
   * Play the game intro.
   * Canvas container width expands out to the full width.
   */
  playIntro() {
    if (!this.activated && !this.crashed) {
      this.playingIntro = true;
      this.tRex.playingIntro = true;

      // CSS animation definition.
      const keyframes =
        `${'@-webkit-keyframes intro { from { width:'}${
          Trex.config.WIDTH
        }px }` +
        `to { width: ${this.dimensions.WIDTH}px }` +
        '}';
      document.styleSheets[0].insertRule(keyframes, 0);

      this.containerEl.addEventListener(
        Runner.events.ANIM_END,
        this.startGame.bind(this)
      );

      this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
      this.containerEl.style.width = `${this.dimensions.WIDTH}px`;

      this.playing = true;
      this.activated = true;
    } else if (this.crashed) {
      this.restart();
    }
  }

  /**
   * Update the game status to started.
   */
  startGame() {
    this.runningTime = 0;
    this.playingIntro = false;
    this.tRex.playingIntro = false;
    this.containerEl.style.webkitAnimation = '';
    this.playCount += 1;
  }

  clearCanvas() {
    this.canvasCtx.clearRect(
      0,
      0,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT
    );
  }

  /**
   * Update the game frame and schedules the next one.
   */
  update() {
    this.updatePending = false;

    const now = getTimeStamp();
    let deltaTime = now - (this.time || now);
    this.time = now;

    if (this.playing) {
      this.clearCanvas();

      if (this.tRex.jumping) {
        this.tRex.updateJump(deltaTime);
      }

      this.runningTime += deltaTime;
      const hasObstacles = this.runningTime > this.config.CLEAR_TIME;

      // First jump triggers the intro.
      if (this.tRex.jumpCount === 1 && !this.playingIntro) {
        this.playIntro();
      }

      // The horizon doesn't move until the intro is over.
      if (this.playingIntro) {
        this.horizon.update(0, this.currentSpeed, hasObstacles);
      } else {
        deltaTime = !this.activated ? 0 : deltaTime;
        this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);
      }

      // Check for collisions.
      const collision =
        hasObstacles && checkForCollision(this.horizon.obstacles[0], this.tRex);

      if (!collision) {
        this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;

        if (this.currentSpeed < this.config.MAX_SPEED) {
          this.currentSpeed += this.config.ACCELERATION;
        }
      } else {
        this.gameOver();
      }

      const playAchievementSound = this.distanceMeter.update(
        deltaTime,
        Math.ceil(this.distanceRan)
      );
    }

    if (
      this.playing ||
      (!this.activated && this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)
    ) {
      this.tRex.update(deltaTime);
      this.scheduleNextUpdate();
    }
  }

  /**
   * Bind relevant key
   */
  startListening() {
    document.addEventListener(Runner.events.KEYDOWN, (e) => {
      this.onKeyDown(e);
    });
    document.addEventListener(Runner.events.KEYUP, (e) => {
      this.onKeyUp(e);
    });
  }

  /**
   * Process keydown.
   * @param {Event} e
   */
  onKeyDown(e) {
    if (e.target !== this.detailsButton) {
      if (!this.crashed && Runner.keycodes.JUMP[e.keyCode]) {
        if (!this.playing) {
          this.playing = true;
          this.update();
        }
        //  Jump on starting the game for the first time.
        if (!this.tRex.jumping && !this.tRex.ducking) {
          this.tRex.startJump(this.currentSpeed);
        }
      }
      if (this.crashed && e.currentTarget === this.containerEl) {
        this.restart();
      }
    }

    if (this.playing && !this.crashed && Runner.keycodes.DUCK[e.keyCode]) {
      e.preventDefault();
      if (this.tRex.jumping) {
        // Speed drop, activated only when jump key is not pressed.
        this.tRex.setSpeedDrop();
      } else if (!this.tRex.jumping && !this.tRex.ducking) {
        // Duck.
        this.tRex.setDuck(true);
      }
    }
  }

  /**
   * Process key up.
   * @param {Event} e
   */
  onKeyUp(e) {
    const keyCode = String(e.keyCode);
    const isJumpKey = Runner.keycodes.JUMP[keyCode];

    if (this.isRunning() && isJumpKey) {
      this.tRex.endJump();
    } else if (Runner.keycodes.DUCK[keyCode]) {
      this.tRex.speedDrop = false;
      this.tRex.setDuck(false);
    } else if (this.crashed) {
      if (Runner.keycodes.JUMP[keyCode]) {
        this.restart();
      }
    } else if (this.paused && isJumpKey) {
      // Reset the jump state
      this.tRex.reset();
      this.play();
    }
  }

  /**
   * RequestAnimationFrame wrapper.
   */
  scheduleNextUpdate() {
    if (!this.updatePending) {
      this.updatePending = true;
      this.raqId = requestAnimationFrame(this.update.bind(this));
    }
  }

  /**
   * Whether the game is running.
   * @return {boolean}
   */
  isRunning() {
    return !!this.raqId;
  }

  /**
   * Game over state.
   */
  gameOver() {
    this.stop();
    this.crashed = true;
    this.distanceMeter.acheivement = false;

    this.tRex.update(100, Trex.status.CRASHED);

    // Game over panel.
    console.info('Game Over');

    // Update the high score.
    if (this.distanceRan > this.highestScore) {
      this.highestScore = Math.ceil(this.distanceRan);
      this.distanceMeter.setHighScore(this.highestScore);
    }

    // Reset the time clock.
    this.time = getTimeStamp();
  }

  stop() {
    this.playing = false;
    this.paused = true;
    cancelAnimationFrame(this.raqId);
    this.raqId = 0;
  }

  play() {
    if (!this.crashed) {
      this.playing = true;
      this.paused = false;
      this.tRex.update(0, Trex.status.RUNNING);
      this.time = getTimeStamp();
      this.update();
    }
  }

  restart() {
    if (!this.raqId) {
      this.playCount += 1;
      this.runningTime = 0;
      this.playing = true;
      this.crashed = false;
      this.distanceRan = 0;
      this.setSpeed(this.config.SPEED);
      this.time = getTimeStamp();
      this.containerEl.classList.remove(Runner.classes.CRASHED);
      this.clearCanvas();
      this.distanceMeter.reset(this.highestScore);
      this.horizon.reset();
      this.tRex.reset();
      this.update();
    }
  }

  /**
   * Updates the canvas size taking into
   * account the backing store pixel ratio and
   * the device pixel ratio.
   *
   * See article by Paul Lewis:
   * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
   *
   * @param {HTMLCanvasElement} canvas
   * @param {number} width
   * @param {number} height
   * @return {boolean} Whether the canvas was scaled.
   */
  static updateCanvasScaling(canvas, width, height) {
    const context = canvas.getContext('2d');

    // Query the various pixel ratios
    const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    const backingStoreRatio =
      Math.floor(context.webkitBackingStorePixelRatio) || 1;
    const ratio = devicePixelRatio / backingStoreRatio;

    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
      const oldWidth = width || canvas.width;
      const oldHeight = height || canvas.height;

      canvas.width = oldWidth * ratio;
      canvas.height = oldHeight * ratio;

      canvas.style.width = `${oldWidth}px`;
      canvas.style.height = `${oldHeight}px`;

      // Scale the context to counter the fact that we've manually scaled
      // our canvas element.
      context.scale(ratio, ratio);
      return true;
    } else if (devicePixelRatio === 1) {
      // Reset the canvas width / height. Fixes scaling bug when the page is
      // zoomed and the devicePixelRatio changes accordingly.
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
    }
    return false;
  }
}

/**
 * Create canvas element.
 * @param {HTMLElement} container Element to append canvas to.
 * @param {number} width
 * @param {number} height
 * @param {string} className
 * @return {HTMLCanvasElement}
 */
function createCanvas(container, width, height, className) {
  const canvas = document.createElement('canvas');
  canvas.className = className
    ? `${Runner.classes.CANVAS} ${className}`
    : Runner.classes.CANVAS;
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);

  return canvas;
}
