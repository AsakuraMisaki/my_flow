
import { Container, Graphics, Point, getGlobalBounds } from "pixi.js";
import { Utils } from "./Utils";
import { Enity } from "../core/entity";
import { AdvanceInput, hitTest } from "../components/advanceInput";
import { FrameLike, stops } from "./DragToMake";
import { Frame, FrameMask } from "./protoObject/frame";
import { refreshOutline } from "../core/editor";

export const interactives = new Set();
export async function makeinteractivity(target){
  let e = await Enity.attach(target);
  let input = await e.addComponent("input", new AdvanceInput());
  input.on("pointermove", (pointer)=>{
    if(stops.has(FrameLike)) return;
    if(Drag.current == target){
      let g = stackGet(target);
      target.x += pointer.x - point.x;
      target.y += pointer.y - point.y;
      point.x = pointer.x;
      point.y = pointer.y;
      if(g){
        g.x = target.x;
        g.y = target.y;
      }
    }
    if(!hitTest(target)){
      removeFromStack(target);
      return;
    }
    if(stackGet(target)) return;
    let b = target.getBounds();
    let g = new Graphics();
    g.noOutline = true;
    g.rect(b.x, b.y, b.width, b.height);
    g.fill({color:0x223344, alpha:0.5});
    Utils.app.stage.addChild(g);
    addToStack(target, g);
    if(!Drag.current){
      input.clear("pointerdown");
      input.clear("pointerup");
      input.on("pointerdown", (pointer)=>{
        let hit = hitTest(target);
        if(!hit) return;
        point.x = pointer.x;
        point.y = pointer.y;
        Drag.current = target;
        input.on("pointerup", ()=>{
          removeFromStack(Drag.current);
          removeFromStack(target);
          Drag.current = null;
          refreshOutline();
          const parent = ranges.keys().next().value;
          if(parent && parent instanceof Frame){
            applyToParent(parent, target);
            parent.addChild(target);
          }
        })
      })
    }
    
  })
}

function addToStack(target, g){
  
  ranges.set(target, g);
}

function removeFromStack(target){
  
  let g = ranges.get(target);
  if(g){
    g.remove();
  }
  ranges.delete(target);
}

function stackGet(target){
  
  return ranges.get(target);
}

function applyToParent(parent, target){
  let pb = parent.getBounds();
  let tb = target.getBounds();
  target.x = (tb.x - pb.x);
  target.y = (tb.y - pb.y);
}

let point = new Point();
export let ranges = new Map();

export class Drag{

  static start(e){
    if(Drag.current) return;
    Drag.current = e.target;
    Drag.current.hitArea = Utils.app.screen;
    point.x = e.global.x;
    point.y = e.global.y;
    Drag.current.on("pointermove", Drag.drag);
  }
  static drag(e){
    Drag.current.x += e.global.x - point.x;
    Drag.current.y += e.global.y - point.y;
    point.x = e.global.x;
    point.y = e.global.y;
  }
  static end(e){
    e.target.hitArea = null;
    e.target.off("pointermove", Drag.drag);
    Drag.current = null;
  }
}