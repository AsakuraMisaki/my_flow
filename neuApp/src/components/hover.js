import { Component } from "../core/entity.js";
import { Input, STATIC } from "../core/interaction.js";
import { ItemAble } from "./itemable.js";



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


export { Hover };



