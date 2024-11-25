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
class Queue_make extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput("QueueInfo")
        .setCheck("QueueInfo")
        .appendField('内置序列')
        .appendField(new Blockly.FieldDropdown([["销毁", "destroy"], ["生命周期", "life"]]), "Qname");
    this.setNextStatement(true);
    this.setColour(255);
    this.setCommentText("注释");
  }
  forBlock(block=this, generator = PlainGenerator){ //generator.forBlock
    let value = block.getFieldValue("Qname");
    // console.log(value);
    // // let next = 
    // let next = block.getNextBlock()
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
    this.setTooltip('Returns number of letters in the provided text.');
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
        .appendField('缓存')
        .appendField(new Blockly.FieldTextInput("id"), 'cacheName')
    this.setOutput(true, "String")
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

class Queue_param extends Blockly.Block{
  block(){ //Blockly.Blocks...init
    this.appendValueInput('VALUE')
        .setCheck('String')
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        .appendField(new Blockly.FieldDropdown([
          ['方法', 'Method'],
        ]), 'Method')
    // this.setOutput(true, 'typeReturn');
    this.setCommentText("注释");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
    this.setTooltip('Returns number of letters in the provided text.');
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

class Queue_run extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    
    this.appendValueInput('VALUE')
        .setCheck(["Param"])
        .appendField(new Blockly.FieldDropdown([["值", "Value"], ["值函数", "ValueFunction"], ["函数", "Function"], ["切分", "Array"]]), "ParamType")
        .appendField(new Blockly.FieldDropdown([["参数", "Param"]]), "Param")
    // this.appendDummyInput()
    this.setOutput(true, 'String');
    this.setColour(20);
    this.setCommentText("注释");
    this.setTooltip('Returns number of letters in the provided text.');
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

class Queue_param_value extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    

    // 添加一个插槽，允许放置其他块
    this.appendValueInput("INPUT_SLOT")
    .setCheck("ParamX") // 允许放置任何类型的块
    this.setCommentText("注释");
    this.setOutput(true, "Param");
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

class Queue_local extends Blockly.Block{ 
  
  block(){ //Blockly.Blocks...init
    // 添加一个插槽，允许放置其他块
    this.appendValueInput("INPUT_SLOT")
    .appendField(
      new FieldMultilineInput('direct Value'),
      'value',
    )
    this.setOutput(true, "Param");
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






PlainGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock =
      block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + ',\n' + PlainGenerator.blockToCode(nextBlock);
  }
  return code;
};
Blockly.Blocks.Queue_relation = {
  init: Queue_relation.prototype.block,
}
PlainGenerator.forBlock.Queue_relation = Queue_relation.prototype.forBlock.bind(Queue_relation);
Blockly.Blocks.Queue_run = {
  init: Queue_run.prototype.block,
}
PlainGenerator.forBlock.Queue_run = Queue_run.prototype.forBlock.bind(Queue_run);
Blockly.Blocks.Queue_make = {
  init: Queue_make.prototype.block,
}
PlainGenerator.forBlock.Queue_make = Queue_make.prototype.forBlock.bind(Queue_make);

Blockly.Blocks.Queue_typeReturn = {
  init: Queue_typeReturn.prototype.block,
}
PlainGenerator.forBlock.Queue_typeReturn = Queue_typeReturn.prototype.forBlock.bind(Queue_typeReturn);

Blockly.Blocks.Queue_param = {
  init: Queue_param.prototype.block,
}
PlainGenerator.forBlock.Queue_param = Queue_param.prototype.forBlock.bind(Queue_param);

Blockly.Blocks.Queue_param_value = {
  init: Queue_param_value.prototype.block,
}
PlainGenerator.forBlock.Queue_param_value = Queue_param_value.prototype.forBlock.bind(Queue_param_value);

Blockly.Blocks.Queue_local = {
  init: Queue_local.prototype.block,
}
PlainGenerator.forBlock.Queue_local = Queue_local.prototype.forBlock.bind(Queue_local);

Blockly.Blocks.Queue_name = {
  init: Queue_name.prototype.block,
}
PlainGenerator.forBlock.Queue_name = Queue_name.prototype.forBlock.bind(Queue_name);

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