import TelegramBot from "node-telegram-bot-api";
import { botInstance } from "../../global-bot-config";
import { glog } from "../logger/custom-logger";
import DbHandler from "../sqlite/db-handler";

// inline button을 눌렀을 때 발생하는 이벤트를 처리하는 클래스
export default class AnswerCallbackResponder {
  constructor(private _query: TelegramBot.CallbackQuery) {}

  async start() {
    botInstance
      .answerCallbackQuery(this._query.id)
      .then(async () => {
        let chatId = this._query.message?.chat.id;
        let username = this._query.from.username;
        let data = this._query.data;

        if (data === "keep") {
          botInstance.sendMessage(
            chatId!,
            "💌 앱 가격이 변경되면 다시 알려드릴게요."
          );
        } else {
          DbHandler.deleteApp(data!, username!, chatId!)
            .then(() => {
              botInstance.sendMessage(
                chatId!,
                "💤 다음부터 이 앱은 알림을 보내지 않습니다."
              );
            })
            .catch(console.log);
        }
        this.clearOutButtons(this._query);
      })
      .catch(error =>
        glog.error(`[Line - 29][File - AnswerCallbackResponder.ts] ${error}`)
      );
  }

  clearOutButtons(msg: TelegramBot.CallbackQuery) {
    botInstance.editMessageReplyMarkup(
      { inline_keyboard: [] },
      {
        chat_id: msg.from?.id,
        message_id: msg.message?.message_id
      }
    );
  }
}
