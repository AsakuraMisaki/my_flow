import { Assets, Matrix, Rectangle, RenderTexture, Sprite } from "pixi.js";
import { Component } from "../core/Entity";
import { Editor, app, editor, renderer, stage } from "../core/editor";
import { snap } from "../core/camera";



class Drag extends Component{
  constructor(){
    super();
    this.target = null;
    this._pd = this.pointerdown.bind(this);
    this._pm = this.pointermove.bind(this);
    this._pu = this.pointerup.bind(this);
  }

  get global(){
    return Drag._global;
  }
  set global(v){
    Drag._global = v;
  }

  onAdd(){
    super.onAdd();
    this.E.on("pointerdown", this._pd);
    this.E.interactive = true;
  }

  async pointerdown(e) {
    if (this.global) return;
    this.target = this.global = e.currentTarget;
    let s = await snap(this.target);
    this.snap = s;
    s.alpha = 0.5;
    let layer = editor.getLayer("ui");
    stage.addChild(this.snap);
    layer.on("pointermove", this._pm);
    layer.once("pointerup", this._pu);
    layer.once("pointerupoutside", this._pu);
  }

  pointermove(e){
    if(!this.snap) return;
    // console.log(e.global);
    this.snap.x = e.global.x;
    this.snap.y = e.global.y;
  }

  pointerup(e){
    this.snap.remove();
    this.snap = null;
    this.target = this.global = null;
    let layer = editor.getLayer("ui");
    layer.off("pointerupoutside", this._pu);
    layer.off("pointermove", this._pm);
  }

}

Drag._global = null;

export { Drag }


