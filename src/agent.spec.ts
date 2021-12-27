import { HandleTransaction, HandleBlock } from "forta-agent";
import { TestUtils } from "./utils";
import agent from "./agent";
import { VOTE_CAST_SIG } from "./const";

describe("governance influence detection", () => {
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let mockUni: any;

  const testUtils = new TestUtils();

  beforeAll(() => {
    mockUni = {};
    handleTransaction = agent.provideHandleTransaction(mockUni);
    handleBlock = agent.provideHandleBlock(mockUni);
  });

  it("voters without balance change", async () => {
    const voteTx = testUtils.createVoteTx(100, mockUni, 100, 100);
    const findings = await handleTransaction(voteTx);

    console.log(findings);
  });
  it("voter uni balance decreases before voting", async () => {});
  it("voter uni balance increases before voting", async () => {});
  it("voter uni balance increases after voting", () => {});
  it("voter uni balance decreases after voting", () => {});
  it("voter uni balance increase after voting and then decreases", () => {});
});
