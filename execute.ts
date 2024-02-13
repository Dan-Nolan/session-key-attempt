require("dotenv").config();
import { sessionKeyPluginActions } from "@alchemy/aa-accounts";
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import {
  LocalAccountSigner,
  sepolia,
  type SmartAccountSigner,
} from "@alchemy/aa-core";
import { Hex } from "viem";

(async () => {
  const mscaAddr = "0x1d2F5E3aa5bC11035DfB0CbE3Ed212A50D0A9dc9";
  const sessionKeySigner: SmartAccountSigner =
    LocalAccountSigner.privateKeyToAccountSigner(
      process.env.SESSION_KEY as Hex
    );

  const sessionKeyClient = (
    await createModularAccountAlchemyClient({
      apiKey: process.env.API_KEY,
      chain: sepolia,
      owner: sessionKeySigner,
      accountAddress: mscaAddr,
    })
  ).extend(sessionKeyPluginActions);

  const result = await sessionKeyClient.executeWithSessionKey({
    args: [
      [
        {
          target: "0x526B251b9bD36135F4AaDB1eBF0041Bb53359E9a",
          data: "0x",
          value: 10000n,
        },
      ],
      await sessionKeySigner.getAddress(),
    ],
  });

  console.log(result);
})();
