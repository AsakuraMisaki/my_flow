import { Component } from "../core/entity.js";

class FPS extends Component{
  constructor(target){
    super();
    this._target = target;
  }

  onUpdate(delta){
    super.onUpdate(delta);
    this.E.text = this._target.delta.toFixed(2) + "MS";
  }
}

export { FPS }