import { Container, Sprite } from "pixi.js";
import GameObject from "./gameObject";

class Actor extends GameObject{
  constructor() {
    super();
    this.displayObject = new Sprite();
  }

  onUpdate(delta) {
    super.onUpdate(delta);
    this._updateDisplayObject(delta);
  }

  _updateDisplayObject(delta){
    this.displayObject.transform = this._transform;
  }
}

export default Actor;