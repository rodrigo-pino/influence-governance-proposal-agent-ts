import { BigNumber } from "ethers";
import { BlockEvent, ethers, Finding } from "forta-agent";
import { Alerts, VoterTrack } from "./utils";

export const trackOldVotes = async (
  blockEvent: BlockEvent,
  uni: ethers.Contract,
  previousVoters: Array<VoterTrack>
) => {
  const findings: Finding[] = [];

  // Delete all voters which voted 100 or more blocks ago
  while (
    previousVoters.length > 0 &&
    blockEvent.blockNumber - previousVoters[0].blockNum > 100
  ) {
    previousVoters.shift();
  }

  // Get the current account balance for every voter
  const currentBalance = previousVoters.map(async (voter) =>
    uni.getPriorVotes(voter.address)
  );

  const alerts = new Alerts();
  const deleteIndices: Array<number> = [];
  for (let i = 0; i < previousVoters.length; i++) {
    const voter = previousVoters[i];
    const currentVote: BigNumber = await currentBalance[i];

    // If balance decreased
    if (currentVote.lt(voter.votes)) {
      let finding: Finding;
      // Throw a different alert if balance decreased
      // from an already suspicius account
      if (voter.suspicius > 0) {
        finding = alerts.blockSuspiciusBalanceDecreased(voter, currentVote);
      } else {
        finding = alerts.blockBalanceDecreased(voter, currentVote);
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
