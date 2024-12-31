
import { Container, Graphics, Point, getGlobalBounds } from "pixi.js";
import { Utils } from "./Utils";
import { Enity } from "../core/entity";
import { AdvanceInput, hitTest } from "../components/advanceInput";
import { stops } from "./DragToMake";

export async function makeinteractivity(target){
  let e = await Enity.attach(target);
  let input = await e.addComponent("input", new AdvanceInput());
  input.on("pointermove", (pointer)=>{
    if(Drag.current == target){
      target.x += pointer.x - point.x;
      target.y += pointer.y - point.y;
      point.x = pointer.x;
      point.y = pointer.y;
    }
    if(!hitTest(target)){
      let g = ranges.get(target);
      if(g){
        g.remove();
      }
      ranges.delete(target);
      stops.delete(target);
      return;
    }
    if(ranges.has(target)) return;
    let b = target.getBounds();
    let g = new Graphics();
    g.rect(b.x, b.y, b.width, b.height);
    g.fill({color:0x223344, alpha:0.5});
    Utils.app.stage.addChild(g);
    ranges.set(target, g);
    stops.add(target);
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
          Drag.current = null;
        })
      })
    }
  })
}

let point = new Point();
let ranges = new Map();

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