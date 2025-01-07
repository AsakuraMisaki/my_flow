import { Assets, Container, Graphics, Point } from "pixi.js";
import { GEV, Utils } from "../workflow/Utils";
import { Component, Enity } from "./entity";
import { AdvanceInput, hitTest } from "../components/advanceInput";
import { FrameLike } from "../workflow/DragToMake";
import { Pane } from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { app } from "@neutralinojs/lib";
import { Frame } from "../workflow/protoObject/frame";
import { _Sprite } from "../workflow/protoObject/sprite";
import { _Text } from "../workflow/protoObject/text";
import { _Graphics } from "../workflow/protoObject/graphics";


let mover = { };
let Name = 0;
export function makeName(target){
  return target.constructor.name + "_" + (Name++);
}
export class Editor extends Container{
  constructor(){
    super();
    this.content = new Container();
    this.upper = new Container();
    this.range = new Container();
    this.ranges = new Map();
    this.drawer = new Graphics();
    this.drawer.rect(0, 0, 1, 1);
    this.drawer.fill({color:0x223344, alpha:1});
    this.drawer.alpha = 0.5;
  }
  async setup(){
    let entity = await Enity.attach(this.content);
    let input = new AdvanceInput();
    await entity.addComponent("input", input);
    input.on("pointerdown", this.onDragStart.bind(this, input, this.content));
    this.content.hitArea = Utils.app.screen;
    this.addChild(this.content, this.upper, this.range);
    // entity.on("update", this.updateContentChildrenRange.bind(this));
  }
  onDragStart(input, stage, pointer){
    if(!hitTest(stage)) return;
    let drawer = this.drawer;
    drawer.scale.x = drawer.scale.y = 1;
    this.range.addChild(this.drawer);
    let point = new Point();
    drawer.x = point.x = pointer.x;
    drawer.y = point.y = pointer.y;
    input.on("pointermove", this.onDrag.bind(this, point));
    input.on("pointerup", this.onDragEnd.bind(this, input, point));
  }
  onDrag(point, pointer){
    let drawer = this.drawer;
    let sx = pointer.x - point.x;
    let sy = pointer.y - point.y;
    console.log(sx, sy);
    drawer.scale.x = sx;
    drawer.scale.y = sy;
  }
  onDragEnd(input){
    let drawer = this.drawer;
    drawer.remove();
    input.clear("pointermove");
    input.clear("pointerup");
    this._onDragEnd();
  }
  async _onDragEnd(){
    const tool = Utils.tool;
    let drawer = this.drawer;
    if(drawer.width < 10 && drawer.height < 10) return;
    if(typeof(tool) == "function"){
      let test = new tool(); 
      
      
      this.content.addChild(test);
      test.x = drawer.x;
      test.y = drawer.y;
      test.width = drawer.width * (Math.abs(drawer.scale.x) / drawer.scale.x);
      test.height = drawer.height * (Math.abs(drawer.scale.y) / drawer.scale.y);
      
      if(test instanceof _Sprite){
        test.texture = await Assets.load("./workflow/font/sprite.svg");
      }
      test.name = makeName(test);
      // makeinteractivity(test);
      refreshOutline(this.content);
    }
  }
  updateContentChildrenRange(){
    this._updateContentChildrenRange(this.content);
  }
  _updateContentChildrenRange(stage){
    stage.children.forEach((c)=>{
      if(!(c instanceof Frame)) return;
      this._updateContentChildrenRange(c);
      let range = this.ranges.get(c);
      if(!range){
        range = new Graphics();
        range.rect(0, 0, 1, 1);
        range.fill({color:0xffffff, alpha:1});
        range.alpha = 1;
        this.ranges.set(c, range);
      }
      this.range.addChild(range);
      let b = c.getBounds();
      range.x = b.x;
      range.y = b.y;
      range.scale.x = b.width;
      range.scale.y = b.height;
    })
    this.ranges.forEach((range, stage, map)=>{
      if(!stage.parent){
        map.delete(stage);
        range.remove();
      }
    })
  }
  static select(r){
    if(!r) return;
    
    const a = ["State", "Basic", "Scale", "Anchor"];
    const b = ["Align", "Effect", "Align", "Export"]
    while(this.pane.children.length){
      this.pane.remove(this.pane.children[0]);
    }
    let list;
    if(r instanceof Frame){
      let map = new Map();
      
      map.set("state1", {des:"afaf"});
      map.set("state2", {des:"dad"});
      GEV.emit("prototype:select:states", map);
      list = Array.from(new Set(a.concat(["Frame", "Flex"].concat(b))));
    }
    else if(r instanceof _Sprite){
      let map = new Map();
      
      map.set("fff", {des:"afaf"});
      map.set("stassdste2", {des:"dad"});
      GEV.emit("prototype:select:states", map);
      list = Array.from(new Set(a.concat(["Texture", "Tile"].concat(b))));
    }
    else if(r instanceof _Text){
      list = Array.from(new Set(a.concat(["Text", "TextWrap", "TextStyle"].concat(b))));
    }
    else if(r instanceof _Graphics){
      list = Array.from(new Set(a.concat([].concat(b))));
    }
    let param = this.makeParamsFromBuiltin(...list);
    this.applyPane(param);
  }
  static async init(){
    await this.initPane();
    return true;
  }
  static get paneParams(){
    return this._paneParams;
  }
  static createPane(container){
    let pane = new Pane({container});
    pane.registerPlugin(EssentialsPlugin);
    return pane;
  }
  static async initPane(){
    this._paneParams = await Assets.load("./core/typePane.yaml");
    this.pane = this.createPane(document.getElementById("pane"));
    console.log(this._paneParams);
    let keys = Object.keys(this._paneParams);
    let param = this.makeParamsFromBuiltin(...keys);
    // this.applyPane(param);
    console.log(this.pane);
    this.pane.on("change", paneOnchange);
  }
  static makeParamsFromBuiltin(...names){
    let p = {};
    names.forEach((name)=>{
      let target = this.paneParams[name];
      if(!target) return;
      p[name] = target;
    })
    return p;
  }
  static getPaneEleByRefString(str, pane=this.pane){
    if(!pane) return;
    const path = str.split(/\./);
    return this._getPaneEleByRef(pane.children, path);
  }
  static _getPaneEleByRef(children, path){
    let name = path[0];
    let length = children.length;
    for(let i=0; i<length; i++){
      const {element, label, title} = children[i];
      let c = children[i].children;
      if(label && label.toLowerCase() == name.toLowerCase()){
        path.shift();
        if(!path.length){
          return element;
        }
        return this._getPaneEleByRef(c, path);
      }
      else if(title && title.toLowerCase() == name.toLowerCase()){
        path.shift();
        if(!path.length){
          return Array.from(element.children)[0];
        }
        return this._getPaneEleByRef(c, path);
      }
    }
  }
  static applyPane(param, pane=this.pane){
    for(const key in param){
      const data = param[key];
      const f = pane.addFolder({
        title: key
      }) 
      for(const label in data){
        const _data = data[label];
        this._applyPaneParam(_data, label, f);
      }
    }
  }
  static _applyPaneParam(_data, label, target=this.pane){
    let a;
    let setting = _data.setting;
    if(setting && setting._dynamic && this[setting._dynamic]){
      setting = this[setting._dynamic]();
    }
    if(setting && setting.view){
      a = target.addBlade(setting);
    }
    else{
      const p = {};
      p[label] = _data.default;
      a = target.addBinding(p, label, setting || {picker:"inline"});
    }
  }
  static getTextures(){
    return {
      options:
        {
          a: 0,
          b: 1
        }
    }
  }
}
const paneOnchange = function(target){
  console.log(target);
}
export const badRefs = new Map();
export function refreshOutline(stage, gData=[], parentKey=""){
  badRefs.clear();
  _refreshOutline(stage, gData, parentKey);
  // exportDatas.outline.clear();

  GEV.emit("editor:outline:change", gData);
  GEV.emit("editor:presetDefault:change", gData);
  GEV.emit("editor:presets:change", gData);
}


function _refreshOutline(stage, gData, parentKey){
  _getChildren(stage).forEach((c)=>{
    if(c.noOutline) return;
    let next = {
      title: c.name,
      key: c.name,
      children: []
    }
    badRefs.set(next.key, c);
    _refreshOutline(c, next.children, next.key);
    gData.push(next)
  })
}
function _getChildren(stage){
  if(stage._getChildren){
    return stage._getChildren();
  }
  return stage.children;
}


class Nav{
  static start(pointer){
    if(!hitTest(Utils.app.stage)) return;
    this._start = {x:pointer.x, y:pointer.y};
    input.on("pointermove", Nav._move);
  }
  static move(pointer){
    if(!this._start) return;
    Utils.app.stage.x += pointer.x - this._start.x;
    Utils.app.stage.y += pointer.y - this._start.y;
    this._start = {x:pointer.x, y:pointer.y}
  }
  static end(){
    input.off("pointermove", Nav._move);
    this._start = null;
  }
}
Nav._move = Nav.move.bind(Nav);