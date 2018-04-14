import Runner from './Runner';
import Trex, { checkForCollision } from './Trex';

export default class TrexGroup {
  onReset = noop;
  onRunning = noop;
  onCrash = noop;

  constructor(count, canvas, spriteDef) {
    this.tRexes = [];
    for (let i = 0; i < count; i += 1) {
      const tRex = new Trex(canvas, spriteDef);
      tRex.id = i;
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
    this.tRexes.forEach((tRex) => {
      tRex.reset();
      this.onReset({ tRex });
    });
  }

  lives() {
    return this.tRexes.reduce((count, tRex) => tRex.crashed ? count : count + 1, 0);
  }

  checkForCollision(obstacle) {
    let crashes = 0;
    const state = {
      obstacleX: obstacle.xPos,
      obstacleY: obstacle.yPos,
      obstacleWidth: obstacle.width,
      speed: Runner.instance_.currentSpeed
    };
    this.tRexes.forEach(async (tRex) => {
      if (!tRex.crashed) {
        const result = checkForCollision(obstacle, tRex);
        if (result) {
          crashes += 1;
          tRex.crashed = true;
          this.onCrash({ tRex, state });
        } else {
          const action = await this.onRunning({ tRex, state });
          if (action === 1) {
            tRex.startJump();
          } else if (action === -1) {
            if (tRex.jumping) {
              // Speed drop, activated only when jump key is not pressed.
              tRex.setSpeedDrop();
            } else if (!tRex.jumping && !tRex.ducking) {
              // Duck.
              tRex.setDuck(true);
            }
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
