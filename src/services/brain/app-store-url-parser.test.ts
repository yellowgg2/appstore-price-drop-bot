import AppStoreUrlParser from "./app-store-url-parser";

describe("URL validation check", () => {
  test("AppStore url 형식 성공 케이스", () => {
    const parser = new AppStoreUrlParser(
      "https://apps.apple.com/kr/app/9th-dawn-iii/id1528353612"
    );
    expect(parser.isValidAppStoreUrl()).toEqual(true);

    parser.url = "apps.apple.com/kr/app/9th-dawn-iii/id1528353612";
    expect(parser.isValidAppStoreUrl()).toEqual(true);
  });

  test("AppStore url 형식 실패 케이스", () => {
    const parser = new AppStoreUrlParser(
      "https://google.com/kr/app/9th-dawn-iii/id1528353612"
    );
    expect(parser.isValidAppStoreUrl()).toEqual(false);

    parser.url = "ht://apps.apple.com/kr/app/9th-dawn-iii/id1528353612";
    expect(parser.isValidAppStoreUrl()).toEqual(false);
  });
});

describe("get id from url", () => {
  test("AppStore id 얻기 성공", () => {
    const parser = new AppStoreUrlParser(
      "https://apps.apple.com/kr/app/9th-dawn-iii/id1528353612"
    );
    expect(parser.getStoreIdFromUrl()).toEqual("1528353612");

    parser.url = "https://apps.apple.com/kr/app/siralim-ultimate/id1601114348";
    expect(parser.getStoreIdFromUrl()).toEqual("1601114348");
  });

  test("AppStore id 얻기 실패", () => {
    const parser = new AppStoreUrlParser(
      "https://apps.apple.com/kr/app/9th-dawn-iii/od1528353612"
    );
    expect(parser.getStoreIdFromUrl()).toEqual("");
  });
});
