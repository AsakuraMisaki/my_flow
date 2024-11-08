import { Component } from "../core/Entity";
import { Input, STATIC } from "../core/input";
import { ItemAble } from "./itemable";



class Hover extends ItemAble{
  constructor(){
    super();
  }

  onTargetChange(current, old){
    current ? this.emit("hoverin", current) : null;
    old ? this.emit("hoverout", old) : null;
    super.onTargetChange(current, old);
  }

  updateHover(){
    if(this.target){
      this.emit("hover", this.target);
    }
  }

  onUpdate(delta){
    if(!Input.isPointerMove()) return;
    this.updateHitTest();
    this.updateHover();
    super.onUpdate(delta);
  }

}
Hover._global = null;

export { Hover };



