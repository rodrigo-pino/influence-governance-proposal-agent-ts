import { HandleTransaction, HandleBlock } from "forta-agent";
import {
  Alerts,
  analyzeBalanceChange,
  toBase18Votes,
  TestUtils,
  VoterTrack,
} from "./utils";
import agent from "./agent";
import { BigNumber } from "ethers";

describe("voters balance status after voting", () => {
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let mockUni: any;
  let previousVoters: Array<VoterTrack>;

  const testUtils = new TestUtils();
  const alerts = new Alerts();

  beforeEach(() => {
    mockUni = {};
    previousVoters = [];
    handleTransaction = agent.provideHandleTransaction(mockUni, previousVoters);
    handleBlock = agent.provideHandleBlock(mockUni, previousVoters);
  });

  it("balance increase", async () => {
    // Needs to detect an inital voter to track it later
    const blockNum = 100;
    mockUni.getPriorVotes = () => toBase18Votes(100);
    const voteTx = testUtils.createVoteTx(
      "0x1111",
      blockNum,
      toBase18Votes(100)
    );
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([]);

    // The tracked voter new balance
    mockUni.getPriorVotes = () => toBase18Votes(150);
    const voteBlock = testUtils.createVoteBlock(blockNum + 50);
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([]);
  });

  it("balance decrease", async () => {
    mockUni.getPriorVotes = () => toBase18Votes(100);
    const voteTx = testUtils.createVoteTx("0x1111", 100, toBase18Votes(100));
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([]);

    mockUni.getPriorVotes = () => toBase18Votes(50);
    const voteBlock = testUtils.createVoteBlock(150);
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([
      alerts.blockBalanceDecreased(
        {
          address: "0x1111",
          votes: toBase18Votes(100),
          blockNum: 150,
          suspicius: 0,
        },
        toBase18Votes(50)
      ),
    ]);
  });

  // Only once a balance decrease must be alerted!
  it("balance decrease twice", async () => {
    mockUni.getPriorVotes = () => toBase18Votes(100);
    const voteTx = testUtils.createVoteTx("0x1111", 100, toBase18Votes(100));
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([]);

    mockUni.getPriorVotes = () => toBase18Votes(50);
    let voteBlock = testUtils.createVoteBlock(150);

    // Alert once
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([
      alerts.blockBalanceDecreased(
        {
          address: "0x1111",
          votes: toBase18Votes(100),
          blockNum: 150,
          suspicius: 0,
        },
        toBase18Votes(50)
      ),
    ]);

    // Do not alert again
    mockUni.getPriorVotes = () => toBase18Votes(25);
    voteBlock = testUtils.createVoteBlock(151);
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([]);
  });

  // After block current + 100 voter balance is not tracked again
  it("balance decrease after block +100", async () => {
    mockUni.getPriorVotes = () => toBase18Votes(100);
    const voteTx = testUtils.createVoteTx("0x1111", 100, toBase18Votes(100));
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([]);

    mockUni.getPriorVotes = () => toBase18Votes(50);
    const voteBlock = testUtils.createVoteBlock(201);
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([]);
  });

  // Special alert for already suspicius accounts
  it("balance increase before vote and decrease after vote", async () => {
    const priorVotes = toBase18Votes(50);
    const currentVotes = toBase18Votes(100);
    const blockNum = 100;
    const suspicius = analyzeBalanceChange(currentVotes, priorVotes);

    // Balance increase, expect an alert
    mockUni.getPriorVotes = () => priorVotes;
    const voteTx = testUtils.createVoteTx("0x1111", blockNum, currentVotes);
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([
      alerts.txBalanceIncrease(suspicius, "0x1111", currentVotes, priorVotes),
    ]);

    // Balance decrease, expect a suspicius alert
    const newVotes = toBase18Votes(50);
    const blockTx = testUtils.createVoteBlock(blockNum + 99);
    findings = await handleBlock(blockTx);
    expect(findings).toStrictEqual([
      alerts.blockSuspiciusBalanceDecreased(
        {
          address: "0x1111",
          votes: currentVotes,
          blockNum: blockNum,
          suspicius: suspicius,
        },
        newVotes
      ),
    ]);
  });
});
