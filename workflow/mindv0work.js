import List from "list.js";

import { createBlock, createRelation, graph } from "./mindv0.js";


const socket = new WebSocket("ws://192.168.31.35:8080");

// socket.
// import { ipcMain, ipcRenderer } from "electron";
class Editor{
  constructor(){
    this.workspace = document.getElementById("workspace");
  }
  async init(){
    // await this.initTypes();
    // await this.initDataBase();
    this.initSocket();
    const options = {
      // valueNames: [ 'name' ],
      item: function(values){
        return `<li><button name="run">运行</button><button name="del" class="del">删除</button><button class="add">增加</button><input class="value" value="${values.key}"></input></li>`;
      }
    }
    this.builder = new Builder();
    this.userList = new List('users', options, []);
    this.userList.list.addEventListener("pointerup", (e)=>{
      let target = e.target;
      if(target.tagName.toLowerCase() != "button") return;
      let valuer = target.parentElement.getElementsByClassName("value")[0];
      if(target.name == "run" && this.current != valuer){
        if(this.current){
          this.caches[this.current.value] = graph.toJSON();
        }
        this.current = valuer;
        graph.clearCells();
        graph.fromJSON(this.caches[this.current.value]);
        this.builder.buildAll(this.caches);
      }
      else if(target.name == "del" && this.userList.last == target){
        // this.deleteItem(valuer.value);
        delete this.caches[valuer.value];
        this.userList.remove("key", valuer.value);
        // target.parent.remove();
        graph.clearCells();
        this.builder.buildAll(this.caches);
        this.current = null;
      }
      
      this.userList.last = target;
    })
    socket.addEventListener("message", (message)=>{
      if(message.data == "start"){
        let data = JSON.stringify({type:"group", name:"editor"});
        socket.send(data);
        this.load();
      }
    })
    
    
  }

  initSocket(){
    socket.addEventListener("message", (message)=>{
      try{
        let data = JSON.parse(message.data);
        if(data.type == "load"){
          console.log(data);
          this.caches = { };
          let z = 0;
          let cb = (items)=>{
            items.forEach((item)=>{
              let valuer = item.elm.getElementsByClassName("value")[0];
              valuer.lastValue = valuer.value;
              this.caches[valuer.lastValue] = data.data.data[valuer.lastValue] || {cells:[]};
              valuer.addEventListener("input", ()=>{
                let key = item.values().key;
                item.values({ key:valuer.value });
                this.caches[valuer.value] = this.caches[key];
                delete this.caches[key];
              })
              let add = item.elm.getElementsByClassName("add")[0];
              add.addEventListener("pointerup", ()=>{
                let key = item.values().key;
                this.userList.add([{key:key + "-0"}], (items)=>cb(items));
                this.userList.sort("key");
              })
            })
          }
          for(let key in data.data.data){
            this.userList.add([{key}], (items)=>cb(items))
          }
          this.userList.sort("key");
        }
      }catch(e){
        console.error(e);
      }
    })
  }

  start(){
    requestAnimationFrame(this.update.bind(this));
    
  }

  stop(){
    
  }
  initAutoComplete(){
    const options = {
      valueNames: [ 'name', 'desc' ],
      item: '<li><div class="autoCompleteItem"><p class="name"></p><p class="desc"></p></div></li>'
    }
    this.autoComplete = new List('autoComplete', options, []);
    this.autoComplete.userContext = new Map();
    this.setCompleteContext();
    this.closeAutoComplete();
  }
  setupListeners(){
    this.autoComplete.list.addEventListener("pointerup", (e)=>{
      if(e.button == 2){
        this.closeAutoComplete();
      }
      if(!e.target.classList.contains("autoCompleteItem")) return;
      let name = e.target.getElementsByClassName("name")[0];
      if(this.autoComplete.tempCallBack){
        this.autoComplete.tempCallBack(name.innerText);
      }
    })
  }
  clearListeners(){

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
    this.builder.update();
    let tip = document.getElementById("tip");
    if(this.current){
      tip.innerText = this.tip || this.current.value;
    }
    
  }
  load(data){
    graph.clearCells();
    socket.send(JSON.stringify({type:"requestLoad"}));
  }
  save(){
    
  }
  
  beforeBuild(){
    
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
    let temp = await fetch("./project/queue_json_old.json", {encoding:"utf-8"});
    temp = await temp.json();
    
    const options = {
      // valueNames: [ 'name' ],
      item: function(values){
        return `<li><button>visible</button><input class="value" value="${values.name}"></input></li>`;
      }
    }
    const values = [];
    let mapping = new Map();
    for(let name in temp.ctx){
      values.push({ name });
      mapping.set(name, temp.ctx[name]);
    }
    this.builder = new Builder();
    let userList = new List('users', options, values);
    let children = userList.list.getElementsByClassName("value");
    children = Array.from(children);
    children.forEach((target)=>{
      let key = target.value;
      let ctx = mapping.get(key);
      this.builder.addBuild({ctx, key});
    })
    this.builder.buildAll(this.caches);
    // userList.list.addEventListener("pointerup", (e)=>{
    //   if(e.target instanceof HTMLElement && e.target.tagName.toLocaleLowerCase() == "button"){
    //     this.beforeBuild();
    //     let target = e.target.parentElement.getElementsByClassName("value")[0];
    //     if(!target);
    //     let key = target.value;
    //     let ctx = mapping.get(key);
    //     console.log(ctx);
    //     this.builder.build(ctx);
    //   }
    // })
  
    this.meta = temp;
    console.log(this.meta);
    
  }
}

class Builder{
  constructor(){
    this.lists = [];
    this.lastX = 0;
    this.lastY = 0;
    this.caches = new Map();
    
  }

  addBuild(obj){
    this.lists.push(obj);
  }

  local(text, loc="zh"){
    const ref = {
      "parent": {"zh": "父级"},
      "kill": {"zh": "关闭"},
      "lock": {"zh": "锁定"}
    }
    if(!ref[text]) return;
    return ref[text][loc];
  }

  build(ctx){
    let { contents, relation } = ctx;
    // if(this.lists.length) return;
    // this.lastX = 0;
    // this.lastY = 0;
    let x=0, y=0;
    let temp = new Map();
    for(let key in contents){
      let content = contents[key];
      
      let b = createBlock(content, key);
      b.setPosition(x, y);
      let pos = b.position();
      let size = b.size();
      x += size.width + 30;
      y += 32;
      temp.set(key, b);
    }
    console.log(temp);
    for(let key0 in relation){
      
      if(!temp.has(key0)) continue;
      let data = relation[key0];
      console.log(data);
      for(let type in data){
        
        let label = this.local(type);
        
        if(!label) continue;
        console.log(type, label);
        let array = data[type];
        console.log(array);
        array.forEach((ref)=>{
          createRelation(temp.get(key0), temp.get(ref), label);
        })
      }
    }
  }

  buildAll(caches){
    this.caches = caches;
    if(this.lists.length){
      
      this.build(ctx.ctx);
      let data = graph.toJSON();
      this.caches.set(ctx.key, data);
      setTimeout(()=>{
        graph.clearCells();
        this.buildAll();
      }, 60)
    }
    else{
      let caches = { };
      for(let key in this.caches){
        caches[key] = this.caches[key];
      }
      
      // this.caches.forEach((content, key)=>{
      //   caches[key] = content;
      // })
      
      console.log(this.caches);
      let userData = { };
      // this.caches.forEach((content, key)=>{
        
      //   let relations = content.cells.filter((cell)=>cell.data && cell.data.link);
      //   // console.log(relations);
        
      //   let targetBlocks = new Map();
      //   let targetLinkPoints = new Map();
      //   let blocks = content.cells.filter((cell)=>cell.data && cell.data.block);
      //   blocks.forEach((b)=>{
      //     targetBlocks.set(b.id, b);
      //   })
      //   let linkpoints = content.cells.filter((cell)=>cell.data && cell.data.linkPoint);
      //   linkpoints.forEach((b)=>{
      //     targetLinkPoints.set(b.id, b);
      //   })
      //   let targetRelations = { };
      //   // console.log(targetBlocks);
      //   relations.forEach((cell)=>{
      //     let a = targetBlocks.get(cell.source.cell);
      //     if(!a) return;
      //     let point = targetLinkPoints.get(cell.target.cell);
      //     if(!point) return;
      //     let next = relations.find((link)=>link.source.cell == point.id);
      //     if(!next) return;
      //     let b = targetBlocks.get(next.target.cell);
      //     if(!b) return;
      //     targetRelations[a.data.name] = targetRelations[a.data.name] || { };
      //     let tr = targetRelations[a.data.name];
      //     let type = point.data.comment;
      //     tr[type] = tr[type] || [];
      //     tr[type].push(b.data.name);
      //   })
      //   // console.log(targetRelations);
      //   let finalInfo = { q:{ }, r:{ }, i:{ } };
      //   finalInfo.r = targetRelations;
      //   targetBlocks.forEach((cell, key)=>{
      //     let name = cell.data.name;
      //     if(/^~/i.test(name)){
      //       finalInfo.i[name] = cell.data.content;
      //     }
      //     else{
      //       finalInfo.q[name] = cell.data.content;
      //     }
      //   })
      //   userData[key] = finalInfo;
      // })
      let doSave = (content, key)=>{
        let relations = content.cells.filter((cell)=>cell.data && cell.data.link);
        // console.log(relations);
        
        let targetBlocks = new Map();
        let targetLinkPoints = new Map();
        let blocks = content.cells.filter((cell)=>cell.data && cell.data.block);
        blocks.forEach((b)=>{
          targetBlocks.set(b.id, b);
        })
        let linkpoints = content.cells.filter((cell)=>cell.data && cell.data.linkPoint);
        linkpoints.forEach((b)=>{
          targetLinkPoints.set(b.id, b);
        })
        let targetRelations = { };
        // console.log(targetBlocks);
        relations.forEach((cell)=>{
          let a = targetBlocks.get(cell.source.cell);
          if(!a) return;
          let point = targetLinkPoints.get(cell.target.cell);
          if(!point) return;
          let next = relations.find((link)=>link.source.cell == point.id);
          if(!next) return;
          let b = targetBlocks.get(next.target.cell);
          if(!b) return;
          targetRelations[a.data.name] = targetRelations[a.data.name] || { };
          let tr = targetRelations[a.data.name];
          let type = point.data.comment;
          tr[type] = tr[type] || [];
          tr[type].push(b.data.name);
        })
        // console.log(targetRelations);
        let finalInfo = { q:{ }, r:{ }, i:{ } };
        finalInfo.r = targetRelations;
        targetBlocks.forEach((cell, key)=>{
          let name = cell.data.name;
          if(/^~/i.test(name)){
            finalInfo.i[name] = cell.data.content;
          }
          else{
            finalInfo.q[name] = cell.data.content;
          }
        })
        userData[key] = finalInfo;
      }
      for(let key in this.caches){
        doSave(this.caches[key], key);
      }
      console.log(userData);
      let message = JSON.stringify({ type:"save", data:caches, userData });
      socket.send(message);
      editor.tip = "...同步成功"
      setTimeout(()=>{
        editor.tip = ""
      }, 300)
    }
  }

  update(){
    // if(this.lists.length){
    //   const {content, key} = this.lists.shift();
    //   let b = createBlock(content, key);
    //   b.setPosition(this.lastX, this.lastY);
    //   let pos = b.position();
    //   let size = b.size();
    //   this.lastX += size.width + 30;
    //   this.lastY += 32;
    // }
  }
}




async function initEditor(){
  let editor = new Editor();
  await editor.init();
  editor.start();
  globalThis.editor = editor;
  editor.graph = graph;
}

initEditor();






export { Editor };