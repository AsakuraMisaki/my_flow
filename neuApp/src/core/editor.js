import { Container } from "pixi.js";
import { Utils } from "../workflow/Utils";
import { Component, Enity } from "./entity";
import { AdvanceInput } from "../components/advanceInput";
import { FrameLike } from "../workflow/DragToMake";
import { Pane } from "tweakpane";

export class Editor{
  static async init(){
    let stage = Utils.app.stage;
    stage.hitArea = Utils.app.screen;
    let entity = await Enity.attach(stage);
    let input = new AdvanceInput();
    entity.addComponent("input", input);
    input.on("pointerdown", FrameLike.onDragStart.bind(input));
    input.on("pointerup", FrameLike.onDragEnd.bind(input));
    this.initPane();
  }
  static initPane(){
    this.pane = new Pane({container:document.getElementById("pane")});
    const pane = this.pane;
    const PARAMS = {
      width: 123,
      title: 'hello',
      color: '#ff0055',
    }
    let w = pane.addBinding(PARAMS, 'width');
    w.on("change", (ev)=>{
      Utils.app.stage.children[0].width = ev.value;
    })
    pane.addBinding(PARAMS, 'title');
    pane.addBinding(PARAMS, 'color');
  }
}