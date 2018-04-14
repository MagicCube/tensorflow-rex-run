import RandomModel from '../random/RandomModel';

export default class GeneticRandomModel extends RandomModel {
  getChromosome() {
    return this.weights.concat(this.biases);
  }

  setChromosome(chromosome) {
    this.weights[0] = chromosome[0];
    this.weights[1] = chromosome[1];
    this.weights[2] = chromosome[2];
    this.biases[0] = chromosome[3];
  }
}
