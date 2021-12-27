import { HandleTransaction, HandleBlock } from "forta-agent";
import { Alerts, analyzeBalanceChange, TestUtils } from "./utils";
import agent from "./agent";
import { VOTE_CAST_SIG } from "./const";

describe("governance influence detection", () => {
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let mockUni: any;

  const testUtils = new TestUtils();
  const alerts = new Alerts();

  beforeAll(() => {
    mockUni = {};
    handleTransaction = agent.provideHandleTransaction(mockUni);
    handleBlock = agent.provideHandleBlock(mockUni);
  });

  it("voters without balance change", async () => {
    const voteTx = testUtils.createVoteTx("0x1111", 100, mockUni, 100, 100);
    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual([]);
  });
  it("voter uni balance decreases before voting", async () => {
    const voteTx = testUtils.createVoteTx("0x1111", 100, mockUni, 300, 100);
    const findings = await handleTransaction(voteTx);

    expect(findings).toStrictEqual([]);
  });
  it("voter uni balance increases before voting", async () => {
    const priorBalance = 0;
    const currentBalance = 100;
    const voteTx = testUtils.createVoteTx(
      "0x1111",
      100,
      mockUni,
      priorBalance,
      currentBalance
    );
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
  it("voter uni balance increases after voting", () => {});
  it("voter uni balance decreases after voting", () => {});
  it("voter uni balance increase after voting and then decreases", () => {});
});
