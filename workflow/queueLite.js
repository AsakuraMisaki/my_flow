import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
import { FieldMultilineInput } from '@blockly/field-multilineinput';
// import { ipcMain, ipcRenderer } from "electron";
// registerFieldMultilineInput();
const PlainGenerator = new Blockly.Generator("Plain");
// PlainGenerator.forBlock
class Editor{
  constructor(){
    this.div = document.createElement("div");
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
    document.body.appendChild(this.div);
    const workspace = Blockly.inject(this.div, { toolbox:this.getToolbox() });
    this.workspace = workspace;
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
      // console.log(e, e.target);
      this.lastSvgTarget = this.findSvgTarget(e.target);
      requestAnimationFrame(this.update.bind(this));
    })
    window.addEventListener("resize", ()=>{
      this.adapt();
    })
    this.consoleDiv = document.getElementById("console");
    
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
  refreshConsole(content, type){
    let target = this.consoleDiv.getElementsByClassName(type)[0];
    if(!target) return;
    if(type == "tip"){
      target.innerHTML = content;
    }
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
    this.appendValueInput("QueueInfo")
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
    this.appendValueInput("Condition")
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
    this.appendValueInput("Condition")
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
        .appendField(new Blockly.FieldDropdown(()=>Queue_method.methods.targets, this.validate), 'Method')
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
        .appendField(new Blockly.FieldTextInput("custom"), 'Method')
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
        .appendField(new Blockly.FieldDropdown(()=>{
          return this.paramlist || [["args.next", "args.next"]]
        }), "Param")
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
    // 添加一个插槽，允许放置其他块
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

async function initTypes(){
  let types = await fetch("https://asakuramisaki.github.io/workflow_js_doc/ScriptableQueryObject/Type.json");
  types = await types.json();
  
  types = types.docs.filter((data)=>{
    if(!data.meta || !data.meta.code.name) return;
    let name = data.meta.code.name;
    return /mzarpg|battler|arpg|petsystem/i.test(name);
  })
  console.log(types);
  
  let ref = new Map();
  let targets = types.map((type)=>{
    let name = type.meta.code.name;
    let desc = type.description;
    let _name = name.split(".");
    _name = _name[_name.length - 1];
    ref.set(name, type);
    return [_name, name];
  })
  Queue_method.methods = {targets, ref};
  // Queue_method.methods = Queue_method.methods.sort((a, b)=>{
  //   let namea = a[0];
  //   let nameb = b[0];
  //   return namea - nameb;
  // })
  console.log(Queue_method.methods);
  initToolBox();
} 
function initToolBox(){
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
  initEditor();
}
function initEditor(){
  let editor = new Editor();
  editor.start();
  globalThis.editor = editor;
}

initTypes();

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