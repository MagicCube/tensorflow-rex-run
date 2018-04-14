import Model from '../Model';

export default class RandomModel extends Model {
  weights = [];
  biases = [];

  init() {
    this.randomize();
  }

  predict(inputXs) {
    const inputX = inputXs[0];
    const y =
      this.weights[0] * inputX[0] +
      this.weights[1] * inputX[1]+
      this.weights[2] * inputX[2] +
      this.biases[0];
    return y < 0 ? 1 : 0;
  }

  train() {
    this.randomize()
  }

  randomize() {
    this.weights[0] = random();
    this.weights[1] = random();
    this.weights[2] = random();
    this.biases[0] = random();
  }
}

function random() {
  return (Math.random() - 0.5) * 2;
}
