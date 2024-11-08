import { FPS } from "../components/fps";
import { Grid } from "../components/layout";
import { ContainerEntity, TextEntity } from "./Entity";

class UPromise{
  static new(){
    let resolve = null;
    let reject = null;
    let promise = new Promise(r, rj=>{
      resolve = r;
      reject = rj;
    })
    promise.resolve = resolve;
    promise.reject = reject;
    return promise;
  }
}

class ScreenPrinter extends ContainerEntity{
  constructor() {
    super();
  }

  onReady(){
    super.onReady();
    this._accessContainer = new ContainerEntity();
    this._accessContainer.addComponent("grid", new Grid(1, 0, 20));
    this.mainText = new TextEntity();
    this.mainText.addComponent("fps", new FPS());
    this._accessContainer.addChild(this.mainText);
    this.addChild(this._accessContainer);
  }

}

export {ScreenPrinter, UPromise}
