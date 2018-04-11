import Runner from './tr/Runner';

import './tr/index.less';

let runner = null;

function handleRunning({ tRex, state }) {
  if (!tRex.jumping) {
    const jump = Math.random() > 0.97;
    if (jump) {
      return 1;
    }
  }
  return 0;
}

function handleCrash({ tRex }) {
  console.log(tRex.id);
}

document.addEventListener('DOMContentLoaded', () => {
  runner = new Runner('.interstitial-wrapper', { onRunning: handleRunning, onCrash: handleCrash });
  window.runner = runner;
  runner.init();
});
