import { Assets, Container } from "pixi.js";
import { GEV, Utils } from "../workflow/Utils";
import { Component, Enity } from "./entity";
import { AdvanceInput, hitTest } from "../components/advanceInput";
import { FrameLike } from "../workflow/DragToMake";
import { Pane } from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { app } from "@neutralinojs/lib";

let input = new AdvanceInput();
let mover = { };
let Name = 0;
export function makeName(target){
  return target.constructor.name + "_" + (Name++);
}
export class Editor{
  static async init(){
    let stage = Utils.app.stage;
    stage.hitArea = Utils.app.screen;
    let entity = await Enity.attach(stage);
    
    entity.addComponent("input", input);
    input.on("pointerdown", FrameLike.onDragStart.bind(input));
    input.on("pointerup", FrameLike.onDragEnd.bind(input));
    input.on("move", Nav.start.bind(Nav));
    
    input.on("movend", Nav.end.bind(Nav));
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
    this.applyPane(param);
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
  static applyPane(param, pane=this.pane){
    for(const key in param){
      const data = param[key];
      const f = pane.addFolder({
        title: key
      }) 
      for(const label in data){
        const p = {};
        const _data = data[label];
        if(_data.setting && _data.setting.view){
          f.addBlade(_data.setting);
        }
        else{
          p[label] = _data.default;
          f.addBinding(p, label, _data.setting || {});
        } 
      }
    }
  }
}

export function refreshOutline(stage, gData=[], parentKey=""){
  stage = stage || Utils.app.stage
  _refreshOutline(stage, gData, parentKey);
  // exportDatas.outline.clear();

  GEV.emit("editor:outline:change", gData);
  GEV.emit("editor:presetDefault:change", gData);
  GEV.emit("editor:presets:change", gData);
}

export const badRefs = new Map();
function _refreshOutline(stage, gData, parentKey){
  _getChildren(stage).forEach((c)=>{
    if(c.noOutline) return;
    let next = {
      title: c.name,
      key: c.name,
      children: []
    }
    badRefs.set(next, c);
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