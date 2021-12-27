import {
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import { DECIMALS, GOVERNOR_BRAVO_ADDRESS, VOTE_CAST_SIG } from "./const";
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

    console.log(`votes: ${voterVotes / DECIMALS}`);
    // If vote has a significant balance increase send alert
    // and set it as suspicius for later tracking
    const balanceChange = voterVotes - priorVotes;
    if (balanceChange >= 1 * DECIMALS) {
      findings.push(
        Finding.fromObject({
          name: "Voter Balance Increase",
          description: `Voter Balance increased by ${balanceChange / DECIMALS}`,
          alertId: "UNI-INC-1",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: {
            voterAddress: voterAddress,
            currentBalance: voterVotes,
            priorBalance: priorVotes,
          },
        })
      );
    }

    // Save all detected votes and keep checking them
    // for the next 100 blocks
    previousVoters.push({
      address: voterAddress,
      votes: voterVotes,
      blockNum: blockNum,
      suspicius: balanceChange > 0,
    });
  }

  return findings;
};
