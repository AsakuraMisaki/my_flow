import { Component } from "../core/entity.js";
import { Input, STATIC } from "../core/interaction.js";
import { ItemAble } from "./itemable.js";



class dragToMake extends Component{
  constructor(){
    super();
    this._onlyDown = false;
    this._onlyUp = false;
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



