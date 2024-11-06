import { Component } from "../core/Entity";
import { Input, STATIC } from "../core/input";
import { Drag } from "./drag";


class Hover extends Component{
  constructor(){
    super();
    this._lastHit = false;
  }

  updateHover(){
    let hit = Input.hitTest(this.E);
    if(!this._lastHit && hit){
      this.E.emit("hoverin");
    }
    else if(!hit && this._lastHit){
      this.E.emit("hoverout");
    }
    else if(hit && this._lastHit){
      this.E.emit("hover");
    }
    this._lastHit = hit;
    return this._lastHit;
  }

  onUpdate(){
    this.updateHover(this._lastHit);
  }

}

export { Hover };



