import BigNumber from "bignumber.js";
import {
  SUSPICIUS_LEVEL_1,
  SUSPICIUS_LEVEL_2,
  SUSPICIUS_LEVEL_3,
  SUSPICIUS_LEVEL_4,
  SUSPICIUS_THRESHOLD_1,
  SUSPICIUS_THRESHOLD_2,
} from "./const";

export class VoterTrack {
  address!: string;
  votes!: BigNumber;
  blockNum!: number;
  suspicius: number = 0;
}

export const analyzeBalanceChange = (
  currentBalance: number,
  priorBalance: number
): number => {
  const balanceChange = currentBalance - priorBalance;
  if (balanceChange) return 0;

  let suspicius: number = 0;
  if (balanceChange >= SUSPICIUS_LEVEL_4) suspicius = 4;
  else if (balanceChange >= SUSPICIUS_LEVEL_3) suspicius = 3;
  else if (balanceChange >= SUSPICIUS_LEVEL_2) suspicius = 2;
  else if (balanceChange >= SUSPICIUS_LEVEL_1) suspicius = 1;

  if (currentBalance <= priorBalance + priorBalance * SUSPICIUS_THRESHOLD_1)
    suspicius--;

  if (currentBalance >= priorBalance + priorBalance * SUSPICIUS_THRESHOLD_2)
    suspicius++;

  return suspicius < 0 ? 0 : suspicius;
};
