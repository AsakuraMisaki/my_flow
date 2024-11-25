import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
import { FieldMultilineInput } from '@blockly/field-multilineinput';
import { ipcMain, ipcRenderer } from "electron";
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
    window.addEventListener("resize", ()=>{
      this.adapt();
    })
  }
  adapt(){
    this.div.style.width = window.innerWidth + "px";
    this.div.style.height = window.innerHeight + "px";
  }
  stop(){
    
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
        .setCheck("QueueInfo")
        .appendField('内置序列')
        .appendField(new Blockly.FieldDropdown([["销毁", "destroy"], ["生命周期", "life"]]), "Qname");
    this.setNextStatement(true);
    this.setColour(255);
    this.setCommentText("生命周期序列在序列开始时自动构建运行, 销毁序列在销毁指令后运行[并停止其他所有序列]");
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
        .setCheck("QueueInfo")
        .appendField("自定义序列")
        .appendField(new Blockly.FieldTextInput("序列名"), "Qname");
    this.setNextStatement(true);
    this.setColour(254);
    this.setCommentText("自定义序列");
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
        .setCheck('Qname')
        .appendField('父级')
    this.appendValueInput('VALUE')
        .setCheck('Qname')
        .appendField('自动清除')
    this.appendValueInput('VALUE')
        .setCheck('Qname')
        .appendField('锁定')
    this.appendDummyInput();
    this.setOutput(true, "QueueInfo");
    this.setColour(1);
    this.setCommentText('父级:父级序列被关闭时本序列将同时关闭，自动清除:本序列开启时将自动清除目标序列, 锁定:本序列开启时目标序列将无法开启');
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
        .appendField(new Blockly.FieldDropdown([["生命周期", "life"]]), 'qName')
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
        .setCheck("ContextString")
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
        .setCheck("ContextString")
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
    this.appendValueInput('VALUE')
        .setCheck(["Context"])
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        .appendField(new Blockly.FieldDropdown([
          ['方法', 'Method'],
        ]), 'Method')
    this.setCommentText("已提供的方法");
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
    
    this.appendValueInput('VALUE')
        .setCheck(["Param"])
        .appendField(new Blockly.FieldDropdown([["值", "Value"], ["值(手动)", "ValueFunction"], ["函数", "Function"], ["切分", "Array"]]), "ParamType")
        .appendField(new Blockly.FieldDropdown([["参数", "Param"]]), "Param")
    this.setOutput(true, "Context");
    this.setColour(20);
    this.setCommentText("注释");
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
    this.appendValueInput("Value")
    .appendField(
      new FieldMultilineInput("规范字符串"),
      'value',
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

class Queue_group extends Blockly.Block{ 
  
  block(){
    this.appendValueInput("Value").setCheck(["Context"]).appendField("组")
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
        .appendField(new Blockly.FieldDropdown([["序列", "序列"]]), "Queue")
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

let list = [
  Queue_groupend, Queue_group, Queue_value, Queue_param, 
  Queue_method, Queue_typeReturn, Queue_name, Queue_relation,
  Queue_custom, Queue_inter, Queue_typeMax, Queue_typeCondition, Queue_public 
]



PlainGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock =
      block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + ',\n' + PlainGenerator.blockToCode(nextBlock);
  }
  return code;
};


let toolbox = document.getElementById("Queue");
list.forEach((q)=>{
  let name = q.name;
  Blockly.Blocks[name] = {
    init: q.prototype.block,
  }
  PlainGenerator.forBlock[name] = q.prototype.forBlock.bind(q);
  let block = document.createElement("block");
  block.setAttribute("type", name);
  toolbox.append(block);
})
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

let editor = new Editor();
editor.start();
globalThis.editor = editor;


export { Editor, editor };