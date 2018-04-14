import * as tf from '@tensorflow/tfjs';
import NNModel from '../nn/NNModel';

export default class GeneticNNModel extends NNModel {
  getChromosome() {
    const result = tf.concat([
      this.weights[0].flatten(),
      this.biases[0].flatten(),
      this.weights[1].flatten(),
      this.biases[1].flatten()
    ]);
    return result.dataSync();
  }

  setChromosome(chromosome) {
    let weight = chromosome.slice(0, 3 * 6);
    let bias = chromosome.slice(3 * 6, 3 * 6 + 1);
    this.weights[0].assign(tf.tensor(weight, [3, 6]));
    this.biases[0].assign(tf.tensor(bias[0]));
    weight = chromosome.slice(3 * 6 + 1, 3 * 6 + 1 + 6 * 2);
    bias = chromosome.slice(3 * 6 + 1 + 6 * 2, 3 * 6 + 1 + 6 * 2 + 1);
    this.weights[1].assign(tf.tensor(weight, [6, 2]));
    this.biases[1].assign(tf.tensor(bias[0]));
  }
}
