import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getJsonRpcUrl,
  getEthersProvider,
} from "forta-agent";
import { GOVERNANCE_ADDRESS } from "./const";

import governance_abi from "./governance_abi.json";

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
const governance = new ethers.Contract(
  GOVERNANCE_ADDRESS,
  governance_abi,
  provider
);

// Map voters from previous blocks
const previousVoters: Map<string, number> = new Map();

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];

  return findings;
};

export default {
  handleBlock,
};
