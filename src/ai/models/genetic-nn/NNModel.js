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
    for (let i = 0; i < 2; i += 1) {
      const weight = chromosome.slice(i * 2, i * 2 + 3 * 6);
      const bias = chromosome.slice(i * 2 + 3 * 6, i * 2 + 3 * 6 + 1);
      this.weights[i].assign(tf.tensor(weight));
      this.biases[i].assign(tf.tensor(bias));
    }
  }
}
