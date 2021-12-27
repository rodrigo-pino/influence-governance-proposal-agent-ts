import BigNumber from "bignumber.js";

export class VoterTrack {
  address!: string;
  votes!: BigNumber;
  blockNum!: number;
  suspicius: boolean = false;
}
