import Model from '../Model';

export class GeneticModel {
  train(chromosomes) {
    this.select(chromosomes);
    this.crossOver();
    this.mutate();
  }

  select(chromosomes) {
    const parents = [chromosomes[0], chromosomes[1]];

  }

  crossOver() {

  }

  mutate() {

  }
}
