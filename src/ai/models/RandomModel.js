import Model from './Model';

export default class RandomModel extends Model {
  weights = [];

  init() {
    this.train();
  }

  predict(inputXs) {
    const inputX = inputXs[0];
    const y = inputX[0] * this.weights[0] + inputX[1] * this.weights[1];
    return y < this.weights[2] ? 1 : 0;
  }

  train() {
    this.weights[0] = Math.random();
    this.weights[1] = Math.random();
    this.weights[2] = Math.random();
  }
}
