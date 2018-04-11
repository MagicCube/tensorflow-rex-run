import * as tf from '@tensorflow/tfjs';

const weights = tf.variable(tf.randomNormal([2, 2]));
const bias = tf.variable(tf.scalar(Math.random()));

const optimizer = tf.train.adam(0.1);

export function predict(arrX) {
  const x = tf.tensor(arrX);
  // y = sigmoid(wx + b)
  const prediction = tf.tidy(
    () => tf.sigmoid(x.matMul(weights).add(bias))
  );
  return prediction;
}

export function train(arrXs, arrYs, numIterations = 100) {
  const ys = tf.tensor(arrYs);
  for (let iter = 0; iter < numIterations; iter += 1) {
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
