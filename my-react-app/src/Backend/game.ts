import type { Player } from "./player";

export class Game {
  public allPlayers!: Player[];
  public isOver!: boolean;
  public currentPlayer!: Player;
}
