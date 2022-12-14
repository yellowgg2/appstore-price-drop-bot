import sqlite3 from "sqlite3";
import { glog } from "../logger/custom-logger";

export default class DbService {
  private static instance: DbService;
  private dbInstance?: sqlite3.Database;
  private _dbFilename = "./db/bot.db";

  private constructor() {
    this.open();
  }

  static getInstance() {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }

    return DbService.instance;
  }

  async createTables() {
    let userTable = `
    CREATE TABLE IF NOT EXISTS users (
		username TEXT PRIMARY KEY,
		first_name TEXT
    )`;

    let chatroomTable = `
    CREATE TABLE IF NOT EXISTS chatroom (
		username TEXT,
		chatroom_id INTEGER,
		PRIMARY KEY (username, chatroom_id),
		FOREIGN KEY (username) REFERENCES users (username) 
    )`;

    // 다음에 알림을 안울리게 선택하면 레코드를 지운다
    let appStoreTable = `
    CREATE TABLE IF NOT EXISTS appstore_price (
		store_id TEXT,
		username TEXT,
		chatroom_id INTEGER,
		url TEXT NOT NULL, 
		latest_price TEXT NOT NULL DEFAULT '0',
		title TEXT DEFAULT 'UNKNOWN',
		PRIMARY KEY (store_id, username, chatroom_id),
		FOREIGN KEY (username) REFERENCES users (username), 
		FOREIGN KEY (chatroom_id) REFERENCES chatroom (chatroom_id)
      )`;

    await this.writeQuery(userTable);
    await this.writeQuery(chatroomTable);
    await this.writeQuery(appStoreTable);
  }

  private open() {
    this.dbInstance = new sqlite3.Database(this._dbFilename, err => {
      if (err) {
        glog.error(`[Line - 9][File - DbService.ts] ${err}`);
      }
    });
  }

  close() {
    if (this.dbInstance) {
      this.dbInstance.close();
    }
    this.dbInstance = undefined;
  }

  writeQuery(sql: string, params: Array<any> = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dbInstance?.run(sql, params, (err: Error | null) => {
        if (err) {
          glog.error(`[Line - 73][File - db-service.ts] Query : [${sql}]`);
          glog.error(`[Line - 73][File - db-service.ts] ${err.message}`);
          reject(err.message);
        }
        resolve("success");
      });
    });
  }

  selectQuery(sql: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dbInstance?.all(sql, [], (err, rows) => {
        if (err) {
          glog.error(`[Line - 84][File - db-service.ts] Query : [${sql}]`);
          glog.error(`[Line - 85][File - db-service.ts] ${err.message}`);
          reject(err);
        }
        resolve(rows);
      });
    });
  }
}
