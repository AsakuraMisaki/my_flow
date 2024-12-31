
import { EV } from "../core/ev";
import { events, filesystem, init, os } from '@neutralinojs/lib';
import * as YAML from 'js-yaml';
import { Application, Assets, Container, Loader, Sprite, Texture } from 'pixi.js';
import { Component } from "../core/entity.js";
import { AdvanceInputSystem, ConfigAdvanceInput } from "../components/advanceInput";
import { loader } from "../core/yaml";
import { Editor } from "../core/editor";



const GEV = new EV();


class Utils{
  static async _ready(){
    // init();
    
    const app = new Application();

    let target = document.getElementById("protoEditor");
    // Initialize the application
    await app.init({ background: '#f5f5f5', resizeTo:target });
    
    target.appendChild(app.canvas);
    this._app = app;
    this._nodeMovable = true;
    events.on("ready", ()=>{
      this.getUserData();
    })
    GEV.emit("ready");
    globalThis.app = app;

    const update = function (ticker) {
      app.stage.update(ticker.deltaMS);
      
    }
    app.ticker.add(update);
    await AdvanceInputSystem._init();
    ConfigAdvanceInput.create(ConfigAdvanceInput.POINTRE_0)
    .sort()
    .motion("pointerdown", ConfigAdvanceInput.STATES_DOWN);
    ConfigAdvanceInput.create(ConfigAdvanceInput.POINTRE_0)
    .sort()
    .motion("pointermove", ConfigAdvanceInput.STATES_POINTER_MOVE);
    ConfigAdvanceInput.create(ConfigAdvanceInput.POINTRE_0)
    .sort()
    .motion("pointerup", ConfigAdvanceInput.STATES_UP);

    Editor.init();
  }

  static get app(){
    return this._app;
  }

  static async LoadProject(type, path){
    GEV.clear("workspace:build");
    if(type == "Q"){
      let project = new Qproject();
      await project.load(path);
      this.project = project;
    }
  }

  static get nodeMovable(){
    return this._nodeMovable;
  }
  static setNodeMovable(value=false){
    this._nodeMovable = value;
  }

  static async getUserData(){
    let data = await filesystem.readFile("./src/workflow/user.yaml");
    data = YAML.load(data);
    let items = data.lastests.map((data)=>{
      return { key: JSON.stringify(data), label: `[${data.type}] ${data.path}` };
    })
    const userData = {items, ctx: "aaaaaa"};
    
    GEV.emit("project:data:get", userData);
  }

  static getData(){
    if(!this.project) return;
    return this.project.getData();
  }
}

class Project extends EV{
  constructor(){
    super();
    this.isProject = true;
  }
}

class UIproject extends Project{
  constructor(){
    super();
  }
}

const Qproject_Constant = {
  files: ["Actors", "Enemies", "Skills", "Items", "States"]
}
class Qproject extends Project{
  constructor(){
    super();
    this.caches = new Map();
    this.workCaches = null;
  }

  async load(folder){
    this.folder = folder + "\\";
    this.create();
  }


  async getFolderData(...files){
    let data = {};
    const all = files.map(async (f)=>{
      let target = await filesystem.readFile(this.folder + f + ".json");
      target = JSON.parse(target);
      data[f] = target;
    })
    await Promise.all(all);
    return data;
  }

  async getProjectData(){
    try{
      let workData = await filesystem.readFile(this.folder + "wf_Qproject.yaml");
      workData = YAML.load(workData);
      return workData;
    }catch(e){
      if(e.code == "NE_FS_DIRCRER"){
        // workData = { };
      }
      return { };
    }
  }

  async create(){
    let folderData = await this.getFolderData(...Qproject_Constant.files);
    
    let workData = await this.getProjectData();
    console.log(folderData, workData);
    let list = [];
    for(let type in folderData){
      const arr = folderData[type].filter((data)=>data);
      let items = arr.map((data, i)=>{
        return { key:data.id, label:data.name, type }
      })
      let result = { label:type, items, key:type };
      list.push(result);
    }

    console.log(list);
    
    GEV.emit("workspace:list:change", list);
    this.folderData = folderData;
    this.workData = workData;
    GEV.on("workspace:build", this.buildGraph.bind(this));
  }

  async buildGraphFromOld(type, id){
    let types = {
      "Actors": SQ.Battler, 
      "Enemies": SQ.Ene, 
      "Skills": SQ.Skill, 
      "Items": SQ.Item, 
      "States": SQ.State
    }
    if(!types[type]) return;
    let data = this.folderData[type][id];
    if(!data) return;
    let cache = SQ.preCompliedFixTest(data, types[type]);
    console.log(cache);
  }

  async buildGraph(type, id){
    if(this.workData[type] && this.workData[type][id]){
      GEV.emit("workspace:graph:source", this.workData[type][id]);
      return;
    }
    this.buildGraphFromOld(type, id);
  }

  getData(){
    return this.workData;
  }


}



export {Utils, GEV}