import {
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { GOVERNOR_BRAVO_ADDRESS, VOTE_CAST_SIG } from "./const";
import { VoterTrack } from "./utils";

export const verifyNewVotes = async (
  transactionEvent: TransactionEvent,
  uni: ethers.Contract,
  previousVoters: Array<VoterTrack>
) => {
  const findings: Finding[] = [];

  // Get all VoteCast events in this transaction
  const voteCasts = transactionEvent.filterLog(
    VOTE_CAST_SIG,
    GOVERNOR_BRAVO_ADDRESS
  );

  const blockNum = transactionEvent.blockNumber;
  console.log(`Transaction detected on block: ${blockNum}`);

  // For each voter analyze it's uni balance 100 blocks ago
  for (const vote of voteCasts) {
    const voterAddress = vote.args.voter;
    const priorVotes = await uni.getPriorVotes(voterAddress, blockNum - 100);

    const voterVotes = vote.args.votes;

    console.log(`votes: ${voterVotes}`);

    // If vote has a significant balance increase send alert
    // and set it as suspicius for later tracking
    let suspicius = false;
    if (voterVotes - priorVotes >= 0) {
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

    // Save all detected votes and keep checking them
    // for the next 100 blocks
    previousVoters.push({
      address: voterAddress,
      votes: voterVotes,
      blockNum: blockNum,
      suspicius: suspicius,
    });
  }

  return findings;
};
