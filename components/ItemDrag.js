import { Assets, Matrix, Rectangle, RenderTexture, Sprite } from "pixi.js";
import { Component } from "../core/Entity";
import { Editor, app, renderer, stage } from "../core/editor";



async function snap(displayObject) {
    
  let bound = displayObject.getBounds();
  const { x, y, width, height } = bound;
  let r = 0.5;
  const renderTexture = RenderTexture.create({
    width: displayObject.width,
    height: displayObject.height,
    resolution: r
  });
  renderer.render({ container:displayObject, target:renderTexture });
  // renderTexture.frame = new Rectangle(x, y, width, height); //(注意resolution不会影响texture本身的frame, 不需要再乘r)
  // let image = await Graphics.app.renderer.extract.image(renderTexture, "image/webp", 0.25);
  // const texture = await Assets.load("../res/icons.svg");
  let sprite = new Sprite(renderTexture);
  return sprite;
};

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
    stage.interactive = true;
  }

  async pointerdown(e) {
    if (this.global) return;
    this.target = this.global = e.currentTarget;
    let s = await snap(this.target);
    this.snap = s;
    s.alpha = 0.5;
    app.stage.addChild(this.snap);
    app.stage.on("pointermove", this._pm);
    app.stage.on("pointerup", this._pu);
    app.stage.on("pointerupoutside", this._pu);
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
    app.stage.off("pointerup", this._pu);
    app.stage.off("pointerupoutside", this._pu);
  }

}

Drag._global = null;

export {Drag}

