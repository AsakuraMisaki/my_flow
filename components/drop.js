import { Component } from "../core/Entity";
import { Drag } from "./ItemDrag";


class Drop extends Component{
  constructor(){
    super();
    this._pm = this.pointermove.bind(this);
    this._pu = this.pointerup.bind(this);
    this._po = this.pointerout.bind(this);
  }

  get global(){
    return Drag._global;
  }

  onAdd(){
    super.onAdd();
    this.E.on("pointerup", this._pu);
    this.E.on("pointermove", this._pm);
    this.E.on("pointerout", this._po);
    this.E.interactive = true;
  }

  pointermove(e) {
    console.log(this.global);
    this.E.emit("dragover", this.global);
  }

  pointerout(e){
    console.warn(this.global);
    this.E.emit("dragleave", this.global);
  }

  pointerup(e){
    if(!this.global) return;
    console.error(this.global);
    this.E.emit("drop", this.global);
  }

}

export { Drop };


