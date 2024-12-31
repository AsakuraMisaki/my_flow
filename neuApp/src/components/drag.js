import { Assets, Matrix, Rectangle, RenderTexture, Sprite } from "pixi.js";
import { Component } from "../core/entity.js";
// import { Editor, app, editor, renderer, stage } from "../core/editor.js";
import { snap } from "../core/camera.js";
import { STATIC, Input, InputEmitter } from "../core/interaction.js";
import { ItemAble } from "./itemable.js";



class Drag extends ItemAble{
  constructor(){
    super();
    this._snapTarget = null;
  }

  get global(){
    return Drag._global;
  }
  set global(v){
    Drag._global = v;
  }

  setSnapTarget(e){
    this._snapTarget = e;
  }

  onUpdate(){
    let start = this.updateDragStart();
    if(!start) return;
    let end = this.updateDragEnd();
    if(end) return;
    this.updateDrag();
  }

  updateDragStart(){
    if(this.target && this.global == this.target) return true;
    else if(this.global) return;
    let pointerdown = Input.isTriggered(STATIC.MOUSE0);
    if(!pointerdown) return;
    this.updateHitTest();
    if(this.target){
      this.global = this.target;
      this.emit("start", this.target);
      this.preventDefault ? null : this.defaultDragStart();
    }
  }
  async defaultDragStart(){
    let s = await snap(this._snapTarget || this.target);
    this.snap = s;
    s.alpha = 0.5;
    app.stage.addChild(this.snap);
  }
  updateDrag(){
    this.updateDragSnap();
    this.emit("drag", this.target);
  }
  updateDragSnap(){
    if(!this.snap) return;
    let pointer = Input.pointer;
    this.snap.x = pointer.x;
    this.snap.y = pointer.y;
  }
  updateDragEnd(){
    let pointerup = (!Input.isPressed(STATIC.MOUSE0, 0));
    if(!pointerup) return;
    if(this.global == this.target){
      this.global = null;
    }
    this.emit("end", this.target);
    this.target = null;
    this.snap ? (this.snap.destroy() && this.snap.remove()) : null;
    return true;
  }
}

Drag._global = null;

export { Drag }


