import { Component } from "../core/Entity";
import { Input } from "../core/input";

class ItemAble extends Component{
  constructor(){
    super();
    this._target = null;
    this._itemAble = false;
    this._itemOnly = false;
  }
  
  get target(){
    return this._target;
  }
  set target(e){
    if(this._target != e){
      this.onTargetChange(e, this._target);
      this._target = e;
    }
  }

  onTargetChange(){ };

  updateHitTest(){
    let hit = Input.hitTest(this.E);
    if(!hit){
      this.target = null;
    }
    else if(this._itemAble && hit){
      this.processItemTarget();
    }
    else if(hit){
      this.target = this.E;
    }
  }

  processItemTarget(){
    let e = this.E;
    let children = Array.from(e.children).reverse();
    let length = children.length;
    let target = e;
    for(let i=0; i<length; i++){
      if(!Input.hitTest(children[i])) continue;
      target = children[i];
      break;
    }
    this.target = target;
    return this.target;
  }

  onUpdate(delta){
    super.onUpdate(delta);
  }

  itemAble(value = true){
    this._itemAble = value;
    return this;
  }

  itemOnly(value = true){
    this._itemOnly = value;
    return this;
  }
}

export { ItemAble };



