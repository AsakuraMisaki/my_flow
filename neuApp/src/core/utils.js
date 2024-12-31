import { FPS } from "../components/fps.js";
import { Grid } from "../components/layout.js";
import { ContainerEntity, TextEntity } from "./entity.js";

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
  constructor(target) {
    super();
    this._target = target;
  }

  onReady(){
    super.onReady();
    this._accessContainer = new ContainerEntity();
    this._accessContainer.addComponent("grid", new Grid(1, 0, 20));
    this.mainText = new TextEntity();
    this.mainText.addComponent("fps", new FPS(this._target));
    this._accessContainer.addChild(this.mainText);
    this.addChild(this._accessContainer);
  }

}

export {ScreenPrinter, UPromise}
