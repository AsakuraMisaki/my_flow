import { tryAddBasicInput, tryCustomPropOutput, simpleArray, simpleNumber, simpleValue } from "./main.js";

let ctx = { group:"feature" };
let ex = { ctx };
function Cut_Tile()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this,
    {key:"index", type:["number", "reflect"]},
    {key:"pw", type:["number", "reflect"]},
    {key:"ph", type:["number", "reflect"]},
  )
}
Cut_Tile.title = "Cut_Tile";

Cut_Tile.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2]);
  this.setOutputData( 0, obj );
}


function Cut()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  // tryAddBasicInput(this, 
  //   {

  //   }
  // )
  this.addInput("x", ["number", "reflect"]);
  this.addInput("y", ["number", "reflect"]);
  this.addInput("pw", ["number", "reflect"]);
  this.addInput("ph", ["number", "reflect"]);
}
Cut.title = "Cut";
Cut.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2, 3]);
  this.setOutputData( 0, obj );
}

function Cut_Object()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {key:"obj", type:["string", "object", "reflect"]}
  )
}
Cut_Object.title = "Cut_Object";
Cut_Object.prototype.onExecute = function(){
  let obj = tryCustomPropOutput(this, simpleValue, [0]);
  if(typeof(obj.obj) == "string"){
    if(!/^\{|^\[/i.test(obj.obj)){
      obj.obj = `{${obj.obj}}`
    }
    obj.obj = JSON.parse(obj.obj);
  }
  this.setOutputData(0, obj);
}


function Drag()
{
  this.properties = { precision: 1 };
}
Drag.title = "Drag";

function Scroll()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group)
  this.addInput("touch", ["boolean", "reflect"]);
  this.addInput("wheel", ["boolean", "reflect"]);
}
Scroll.title = "Scroll";

function Dynamic_Grid()
{
  this.properties = { precision: 1 };
  this.addOutput("self", "layout");
  tryAddBasicInput(this,
    {key:"col", type:["number", "reflect"]},
    {key:"margin_x", type:["number", "reflect"]},
    {key:"margin_y", type:["number", "reflect"]},
    )
}
Dynamic_Grid.title = "Dynamic_Grid";
Dynamic_Grid.prototype.onExecute = function(){
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2]);
  this.setOutputData(0, obj);
}

function Dynamic()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group)
  this.addInput("layout", "layout");
  this.addInput("source", "array");
  this.addInput("instances", "array");
}
Dynamic.title = "Dynamic";
Dynamic.prototype.onExecute = function(){
  let layout = simpleValue(this.getInputData(0));
  let source = simpleArray(this.getInputData(1));
  let instances_t = simpleArray(this.getInputData(2));
  let instances = { };
  instances_t.forEach((data, i)=>{
    if(!data) return;
    if(!data.key) return;
    instances[data.key] = data.obj;
  })
  this.setOutputData(0, { type:this.type, layout, source, instances })
}

function HasKey()
{
  this.properties = { precision: 1 };
  this.addOutput("instance", "reflect")
  this.addInput("", "pixijs");
  this.addProperty("key", "key");
  this.value_widget = this.addWidget("text", "", "", "key");
  this.widgets_up = true;
  this.size = [100, 40];
}
HasKey.title = "HasKey";
HasKey.prototype.onExecute = function(){
  let obj = simpleValue(this.getInputData(0));
  let key = this.widgets[0].value;
  if(obj && key){
    this.setOutputData(0, { key, obj });
  }
}

function Texture()
{
  this.properties = { precision: 1 };
  tryAddBasicInput(this, {
    key: "url", type: ["string", "reflect"]
  })
  this.addOutput("instance", ctx.group)
}
Texture.title = "Texture";
Texture.prototype.onExecute = function(){
  let obj = tryCustomPropOutput(this, simpleValue, [0]);
  this.setOutputData(0, obj);
}

function Size_Flag()
{
  this.addOutput("self", ctx.group)
  this.addInput("align_x", ["number", "reflect"]);
  this.addInput("align_y", ["number", "reflect"]);
  this.addInput("margin", ["array", "reflect"]);
  this.properties = { precision: 1 };
}
Size_Flag.title = "Size_Flag";
Size_Flag.prototype.onExecute = function(){
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [2]);
  if(obj && obj1){
    let result = Object.assign(obj, obj1);
    this.setOutputData(0, result);
  }
}


function Style()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  let input = [
    { key:"size", type:["number", "reflect"] },
    { key:"color", type:["string", "color", "reflect"] },
    { key:"outline", type:["string", "color", "reflect"] },
    { key:"outline_width", type:["number", "reflect"] },
    { key:"align", type:["string", "reflect"] },
  ]
  tryAddBasicInput(this, ...input);
}
Style.title = "Style";
Style.prototype.onExecute = function(){
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 3]);
  let obj1 = tryCustomPropOutput(this, simpleValue, [1, 2, 4]);
  if(obj && obj1){
    let result = Object.assign(obj, obj1);
    this.setOutputData(0, result);
  }
}

function Mask()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  this.addInput("mask", "pixijs");
}
Mask.title = "Mask";

function Anchor()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group );
  this.addInput("x", ["number", "reflect"]);
  this.addInput("y", ["number", "reflect"]);
}
Anchor.title = "Anchor";

function Note()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  let input = [
    { key: "name", type:["string", "reflect"] },
    { key: "others", type:"" },
  ]
  tryAddBasicInput(this, ...input);
}
Note.title = "Note";
Note.prototype.onExecute = function(){
  let obj = tryCustomPropOutput(this, simpleValue, [0, 1]);
  this.setOutputData(0, obj);
}

Object.assign(ex, 
  { Texture, HasKey, Cut_Tile, Cut, Cut_Object, Drag, Scroll, Size_Flag, Anchor, Mask, Style, Dynamic_Grid, Dynamic }
);

export default ex;


















export {}