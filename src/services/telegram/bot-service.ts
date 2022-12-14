import TelegramBot, { SendMessageOptions } from "node-telegram-bot-api";
import {
  InlineKeyboard,
  InlineKeyboardButton,
  Row
} from "node-telegram-keyboard-wrapper";
import { botInstance } from "../../global-bot-config";
import AppStoreUrlParser from "../brain/app-store-url-parser";
import ComparePrice from "../brain/compare-price";
import { glog } from "../logger/custom-logger";
import PriceCheckingScheduler from "../scheduler/price-checking-scheduler";
import DbHandler from "../sqlite/db-handler";
import AnswerCallbackResponder from "./answer-callback-responder";

enum CheckReplyForEdit {
  StopProcessing = 1,
  KeepProcessing
}

export default class BotService {
  private static instance: BotService;

  private constructor() {}

  static getInstance() {
    if (!BotService.instance) {
      BotService.instance = new BotService();
    }

    return BotService.instance;
  }

  start() {
    botInstance.on("message", this._messageHandler);
    botInstance.on("polling_error", err => console.log(err));
    botInstance.on("callback_query", async msg => {
      let responder = new AnswerCallbackResponder(msg);
      responder.start();
    });
  }

  showHelp(chatId: number) {
    let greetingMessage = "반갑습니다\n\n";
    greetingMessage += "--- 사용법 ---\n";
    greetingMessage += `AppStore에서 공유하기 버튼을 눌러 링크복사를 하시고, 봇에게 링크를 보내면 가격이 변경될 때 마다 메세지를 보내드립니다.\n\n`;

    greetingMessage += `메세지를 받은 후 다음부터 메세지를 받을지 말지 선택할 수 있습니다.\n`;
    this.sendMsg(chatId, greetingMessage);
  }

  sendMsg(
    chatId: number,
    msg: string,
    options: SendMessageOptions = { parse_mode: "HTML" }
  ): Promise<TelegramBot.Message | null> {
    return botInstance.sendMessage(chatId, msg, options).catch(e => {
      glog.error(`[Line - 55][File - bot-service.ts] ${e}`);
      return null;
    });
  }

  addUser(username: string, chatId: number, firstName: string) {
    DbHandler.insertNewUser(username, firstName)
      .then(() => this.showHelp(chatId))
      .catch(e => {
        glog.error(`[Line - 66][File - bot-service.ts] ${e}`);
      });
  }

  addChatroom(username: string, chatId: number) {
    DbHandler.insertChatroom(username, chatId)
      .then(() => console.log)
      .catch(e => {
        glog.error(`[Line - 74][File - bot-service.ts] ${e}`);
      });
  }

  addNewApp(username: string, chatId: number, storeId: string) {
    let store = require("app-store-scraper");
    store
      .app({ id: storeId })
      .then((v: any) => {
        const { id, url, title, price, free, currency } = v;

        if (free === false) {
          // skip free app
          DbHandler.insertApp(id, username, chatId, url, price, title)
            .then(() => {
              this.sendMsg(chatId, `${title} 앱이 등록 되었습니다.`);
            })
            .catch(e => {
              if (e.includes("UNIQUE constraint failed")) {
                this.sendMsg(
                  chatId,
                  `${title} 이미 같은 앱이 등록 되어있습니다.`
                );
              } else {
                this.sendMsg(chatId, e);
              }
            });
        } else {
          this.sendMsg(chatId, "무료앱은 지원하지 않습니다.");
        }
      })
      .catch((e: any) => {
        this.sendMsg(chatId, `${e}`);
        glog.error(`[Line - 100][File - bot-service.ts] ${e}`);
      });
  }

  startBot(username: string, chatId: number, name: string = "") {
    this.addUser(username, chatId, name);
    this.addChatroom(username, chatId);
  }

  private _messageHandler = async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const username = msg.from?.username;

    if (!username) {
      this.sendMsg(chatId, "텔레그램 아이디가 없다면 설정에서 생성하세요");
      return;
    }

    if ((await DbHandler.isExistingUsername(username)) === false) {
      this.addUser(username, chatId, msg.from?.first_name ?? "");
      glog.warn(
        `[Line - 94][File - bot-service.ts] new user added [${username}]`
      );
    }

    if ((await DbHandler.isExistingChatId(chatId)) === false) {
      glog.warn(
        `[Line - 101][File - bot-service.ts] new chatroom added [${chatId}]`
      );
      this.addChatroom(username, chatId);
    }

    if (msg.entities && msg.entities[0].type === "bot_command") {
      const cmd = msg.text?.split(" ") ?? [""];
      switch (true) {
        // ----------------------------------- 게스트 메뉴
        case /\/help/.test(cmd[0]):
          this.showHelp(chatId);
          break;
        case /\/start/.test(cmd[0]):
          this.startBot(username, chatId, msg.from?.first_name);
          break;
        case /\/list/.test(cmd[0]):
          const cp = new ComparePrice();
          cp.sendBackAllAppsToUser(username, chatId);
          break;
        default:
          console.log(`${username} - ${msg.text}`);
          break;
      }
      return;
    } else {
      if (msg.text) {
        const parser = new AppStoreUrlParser(msg.text);

        if (parser.isValidAppStoreUrl() === false) {
          this.sendMsg(chatId, "AppStore URL만 적용됩니다.");
          return;
        }

        const storeId = parser.getStoreIdFromUrl();
        if (storeId) {
          this.addNewApp(username, chatId, storeId);
        }
      }
    }
  };
}
