import Model from './Model';

export default class RandomModel extends Model {
  weights = [];
  baises = [];

  init() {
    this.train();
  }

  predict(inputXs) {
    const inputX = inputXs[0];
    const y =
      inputX[0] * this.weights[0] +
      inputX[1] * this.weights[1] +
      inputX[2] * this.weights[2] +
      this.baises[0];
    return y > 0 ? 0 : 1;
  }

  train() {
    this.weights[0] = Math.random() - 0.5;
    this.weights[1] = Math.random() - 0.5;
    this.weights[2] = Math.random() - 0.5;
    this.baises[0] = Math.random() - 0.5;
  }
}
