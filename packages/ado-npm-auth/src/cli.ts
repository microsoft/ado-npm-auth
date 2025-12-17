import process from "node:process";

import { main } from "@microsoft/ado-npm-auth-lib";

main().then((result: boolean) => {
  if (!result) {
    process.exitCode = 1;
  }
});
