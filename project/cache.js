import { Loader } from "pixi.js";

class Cache{
  constructor() {
    this._insist = new Map();
    this._temp = new Map();
    this._sourceProcessor = new Map();
  }

  async add(absPath, sourceType, insist=false){
    let p = this._sourceProcessor.get(sourceType);
    if(p){
      let result = await p(absPath);
      
    }
    else{
      // let result = await Loader
    }
    insist ? this._insist.set(absPath, result) : this._temp.set(absPath, result);
  }

  remove(...absPath){
    absPath.forEach((a)=>{
      this._temp.delete(a);
    })
  }

  clear(insist=false){
    this._temp.clear();
    insist ? this._insist.clear() : null;
  }

  get(absPath){
    return (this._insist.get(absPath) || this._temp.get(absPath));
  }

  addSourceType(sourceType, processor){
    this._sourceProcessor.set(sourceType, processor);
  }

}

export default Cache;