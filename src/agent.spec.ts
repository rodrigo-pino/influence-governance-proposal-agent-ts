import { HandleTransaction, HandleBlock } from "forta-agent";
import { Alerts, analyzeBalanceChange, TestUtils, VoterTrack } from "./utils";
import agent from "./agent";
import { VOTE_CAST_SIG } from "./const";
import { BigNumber } from "ethers";

describe("governance influence detection", () => {
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

  it("voters without balance change", async () => {
    mockUni.getPriorVotes = () => BigNumber.from(100);
    const voteTx = testUtils.createVoteTx("0x1111", 100, BigNumber.from(100));
    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual([]);
  });
  it("voter uni balance decreases before voting", async () => {
    mockUni.getPriorVotes = () => BigNumber.from(300);
    const voteTx = testUtils.createVoteTx("0x1111", 100, BigNumber.from(100));
    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual([]);
  });

  it("voter uni balance increases before voting", async () => {
    const priorBalance = BigNumber.from(0);
    const currentBalance = BigNumber.from(100);
    mockUni.getPriorVotes = () => priorBalance;
    const voteTx = testUtils.createVoteTx("0x1111", 100, currentBalance);
    const expectedFindings = [
      alerts.txBalanceIncrease(
        analyzeBalanceChange(currentBalance, priorBalance),
        "0x1111",
        currentBalance,
        priorBalance
      ),
    ];

    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual(expectedFindings);
  });

  it("voter uni balance increases after voting", async () => {
    mockUni.getPriorVotes = () => BigNumber.from(100);
    const voteTx = testUtils.createVoteTx("0x1111", 100, BigNumber.from(100));
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([]);

    mockUni.getPriorVotes = () => BigNumber.from(150);
    const voteBlock = testUtils.createVoteBlock(150);
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([]);
  });

  it("voter uni balance decreases after voting", async () => {
    mockUni.getPriorVotes = () => BigNumber.from(100);
    const voteTx = testUtils.createVoteTx("0x1111", 100, BigNumber.from(100));
    let findings = await handleTransaction(voteTx);
    expect(findings).toStrictEqual([]);

    mockUni.getPriorVotes = () => BigNumber.from(50);
    const voteBlock = testUtils.createVoteBlock(150);
    findings = await handleBlock(voteBlock);
    expect(findings).toStrictEqual([
      alerts.blockBalanceDecreased(
        {
          address: "0x1111",
          votes: BigNumber.from(100),
          blockNum: 150,
          suspicius: 0,
        },
        BigNumber.from(50)
      ),
    ]);
  });
  it("voter uni balance increase after voting and then decreases", () => {});
});
