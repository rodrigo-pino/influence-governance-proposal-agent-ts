import {
  BlockEvent,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import { UNI_ABI, UNI_ADDRESS } from "./const";
import { trackOldVotes } from "./track.old.votes";
import { verifyNewVotes } from "./verify.new.votes";
import { VoterTrack } from "./utils";

const uni = new ethers.Contract(UNI_ADDRESS, UNI_ABI, getEthersProvider());
const previousVoters: Array<VoterTrack> = new Array();

function provideHandleTransaction(
  uniContract: ethers.Contract,
  previousVoters: Array<VoterTrack>
) {
  return async (transactionEvent: TransactionEvent) =>
    verifyNewVotes(transactionEvent, uniContract, previousVoters);
}

function provideHandleBlock(
  uniContract: ethers.Contract,
  previousVoters: Array<VoterTrack>
) {
  return async (blockEvent: BlockEvent) =>
    trackOldVotes(blockEvent, uniContract, previousVoters);
}

export default {
  provideHandleTransaction,
  provideHandleBlock,
  HandleTransaction: provideHandleTransaction(uni, previousVoters),
  HandleBlock: provideHandleBlock(uni, previousVoters),
};
