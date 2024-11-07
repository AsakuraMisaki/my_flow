import { Component } from "../core/Entity";
import { Input, STATIC } from "../core/input";
import { ItemAble } from "./itemable";



class Hover extends ItemAble{
  constructor(){
    super();
  }

  updateHover(){
    let hit = this.hitTest(this._lastTarget);
    if(!this._lastHit && hit){
      this.target = this.E;
      this.emit("hoverin", this.target, this._lastTarget);
    }
    else if(!hit && this._lastHit){
      this.emit("hoverout", this.target, this._lastTarget);
      this.target = null;
    }
    else if(hit && this._lastHit){
      this.emit("hover", this.target);
    }
    this._lastHit = hit;
    return this._lastHit;
  }

  onUpdate(delta){
    this.updateHover();
    super.onUpdate(delta);
  }

}
Hover._global = null;

export { Hover };



