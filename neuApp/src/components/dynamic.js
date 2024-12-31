import { Component } from "../core/entity.js";

class Dynamic extends Component{
  constructor(){
    super();
    this.examples = new Map();
    this._source = null;
  }

  setExample(key, construCallback, refreshCallback){
    this.examples.set(key, { construCallback, refreshCallback });
  }

  get source(){
    return this._source;
  }
  set source(v){
    if(!Array.isArray(v)) return;
    if(this._source == v) return; 
    this.emit("start");
    this.emit("change", v, this._source);
    this._source = v;
    this.refresh();
  }

  async refresh(source = this.source){
    if(!source) return;
    source = Array.from(source);
    source.forEach(()=>{
      
    })
    this.emit("end");
  }
  
}



export { Dynamic };



