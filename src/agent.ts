import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getJsonRpcUrl,
} from "forta-agent";
import {
  GOVERNOR_BRAVO_ADDRESS,
  UNI_ABI,
  UNI_ADDRESS,
  VOTE_CAST_SIG,
} from "./const";

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
const uni = new ethers.Contract(UNI_ADDRESS, UNI_ABI, provider);

const previousVoters: Array<VoterTrack> = new Array();

class VoterTrack {
  address!: string;
  votes!: BigNumber;
  blockNum!: number;
  suspicius: boolean = false;
}

const handleTransaction: HandleTransaction = async (
  transactionEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  console.log("handling transaction");

  const voteCasts = transactionEvent.filterLog(
    VOTE_CAST_SIG,
    GOVERNOR_BRAVO_ADDRESS
  );

  const blockNum = transactionEvent.blockNumber;
  console.log(`Transaction ocurred in blocknum: ${blockNum}`);
  for (const vote of voteCasts) {
    const voterAddress = vote.args.voter;
    const priorVotes = await uni.getPriorVotes(voterAddress, blockNum - 100);

    const voterVotes = vote.args.votes;

    console.log(`votes: ${voterVotes}`);

    //
    let suspicius = false;
    if (voterVotes - (await priorVotes) >= 0) {
      suspicius = true;
      findings.push(
        Finding.fromObject({
          name: "Significant balance Increase",
          description: "It increased like, a lot",
          alertId: "UNI-INC-1",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
        })
      );
    }

    // Keep track of all voters to check transaction changes
    previousVoters.push({
      address: voterAddress,
      votes: voterVotes,
      blockNum: blockNum,
      suspicius: suspicius,
    });
  }

  return findings;
};

// For each block check if any voter had it's uni balance decreased
const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];

  // Delete all voters which voted 100 or more blocks ago
  while (
    previousVoters.length > 0 &&
    blockEvent.blockNumber - previousVoters[0].blockNum < 100
  ) {
    previousVoters.shift();
  }

  // Get the current account balance of every voter
  const currentBalance = previousVoters.map(async (voter) =>
    uni.getPriorVotes(voter.address)
  );

  const deleteIndices: Array<number> = [];
  for (let i = 0; i < previousVoters.length; i++) {
    const voter = previousVoters[i];
    const currentVote = await currentBalance[i];

    // If balance decreased
    if (currentVote < voter.votes) {
      let finding: Finding;
      // Throw a different alert if balance decreased
      // from an already suspicius account
      if (voter.suspicius) {
        finding = Finding.fromObject({
          name: "Account balance decrease",
          description: "Account balance decreased",
          alertId: "UNI-DEC-2",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
        });
      } else {
        finding = Finding.fromObject({
          name: "Account balance decrease",
          description: "Account balance decreased",
          alertId: "UNI-DEC-1",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
        });
      }
      deleteIndices.push(i);
      // Add finding
      findings.push(finding);
    }
  }

  // Stop tracking suspicius voters
  for (const index of deleteIndices.reverse()) {
    previousVoters.splice(index, 1);
  }
  return findings;
};

export default {
  handleBlock,
  handleTransaction,
};
