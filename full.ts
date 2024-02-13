require("dotenv").config();
import {
  SessionKeyPermissionsBuilder,
  SessionKeyPlugin,
  sessionKeyPluginActions,
} from "@alchemy/aa-accounts";
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import {
  LocalAccountSigner,
  SmartAccountSigner,
  sepolia,
} from "@alchemy/aa-core";
import { Address, Hex, pad, getContract } from "viem";

const SESSION_KEY_PLUGIN_ADDRESS = "0x000000e30a00f600823700E975f1b1ac387f0017";

const feeOptions = {
  // Jack up the verification gas limit to work around an estimation bug
  // in the session key plugin.
  verificationGasLimit: { percentage: 200 },
  // Jack up the call gas limit for cases when state changes cause the
  // execution gas to increase.
  callGasLimit: { percentage: 100 },
};

// export interface GetSessionKeyTimeRangeParams {
//   accountAddress: Address;
//   sessionPublicKey: Address;
// }

// export async function getSessionKeyExpiryTime({
//   accountAddress,
//   sessionPublicKey,
// }: GetSessionKeyTimeRangeParams): Promise<number> {
//   const client = getSmartAccountClient();
//   const loupe = getContract({
//     address: SESSION_KEY_PLUGIN_ADDRESS,
//     abi: SessionKeyPluginAbi,
//     client,
//   });
//   const [, validUntil] = await loupe.read.getKeyTimeRange([
//     accountAddress,
//     sessionPublicKey,
//   ]);
//   return 1000 * validUntil;
// }

(async () => {
  const owner = LocalAccountSigner.privateKeyToAccountSigner(
    process.env.PRIVATE_KEY as Hex
  );
  const chain = sepolia;
  const sessionKeySigner: SmartAccountSigner =
    LocalAccountSigner.privateKeyToAccountSigner(
      process.env.SESSION_KEY as Hex
    );
  const client = (
    await createModularAccountAlchemyClient({
      chain,
      apiKey: process.env.API_KEY,
      owner,
      opts: {
        feeOptions,
      },
      // gasManagerConfig: {
      //   policyId: process.env.POLICY_ID as string,
      // },
    })
  ).extend(sessionKeyPluginActions);

  let isPluginInstalled = false;
  try {
    isPluginInstalled = await client
      .getInstalledPlugins({})
      .then((x) => x.includes(SessionKeyPlugin.meta.addresses[chain.id]));
  } catch (ex) {}

  console.log(client.getAddress());

  if (!isPluginInstalled) {
    const initialPermissions =
      new SessionKeyPermissionsBuilder().setNativeTokenSpendLimit({
        spendLimit: 1000000n,
      });

    const { hash } = await client.installSessionKeyPlugin({
      args: [
        [await sessionKeySigner.getAddress()],
        [pad("0x0")],
        [initialPermissions.encode()],
      ],
      pluginAddress: SESSION_KEY_PLUGIN_ADDRESS,
    });

    await client.waitForUserOperationTransaction({ hash });
  }

  const sessionKeyClient = (
    await createModularAccountAlchemyClient({
      chain,
      owner: sessionKeySigner,
      apiKey: process.env.API_KEY,
      accountAddress: client.getAddress(),
      opts: {
        feeOptions,
      },
      // gasManagerConfig: {
      //   policyId: process.env.POLICY_ID as string,
      // },
    })
  ).extend(sessionKeyPluginActions);

  const result = await sessionKeyClient.executeWithSessionKey({
    args: [
      [
        {
          target: "0x526B251b9bD36135F4AaDB1eBF0041Bb53359E9a",
          value: 1n,
          data: "0x",
        },
      ],
      await sessionKeySigner.getAddress(),
    ],
  });

  console.log(result);
})();
