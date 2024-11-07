import { Component } from "../core/Entity";

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
    this.E.emit("c.dynamic.start");
    this._source = v;
    this.refresh();
  }

  async refresh(source = this.source){
    if(!source) return;
    source = Array.from(source);
    source.forEach(()=>{
      
    })
    this.E.emit("c.dynamic.end");
  }
  
}



export { Dynamic };



