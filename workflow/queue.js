class Editor{
  constructor(){
    
  }
  async init(){
    await this.initTypes();
    await this.initDataBase();
    this.initToolBox();
  }
  get workspace(){
    return this._workspace;
  }
  set workspace(space){
    return this._workspace = space;
  }
  start(){
    
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
        this.beforeBuild();
        let key = e.target.innerText;
        let ctx = mapping.get(key);
        console.log(ctx);
        this.workspace.clear();
        this.buildBlocklyWithTextOld(ctx.q, key);
      }
    })
  
    this.meta = temp;
  }
}