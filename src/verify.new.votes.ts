import { BigNumber } from "ethers";
import { ethers, Finding, TransactionEvent } from "forta-agent";
import { GOVERNOR_BRAVO_ADDRESS, VOTE_CAST_SIG } from "./const";
import { analyzeBalanceChange, VoterTrack, Alerts } from "./utils";

export const verifyNewVotes = async (
  transactionEvent: TransactionEvent,
  uni: ethers.Contract,
  previousVoters: Array<VoterTrack>
) => {
  console.log("Handling event");
  const findings: Finding[] = [];

  // Get all VoteCast events in this transaction
  const voteCasts = transactionEvent.filterLog(
    VOTE_CAST_SIG,
    GOVERNOR_BRAVO_ADDRESS
  );

  const blockNum = transactionEvent.blockNumber;
  console.log(`Transaction detected on block: ${blockNum}`);
  console.log(`Total alerts: ${voteCasts.length}`);

  // For each voter analyze it's uni balance 100 blocks ago
  const alerts = new Alerts();
  for (const vote of voteCasts) {
    const voterAddress: string = vote.args.voter;
    const priorBalance: BigNumber = await uni.getPriorVotes(
      voterAddress,
      blockNum - 100
    );

    const currentBalance: BigNumber = vote.args.votes;

    console.log("Detected");
    console.log(priorBalance, currentBalance);
    console.log(priorBalance.toString(), currentBalance.toString());
    console.log(`changeInbalance ${currentBalance.sub(priorBalance)}`);

    // If vote has a significant balance increase send alert
    // and set it as suspicius for later tracking
    const severity = analyzeBalanceChange(currentBalance, priorBalance);
    console.log("severity:", severity);
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
