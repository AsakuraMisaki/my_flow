import { Component } from "../core/Entity";

class FPS extends Component{
  constructor(){
    super();
  }

  onUpdate(delta){
    super.onUpdate(delta);
    this.E.text = delta.toFixed(2) + "MS";
  }
}

export { FPS }