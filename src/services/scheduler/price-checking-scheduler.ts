import ComparePrice from "../brain/compare-price";
import { glog } from "../logger/custom-logger";

// inline button을 눌렀을 때 발생하는 이벤트를 처리하는 클래스
export default class PriceCheckingScheduler {
  private comparePrice = new ComparePrice();
  constructor(private _period: number = 60 * 60) {
    glog.info(
      `[Line - 9][File - price-checking-scheduler.ts] Schedule Period ${this._period} SEC`
    );
  } // seconds

  start() {
    setTimeout(() => {
      this.comparePrice
        .startCompareApps()
        .catch(e =>
          glog.error(`[Line - 21][File - price-checking-scheduler.ts] ${e}`)
        );
      this.start();
    }, this._period * 1000);
  }
}
