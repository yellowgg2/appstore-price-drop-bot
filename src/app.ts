require("custom-env").env();

if (process.env.NODE_ENV === "development") {
  require("custom-env").env("dev");
}

function checkEnvs() {
  if (process.env.BOT_API_TOKEN) {
    return;
  }
  console.error("There are missing env variable. check the .env file");
  console.log("==================");
  console.log(process.env.BOT_API_TOKEN);
  console.log("==================");
  process.exit(1);
}

checkEnvs();

import { glog } from "./services/logger/custom-logger";
import PriceCheckingScheduler from "./services/scheduler/price-checking-scheduler";
import DbService from "./services/sqlite/db-service";
import BotService from "./services/telegram/bot-service";

class Starter {
  startServer = async () => {
    await DbService.getInstance()
      .createTables()
      .then(() => {
        let period = parseInt(process.env?.CHECK_PERIOD ?? "600");
        let pcs = new PriceCheckingScheduler(period);
        pcs.start();
      })
      .catch(e => glog.error(`[Line - 14][File - app.ts] ${e}`));

    BotService.getInstance().start();

    process.on("SIGINT", () => {
      process.exit(0);
    });
  };

  startDevServer = async () => {};
}

new Starter().startServer();
