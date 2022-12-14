import TelegramBot from "node-telegram-bot-api";

export interface DynamicObject {
  [key: string]: any;
}

let botToken = process.env.BOT_API_TOKEN;

if (!botToken) {
  console.log("========================= NO TOKEN");
  process.exit(1);
} else {
  console.log("You have bot token!");
}

export const botInstance = new TelegramBot(botToken!, {
  polling: true
});
