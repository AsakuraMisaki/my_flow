import { Component } from "../core/Entity.js";
import { Input, STATIC } from "../core/interaction.js";
import { ItemAble } from "./itemable.js";



class Tap extends ItemAble{
  constructor(){
    super();
    this._onlyDown = false;
    this._onlyUp = false;
  }

  onlyUp(value=true){
    this._onlyUp = value;
  }

  onlyDown(value=true){
    this._onlyDown = value;
  }


  updatePossibleOK(type){
    this.updateHitTest();
    if(this.target && type == 1){
      this.emit("down", this.target);
    }
    else if(this.target && type == -1){
      this.emit("up", this.target);
    }
  }

  onUpdate(delta){
    let down = Input.isTriggered(STATIC.MOUSE0);
    let up = Input.isReleased(STATIC.MOUSE0);
    let press = Input.isPressed(STATIC.MOUSE0, 0);
    if(down){
      this.updatePossibleOK(1);
    }
    if(up){
      this.updatePossibleOK(-1);
    }
    if(this.target && press){
      
    }
    super.onUpdate(delta);
  }

}


export { Tap };



