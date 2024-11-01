

/**
 * @description main concept is that the components is scoped
 */
class Component{
  constructor(){
    this.parent = null;
    this._destroy = false;
    this._components = new Map();
    this._delta = 0;
    this._timeScale = 1;
  }

  get delta(){
    return this._delta * this._timeScale;
  }

  destroy(){
    this._destroy = true;
  }

  onAdd(){

  }

  onDestroy(){
    
  }

  getComponent(absPath){
    return this._components.get(absPath);
  }

  onUpdate(delta){
    this._delta = delta;
  }

}

export default Component;