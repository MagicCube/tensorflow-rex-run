import Runner from './tr/Runner';

import './tr/index.less';

document.addEventListener('DOMContentLoaded', () => {
  const runner = new Runner('.interstitial-wrapper');
  runner.init();
});
