import { Component } from "../core/Entity";
import { Input } from "../core/input";

class ItemAble extends Component{
  constructor(){
    super();
    this._target = null;
    this._lastTarget = null;
    this._lastHit = false;
    this._itemAble = false;
  }
  
  get target(){
    return this._target;
  }
  set target(e){
    if(this._target != e){
      this.onTargetChange(this._target, e);
      this._target = e;
    }
  }

  onTargetChange(current, old){
    
  }

  hitTest(){
    if(!Input.hitTest(this.E)) return;
    let target = this.target;
    if((target != this.E) && target.parent == this.E){
      return Input.hitTest(target);
    }
    else{
      return this.processItemTarget();
    }
  }

  processItemTarget(){
    let e = this.E;
    let children = Array.from(e.children).reverse();
    let length = children.length;
    let target = e;
    for(let i=0; i<length; i++){
      target = children[i];
      if(!this.hitTest(t)) continue;
      break;
    }
    this.target = target;
    return this.target;
  }

  onUpdate(delta){
    // this._lastTarget = this.target;
    super.onUpdate(delta);
  }

  itemAble(){
    this._itemAble = true;
    return this;
  }
}

export { ItemAble };



