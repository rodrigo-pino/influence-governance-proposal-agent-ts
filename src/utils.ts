import { BigNumber } from "ethers";
import {
  createTransactionEvent,
  TransactionEvent,
  LogDescription,
  Finding,
  FindingType,
  FindingSeverity,
  createBlockEvent,
  BlockEvent,
} from "forta-agent";
import {
  //DECIMALS,
  //DEC_ALERT_1,
  //DEC_ALERT_2,
  //INC_ALERT_1,
  //SUSPICIUS_LEVEL_1,
  //SUSPICIUS_LEVEL_2,
  //SUSPICIUS_LEVEL_3,
  //SUSPICIUS_LEVEL_4,
  SUSPICIUS_THRESHOLD_1,
  SUSPICIUS_THRESHOLD_2,
  VOTE_CAST_SIG,
} from "./const";

const INC_ALERT_1 = "UNI-INC-1";
const DEC_ALERT_1 = "UNI-DEC-1";
const DEC_ALERT_2 = "UNI-DEC-2";

const DECIMALS = BigNumber.from(10).pow(18);
export const toBase18Votes = (num: number) => BigNumber.from(num).mul(DECIMALS);
const fromBase18Votes = (num: BigNumber) => num.div(DECIMALS);

const SUSPICIUS_LEVEL_4 = toBase18Votes(800);
const SUSPICIUS_LEVEL_3 = toBase18Votes(300);
const SUSPICIUS_LEVEL_2 = toBase18Votes(150);
const SUSPICIUS_LEVEL_1 = toBase18Votes(50);

export class VoterTrack {
  address!: string;
  votes!: BigNumber;
  blockNum!: number;
  suspicius: number = 0;
}

export const analyzeBalanceChange = (
  currentBalance: BigNumber,
  priorBalance: BigNumber
): number => {
  const balanceChange = currentBalance.sub(priorBalance);
  if (balanceChange.eq(0)) return 0;

  let suspicius: number = 0;
  if (balanceChange.gte(SUSPICIUS_LEVEL_4)) suspicius = 4;
  else if (balanceChange.gte(SUSPICIUS_LEVEL_3)) suspicius = 3;
  else if (balanceChange.gte(SUSPICIUS_LEVEL_2)) suspicius = 2;
  else if (balanceChange.gte(SUSPICIUS_LEVEL_1)) suspicius = 1;

  if (currentBalance >= priorBalance.add(priorBalance.div(4))) suspicius++;

  return suspicius;
};

export class Alerts {
  public txBalanceIncrease(
    severity: number,
    address: string,
    currentBalance: BigNumber,
    priorBalance: BigNumber
  ) {
    return Finding.fromObject({
      name: "Voter Balance Increase",
      description: `Voter balance increased by ${fromBase18Votes(
        currentBalance.sub(priorBalance)
      )}`,
      alertId: INC_ALERT_1,
      severity: severity,
      type: severity === 1 ? FindingType.Info : FindingType.Suspicious,
      metadata: {
        voterAddress: address,
        currentBalance: currentBalance.toString(),
        priorBalance: priorBalance.toString(),
      },
    });
  }

  public blockSuspiciusBalanceDecreased(
    voter: VoterTrack,
    currentVote: BigNumber
  ) {
    return Finding.fromObject({
      name: "Suspicius Account Balance Decrease",
      description: `Suspicius account balance decreased ${fromBase18Votes(
        voter.votes.sub(currentVote)
      )}`,
      alertId: DEC_ALERT_2,
      severity: (voter.suspicius + 1) % 5,
      type: FindingType.Suspicious,
      metadata: {
        voterAddress: voter.address,
        curretBalance: currentVote.toString(),
        priorBalance: voter.votes.toString(),
      },
    });
  }

  public blockBalanceDecreased(voter: VoterTrack, currentVote: BigNumber) {
    return Finding.fromObject({
      name: "Account Balance Decrease",
      description: `Account balance decreased ${fromBase18Votes(
        voter.votes.sub(currentVote)
      )}`,
      alertId: DEC_ALERT_1,
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
      metadata: {
        voterAddress: voter.address,
        curretBalance: currentVote.toString(),
        priorBalance: voter.votes.toString(),
      },
    });
  }
}

export class TestUtils {
  private zip(lists: any[][]) {
    return lists[0].map((_, c) => lists.map((row) => row[c]));
  }

  private createBckEvent(blockNum: number): BlockEvent {
    return createBlockEvent({
      type: {} as any,
      network: {} as any,
      block: {
        uncles: [],
        transactions: [],
        stateRoot: "",
        timestamp: 0,
        totalDifficulty: "",
        transactionsRoot: "",
        sha3Uncles: "",
        size: "",
        difficulty: "",
        extraData: "",
        gasLimit: "",
        gasUsed: "",
        logsBloom: "",
        hash: "",
        miner: "",
        mixHash: "",
        nonce: "",
        parentHash: "",
        receiptsRoot: "",
        number: blockNum,
      },
    });
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
    address: string,
    blockNum: number,
    currentVotes: BigNumber
  ) {
    let args: Array<any> & { [key: string]: any } = [];
    args["voter"] = address;
    args["votes"] = currentVotes;
    const mockTx = this.createEventWithLogs(blockNum, [VOTE_CAST_SIG], [args]);
    return mockTx;
  }

  public createVoteBlock(blockNum: number) {
    return this.createBckEvent(blockNum);
  }
}
