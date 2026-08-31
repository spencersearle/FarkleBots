import type { AllDice } from "./allDice";
import type { RollingStrategy } from "./rollingStrategy";

export class Player {
  public playersDice!: AllDice;
  public rollingStrategy!: RollingStrategy;
  public points!: number;
  public isHuman!: boolean;
}
