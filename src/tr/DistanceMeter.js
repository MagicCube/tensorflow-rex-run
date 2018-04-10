import { getImageSprite } from './ImageSprite';

/**
 * Handles displaying the distance meter.
 * @param {!HTMLCanvasElement} canvas
 * @param {Object} spritePos Image position in sprite.
 * @param {number} canvasWidth
 * @constructor
 */
export default class DistanceMeter {
  static dimensions = {
    WIDTH: 10,
    HEIGHT: 13,
    DEST_WIDTH: 11
  };

  static yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];

  static config = {
    // Number of digits.
    MAX_DISTANCE_UNITS: 5,

    // Distance that causes achievement animation.
    ACHIEVEMENT_DISTANCE: 100,

    // Used for conversion from pixel distance to a scaled unit.
    COEFFICIENT: 0.025,

    // Flash duration in milliseconds.
    FLASH_DURATION: 1000 / 4,

    // Flash iterations for achievement animation.
    FLASH_ITERATIONS: 3
  };

  constructor(canvas, spritePos, canvasWidth) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.image = getImageSprite();
    this.spritePos = spritePos;
    this.x = 0;
    this.y = 5;

    this.currentDistance = 0;
    this.maxScore = 0;
    this.highScore = 0;
    this.container = null;

    this.digits = [];
    this.acheivement = false;
    this.defaultString = '';
    this.flashTimer = 0;
    this.flashIterations = 0;
    this.invertTrigger = false;

    this.config = DistanceMeter.config;
    this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
    this.init(canvasWidth);
  }

  /**
   * Initialise the distance meter to '00000'.
   * @param {number} width Canvas width in px.
   */
  init(width) {
    let maxDistanceStr = '';

    this.calcXPos(width);
    this.maxScore = this.maxScoreUnits;
    for (let i = 0; i < this.maxScoreUnits; i += 1) {
      this.draw(i, 0);
      this.defaultString += '0';
      maxDistanceStr += '9';
    }

    this.maxScore = parseInt(maxDistanceStr, 0);
  }

  /**
   * Calculate the xPos in the canvas.
   * @param {number} canvasWidth
   */
  calcXPos(canvasWidth) {
    this.x =
      canvasWidth -
      DistanceMeter.dimensions.DEST_WIDTH * (this.maxScoreUnits + 1);
  }

  /**
   * Draw a digit to canvas.
   * @param {number} digitPos Position of the digit.
   * @param {number} value Digit value 0-9.
   * @param {boolean} highScore Whether drawing the high score.
   */
  draw(digitPos, value, highScore) {
    const sourceWidth = DistanceMeter.dimensions.WIDTH;
    const sourceHeight = DistanceMeter.dimensions.HEIGHT;
    let sourceX = DistanceMeter.dimensions.WIDTH * value;
    let sourceY = 0;

    const targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
    const targetY = this.y;
    const targetWidth = DistanceMeter.dimensions.WIDTH;
    const targetHeight = DistanceMeter.dimensions.HEIGHT;

    sourceX += this.spritePos.x;
    sourceY += this.spritePos.y;

    this.canvasCtx.save();

    if (highScore) {
      // Left of the current score.
      const highScoreX =
        this.x - this.maxScoreUnits * 2 * DistanceMeter.dimensions.WIDTH;
      this.canvasCtx.translate(highScoreX, this.y);
    } else {
      this.canvasCtx.translate(this.x, this.y);
    }

    this.canvasCtx.drawImage(
      this.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight
    );

    this.canvasCtx.restore();
  }

  /**
   * Covert pixel distance to a 'real' distance.
   * @param {number} distance Pixel distance ran.
   * @return {number} The 'real' distance ran.
   */
  getActualDistance(distance) {
    return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
  }

  /**
   * Update the distance meter.
   * @param {number} distance
   * @param {number} deltaTime
   */
  update(deltaTime, distance) {
    let paint = true;

    if (!this.acheivement) {
      distance = this.getActualDistance(distance);
      // Score has gone beyond the initial digit count.
      if (
        distance > this.maxScore &&
        this.maxScoreUnits === this.config.MAX_DISTANCE_UNITS
      ) {
        this.maxScoreUnits += 1;
        this.maxScore = parseInt(`${this.maxScore}9`, 1);
      } else {
        this.distance = 0;
      }

      if (distance > 0) {
        // Acheivement unlocked
        if (distance % this.config.ACHIEVEMENT_DISTANCE === 0) {
          this.acheivement = true;
          this.flashTimer = 0;
        }

        // Create a string representation of the distance with leading 0.
        const distanceStr = (this.defaultString + distance).substr(
          -this.maxScoreUnits
        );
        this.digits = distanceStr.split('');
      } else {
        this.digits = this.defaultString.split('');
      }
    } else if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
      this.flashTimer += deltaTime;

      if (this.flashTimer < this.config.FLASH_DURATION) {
        paint = false;
      } else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
        this.flashTimer = 0;
        this.flashIterations += 1;
      }
    } else {
      this.acheivement = false;
      this.flashIterations = 0;
      this.flashTimer = 0;
    }

    // Draw the digits if not flashing.
    if (paint) {
      for (let i = this.digits.length - 1; i >= 0; i -= 1) {
        this.draw(i, parseInt(this.digits[i], 0));
      }
    }

    this.drawHighScore();
  }
  /**
   * Draw the high score.
   */
  drawHighScore() {
    this.canvasCtx.save();
    this.canvasCtx.globalAlpha = 0.8;
    for (let i = this.highScore.length - 1; i >= 0; i -= 1) {
      this.draw(i, parseInt(this.highScore[i], 10), true);
    }
    this.canvasCtx.restore();
  }

  /**
   * Set the highscore as a array string.
   * Position of char in the sprite: H - 10, I - 11.
   * @param {number} distance Distance ran in pixels.
   */
  setHighScore(distance) {
    distance = this.getActualDistance(distance);
    const highScoreStr = (this.defaultString + distance).substr(
      -this.maxScoreUnits
    );

    this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
  }

  /**
   * Reset the distance meter back to '00000'.
   */
  reset() {
    this.update(0);
    this.acheivement = false;
  }
}
