import { predict, train } from './ai/models/InceptionModel';
import { CANVAS_WIDTH } from './game/constants';
import Runner from './game/Runner';

import './game/index.less';

let runner = null;

function handleRestart(tRexes) {}

let lastJumpingState = null;
let lastRunningState = null;

function handleRunning({ tRex, state }) {
  let action = 0;
  if (!tRex.jumping) {
    const prediction = predict([convertStateToVector(state)]);
    const result = prediction.dataSync();
    if (result[1] > result[0]) {
      // Jump
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
    state.obstacleDistance / CANVAS_WIDTH,
    state.obstacleWidth / CANVAS_WIDTH
  ];
}

document.addEventListener('DOMContentLoaded', () => {
  runner = new Runner('.interstitial-wrapper', {
    onRestart: handleRestart,
    onRunning: handleRunning,
    onCrash: handleCrash
  });
  window.runner = runner;
  runner.init();
});
