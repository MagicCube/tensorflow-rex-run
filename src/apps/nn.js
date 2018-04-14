import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { predict, train } from '../ai/models/NNModel';
import { Runner } from '../game';

let runner = null;

let lastJumpingState = null;
let lastRunningState = null;

function init() {
  runner = new Runner('.interstitial-wrapper', {
    onRestart: handleRestart,
    onRunning: handleRunning,
    onCrash: handleCrash
  });
  window.runner = runner;
  runner.init();
}

function handleRestart(tRexes) {

}

function handleRunning({ tRex, state }) {
  let action = 0;
  if (!tRex.jumping) {
    const prediction = predict([convertStateToVector(state)]);
    const result = prediction.dataSync();
    if (result[1] > result[0]) {
      action = 1;
      lastJumpingState = state;
    } else {
      lastRunningState = state;
    }
  }
  return action;
}

function handleCrash({ tRex }) {
  if (tRex.jumping) {
    train([convertStateToVector(lastJumpingState)], [[1, 0]]);
    console.warn('Should not jump', lastJumpingState);
  } else {
    train([convertStateToVector(lastRunningState)], [[0, 1]]);
    console.warn('Should jump', lastRunningState);
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
