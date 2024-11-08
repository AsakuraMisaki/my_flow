import { Component } from "../core/Entity";
import { Input } from "../core/input";

class ItemAble extends Component{
  constructor(){
    super();
    this._target = false;
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
      this.target = false;
    }
    else if(this._itemAble && hit){
      this.processItemTarget();
    }
    else if(hit && !this._itemOnly){
      this.target = this.E;
    }
  }

  processItemTarget(){
    let e = this.E;
    let possibleItem = this.target;
    if(possibleItem && (possibleItem != e) && Input.hitTest(possibleItem)){ // when hovering the same item
      this.target = possibleItem;
      // console.log(0);
      return this.target;
    }
    let children = Array.from(e.children).reverse();
    let length = children.length;
    let target = this._itemOnly ? false : e; //when itemOnly
    //[task?] the most cost in an itemable component
    let i0 = 0;
    for(let i=0; i<length; i++){
      i0++;
      if(!Input.hitTest(children[i])) continue;
      target = children[i];
      break;
    }
    // console.log(`i0`, i0);
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



