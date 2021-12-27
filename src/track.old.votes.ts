import BigNumber from "bignumber.js";
import {
  BlockEvent,
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { VoterTrack } from "./utils";

export const trackOldVotes = async (
  blockEvent: BlockEvent,
  uni: ethers.Contract,
  previousVoters: Array<VoterTrack>
) => {
  console.log("Hangling block");
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
    const currentVote: BigNumber = await currentBalance[i];

    // If balance decreased
    if (currentVote.lt(voter.votes)) {
      let finding: Finding;
      // Throw a different alert if balance decreased
      // from an already suspicius account
      const metadata = {
        voterAddress: voter.address,
        currentBalance: currentVote.toString(),
        priorBalance: voter.votes.toString(),
      };
      if (voter.suspicius > 0) {
        finding = Finding.fromObject({
          name: "Suspicius Account Balance Decrease",
          description: `Suspicius account balance decreased ${voter.votes.minus(
            currentVote
          )}`,
          alertId: "UNI-DEC-2",
          severity: (voter.suspicius + 1) % 5,
          type: FindingType.Suspicious,
          metadata: metadata,
        });
      } else {
        finding = Finding.fromObject({
          name: "Account balance decrease",
          description: `Account balance decreased ${voter.votes.minus(
            currentVote
          )}`,
          alertId: "UNI-DEC-1",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: metadata,
        });
      }
      // Add voter to stop tracking
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
