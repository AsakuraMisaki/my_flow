import { Component } from "../core/Entity.js";
import { Input } from "../core/interaction.js";

class ItemAble extends Component{
  constructor(){
    super();
    this._itemAble = false;
    this._itemOnly = false;
    this._itemGroup = null;
    this._testFn = undefined;
    this._pruneFn = undefined;
    this.target = false;
  }

  
  get testFn(){
    return this._testFn;
  }
  set testFn(fn){
    return this._testFn = fn;
  }
  get pruneFn(){
    return this._pruneFn;
  }
  set pruneFn(fn){
    this._pruneFn = fn;
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

  hitTest(e, pointer=null){
    return Input.hitTest(e, pointer, this.testFn, this.pruneFn);
  }

  updateHitTest(){
    let hit = this.hitTest(this.E);
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
    if(possibleItem && (possibleItem != e) && this.hitTest(possibleItem)){ // when hovering the same item
      this.target = possibleItem;
      return this.target;
    }
    let children = this._itemGroup ? Array.from(this._itemGroup()) : Array.from(e.children).reverse();
    let length = children.length;
    let target = this._itemOnly ? false : e; //when itemOnly
    //[task?] the most cost in an itemable component
    for(let i=0; i<length; i++){
      let temp = children[i];
      if(!this.hitTest(temp)) continue;
      target = temp;
      break;
    }
    this.target = target;
    return this.target;
  }

  onUpdate(delta){
    super.onUpdate(delta);
  }

  itemFilter(f){
    this._itemFilter = f;
  }

  itemGroup(group){
    if(typeof(group) != "function"){
      this._itemGroup = ()=>group;
    }
    this._itemGroup = group;
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



