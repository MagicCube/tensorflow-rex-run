import * as tf from '@tensorflow/tfjs';

import { tensor } from '../../utils';
import Model from '../Model';

/**
 * Simple Neural Network Model
 */
export default class NNModel extends Model {
  weights = [];
  biases = [];

  constructor({
    inputSize = 3,
    hiddenLayerSize = inputSize * 2,
    outputSize = 2,
    learningRate = 0.1
  } = {}) {
    super();
    this.hiddenLayerSize = hiddenLayerSize;
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    // Using ADAM optimizer
    this.optimizer = tf.train.adam(learningRate);
  }

  init() {
    // Hidden layer
    this.weights[0] = tf.variable(
      tf.randomNormal([this.inputSize, this.hiddenLayerSize])
    );
    this.biases[0] = tf.variable(tf.scalar(Math.random()));
    // Output layer
    this.weights[1] = tf.variable(
      tf.randomNormal([this.hiddenLayerSize, this.outputSize])
    );
    this.biases[1] = tf.variable(tf.scalar(Math.random()));
  }

  predict(inputXs) {
    const x = tensor(inputXs);
    const prediction = tf.tidy(() => {
      const hiddenLayer = tf.sigmoid(x.matMul(this.weights[0]).add(this.biases[0]));
      const outputLayer = tf.sigmoid(hiddenLayer.matMul(this.weights[1]).add(this.biases[1]));
      return outputLayer;
    });
    return prediction;
  }

  train(inputXs, inputYs, iterationCount = 100) {
    for (let i = 0; i < iterationCount; i += 1) {
      this.optimizer.minimize(() => {
        const predictedYs = this.predict(inputXs);
        return this.loss(predictedYs, inputYs);
      });
    }
  }
}
