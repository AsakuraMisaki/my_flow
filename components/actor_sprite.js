import { Sprite } from "pixi.js";
import Component from "../core/component.js";

class ActorSprite extends Component{
  constructor(){
    super(...arguments);
    this.main = new PIXI_ActorSprite();
  }

  set tex(v){
    
  }
  get tex(){
    
  }
}

class PIXI_ActorSprite extends Sprite{
  constructor(){
    super();
  }
}