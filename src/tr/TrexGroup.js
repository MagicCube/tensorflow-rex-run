import Runner from './Runner';
import Trex, { checkForCollision } from './Trex';

export default class TrexGroup {
  onStateChange = noop;

  constructor(count, canvas, spriteDef) {
    this.tRexes = [];
    for (let i = 0; i < count; i += 1) {
      const tRex = new Trex(canvas, spriteDef);
      this.tRexes.push(tRex);
    }
  }

  update(deltaTime, status) {
    this.tRexes.forEach((tRex) => {
      if (!tRex.crashed) {
        tRex.update(deltaTime, status);
      }
    });
  }

  draw(x, y) {
    this.tRexes.forEach((tRex) => {
      if (!tRex.crashed) {
        tRex.draw(x, y);
      }
    });
  }

  updateJump(deltaTime, speed) {
    this.tRexes.forEach((tRex) => {
      if (tRex.jumping) {
        tRex.updateJump(deltaTime, speed);
      }
    });
  }

  reset() {
    this.tRexes.forEach(tRex => tRex.reset());
  }

  checkForCollision(obstacle) {
    let crashes = 0;
    const state = {
      obstacleDistance: obstacle.xPos,
      obstacleWidth: obstacle.width,
      speed: Runner.instance_.currentSpeed
    };
    this.tRexes.forEach((tRex) => {
      if (!tRex.crashed) {
        const result = checkForCollision(obstacle, tRex);
        if (result) {
          crashes += 1;
        } else {
          const action = this.onStateChange({ jumping: tRex.jumping, ...state });
          if (action === 1) {
            tRex.startJump();
          }
        }
      } else {
        crashes += 1;
      }
    });
    return crashes === this.tRexes.length;
  }
}

function noop() { }
