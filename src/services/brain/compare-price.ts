import { SendMessageOptions } from "node-telegram-bot-api";
import {
  InlineKeyboard,
  InlineKeyboardButton,
  Row
} from "node-telegram-keyboard-wrapper";
import { botInstance } from "../../global-bot-config";
import DbHandler, { IAppPrices } from "../sqlite/db-handler";

// inline button을 눌렀을 때 발생하는 이벤트를 처리하는 클래스
export default class ComparePrice {
  async startCompareApps() {
    let apps = await DbHandler.getAllApps();
    for (let app of apps) {
      await this.checkPriceOfApp(app);
    }
  }

  async sendBackAllAppsToUser(username: string, chatId: number) {
    let apps = await DbHandler.getAllAppsForUser(username, chatId);
    for (let app of apps) {
      const { url, latest_price, title } = app;
      let builtMsg = `[ ${title} ] 현재가격: $${latest_price}\n${url}`;
      this.sendBackNotiWithButtons(builtMsg, latest_price, app, false);
    }
  }

  async sendBackStatsToAdmin(username: string, chatId: number) {
    let users = await DbHandler.getAllUsersCount();
    let apps = await DbHandler.getAllAppsCount();

    let builtMsg = "통계\n";
    builtMsg += "------------\n\n";
    builtMsg += `사용자 수: ${users[0].count}\n`;
    builtMsg += `등록 앱 수: ${apps[0].count}`;
    this.sendMsg(chatId, builtMsg);
  }

  async checkPriceOfApp(appInfo: IAppPrices) {
    let store = require("app-store-scraper");

    let v = await store.app({ id: appInfo.store_id });
    const { url, price, title } = v;

    if (`${price}` !== appInfo.latest_price) {
      let builtMsg = `${url}\n\n`;
      builtMsg += `🛒 [${title}] 앱 가격 변경 알림\n\n`;
      builtMsg += "-----------\n";
      builtMsg += `$${appInfo.latest_price} -> $${price}`;

      this.sendBackNotiWithButtons(builtMsg, price, appInfo);
    }
  }

  sendBackNotiWithButtons(
    builtMsg: string,
    freshPrice: string,
    appInfo: IAppPrices,
    updatePrice: boolean = true
  ) {
    const { store_id, username, chatroom_id, latest_price, url } = appInfo;
    let ik = new InlineKeyboard();
    let firstRow = new Row<InlineKeyboardButton>();

    let _firstRowFormatButtons = [
      new InlineKeyboardButton("💌 알림유지", "callback_data", "keep"),
      new InlineKeyboardButton("💔 알림삭제", "callback_data", store_id)
    ];

    firstRow.push(..._firstRowFormatButtons);

    ik.push(firstRow);

    this.sendMsg(chatroom_id, builtMsg, {
      reply_markup: ik.getMarkup()
    }).then(() => {
      if (updatePrice) {
        DbHandler.updateAppPrice(
          store_id,
          username,
          chatroom_id,
          freshPrice
        ).catch(console.log);
      }
    });
  }

  sendMsg(
    chatId: number,
    msg: string,
    options: SendMessageOptions = { parse_mode: "HTML" }
  ): Promise<any> {
    return botInstance.sendMessage(chatId, msg, options);
  }
}
