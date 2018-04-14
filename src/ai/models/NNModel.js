import * as tf from '@tensorflow/tfjs';

const HIDDEN_LAYER_SIZE = 6;
const INPUT_SIZE = 3;
const OUTPUT_SIZE = 2;

const weights1 = tf.variable(tf.randomNormal([INPUT_SIZE, HIDDEN_LAYER_SIZE]));
const weights2 = tf.variable(tf.randomNormal([HIDDEN_LAYER_SIZE, OUTPUT_SIZE]));
const bias1 = tf.variable(tf.scalar(Math.random()));
const bias2 = tf.variable(tf.scalar(Math.random()));

const optimizer = tf.train.adam(0.1);

export function predict(arrX) {
  const x = tf.tensor(arrX);
  // y = sigmoid(wx + b)
  const prediction = tf.tidy(
    () => tf.sigmoid(tf.matMul(
      tf.sigmoid(x.matMul(weights1).add(bias1)), weights2
    ).add(bias2))
  );
  return prediction;
}

export function train(arrXs, arrYs, iterationCount = 100) {
  const ys = tf.tensor(arrYs);
  for (let i = 0; i < iterationCount; i += 1) {
    optimizer.minimize(() => {
      const predsYs = predict(arrXs);
      return loss(predsYs, ys);
    });
  }
}

function loss(predictions, labels) {
  const meanSquareError = predictions.sub(labels).square().mean();
  return meanSquareError;
}
