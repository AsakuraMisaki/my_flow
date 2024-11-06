import { Component } from "../core/Entity";

class DynamicKey{

}

class Layout extends Component{
  constructor(){
    super();
    this._animations = true;
    this._transforms = new Map();
    this.now = 0;
    this.time = 0;
    this._lerp = Layout.lerp;
  }
  
  static lerp(t){
    return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
  }

  lerp(_lerp, time){
    this._lerp = _lerp;
    this.time = time;
  }

  onRefresh(children=this.E.children){

  }

  refresh(children){

  }

  setTransform(e, tx, ty){

  }

  updateTransforms(delta){

  }

  onUpdate(delta){
    super.onUpdate(delta);
    this.updateTransforms(delta);
  }
}

class Grid extends Layout{
  constructor(col, margin_x, margin_y){
    super();
    
  }


}

class Flex extends Layout{
  constructor(col, margin_x, margin_y){
    super();
    
  }
}

export { Layout, DynamicKey, Flex, Grid };



