import Runner from './tr/Runner';

import './tr/index.less';

let runner = null;

function handleStateChange(state) {
  if (!state.jumping) {
    const jump = Math.random() > 0.97;
    if (jump) {
      return 1;
    }
  }
  return 0;
}

document.addEventListener('DOMContentLoaded', () => {
  runner = new Runner('.interstitial-wrapper', { onStateChange: handleStateChange });
  window.runner = runner;
  runner.init();
});
