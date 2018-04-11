import * as tf from '@tensorflow/tfjs';

const weights1 = tf.variable(tf.randomNormal([3, 4]));
const weights2 = tf.variable(tf.randomNormal([4, 2]));
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
