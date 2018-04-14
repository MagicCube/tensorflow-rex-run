import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import Model from '../ai/models/NNModel';
import { Runner } from '../game';

let runner = null;

function setup() {
  runner = new Runner('.game', {
    onRestart: handleRestart,
    onRunning: handleRunning,
    onCrash: handleCrash
  });
  window.runner = runner;
  runner.init();
}

function handleRestart(tRexes) {
  // We only have one T-Rex in this version.
  const tRex = tRexes[0];
  if (!tRex.model) {
    // Initialize tRex's model for the first time.
    tRex.model = new Model();
    tRex.model.init();
  }
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

document.addEventListener('DOMContentLoaded', setup);
