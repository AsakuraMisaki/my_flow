import { Component } from "../core/Entity";
import { Input, STATIC } from "../core/input";
import { Drag } from "./drag";


class Drop extends Component{
  constructor(){
    super();
    this._lastGlobal = null;
    this._lastHit = false;
  }

  get global(){
    return Drag._global;
  }

  updateDragOver(){
    this._lastGlobal = this.global;
    if(!this._lastGlobal) return;
    let hit = Input.hitTest(this.E);
    if(!this._lastHit && hit){
      this.E.emit("dragover", this._lastGlobal);
    }
    else if(!hit && this._lastHit){
      this.E.emit("dragleave", this._lastGlobal);
    }
    this._lastHit = hit;
    return this._lastHit;
  }

  updateDrop(hit){
    if(!hit || !this._lastGlobal) return;
    let pointerup = !Input.isPressed(STATIC.MOUSE0, 0);
    if(!pointerup) return;
    this.E.emit("drop", this._lastGlobal);
    this._lastGlobal = null;
  }

  onUpdate(){
    this.updateDrop(this._lastHit);
    this.updateDragOver();
  }

}

export { Drop };



