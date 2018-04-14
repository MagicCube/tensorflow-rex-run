import * as tf from '@tensorflow/tfjs';

export function isTensor(obj) {
  return obj instanceof tf.Tensor;
}

export function tensor(obj) {
  if (obj instanceof tf.Tensor) {
    return obj;
  }
  if (typeof obj === 'number') {
    return tf.scalar(obj);
  } else if (Array.isArray(obj)) {
    return tf.tensor(obj);
  }
  throw new Error(
    'tensor() only supports number or array as the input parameter.'
  );
}
