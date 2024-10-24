import { tryAddBasicInput, tryCustomPropOutput, simpleArray, simpleNumber, tryCustomArrayOutput, simpleValue } from "./main";


let ctx = { group:"pixijs" };
//node constructor class
function Window()
{
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"number", key:"width"}, 
    {type:"number", key:"height"}, 
    {type:"number", key:"alpha"}, 
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
  
  this.properties = { precision: 1 };
}

//name to show
Window.title = "Window";

//function to call when the node is executed
Window.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2, 3, 4]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [5, 6]);
  let result = { };
  Object.assign(result, obj, obj1);
  this.setOutputData( 0, result );
}

function Sprite()
{
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"number", key:"width"}, 
    {type:"number", key:"height"}, 
    {type:"number", key:"alpha"}, 
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
  this.properties = { precision: 1 };
}
Sprite.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2, 3, 4]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [5, 6]);
  let result = { };
  Object.assign(result, obj, obj1);
  this.setOutputData( 0, result );
}

//name to show
Sprite.title = "Sprite";

function Graphics()
{
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"number", key:"alpha"}, 
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
  this.properties = { precision: 1 };
}
Graphics.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [3, 4]);
  let result = { };
  Object.assign(result, obj, obj1);
  this.setOutputData( 0, result );
}

//name to show
Graphics.title = "Graphics";

function Text()
{
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"number", key:"alpha"}, 
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
  this.properties = { precision: 1 };
}
Text.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [3, 4]);
  let result = { };
  Object.assign(result, obj, obj1);
  this.setOutputData( 0, result );
}

//name to show
Text.title = "Text";

function CTX()
{
  this.addInput("ctx", "pixijs");
  tryAddBasicInput(this, 
    {type:"string", key:"ip"}, 
    {type:"string", key:"global_name"}, 
  )
  this.properties = { precision: 1 };
}
CTX.title = "CTX";
CTX.prototype.onExecute = function()
{
  let ctx = this.getInputData(0);
  console.log(ctx);
}


export { ctx, Window, CTX, Sprite, Text, Graphics }