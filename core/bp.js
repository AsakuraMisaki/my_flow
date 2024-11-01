import ev from "./ev";

/**
 * @abstract
 */
class BP{
  constructor() {
    
  }

  onEnterScene() {

  }

  onExitScene() {

  }

  onDestroy() {
    this._destroy = true;
  }

  onUpdate() {
    
  }

  update(delta) {
    this._delta = delta;
    this.onUpdate();
    this._updateComponents();
  }

  get emitter(){
    return this._emitter;
  }
  set emitter(v){
    if(v instanceof ev){
      this._emitter = v;
    }
    else if(v){
      this._emitter = new ev();
    }
  }

  /**
   * @abstract
   * @description when built from blueprint workflow
   */
  static fromBluePrint(data, targetClass, ...args){
    if(!targetClass.prototype._fromBluePrint) return;
    let target = new targetClass(...args);
    target._fromBluePrint(data);
    return target;
  }

  _fromBluePrint(data){
    console.log(data);
  }

}

export default BP;