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
class string_length extends Blockly.Block{ 
  block(){ //Blockly.Blocks...init
    this.appendValueInput('VALUE')
        .setCheck('String')
        .appendField(new Blockly.FieldCheckbox(true), 'Amount')
        .appendField('精灵');
    this.setOutput(true, 'Number');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
    this.setTooltip('Returns number of letters in the provided text.');
    this.setHelpUrl('http://www.w3schools.com/jsref/jsref_length_string.asp');
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

Blockly.Blocks.string_length = {
  init: string_length.prototype.block,
}
PlainGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock =
      block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + ',\n' + PlainGenerator.blockToCode(nextBlock);
  }
  return code;
};
PlainGenerator.forBlock.string_length = string_length.prototype.forBlock.bind(string_length);

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