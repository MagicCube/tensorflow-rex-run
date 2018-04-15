import { tensor } from '../utils';

export default class Model {
  init() {
    throw new Error(
      'Abstract method must be implemented in the derived class.'
    );
  }

  predict(inputXs) {
    throw new Error(
      'Abstract method must be implemented in the derived class.'
    );
  }

  predictSingle(inputX) {
    return this.predict([inputX]);
  }

  train(inputXs, inputYs) {
    throw new Error(
      'Abstract method must be implemented in the derived class.'
    );
  }

  fit(inputXs, inputYs, iterationCount = 100) {
    for (let i = 0; i < iterationCount; i += 1) {
      this.train(inputXs, inputYs);
    }
  }

  loss(predictedYs, labels) {
    const meanSquareError = predictedYs
      .sub(tensor(labels))
      .square()
      .mean();
    return meanSquareError;
  }
}
