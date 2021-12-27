import {
  BlockEvent,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  ethers,
  getJsonRpcUrl,
} from "forta-agent";
import { UNI_ABI, UNI_ADDRESS } from "./const";
import { trackOldVotes } from "./track.old.votes";
import { verifyNewVotes } from "./verify.new.votes";
import { VoterTrack } from "./utils";

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
const uni = new ethers.Contract(UNI_ADDRESS, UNI_ABI, provider);
const previousVoters: Array<VoterTrack> = new Array();

const handleTransaction: HandleTransaction = async (
  transactionEvent: TransactionEvent
) => {
  return verifyNewVotes(transactionEvent, uni, previousVoters);
};

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  return trackOldVotes(blockEvent, uni, previousVoters);
};

export default {
  handleBlock,
  handleTransaction,
};
