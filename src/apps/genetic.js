import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Runner } from '../game';
import GeneticModel from '../ai/models/genetic/GeneticModel';
import RandomModel from '../ai/models/genetic/RandomModel';

const T_REX_COUNT = 10;

let runner = null;

const rankList = [];
const geneticModel = new GeneticModel();

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
    // Initialize all the tRexes with random models
    // for the very first time.
    firstTime = false;
    tRexes.forEach((tRex) => {
      tRex.model = new RandomModel();
      tRex.model.init();
    });
  } else {
    // Train the model before restarting.
    console.info('Training');
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
  let action = 0;
  if (!tRex.jumping) {
    action = tRex.model.predictSingle(convertStateToVector(state));
  }
  return action;
}

function handleCrash({ tRex }) {
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
