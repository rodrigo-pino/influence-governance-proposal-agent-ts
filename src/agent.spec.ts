import { createTransactionEvent, ethers } from "forta-agent";
import { GOVERNOR_BRAVO_ADDRESS } from "./const";

var spawn = require("child_process").spawn;

describe("high gas agent", () => {
  it("aaa", async () => {
    const provider = new ethers.providers.EtherscanProvider(
      "homestead",
      "7TY68RZP4EI89Z3YYYVVP9WB6TES3G8HAY"
    );
    //const gov = new ethers.Contract(GOVERNOR_BRAVO_ADDRESS, abi, provider);

    const f = async () => {
      let txs = provider.getHistory(GOVERNOR_BRAVO_ADDRESS);
      return txs;
    };
    let txs = await f();
    console.log("Got logs");
    let count = 0;
    txs.forEach((tx) => {
      console.log("start foreach");
      if (count > 1) return;
      count = count + 1;
      const txAddress = tx.hash;
      console.log("spawning");
      var prc = spawn("npm", ["run", "tx", txAddress]);
      console.log("endspawn");
    });
  });
});
