import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Runner } from '../game';

let runner = null;

function setup() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    onReset: handleReset,
    onRunning: handleRunning,
    onCrash: handleCrash
  });
  // Set runner as a global variable if you need runtime debugging.
  window.runner = runner;
  // Initialize everything in the game and start the game.
  runner.init();
}

function handleReset({ tRexes }) {
  // Add initialization of tRexes here.
  // This method is called everytime the game restarts.
}

function handleRunning({ tRex, state }) {
  // Decide whether this `tRex` should jump(return 1) or keep walking(return 0)
  // based on the `state` provided in the parameter.
}

function handleCrash({ tRex }) {
  // Fires when the `tRex` hit a obstacle(like cactus or bird).
}

function convertStateToVector(state) {
  // Here's an example of how to convert the state which provided in handleRunning()
  // into a three-dimensional vector as a array.
  if (state) {
    return [
      state.obstacleX / CANVAS_WIDTH,
      state.obstacleWidth / CANVAS_WIDTH,
      state.speed / 100
    ];
  }
  return [0, 0, 0];
}

document.addEventListener('DOMContentLoaded', setup);
