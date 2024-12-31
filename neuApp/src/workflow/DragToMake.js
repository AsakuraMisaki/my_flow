import { Assets, Container, Graphics, Point, Sprite } from "pixi.js";
import { GEV, Utils } from "./Utils";
import { makeinteractivity } from "./ProtoObject";
let range = new Graphics();
range.rect(0, 0, 1, 1);
range.fill({color:0x223344, alpha:1});

range.alpha = 0.5;
let point = new Point();
export class SelectLike{
  static onDragStart(){

  }
  static onDrag(){

  }
  static onDragEnd(){

  }
}

export const stops = new Set();
const texture = await Assets.load('./workflow/font/A.png');
export class FrameLike{
  static onDragStart(pointer){
    if(stops.size) return;
    range.scale.x = range.scale.y = 1;
    Utils.app.stage.addChild(range);
    range.x = point.x = pointer.x;
    range.y = point.y = pointer.y;
    
    this.on("pointermove", FrameLike.onDrag);
  }
  static onDrag(pointer){
    if(stops.size) return;
    let sx = pointer.x - point.x;
    let sy = pointer.y - point.y;
    console.log(sx, sy);
    range.scale.x = sx;
    range.scale.y = sy;
  }
  static async onDragEnd(pointer){
    if(stops.size) return;
    
    
    let test = new Sprite(texture);
    
    Utils.app.stage.addChild(test);
    test.x = point.x;
    test.y = point.y;
    test.width = range.width * (Math.abs(range.scale.x) / range.scale.x);
    test.height = range.height * (Math.abs(range.scale.y) / range.scale.y);
    range.remove();
    this.off("pointermove", FrameLike.onDrag);
    makeinteractivity(test);
  }
}



export class SpriteLike{
  static onDragStart(){
    
  }
  static onDrag(){

  }
  static onDragEnd(){

  }
}

export class GraphicsLike{
  static onDragStart(){
    
  }
  static onDrag(){

  }
  static onDragEnd(){

  }
}

export class TextLike{
  static onDragStart(){
    
  }
  static onDrag(){

  }
  static onDragEnd(){

  }
}

let lastDragTypeClass = null;
export function trigger(typeClass){
  if(lastDragTypeClass){
    Utils.app.stage.off("pointerdown", lastDragTypeClass.onDragStart);
    Utils.app.stage.off("pointerup", lastDragTypeClass.onDragEnd);
    Utils.app.stage.off('pointerupoutside', lastDragTypeClass.onDragEnd);
  }
  Utils.app.stage.on("pointerdown", typeClass.onDragStart);
  Utils.app.stage.on("pointerup", typeClass.onDragEnd);
  Utils.app.stage.on('pointerupoutside', typeClass.onDragEnd);
}

export function ready(){
  Utils.app.stage.eventMode = 'static';
  Utils.app.stage.interactive = true;
  Utils.app.stage.hitArea = Utils.app.screen;

  trigger(FrameLike);
}

// GEV.on("ready", ready);