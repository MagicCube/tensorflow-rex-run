/* eslint-disable prefer-const */
/* eslint-disable radix */
import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Runner } from '../game';
import QlearningModel, { clearDB, saveDB }  from '../ai/models/qlearning/qlearningModel';

const T_REX_COUNT = 1
const InitPrevState =  [0, 0]
const qlResolution = 8

let runner = null;

function setup() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    T_REX_COUNT,
    onReset: handleReset,
    onCrash: handleCrash,
    onSuccess: handleSuccess,
    onRunning: handleRunning
  });
  // Set runner as a global variable if you need runtime debugging.
  window.runner = runner;
  // Initialize everything in the game and start the game.
  runner.init();
}

let firstTime = true;
function handleReset({ tRexes }) {
  if (firstTime) {
    firstTime = false;
    tRexes.forEach(async (tRex) => {
      if (!tRex.model) {
        // Initialize all the tRexes with random models
        // for the very first time.
        tRex.model = new QlearningModel(2);
        await tRex.model.init();
      }
    });
  } else {
    saveDB()
  }
}
window.clearDB = () => {
  clearDB()
}

function handleRunning({ tRex, state }) {
  let action = 0;
  const _state = convertStateToVector(state)
  action = tRex.model.predictSingle(_state);
  tRex.model.preAction = action
  return action;
}

function handleCrash({ tRex, state }) {
  // tRex.model.train();
  const reward = -100
  const curState = convertStateToVector(state)
  tRex.model.giveReward(reward, curState)
  console.info('crash status >>>>>', curState)
  
  tRex.model.showQArr()
  tRex.model.updateTable()
}

function handleSuccess({ tRex, state }) {
  const reward = 1
  const curState = convertStateToVector(state)
  // eslint-disable-next-line prefer-const
  tRex.model.giveReward(reward, curState)
  // console.info('handleSuccess status >>>>>', curState)
  
}

function convertStateToVector(state) {
  if (state) {
    return [
      parseInt(state.obstacleX / qlResolution),
      // parseInt(state.obstacleWidth / qlResolution),
      state.speed.toFixed(1),
    ].join(',');
  }
  return InitPrevState;
}

document.addEventListener('DOMContentLoaded', setup);
