# Uniswap Governance Agent

## Description

This agent detects any attempt to influence Uniswap governance proposals.

## Config

It is possible to change what does the agent recognize as a significant amount by modifying `SUSPICIOUS_LEVEL_i` and `SUSPICIOUS_THRESHOLD` in  *src/const.ts*:

* `SUSPICIOUS_LEVEL_i` determines the severity level fired by **UNI-BALANCE-INC-1** (_default: 50, 150, 300 and 800_)
* `SUSPICIOUS_THRESHOLD` determines when to increase the severity level by one when current balance surpass older balance by a certain threshold (_default: 4 which means 25%_)

## Supported Chains

- Ethereum

## Alerts

- **UNI-BALANCE-INC-1**
  - Fired when a `VoteCast` event  is detected and the voter had recently increased significantly his Uniswap token balance
  - Severity can be `"info"`, `"low"`, `"medium"`,  `"high"` and `"critical"` depending on how much the balanced increased:
    * `"info"` when balance increased over 50 tokens
    * `"low"` when balance increased over 150 tokens
    * `"medium"` when balance increased over 300 tokens
    * `"high"` when balance increased over 800 tokens
    * Every alert gets a level higher if current balance increased more than 25% over the balance 100 blocks from the current. For example:`"info"` becomes `"low"`, and `"high"` becomes `"critical"`, etc...
  - Type is always set to `"suspicious"` except when severity is set to `"info"`in which case Type is set to `"info"` as well.
  - `metadata`
    * `voterAddress` suspect account address
    * `currentBalance` suspect current balance
    * `priorBalance` suspect balance 100 blocks before the current
- **UNI-BALANCE-DEC-1**
  * Fired when an account which already cast a vote has its balance decreased
  * Severity is always set to `"medium"`
  * Type is always set to `"suspicius"`
  * `metadata`
    * `voterAddress` suspect account address
    * `currentBalance` suspect updated balance
    * `voteBalance` suspect balance when it casted a vote
- **UNI-BALANCE-DEC-2**
  * Fired when an already suspicious account (an account that fired **UNI-BALANCE-INC-1**) has its balance decreased
  * Severity is set one level higher over the fired **UNI-BALANCE-INC-1**. 
  * Type is always set to `"suspicius"`
  * `metadata`
    * `voterAddress` suspect account address
    * `currentBalance` suspect updated balance
    * `voteBalance` suspect balance when it casted a vote



