require("dotenv").config();
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, sepolia } from "@alchemy/aa-core";
import { Hex, pad } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  SessionKeyPermissionsBuilder,
  accountLoupeActions,
  multiOwnerPluginActions,
  sessionKeyPluginActions,
  pluginManagerActions,
} from "@alchemy/aa-accounts";

(async () => {
  const owner = LocalAccountSigner.privateKeyToAccountSigner(
    process.env.PRIVATE_KEY as Hex
  );
  const smartAccountClient = (
    await createModularAccountAlchemyClient({
      apiKey: process.env.API_KEY,
      chain: sepolia,
      owner,
    })
  )
    .extend(pluginManagerActions)
    .extend(accountLoupeActions)
    .extend(multiOwnerPluginActions)
    .extend(sessionKeyPluginActions);

  let plugins: readonly Hex[] = [];
  try {
    plugins = await smartAccountClient.getInstalledPlugins({});
  } catch (ex) {}

  const sessionKeyAccount = privateKeyToAccount(process.env.SESSION_KEY as Hex);
  const permissions = new SessionKeyPermissionsBuilder()
    .setNativeTokenSpendLimit({
      spendLimit: 1000000n,
    })
    .encode();
  if (plugins.length <= 1) {
    const { hash } = await smartAccountClient.installSessionKeyPlugin({
      // 1st arg is the initial set of session keys
      // 2nd arg is the tags for the session keys
      // 3rd arg is the initial set of permissions
      args: [[sessionKeyAccount.address], [pad("0x0")], [permissions]],
    });
  }
  // else {
  //   const sessionKeyAccount = privateKeyToAccount(
  //     process.env.SESSION_KEY as Hex
  //   );
  //   const result = await smartAccountClient.addSessionKey({
  //     key: sessionKeyAccount.address,
  //     tag: pad("0x1"),
  //     permissions,
  //   });
  //   console.log(result);
  // }

  console.log(plugins);
})();
