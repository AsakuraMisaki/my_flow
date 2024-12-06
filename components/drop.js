import { Component } from "../core/Entity.js";
import { Input, STATIC } from "../core/interaction.js";
import { Drag } from "./drag.js";
import { ItemAble } from "./itemable.js";


class Drop extends ItemAble{
  constructor(){
    super();
    this._lastGlobal = null;
  }

  get global(){
    return Drag._global;
  }

  onTargetChange(current, old){
    current ? this.emit("over", current) : null;
    old ? this.emit("leave", old) : null;
    return;
  }

  updateDragOver(){
    this._lastGlobal = this.global;
    if(!this._lastGlobal) return;
    this.updateHitTest();
  }

  updateDrop(){
    if(!this._lastGlobal) return;
    let pointerup = !Input.isPressed(STATIC.MOUSE0, 0);
    if(!pointerup) return;
    if(this.target){
      this.emit("drop", this.target);
    }
    this.target = null;
    this._lastGlobal = null;
  }

  onUpdate(){
    this.updateDrop();
    this.updateDragOver();
  }

}

export { Drop };



