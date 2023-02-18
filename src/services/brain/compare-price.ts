import { SendMessageOptions } from "node-telegram-bot-api";
import {
  InlineKeyboard,
  InlineKeyboardButton,
  Row
} from "node-telegram-keyboard-wrapper";
import { botInstance } from "../../global-bot-config";
import { glog } from "../logger/custom-logger";
import DbHandler, { IAppPrices, IAppTracker } from "../sqlite/db-handler";
import moment from "moment";

// inline button을 눌렀을 때 발생하는 이벤트를 처리하는 클래스
export default class ComparePrice {
  private preventDupAlert: IAppTracker[] = [];

  async startCompareApps() {
    glog.info(`[Line - 14][File - compare-price.ts] Start Checking Apps`);
    let apps = await DbHandler.getAllApps();
    for (let app of apps) {
      glog.info(
        `[Line - 15][File - compare-price.ts] Check App [${app.title}], Price [${app.latest_price}]`
      );
      await this.checkPriceOfApp(app);
    }
    glog.info(`[Line - 14][File - compare-price.ts] End Checking Apps`);
  }

  async sendBackAllAppsToUser(username: string, chatId: number) {
    let apps = await DbHandler.getAllAppsForUser(username, chatId);
    for (let app of apps) {
      const { url, latest_price, title } = app;
      let builtMsg = `[ ${title} ]\n💰 현재가격: $${latest_price}\n`;
      builtMsg += this.createLinkString(url, "앱스토어 바로가기");
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

  async sendTop5Apps(chatId: number) {
    let apps = await DbHandler.getTop5();
    for (let app of apps) {
      const { url, latest_price, title } = app;
      let builtMsg = `[ ${title} ]\n💰 현재가격: $${latest_price}\n`;
      builtMsg += `🤩 ${app.tot_count} 명이 주시 중\n\n`;
      builtMsg += this.createLinkString(url, "앱스토어 바로가기");
      this.sendMsg(chatId, builtMsg);
    }
  }

  // 리턴값이 true면 알림을 보내고 false면 보내지 않는다
  // 24시간이 지나면 배열에서 뺀다
  checkDupAlert(appInfo: IAppPrices) {
    for (let i = 0; i < this.preventDupAlert.length; i++) {
      let app = this.preventDupAlert[i];
      if (
        app.chatroom_id === appInfo.chatroom_id &&
        app.store_id === appInfo.store_id &&
        app.username === appInfo.username
      ) {
        let diffTime = moment().diff(app.lastUpdateTime);
        if (diffTime < 86400000) {
          return false;
        } else {
          this.preventDupAlert.splice(i, 1);
        }
      }
    }
    this.preventDupAlert.push({ ...appInfo, lastUpdateTime: moment() });
    return true;
  }

  async checkPriceOfApp(appInfo: IAppPrices) {
    let store = require("app-store-scraper");

    let v = await store.app({ id: appInfo.store_id });
    const { url, price, title } = v;

    glog.info(
      `[Line - 63][File - compare-price.ts] Compare DB: [${appInfo.latest_price}] to AppStore: [${price}]`
    );
    if (`${price}` !== appInfo.latest_price && this.checkDupAlert(appInfo)) {
      let builtMsg = this.createLinkString(url, "앱스토어 바로가기");
      builtMsg += `\n\n`;
      builtMsg += `🛒 [${title}] 앱 가격 변경 알림\n\n`;
      builtMsg += "-----------\n";
      builtMsg += `$${appInfo.latest_price} -> $${price}`;

      this.sendBackNotiWithButtons(builtMsg, price, appInfo);
    }
  }

  createLinkString(url: string, title: string) {
    return `👉 <a href="${url}">${title}</a>`;
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
      reply_markup: ik.getMarkup(),
      parse_mode: "HTML"
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
