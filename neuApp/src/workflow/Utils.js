
import { EV } from "../core/ev";




const GEV = new EV();

class Utils{
  static async LoadProject(type, path){
    if(type == "Q"){
      let project = new Qproject();
      await project.load(path);
      this.project = project;
    }
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
  files: ["Actors.json", "Enemies.json", "Skills.json", "Items.json", "States.json"]
}
class Qproject extends Project{
  constructor(){
    super();
    this.caches = new Map();
    this.workCaches = null;
  }

  async load(folder){
    // this.folder = folder + "\\";
    // let self = this;
    // ipcRenderer.once("read-file-response", (event, data)=>{
    //   console.log(data);
    //   if(!data.success && data.err=="nofile"){
    //     ipcRenderer.send("save-file", this.folder+"wf_Qproject.json", JSON.stringify({}));
    //     self.create();
    //   }
    //   else{
    //     self.create(data);
    //   }
    // })
    // ipcRenderer.send("read-file", { filePath: this.folder+"wf_Qproject.json" })
  }

  dataCache(event, data, all, _self){
    console.log(event, data);
    if(!data.success) return;
    _self.caches.set(data.filePath.replace(_self.folder, ""), JSON.parse(data.plain));
    all.shift();
    console.log(all);
  }

  waitData(...files){
    // let resolve;
    // let target = new Promise((re, r)=>{resolve=re});
    // let all = Array.from(files).map(()=>{
    //   return { };
    // })
    // this._dataCahe = (event, data)=>{ this.dataCache(event, data, all, this )};
    // ipcRenderer.on("read-file-response", this._dataCahe)
    // Array.from(files).map((f)=>{
    //   let filePath = this.folder + f;
    //   ipcRenderer.send("read-file", { filePath });
    // })
    // requestAnimationFrame(this.updateWaitData.bind(this, all, resolve));
    // return target;
  }

  updateWaitData(all, resolve){
    if(!all.length){
      resolve(1);
      return;
    }
    requestAnimationFrame(this.updateWaitData.bind(this, all, resolve));
  }

  async create(cacheWorkData){
    await this.waitData(...Qproject_Constant.files);
    let data = this.caches;
    
    cacheWorkData = JSON.parse(cacheWorkData.plain);
    console.log(cacheWorkData);
    // let userData = cacheWorkData.userData;
    // cacheWorkData = cacheWorkData.data;
    // let custom = {
    //   "Battler": "Actors.json",
    //   "Ene": "Enemies.json",
    //   "Skill": "Skills.json",
    //   "State": "States.json",
    // }
    // let newCache = { };
    // for(let key in cacheWorkData){
    //   let id = /(\d+)/i.exec(key)[1];
    //   let key0 = key.replace(id, "");
    //   let scope = custom[key0];
    //   newCache[scope] = newCache[scope] || { };
    //   newCache[scope][id] = cacheWorkData[key];
    // }
    // newCache = {data:newCache, userData};
    // console.log(newCache);
    // ipcRenderer.send("save-file", this.folder+"wf_Qproject.json", JSON.stringify(newCache));
    // ipcRenderer.off("read-file-response", this._dataCahe);
    
    let list = [];
    data.forEach((contentItems, filePath)=>{
      contentItems = contentItems.filter((item)=>item);
      let items = contentItems.map((data, i)=>{
        return { key:data.id, label:data.name, type:filePath }
      })
      let result = { label:filePath, items, key:filePath };
      list.push(result);
    })
    console.log(list);
    
    GEV.emit("workspace:list:change", list);
    this.caches.clear();
    this.workCaches = cacheWorkData.data;
    // changeItems(items);
  }

  getData(){
    return this.workCaches;
  }


}



export {Utils, GEV}