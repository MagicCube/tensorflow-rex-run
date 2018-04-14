import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { GeneticNNModel } from '../ai/models/GeneticModel';
import { Runner } from '../game';

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
  tRexes.forEach((tRex) => {
    tRex.model = new GeneticNNModel();
  });
}

function handleRunning({ tRex, state }) {
  let action = 0;
  if (!tRex.jumping) {
    const prediction = tRex.model.predictSingle(convertStateToVector(state));
    const result = prediction.dataSync();
    if (result[1] > result[0]) {
      action = 1;
      tRex.lastJumpingState = state;
    } else {
      tRex.lastRunningState = state;
    }
  }
  return action;
}

function handleCrash({ tRex }) {
  if (tRex.jumping) {
    tRex.model.trainSingle(convertStateToVector(tRex.lastJumpingState), [1, 0]);
    console.warn('Should not jump', tRex.lastJumpingState);
  } else {
    tRex.model.trainSingle(convertStateToVector(tRex.lastRunningState), [0, 1]);
    console.warn('Should jump', tRex.lastRunningState);
  }
}

function convertStateToVector(state) {
  return [
    state.obstacleX / CANVAS_WIDTH,
    state.obstacleWidth / CANVAS_WIDTH,
    state.speed / 100
  ];
}

document.addEventListener('DOMContentLoaded', init);
