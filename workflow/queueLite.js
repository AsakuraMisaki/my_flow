import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
import { FieldMultilineInput } from '@blockly/field-multilineinput';
import List from "list.js";
import * as FilePond from 'filepond';

import { ipcMain, ipcRenderer } from "electron";

const PlainGenerator = new Blockly.Generator("Plain");

class Editor{
  constructor(){
    this.div = document.getElementById("workspace");
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
  getToolbox(){
    return document.getElementById('toolbox-categories');
  }
  start(){
    // document.body.appendChild(this.div);
    const workspace = Blockly.inject(this.div, { toolbox:this.getToolbox() });
    this.workspace = workspace;
    workspace.addChangeListener((event)=>{
      // console.log(event.type);
      if (event.type === Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE) {
        const block = workspace.getBlockById(event.blockId);
        const field = block.getField(event.name);
        
        if (field instanceof Blockly.FieldTextInput) {
          let value = field.getText();
          console.log('FieldTextInput 输入改变:', value);
          this.setCompleteContext();
          this.openAutoComplete(value);
          this.autoComplete.tempCallBack = function(value){
            console.log(value);
            field.setValue(value, true);
          }
        }
      }
    })
    document.addEventListener("keydown", (e)=>{
      if(e.key.toLocaleLowerCase() == "enter"){
        let workspaceSaved = Blockly.serialization.workspaces.save(workspace);
        ipcRenderer.send("save-file", Date.now() + ".json", JSON.stringify(workspaceSaved));
        let code = PlainGenerator.workspaceToCode(workspace);
        console.warn(code);
      }
    })
    this.lastSvgTarget = null;
    let group = this.workspace.getSvgGroup();
    group.addEventListener("pointermove", (e)=>{
      this._pointer = { x:e.pageX, y:e.pageY };
      
      this.lastSvgTarget = this.findSvgTarget(e.target);
      requestAnimationFrame(this.update.bind(this));
      this.lastSvgTarget = null;
    })
    window.addEventListener("resize", ()=>{
      // this.adapt();
    })
    this.consoleDiv = document.getElementById("console");
    this.toolbar = document.getElementById("toolbar");
    // Create a multi file upload component
    FilePond.create(document.querySelector(".filepond"));
    
    this.FilePondListener = this.FilePond.bind(this);
    document.addEventListener('FilePond:addfile', this.FilePondListener);
    // Add it to the DOM
    // this.toolbar.appendChild(pond.element);
    this.initAutoComplete();
    this.setupListeners();
  }
  FilePond(e){
    console.log(this, e);
  }
  
  findSvgTarget(etarget){
    if(!etarget) return;
    if(etarget.tagName == "div") return;
    if(etarget.hasAttribute("data-id")){
      return etarget;
    }
    return this.findSvgTarget(etarget.parentElement);
  }
  adapt(){
    this.div.style.width = window.innerWidth + "px";
    this.div.style.height = window.innerHeight + "px";
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
  Queue_method_autoComplte(data){
    if(!data.meta) return;
    let result = { name:data.name, desc:data.description };
    this.autoComplete.userContext.set(result, data);
    return result;
  }
  setCompleteContext(gen=this.Queue_method_autoComplte, dataset=this.types){
    this.autoComplete.userContext.clear();
    this.autoComplete.clear();
    let objects = dataset.map(gen.bind(this));
    objects = objects.filter(d=>d);
    this.autoComplete.add(objects);
    this.autoComplete.add([{name:"cev", desc:"同名测试"}]);
    this.autoComplete.update();
  }
  openAutoComplete(value, pointer=this.pointer){
    let style = this.autoComplete.listContainer.style;
    style.display = "";
    style.left = `${pointer.x}px`;
    style.top = `${pointer.y}px`;
    this.autoCompleteSearch(value);
  }
  autoCompleteSearch(value){
    this.autoComplete.search(value);
  }
  closeAutoComplete(){
    this.autoComplete.listContainer.style.display = "none";
    this.autoComplete.tempCallBack = null;
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
    // requestAnimationFrame(this.update.bind(this));
    let allBlocks = this.workspace.getAllBlocks();
    allBlocks.forEach((a)=>{
      if(a.getSvgRoot() == this.lastSvgTarget){
        let tip = a.getTooltip();
        this.refreshConsole(tip || "tippppp", "tip");
      }
    })
    // console.log(allBlocks);
  }
  buildBlocklyWithTextOld(meta, key){
    this.caches = this.caches || new Map();
    this.currentCacheKey = key;
    if(this.caches.get(key)){
      Blockly.serialization.workspaces.load(this.caches.get(key), this.workspace);
      return;
    }
    let builder = new QueueTextOld(this.workspace, this);
    builder.build(this.workspace, meta);
  }
  buildBlocklyWithText(builder){
    builder.build(this.workspace);
  }
  beforeBuild(){
    let data = Blockly.serialization.workspaces.save(this.workspace);
    this.caches ? this.caches.set(this.currentCacheKey, data) : null;
  }
  
  initToolBox(){
    let list = [
      Queue_groupend, Queue_group, Queue_value, Queue_valueOp, Queue_valueInter, Queue_valueMeta, 
      Queue_param, Queue_valueLocal, Queue_addMeta, Queue_meta, 
      Queue_method, Queue_methodCustom, Queue_typeReturn, Queue_name, Queue_relation,
      Queue_custom, Queue_inter, Queue_typeMax, Queue_typeCondition, Queue_public 
    ]
    let toolbox = document.getElementById("Queue");
    list.forEach((q)=>{
      let name = q.name;
      Blockly.Blocks[name] = {
        init: q.prototype.block,
        validate: q.prototype.validate,
        updateConnections: q.prototype.updateConnections
      }
      PlainGenerator.forBlock[name] = q.prototype.forBlock.bind(q);
      let block = document.createElement("block");
      block.setAttribute("type", name);
      toolbox.append(block);
    })  
    
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

class Builder{
  constructor(){

  }

}

class QueueTextOld extends Builder{
  constructor(workspace = new Blockly.Workspace(), editor){
    super();
    this.workspace = workspace;
    this.editor = editor;
  }

  buildMethod(methodInfo){
    let blockMethod = this.genMethod(methodInfo.name);
    if(methodInfo.args && methodInfo.args.length){
      let blockParam = this.genParams(methodInfo.args);
      blockMethod.getInput("Context").connection.connect(blockParam.type.outputConnection);
      blockMethod.blockParam = blockParam;
    }
    return blockMethod;
  }
  

  build(workspace, dataSet){
    let count = 0;
    for(let key in dataSet){
      let data0 = dataSet[key];
      // if(key != "life") continue;
      let blockQueue = this.genQueue(key, {});
      count+=100;
      blockQueue.moveBy(count, 0);
      let targetStateMent = blockQueue;
      data0.forEach((data)=>{
        if(data.list && !Array.isArray(data.list)){
          let blockMethod = this.buildMethod(data.list);
          let blockFlag = this.genFlags(data.flags);
          if(blockFlag){
            if(blockMethod.blockParam){
              blockMethod.getInput("Context").connection.connect(blockFlag.type.outputConnection);
              blockFlag.value.getInput("Context").connection.connect(blockMethod.blockParam.type.outputConnection);
            }
            else{
              blockMethod.getInput("Context").connection.connect(blockFlag.type.outputConnection);
            }
          }
          targetStateMent.nextConnection.connect(blockMethod.previousConnection);
          targetStateMent = blockMethod;
        }
        else if(data.list && Array.isArray(data.list)){
          let group = this.genGroup();
          targetStateMent.nextConnection.connect(group.start.previousConnection);
          targetStateMent = group.start;
          let blockFlag = this.genFlags(data.flags);
          if(blockFlag){
            group.start.getInput("Context").connection.connect(blockFlag.type.outputConnection);
          }
          data.list.forEach((methodInfo)=>{
            let blockMethod = this.buildMethod(methodInfo);
            targetStateMent.nextConnection.connect(blockMethod.previousConnection);
            targetStateMent = blockMethod;
          });
          targetStateMent.nextConnection.connect(group.end.previousConnection);
          targetStateMent = group.end;
        }
      })
      // for(let id in data0){
      //   let data = data0[id];
        
      //   // return;
      // }

    }
  }

  newBlock(typeClass, opt_id){
    let block = this.workspace.newBlock(typeClass.name, opt_id);
    block.initSvg();
    block.render();
    this.editor.temps = this.editor.temps || {};
    this.editor.temps[typeClass.name] = block;
    return block;
  }

  genGroup(){
    let start = this.newBlock(Queue_group);
    let end = this.newBlock(Queue_groupend);
    return { start, end };
  }

  genMethod(name){
    let blockMethod = this.newBlock(Queue_method);
    blockMethod.getField("Value").setValue(name);
    return blockMethod;
  }

  genParams(args){
    let all = [];
    args.forEach((a)=>{
      let blockValue = this.newBlock(Queue_value);
      let blockParam = this.newBlock(Queue_param);
      blockValue.getField("Value").setValue(a.a || a);
      blockParam.getInput("Context").connection.connect(blockValue.outputConnection);
      all.push({ type:blockParam, value:blockValue });
    })
    all.forEach((bs, i)=>{
      let next = all[i+1];
      if(!next) return;
      bs.value.getInput("Context").connection.connect(next.type.outputConnection);
    })
    return all[0];
  }

  genFlags(flags){
    if(!flags) return;
    let { max, cons } = flags;
    let all = [];
    if(typeof(max) != "undefined"){
      if(isNaN(Number(max+""))){
        max = Infinity;
      }
      let blockValue = this.newBlock(Queue_value);
      let blockMax = this.newBlock(Queue_typeMax);
      blockValue.getField("Value").setValue(max + "");
      blockMax.getInput("Context").connection.connect(blockValue.outputConnection);
      all.push({value:blockValue, type:blockMax});
    }
    if(typeof(cons) != "undefined"){
      let blocks = [];
      cons.forEach((c, i)=>{
        let blockValue = this.newBlock(Queue_value);
        let blockCon = this.newBlock(Queue_typeCondition);
        blockValue.getField("Value").setValue(c.a || c);
        blockCon.getInput("Context").connection.connect(blockValue.outputConnection);
        blocks.push({ blockCon, blockValue });
      })
      blocks.forEach((bs, i)=>{
        if(i == blocks.length - 1) return;
        let next = blocks[i+1];
        bs.blockValue.getInput("Context").connection.connect(next.blockCon.outputConnection);
      })
      all.push({ value:blocks[blocks.length-1].blockValue, type:blocks[blocks.length-1].blockCon } );
    }
    all.forEach((current, i)=>{
      let next = all[i+1];
      if(!next) return;
      current.value.getInput("Context").connection.connect(next.type.outputConnection);
    })
    return all[0];
  }

  genQueue(name, relation){
    let block = this.newBlock(Queue_custom);
    block.getField("Qname").setValue(name);
    return block;
  }
}

class ToolboxBlockDescription{
  constructor(){ };
  get category(){
    return this._category;
  }
  set category(value){
    return this._category = value;
  }
}

// class statement [only for] code auto-complete
class Queue_inter extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput("QueueInfo")
        .setCheck(["QueueInfo", "Comment"])
        .appendField('内置序列')
        .appendField(new Blockly.FieldDropdown([["销毁", "destroy"], ["生命周期", "life"]]), "Qname");
    this.setNextStatement(true);
    this.setColour(255);
    this.setTooltip("生命周期序列在序列开始时自动构建运行, 销毁序列在销毁指令后运行[并停止其他所有序列]");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let QueueInfo = block.getFieldValue("QueueInfo");
    let value = block.getFieldValue("Qname");
    let methodLists = block.getNextBlock();
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_custom extends Blockly.Block{
  block(){ //Blockly.Blocks...init
    this.appendValueInput("Context")
        .setCheck(["QueueInfo", "Comment"])
        .appendField("自定义序列")
        .appendField(new Blockly.FieldTextInput("序列名"), "Qname");
    this.setNextStatement(true);
    this.setColour(254);
    this.setTooltip("自定义序列");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_relation extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    
    this.appendValueInput('VALUE')
        .setCheck(['Qname', "Comment"])
        .appendField('父级')
    this.appendValueInput('VALUE')
        .setCheck(['Qname', "Comment"])
        .appendField('自动清除')
    this.appendValueInput('VALUE')
        .setCheck(['Qname', "Comment"])
        .appendField('锁定')
    this.appendDummyInput();
    this.setOutput(true, "QueueInfo");
    this.setColour(1);
    this.setTooltip('父级:父级序列被关闭时本序列将同时关闭，自动清除:本序列开启时将自动清除目标序列, 锁定:本序列开启时目标序列将无法开启');
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_name extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput("Cache")
        .appendField(new Blockly.FieldDropdown(()=>{
          let all = [["生命周期", "life"], ["销毁", "destroy"]];
          // let workspace = 
          return all;
        }), 'qName')
    this.setOutput(true, "Qname")
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    return 0;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_typeReturn extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendEndRowInput("Cache")
        .appendField('缓存到')
        .appendField(new Blockly.FieldTextInput(""), 'cacheName')
    this.setOutput(true, "String")
    this.setColour(360)
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    return 0;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_typeCondition extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput("Context")
        .setCheck(["ContextString", "Comment"])
        .appendField('条件')
    this.setOutput(true, "Context")
    this.setColour(360)
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    return 0;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_typeMax extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput("Context")
        .setCheck(["ContextString", "Comment"])
        .appendField("最大执行次数")
    this.setOutput(true, "Context")
    this.setColour(360)
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    return 0;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_method extends Blockly.Block{
  block(){ //Blockly.Blocks...init
    this.appendValueInput('Context')
        .setCheck(["Context", "Comment"])
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        // .appendField(new Blockly.FieldDropdown(()=>Queue_method.methods.targets, this.validate), 'Value')
        .appendField(new Blockly.FieldTextInput("autoComplete"), 'Value')
        this.setTooltip("已提供的方法");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
  validate(newValue){
    let caches = [];
    Queue_method.recursiveRefreshParamList(this.getSourceBlock(), caches);
    console.log(caches);
    let paramlist = Queue_method.getParams(newValue);
    caches.forEach((b)=>{
      b.paramlist = paramlist || [["null", "null"]]
    })
  }
  static getParams(newValue){
    let typeMeta = Queue_method.methods.ref.get(newValue);
    if(!typeMeta) return;
    let targets = [];
    typeMeta.params.forEach((p)=>{
      targets.push([p.name, p.name]);
    })
    return targets;
  } 
  static recursiveRefreshParamList(block, caches=[]){
    if(!block) return;
    let input = block.getInput("Context");
    if(!input || !input.connection) return;
    let tblock = input.connection.targetBlock();
    if(!tblock) return;
    if(/Queue_param/i.test(tblock.type)){
      caches.push(tblock);
    }
    this.recursiveRefreshParamList(tblock, caches);
  }
  static get methods(){
    return this._methods;
  }
  static set methods(v){
    return this._methods = v;
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_methodCustom extends Blockly.Block{
  block(){ //Blockly.Blocks...init
    this.appendValueInput('Context')
        .setCheck(["Context", "Comment"])
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        .appendField(new Blockly.FieldTextInput("custom"), 'Value')
    this.setTooltip("自定义的方法, 参数名自动获取将失效, 参数必须按顺序赋值");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_param extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    
    this.appendValueInput('Context')
        .setCheck(["ContextString", "Comment"])
        .appendField(new Blockly.FieldDropdown([["值", "Value"], ["值(手动)", "ValueFunction"], ["函数", "Function"], ["切分", "Array"]]), "ParamType")
        .appendField(new Blockly.FieldTextInput("参数"), "Param");
    this.setOutput(true, "Context");
    this.setColour(20);
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_value extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    // 添加一个插槽，允许放置其他块
    this.appendValueInput("Context")
    .appendField(
      new FieldMultilineInput("规范字符串"),
      "Value",
    )
    this.setOutput(true, "ContextString");
  } 
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_valueInter extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    // 添加一个插槽，允许放置其他块
    this.appendValueInput("Context")
    .appendField(new Blockly.FieldDropdown(()=>{
      let base = [
        ["true", "true"], ["false", "false"], 
        ["undefined", "undefined"], ["null", "null"],
      ]
      return base;
    }), "Value")
    this.setOutput(true, "ContextString");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_valueOp extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    // 添加一个插槽，允许放置其他块
    this.appendValueInput("Context")
    .appendField(new Blockly.FieldDropdown(()=>{
      let base = [
        ["取属性", "."], ["是实例", "instance of"],
        ["是类型", "typeof"],
        ["(", "("], [")", ")"], 
        ["[", "["], ["]", "]"], 
        ["{", "{"], ["}", "}"], 
        ["=", "="],
        ["==", "=="], ["===", "==="],
        ["!=", "!="], ["!==", "!=="],
        [">", ">"], [">=", ">="],
        ["<", "<"], ["<=", "<="],
        ["&&", "&&"], ["||", "||"],
        ["&", "&"], ["|", "|"],
        ["^", "^"], ["!", "!"],
        ["+", "+"], ["-", "-"],
        ["*", "*"], ["/", "/"],
        ["%", "%"]
      ];
      return base;
    }), "Value")
    this.setOutput(true, "ContextString");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_valueLocal extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    // 添加一个插槽，允许放置其他块
    this.appendValueInput("Context")
    .appendField(new Blockly.FieldDropdown(()=>{
      let base = [
        ["缓存对象", "缓存对象"]
      ]
      return base;
    }), "Value")
    this.setOutput(true, "ContextString");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_valueMeta extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    this.appendValueInput("Context")
        .appendField(new Blockly.FieldDropdown(()=>{
          let base = [
            ["元数据", "元数据"]
          ]
          return base;
        }), "Value")
    this.setOutput(true, "ContextString");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Amount");
    console.log(value);
    // let next = 
    let next = block.getNextBlock()
    return value;
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_group extends Blockly.Block{ 
  
  block(){
    this.appendValueInput("Context").setCheck(["Context", "Comment"]).appendField("组")
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  } 
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_groupend extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    this.appendEndRowInput().appendField('组结束')
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  } 
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_public extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    this.appendValueInput("Context")
        .appendField("公共序列")
        .appendField(new Blockly.FieldDropdown(()=>{
          let base = [["序列", "序列"]]
          return base;
        }), "Queue")
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  } 
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_meta extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    this.appendEndRowInput("Type").appendField(
      new Blockly.FieldDropdown([
      ["无处理", "无处理"], ["数组", "数组"], ["数字", "数字"], ["对象", "对象"], ["延迟的场景目标", "dynamicObject"]
    ]), "Type")
    this.appendEndRowInput("Prop")
        .appendField(new Blockly.FieldTextInput("属性"), "Prop")
    this.appendEndRowInput("Value").appendField(new FieldMultilineInput("值"), "Value")
    
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  } 
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

class Queue_addMeta extends Blockly.Block{ 
  
  block(){ 
    this.appendEndRowInput().appendField("额外元数据")
    this.setNextStatement(true);
  } 
  forBlock(block=this, generator = PlainGenerator){
    
  }
  //toolbox-xml-category-auto-detect
  static toolbox(){
    let desc = ToolboxBlockDescription();
    desc.category = "Queue";
  }
}

PlainGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock =
      block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + ',\n' + PlainGenerator.blockToCode(nextBlock);
  }
  return code;
};

async function initEditor(){
  let editor = new Editor();
  await editor.init();
  editor.start();
  globalThis.editor = editor;
}

initEditor();

// class targetToolBox extends Blockly.Toolbox{
//   constructor(categoryDef, toolbox, opt_parent){
//     super(categoryDef, toolbox, opt_parent);
//   }

//   init(){
//     // this.addToolboxItem_()
//   }
// }

// Blockly.registry.register(
//   Blockly.registry.Type.TOOLBOX_ITEM,
//   Blockly.ToolboxCategory.registrationName,
//   targetToolBox, true);




export { Editor };