import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

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
    this.appendEndRowInput("Label")
        .appendField('创建序列')
        .appendField(new Blockly.FieldTextInput("myQueue"), "Qname");
    this.setNextStatement(true);
    this.setColour(255);
    this.setTooltip('创建序列');
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
        .setCheck('Number')
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        .appendField('序列关系');
    this.setOutput(true, 'typeReturn');
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

class Queue_typeReturn extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput('cacheName')
        .setCheck('typeReturn')
        .appendField(new Blockly.FieldTextInput("id"), 'cacheName')
        .appendField(':缓存');
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


class Queue_run extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        .appendField('精灵');
    this.setOutput(true, 'typeReturn');
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
// globalThis.allowPasting = true;

export { Editor, editor };