export class Dice {
  public values!: number[];
  public currentValue!: number;
  public isFrozen!: boolean;
  public selected!: boolean;
  public id: string;

  constructor(id, faces = [1, 2, 3, 4, 5, 6]) {
    this.values = faces;
    this.currentValue = this.values[0];
    this.isFrozen = false;
    this.id = id;
    this.selected = false;
  }

  public roll() {
    if (this.isFrozen) {
      // skip
    } else {
      this.currentValue =
        this.values[Math.floor(Math.random() * this.values.length)]; //Randomly pick a value from the list
    }
    return this.currentValue;
  }

  public select() {
    this.selected = !this.selected;
  }
}
