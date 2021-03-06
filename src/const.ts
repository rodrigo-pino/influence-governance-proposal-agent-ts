export const GOVERNOR_BRAVO_ADDRESS =
  "0x408ED6354d4973f66138C91495F2f2FCbd8724C3";
export const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

export const VOTE_CAST_SIG =
  "event VoteCast(address indexed voter, uint proposalId, uint8 support, uint votes, string reason)";
export const UNI_ABI = [
  "function getPriorVotes(address, uint) public view returns (uint96)",
];

export const INC_ALERT_1 = "UNI-BALANCE-INC-1";
export const DEC_ALERT_1 = "UNI-BALANCE-DEC-1";
export const DEC_ALERT_2 = "UNI-BALANCE-DEC-2";

export const SUSPICIOUS_LEVEL_1 = 50;
export const SUSPICIOUS_LEVEL_2 = 150;
export const SUSPICIOUS_LEVEL_3 = 300;
export const SUSPICIOUS_LEVEL_4 = 800;
export const SUSPICIOUS_THRESHOLD = 4;
