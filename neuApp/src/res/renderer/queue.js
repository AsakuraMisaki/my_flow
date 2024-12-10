import List from "list.js";
import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";

class Editor{
  constructor(){
    
  }
  async init(){
    await this.initTypes();
    await this.initDataBase();
  }
  get workspace(){
    return this._workspace;
  }
  set workspace(space){
    return this._workspace = space;
  }
  async start(workspace){
    this.workspace = workspace;
    requestAnimationFrame(this.update.bind(this));
    console.log(this.types, this.meta);
    this.workspace.canvas.width = this.workspace.canvas.parentElement.clientWidth;
    this.workspace.canvas.height = this.workspace.canvas.parentElement.clientHeight;
    this.workspace.canvas.style.width = this.workspace.canvas.width + "px";
    this.workspace.canvas.style.height = this.workspace.canvas.height + "px";
    // LiteGraph.registerNodeType()
    this.simpleDiscard("audio", "input", "events", "geometry", "midi", "network", "math3d", "widget");
    this.registerNodeTypeByJsdoc();
  }
  simpleDiscard(...types) {
    for (let key in LiteGraph.registered_node_types) {
      types.forEach((t) => {
        let re = new RegExp(`^${t}`, "is");
        if (re.test(key)) {
          LiteGraph.unregisterNodeType(key);
        }
      })
    }
  }
  registerNodeTypeByJsdoc(){
    let all = { };
    this.types.forEach((element) => {
      // let 
      let group = element.memberof;
      let name = element.name;
      let params = element.params;
      let targetFunction = function(){
        this.properties = { precision: 1 };
        this.addOutput(">", "next");
        
        this.addInput(">", "next");
        this.addInput("cache", ["contextString" || "string"]);
        this.addProperty("cache", "cache");
        this[`cache_widget`] = this.addWidget("string", "cache", "", "cache");
        params.forEach((p)=>{
          let ts = p.type.names || [];
          let key = p.name;
          this.addInput(key, ts.concat(["contextString"]));
          this.addProperty(key, key);
          this[`${key}_widget`] = this.addWidget("string", key, "", key);
        })
      }
      targetFunction.title = name;
      let type = `${group}/${name}`;
      all[type] = targetFunction;
      targetFunction.prototype.onExecute = function(){
        this.setOutputData(0);
      }
      LiteGraph.registerNodeType(type, targetFunction);
    })
  }
  refreshConsole(content, type){
    let target = this.consoleDiv.getElementsByClassName(type)[0];
    if(!target) return;
    if(type == "tip"){
      target.innerHTML = content;
    }
  }
  get pointer(){
    return this._pointer;
  }
  update(){
    requestAnimationFrame(this.update.bind(this));
    // this.workspace.canvas.width = this.workspace.canvas.clientWidth;
    // this.workspace.canvas.height = this.workspace.canvas.clientHeight;
  }
  async initTypes(){
    let types = await fetch("https://asakuramisaki.github.io/workflow_js_doc/ScriptableQueryObject/Type.json");
    types = await types.json();
    types = types.docs.filter((data)=>{
      
      if(!data.meta || !data.meta.code.name) return;
      let name = data.meta.code.name;
      return true;
      return /mzarpg|battler|arpg|petsystem/i.test(name);
    })
    
    this.types = types;
  } 
  async initDataBase(){
    let temp = await fetch("./project/blockly_workspace_rpgmaker.json", {encoding:"utf-8"});
    temp = await temp.json();
    
    const options = {
      valueNames: [ 'name' ],
      item: '<li><button class="name"></button></li>'
    }
    const values = [];
    let mapping = new Map();
    for(let name in temp.ctx){
      values.push({ name });
      mapping.set(name, temp.ctx[name]);
    }
    
    let userList = new List('users', options, values);
  
    userList.list.addEventListener("pointerup", (e)=>{
      if(e.target instanceof HTMLElement && e.target.tagName.toLocaleLowerCase() == "button"){
        let key = e.target.innerText;
        let ctx = mapping.get(key);
        console.log(ctx);
      }
    })
  
    this.meta = temp;
  }
}

export {Editor}