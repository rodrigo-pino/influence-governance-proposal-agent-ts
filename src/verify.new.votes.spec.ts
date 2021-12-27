import { HandleTransaction } from "forta-agent";
import {
  Alerts,
  analyzeBalanceChange,
  toBase18Votes,
  TestUtils,
  VoterTrack,
} from "./utils";
import agent from "./agent";

describe("balance status before voting", () => {
  let handleTransaction: HandleTransaction;
  let mockUni: any;
  let previousVoters: Array<VoterTrack>;

  const testUtils = new TestUtils();
  const alerts = new Alerts();

  beforeEach(() => {
    mockUni = {};
    previousVoters = [];
    handleTransaction = agent.provideHandleTransaction(mockUni, previousVoters);
  });

  it("no change in balance", async () => {
    // balance = 100 at block -100
    mockUni.getPriorVotes = () => toBase18Votes(100);
    // creating transaction with current balance = 100
    const voteTx = testUtils.createVoteTx("0x1111", 100, toBase18Votes(100));
    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual([]);
  });

  it("balance decrease", async () => {
    // balance = 300 at block -100
    mockUni.getPriorVotes = () => toBase18Votes(300);
    // transaction with current balance = 1000
    const voteTx = testUtils.createVoteTx("0x1111", 100, toBase18Votes(100));
    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual([]);
  });

  it("balance increases", async () => {
    // balance = 20 at block -100
    const priorBalance = toBase18Votes(20);
    // balance = 100 at current block
    const currentBalance = toBase18Votes(100);
    mockUni.getPriorVotes = () => priorBalance;
    const voteTx = testUtils.createVoteTx("0x1111", 100, currentBalance);

    // expect an alert
    const findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([
      alerts.txBalanceIncrease(
        analyzeBalanceChange(currentBalance, priorBalance),
        "0x1111",
        currentBalance,
        priorBalance
      ),
    ]);
  });
});
