export default class AppStoreUrlParser {
  constructor(private _url: string) {}

  get url(): string {
    return this._url;
  }

  set url(v: string) {
    if (v.length > 0) {
      this._url = v;
    }
  }

  private isValidUrl() {
    let urlPattern = new RegExp(
      "^(https?:\\/\\/)?" + // validate protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // validate fragment locator
    return !!urlPattern.test(this._url);
  }

  getStoreIdFromUrl(): string {
    const regEx = /id([0-9])+/g;
    const found = this._url.match(regEx);
    if (found && found?.length > 0) {
      return found[0].replace("id", "");
    }
    return "";
  }

  isValidAppStoreUrl() {
    return this.isValidUrl() && this._url.includes("apps.apple.com");
  }
}
