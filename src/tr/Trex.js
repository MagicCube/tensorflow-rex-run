import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  RUNNER_BOTTOM_PAD
} from './constants';
import { getFPS } from './RuntimeConfig';
import { getImageSprite } from './ImageSprite';
import { getTimeStamp } from './utils';
import CollisionBox from './CollisionBox';
import Runner from './Runner';

/**
 * T-rex game character.
 * @param {HTMLCanvas} canvas
 * @param {Object} spritePos Positioning within image sprite.
 * @constructor
 */
export default class Trex {
  static config = {
    DROP_VELOCITY: -5,
    GRAVITY: 0.6,
    HEIGHT: 47,
    HEIGHT_DUCK: 25,
    INIITAL_JUMP_VELOCITY: -10,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    SPEED_DROP_COEFFICIENT: 3,
    SPRITE_WIDTH: 262,
    START_X_POS: 50,
    WIDTH: 44,
    WIDTH_DUCK: 59
  };

  /**
   * Used in collision detection.
   * @type {Array<CollisionBox>}
   */
  static collisionBoxes = {
    DUCKING: [new CollisionBox(1, 18, 55, 25)],
    RUNNING: [
      new CollisionBox(22, 0, 17, 16),
      new CollisionBox(1, 18, 30, 9),
      new CollisionBox(10, 35, 14, 8),
      new CollisionBox(1, 24, 29, 5),
      new CollisionBox(5, 30, 21, 4),
      new CollisionBox(9, 34, 15, 4)
    ]
  };

  /**
   * Animation states.
   * @enum {string}
   */
  static status = {
    CRASHED: 'CRASHED',
    DUCKING: 'DUCKING',
    JUMPING: 'JUMPING',
    RUNNING: 'RUNNING',
    WAITING: 'WAITING'
  };

  /**
   * Blinking coefficient.
   * @const
   */
  static BLINK_TIMING = 7000;

  /**
   * Animation config for different states.
   * @enum {Object}
   */
  static animFrames = {
    WAITING: {
      frames: [44, 0],
      msPerFrame: 1000 / 3
    },
    RUNNING: {
      frames: [88, 132],
      msPerFrame: 1000 / 12
    },
    CRASHED: {
      frames: [220],
      msPerFrame: 1000 / 60
    },
    JUMPING: {
      frames: [0],
      msPerFrame: 1000 / 60
    },
    DUCKING: {
      frames: [262, 321],
      msPerFrame: 1000 / 8
    }
  };

  constructor(canvas, spritePos) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.spritePos = spritePos;
    this.xPos = 0;
    this.yPos = 0;
    // Position when on the ground.
    this.groundYPos = 0;
    this.currentFrame = 0;
    this.currentAnimFrames = [];
    this.blinkDelay = 0;
    this.blinkCount = 0;
    this.animStartTime = 0;
    this.timer = 0;
    this.msPerFrame = 1000 / getFPS();
    this.config = Trex.config;
    // Current status.
    this.status = Trex.status.WAITING;

    this.jumping = false;
    this.ducking = false;
    this.jumpVelocity = 0;
    this.reachedMinHeight = false;
    this.speedDrop = false;
    this.jumpCount = 0;
    this.jumpspotX = 0;

    this.init();
  }

  /**
   * T-rex player initaliser.
   * Sets the t-rex to blink at random intervals.
   */
  init() {
    this.groundYPos = CANVAS_HEIGHT - this.config.HEIGHT - RUNNER_BOTTOM_PAD;
    this.yPos = this.groundYPos;
    this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

    this.draw(0, 0);
    this.update(0, Trex.status.WAITING);
  }

  /**
   * Setter for the jump velocity.
   * The approriate drop velocity is also set.
   */
  setJumpVelocity(setting) {
    this.config.INIITAL_JUMP_VELOCITY = -setting;
    this.config.DROP_VELOCITY = -setting / 2;
  }

  /**
   * Set the animation status.
   * @param {!number} deltaTime
   * @param {Trex.status} status Optional status to switch to.
   */
  update(deltaTime, status) {
    this.timer += deltaTime;

    // Update the status.
    if (status) {
      this.status = status;
      this.currentFrame = 0;
      this.msPerFrame = Trex.animFrames[status].msPerFrame;
      this.currentAnimFrames = Trex.animFrames[status].frames;

      if (status === Trex.status.WAITING) {
        this.animStartTime = getTimeStamp();
        this.setBlinkDelay();
      }
    }

    if (this.status === Trex.status.WAITING) {
      this.blink(getTimeStamp());
    } else {
      this.draw(this.currentAnimFrames[this.currentFrame], 0);
    }

    // Update the frame position.
    if (this.timer >= this.msPerFrame) {
      this.currentFrame =
        this.currentFrame === this.currentAnimFrames.length - 1
          ? 0
          : this.currentFrame + 1;
      this.timer = 0;
    }

    // Speed drop becomes duck if the down key is still being pressed.
    if (this.speedDrop && this.yPos === this.groundYPos) {
      this.speedDrop = false;
      this.setDuck(true);
    }
  }

  /**
   * Draw the t-rex to a particular position.
   * @param {number} x
   * @param {number} y
   */
  draw(x, y) {
    let sourceX = x;
    let sourceY = y;
    const sourceWidth =
      this.ducking && this.status !== Trex.status.CRASHED
        ? this.config.WIDTH_DUCK
        : this.config.WIDTH;
    const sourceHeight = this.config.HEIGHT;

    // Adjustments for sprite sheet position.
    sourceX += this.spritePos.x;
    sourceY += this.spritePos.y;

    // Ducking.
    if (this.ducking && this.status !== Trex.status.CRASHED) {
      this.canvasCtx.drawImage(
        getImageSprite(),
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        this.xPos,
        this.yPos,
        this.config.WIDTH_DUCK,
        this.config.HEIGHT
      );
    } else {
      // Crashed whilst ducking. Trex is standing up so needs adjustment.
      if (this.ducking && this.status === Trex.status.CRASHED) {
        this.xPos += 1;
      }
      // Standing / running
      this.canvasCtx.drawImage(
        getImageSprite(),
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        this.xPos,
        this.yPos,
        this.config.WIDTH,
        this.config.HEIGHT
      );
    }
  }

  /**
   * Sets a random time for the blink to happen.
   */
  setBlinkDelay() {
    this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
  }

  /**
   * Make t-rex blink at random intervals.
   * @param {number} time Current time in milliseconds.
   */
  blink(time) {
    const deltaTime = time - this.animStartTime;

    if (deltaTime >= this.blinkDelay) {
      this.draw(this.currentAnimFrames[this.currentFrame], 0);

      if (this.currentFrame === 1) {
        // Set new random delay to blink.
        this.setBlinkDelay();
        this.animStartTime = time;
        this.blinkCount += 1;
      }
    }
  }

  /**
   * Initialise a jump.
   * @param {number} speed
   */
  startJump(speed) {
    if (speed === undefined) {
      speed = Runner.instance_.currentSpeed;
    }
    if (!this.jumping) {
      this.update(0, Trex.status.JUMPING);
      // Tweak the jump velocity based on the speed.
      this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - speed / 10;
      this.jumping = true;
      this.reachedMinHeight = false;
      this.speedDrop = false;
    }
  }

  /**
   * Jump is complete, falling down.
   */
  endJump() {
    if (
      this.reachedMinHeight &&
      this.jumpVelocity < this.config.DROP_VELOCITY
    ) {
      this.jumpVelocity = this.config.DROP_VELOCITY;
    }
  }

  /**
   * Update frame for a jump.
   * @param {number} deltaTime
   * @param {number} speed
   */
  updateJump(deltaTime, speed) {
    const { msPerFrame } = Trex.animFrames[this.status];
    const framesElapsed = deltaTime / msPerFrame;

    // Speed drop makes Trex fall faster.
    if (this.speedDrop) {
      this.yPos += Math.round(
        this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * framesElapsed
      );
    } else {
      this.yPos += Math.round(this.jumpVelocity * framesElapsed);
    }

    this.jumpVelocity += this.config.GRAVITY * framesElapsed;

    // Minimum height has been reached.
    if (this.yPos < this.minJumpHeight || this.speedDrop) {
      this.reachedMinHeight = true;
    }

    // Reached max height
    if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
      this.endJump();
    }

    // Back down at ground level. Jump completed.
    if (this.yPos > this.groundYPos) {
      this.reset();
      this.jumpCount += 1;
    }

    this.update(deltaTime);
  }

  /**
   * Set the speed drop. Immediately cancels the current jump.
   */
  setSpeedDrop() {
    this.speedDrop = true;
    this.jumpVelocity = 1;
  }

  /**
   * @param {boolean} isDucking.
   */
  setDuck(isDucking) {
    if (isDucking && this.status !== Trex.status.DUCKING) {
      this.update(0, Trex.status.DUCKING);
      this.ducking = true;
    } else if (this.status === Trex.status.DUCKING) {
      this.update(0, Trex.status.RUNNING);
      this.ducking = false;
    }
  }

  /**
   * Reset the t-rex to running at start of game.
   */
  reset() {
    this.yPos = this.groundYPos;
    this.jumpVelocity = 0;
    this.jumping = false;
    this.ducking = false;
    this.update(0, Trex.status.RUNNING);
    this.midair = false;
    this.speedDrop = false;
    this.jumpCount = 0;
    this.crashed = false;
  }
}

/**
 * Check for a collision.
 * @param {!Obstacle} obstacle
 * @param {!Trex} tRex T-rex object.
 * @param {HTMLCanvasContext} canvasContext Optional canvas context for drawing
 *    collision boxes.
 * @return {Array<CollisionBox>}
 */
export function checkForCollision(obstacle, tRex) {
  const obstacleBoxXPos = CANVAS_WIDTH + obstacle.xPos;

  // Adjustments are made to the bounding box as there is a 1 pixel white
  // border around the t-rex and obstacles.
  const tRexBox = new CollisionBox(
    tRex.xPos + 1,
    tRex.yPos + 1,
    tRex.config.WIDTH - 2,
    tRex.config.HEIGHT - 2
  );

  const obstacleBox = new CollisionBox(
    obstacle.xPos + 1,
    obstacle.yPos + 1,
    obstacle.typeConfig.width * obstacle.size - 2,
    obstacle.typeConfig.height - 2
  );

  // Simple outer bounds check.
  if (boxCompare(tRexBox, obstacleBox)) {
    const { collisionBoxes } = obstacle;
    const tRexCollisionBoxes = tRex.ducking
      ? Trex.collisionBoxes.DUCKING
      : Trex.collisionBoxes.RUNNING;

    // Detailed axis aligned box check.
    for (let t = 0; t < tRexCollisionBoxes.length; t += 1) {
      for (let i = 0; i < collisionBoxes.length; i += 1) {
        // Adjust the box to actual positions.
        const adjTrexBox = createAdjustedCollisionBox(
          tRexCollisionBoxes[t],
          tRexBox
        );
        const adjObstacleBox = createAdjustedCollisionBox(
          collisionBoxes[i],
          obstacleBox
        );
        const crashed = boxCompare(adjTrexBox, adjObstacleBox);

        if (crashed) {
          return [adjTrexBox, adjObstacleBox];
        }
      }
    }
  }
  return false;
}

/**
 * Adjust the collision box.
 * @param {!CollisionBox} box The original box.
 * @param {!CollisionBox} adjustment Adjustment box.
 * @return {CollisionBox} The adjusted collision box object.
 */
function createAdjustedCollisionBox(box, adjustment) {
  return new CollisionBox(
    box.x + adjustment.x,
    box.y + adjustment.y,
    box.width,
    box.height
  );
}

/**
 * Compare two collision boxes for a collision.
 * @param {CollisionBox} tRexBox
 * @param {CollisionBox} obstacleBox
 * @return {boolean} Whether the boxes intersected.
 */
function boxCompare(tRexBox, obstacleBox) {
  let crashed = false;
  const tRexBoxX = tRexBox.x;
  const tRexBoxY = tRexBox.y;

  const obstacleBoxX = obstacleBox.x;
  const obstacleBoxY = obstacleBox.y;

  // Axis-Aligned Bounding Box method.
  if (
    tRexBox.x < obstacleBoxX + obstacleBox.width &&
    tRexBox.x + tRexBox.width > obstacleBoxX &&
    tRexBox.y < obstacleBox.y + obstacleBox.height &&
    tRexBox.height + tRexBox.y > obstacleBox.y
  ) {
    crashed = true;
  }

  return crashed;
}
