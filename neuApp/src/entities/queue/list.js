import List from "list.js";
import { Drag } from "../../components/drag";
import { Drop } from "../../components/drop";
import { ContainerEntity } from "../../core/Entity";
import { block } from "./block";
import { Grid } from "../../components/layout";

class list extends ContainerEntity{
  constructor(){
    super();
  }
  async ready(){
    this.workspace = new Workspace();
    await this.workspace.init(this);
  }
  onReady(){
    let drop = this.addComponent("drop", new Drop().itemAble().itemOnly());
    let drag = this.addComponent("drag", new Drag().itemAble());
    this.addComponent("layout", new Grid(1, 0, 5));
    drop.on("over", (target)=>{
      target.alpha = 0.5;
    })
    drop.on("leave", (target)=>{
      target.alpha = 1;
    })
    super.onReady();
  }
  fromJSON(data){
    data.forEach(d => {
      let blockNew = new block();
      let newObj = { args:"aa", source:"d.source" };
      blockNew.once("ready", ()=>{
        blockNew.fromJSON(newObj);
        this.addChild(blockNew);
        this.getComponent("layout").refresh();
      })
    })
    this.getComponent("layout").refresh();
  }
  
}

class Workspace{
  constructor(){

  }
  async init(container){
    this.container = container;
    await this.initTypes();
    await this.initDataBase();
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
    console.log(types);
    // console.log(Queue_method.methods);
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
        let life = JSON.parse(JSON.stringify(ctx.q.life));
        this.container.fromJSON(life);
      }
    })
  
    this.meta = temp;
    console.log(this.meta);
  }
}

export {list}