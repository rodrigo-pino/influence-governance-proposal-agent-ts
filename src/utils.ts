import BigNumber from "bignumber.js";
import {
  createTransactionEvent,
  TransactionEvent,
  LogDescription,
} from "forta-agent";
import {
  SUSPICIUS_LEVEL_1,
  SUSPICIUS_LEVEL_2,
  SUSPICIUS_LEVEL_3,
  SUSPICIUS_LEVEL_4,
  SUSPICIUS_THRESHOLD_1,
  SUSPICIUS_THRESHOLD_2,
  VOTE_CAST_SIG,
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

export class TestUtils {
  private zip(lists: any[][]) {
    return lists[0].map((_, c) => lists.map((row) => row[c]));
  }

  private createTxEvent(blockNum: number): TransactionEvent {
    return createTransactionEvent({
      transaction: {} as any,
      receipt: {} as any,
      block: {
        hash: {} as any,
        timestamp: {} as any,
        number: blockNum,
      },
    });
  }

  private createLogEvent(
    signature: string,
    result: Array<any> & { [key: string]: any }
  ): LogDescription {
    return {
      eventFragment: {} as any,
      name: {} as any,
      signature: signature,
      topic: {} as any,
      args: result,
      address: "",
    };
  }
  public createEventWithLogs(
    blockNum: number,
    signatures: string[],
    logs: any[]
  ) {
    const txEvent = this.createTxEvent(blockNum);

    const eventDescription: LogDescription[] = [];
    this.zip([signatures, logs]).forEach((result) =>
      eventDescription.push(this.createLogEvent(result[0], result[1]))
    );
    txEvent.filterLog = () => eventDescription;

    return txEvent;
  }

  public createVoteTx(
    blockNum: number,
    mockUni: any,
    priorVotes: number,
    currentVotes: number
  ) {
    mockUni.getPriorVotes = () => priorVotes;
    let args: Array<any> & { [key: string]: any } = [];
    args["voter"] = currentVotes;
    const mockTx = this.createEventWithLogs(blockNum, [VOTE_CAST_SIG], [args]);
    return mockTx;
  }
}
