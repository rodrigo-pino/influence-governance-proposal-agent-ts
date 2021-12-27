import { ethers, Finding, TransactionEvent } from "forta-agent";
import { DECIMALS, GOVERNOR_BRAVO_ADDRESS, VOTE_CAST_SIG } from "./const";
import { analyzeBalanceChange, VoterTrack, Alerts } from "./utils";

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

  console.log(voteCasts);
  const blockNum = transactionEvent.blockNumber;
  console.log(`Transaction detected on block: ${blockNum}`);

  // For each voter analyze it's uni balance 100 blocks ago
  const alerts = new Alerts();
  for (const vote of voteCasts) {
    const voterAddress = vote.args.voter;
    const priorBalance = await uni.getPriorVotes(voterAddress, blockNum - 100);

    const currentBalance = vote.args.votes;

    console.log(`changeInbalance ${currentBalance - priorBalance != 0}`);
    if (currentBalance - priorBalance != 0) {
      console.log(`incraseInbalance: ${currentBalance - priorBalance > 0}`);
    }
    // If vote has a significant balance increase send alert
    // and set it as suspicius for later tracking
    const severity = analyzeBalanceChange(currentBalance, priorBalance);
    if (severity > 0) {
      findings.push(
        alerts.txBalanceIncrease(
          severity,
          voterAddress,
          currentBalance,
          priorBalance
        )
      );
    }
    // Save all detected votes and keep checking them
    // for the next 100 blocks
    previousVoters.push({
      address: voterAddress,
      votes: currentBalance,
      blockNum: blockNum,
      suspicius: severity,
    });
  }

  return findings;
};
