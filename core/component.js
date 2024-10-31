import ev from "./ev";

class Component extends ev{
  constructor(parent){
    this._parent = parent;
    this._destroy = false;
  }

  get parent(){
    return this._parent;
  }
  set parent(actor){
    this._parent = actor;
  }

  destroy(){
    this._destroy = true;
  }

  onAdd(){

  }

  onDestroy(){

  }

  update(delta){
    this.emit("update", delta);
  }
}

export default Component;