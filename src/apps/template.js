import 'babel-polyfill';

import { predict, train } from '../ai/models/NNModel';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Runner } from '../game/Runner';

let runner = null;

function init() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    onRestart: handleRestart,
    onRunning: handleRunning,
    onCrash: handleCrash
  });
  // Set runner as a global variable if you need runtime debugging.
  window.runner = runner;
  // Initialize everything in the game and start the game.
  runner.init();
}

function handleRestart(tRexes) {
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
  return [
    state.obstacleX / CANVAS_WIDTH,
    state.obstacleWidth / CANVAS_WIDTH,
    state.speed / 100
  ];
}

document.addEventListener('DOMContentLoaded', init);
