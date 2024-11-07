import { Assets, Matrix, Rectangle, RenderTexture, Sprite } from "pixi.js";
import { Component } from "../core/Entity";
import { Editor, app, editor, renderer, stage } from "../core/editor";
import { snap } from "../core/camera";
import { STATIC, Input, InputEmitter } from "../core/input";



class Drag extends Component{
  constructor(){
    super();
    this._target = null;
    this.preventDefault = false;
    this._snapTarget = null;
    this._itemMode = false;
  }

  get global(){
    return Drag._global;
  }
  set global(v){
    Drag._global = v;
  }
  get target(){
    return this._target;
  }
  set target(v){
    if(this._itemMode && v){
      v = this.processItemTarget() || v;
    }
    this._target = v;
  }

  processItemTarget(){
    let children = Array.from(this.E.children);
    let length = children.length;
    for(let i=0; i<length; i++){
      let t = children[i];
      if(!Input.hitTest(t)) continue;
      return t;
    }
  }

  itemMode(){
    this._itemMode = true;
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
    if(!Input.hitTest(this.E)) return;
    this.target = this.global = this.E;
    this.E.emit("c.drag.start", this.target);
    this.preventDefault ? null : this.defaultDragStart();
  }
  async defaultDragStart(){
    let s = await snap(this._snapTarget || this.target);
    this.snap = s;
    s.alpha = 0.5;
    let layer = editor.getLayer("ui");
    layer.addChild(this.snap);
  }
  updateDrag(){
    this.updateDragSnap();
    this.E.emit("c.drag.ing", this.target);
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
    this.E.emit("c.drag.end", this.target);
    this.target = null;
    this.snap ? (this.snap.destroy() && this.snap.remove()) : null;
    return true;
  }
}

Drag._global = null;

export { Drag }


