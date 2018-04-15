import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Runner } from '../game';
import NNModel from '../ai/models/genetic-nn/NNModel';
import GeneticModel from '../ai/models/genetic/GeneticModel';

const T_REX_COUNT = 10;

const geneticModel = new GeneticModel();
const rankList = [];

let runner = null;

function setup() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    T_REX_COUNT,
    onReset: handleReset,
    onCrash: handleCrash,
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
    // Initialize all the tRexes for the very first time.
    firstTime = false;
    tRexes.forEach((tRex) => {
      tRex.model = new NNModel();
      tRex.model.init();
      tRex.training = {
        inputs: [],
        labels: []
      };
    });
  } else {
    // Train the model before restarting.
    console.info('Training');
    // Do the NN training first
    tRexes.forEach((tRex) => {
      tRex.model.train(tRex.training.inputs, tRex.training.labels);
    });
    // Genetic training
    const chromosomes = rankList.map((tRex) => tRex.model.getChromosome());
    // Clear rankList
    rankList.splice(0);
    geneticModel.train(chromosomes);
    tRexes.forEach((tRex, i) => {
      tRex.model.setChromosome(chromosomes[i]);
    });
  }
}

function handleRunning({ tRex, state }) {
  return new Promise((resolve) => {
    if (!tRex.jumping) {
      let action = 0;
      const prediction = tRex.model.predictSingle(convertStateToVector(state));
      prediction.data().then((result) => {
        if (result[1] > result[0]) {
          action = 1;
          tRex.lastJumpingState = state;
        } else {
          tRex.lastRunningState = state;
        }
        resolve(action);
      });
    } else {
      resolve(0);
    }
  });
}

function handleCrash({ tRex }) {
  let input = null;
  let label = null;
  if (tRex.jumping) {
    input = convertStateToVector(tRex.lastJumpingState);
    label = [1, 0];
  } else {
    input = convertStateToVector(tRex.lastRunningState);
    label = [0, 1];
  }
  tRex.training.inputs.push(input);
  tRex.training.labels.push(label);
  if (!rankList.includes(tRex)) {
    rankList.unshift(tRex);
  }
}

function convertStateToVector(state) {
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
