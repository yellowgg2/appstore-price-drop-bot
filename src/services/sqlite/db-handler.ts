import DbService from "./db-service";

interface IUsers {
  username: string;
  first_name: string;
}
export interface IAppPrices {
  store_id: string;
  username: string;
  chatroom_id: number;
  url: string;
  latest_price: string;
  title: string;
}

export default class DbHandler {
  static async insertNewUser(
    username: string,
    firstName: string
  ): Promise<void> {
    await DbService.getInstance().writeQuery(
      "INSERT INTO users(username, first_name) VALUES (?, ?)",
      [username, firstName]
    );
  }

  static async insertChatroom(
    username: string,
    chatroomId: number
  ): Promise<void> {
    await DbService.getInstance().writeQuery(
      "INSERT INTO chatroom(username, chatroom_id) VALUES (?, ?)",
      [username, chatroomId]
    );
  }

  static async isExistingUsername(username: string): Promise<boolean> {
    let result: Array<IUsers> = await DbService.getInstance().selectQuery(
      `SELECT * FROM users WHERE username = '${username}'`
    );

    return result.length !== 0;
  }

  static async isExistingChatId(chatId: number): Promise<boolean> {
    let result: Array<IUsers> = await DbService.getInstance().selectQuery(
      `SELECT * FROM chatroom WHERE chatroom_id = ${chatId}`
    );

    return result.length !== 0;
  }

  static async getAllApps(): Promise<Array<IAppPrices>> {
    let result: Array<IAppPrices> = await DbService.getInstance().selectQuery(
      `SELECT * FROM appstore_price`
    );

    return result;
  }

  static async getAllAppsForUser(
    username: string,
    chatId: number
  ): Promise<Array<IAppPrices>> {
    let result: Array<IAppPrices> = await DbService.getInstance().selectQuery(
      `SELECT * FROM appstore_price WHERE username = '${username}' AND chatroom_id = ${chatId}`
    );

    return result;
  }

  static async insertApp(
    storeId: string,
    username: string,
    chatroomId: number,
    url: string,
    curPrice: string,
    title: string
  ): Promise<void> {
    await DbService.getInstance().writeQuery(
      "INSERT INTO appstore_price(store_id, username, chatroom_id, url, latest_price, title) VALUES (?, ?, ?, ?, ?, ?)",
      [storeId, username, chatroomId, url, curPrice, title]
    );
  }

  // if user wants to keep the alert for the app, then update the price and pre price
  // otherwise, delete the record to prevent to send a message
  static async updateAppPrice(
    storeId: string,
    username: string,
    chatroomId: number,
    curPrice: string
  ): Promise<void> {
    await DbService.getInstance().writeQuery(
      "UPDATE appstore_price SET latest_price = ? WHERE store_id = ? AND username = ? AND chatroom_id = ?",
      [curPrice, storeId, username, chatroomId]
    );
  }

  static async deleteApp(
    storeId: string,
    username: string,
    chatroomId: number
  ): Promise<void> {
    await DbService.getInstance().writeQuery(
      `DELETE FROM appstore_price WHERE store_id = ? AND username = ? AND chatroom_id = ?`,
      [storeId, username, chatroomId]
    );
  }

  static async deleteUserApps(username: string): Promise<void> {
    await DbService.getInstance().writeQuery(
      `DELETE FROM appstore_price where username = '${username}'`
    );
  }
}
