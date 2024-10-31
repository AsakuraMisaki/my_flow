import { socket, tryAddBasicInput, tryCustomPropOutput, simpleArray, simpleNumber, tryCustomArrayOutput, simpleValue } from "./main";


let ctx = { group:"pixijs" };
//node constructor class
function Window()
{
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"number", key:"width"}, 
    {type:"number", key:"height"}, 
    {type:"number", key:"alpha"}, 
    {type:"boolean", key:"windowArea"},
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
  
  
}

//name to show
Window.title = "Window";

//function to call when the node is executed
Window.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2, 3, 4]);
  let obj1 = tryCustomPropOutput(this, simpleValue, [5]);
  let obj2 = tryCustomPropOutput(this, simpleArray, [6, 7]);
  let result = { };
  Object.assign(result, obj, obj1, obj2);
  this.setOutputData( 0, result );
}

function Sprite()
{
  this.properties = { precision: 1 };
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
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"number", key:"alpha"}, 
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
  
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
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    {type:"number", key:"x"}, 
    {type:"number", key:"y"}, 
    {type:"string", key:"text"}, 
    {type:"number", key:"alpha"}, 
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
}
Text.prototype.onExecute = function()
{
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 3]);
  let obj2 = tryCustomPropOutput(this, simpleValue, [2]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [4, 5]);
  let result = { };
  Object.assign(result, obj, obj1, obj2);
  this.setOutputData( 0, result );
}

//name to show
Text.title = "Text";

function Container(){
  this.properties = { precision: 1 };
  this.addOutput("self", ctx.group);
  tryAddBasicInput(this, 
    { type:"number", key:"x" }, 
    { type:"number", key:"y" }, 
    { type:"number", key:"alpha"},
  )
  this.addInput("children", "array");
  this.addInput("features", ["array", "feature"]);
}
Container.title = "Container";
Container.prototype.onExecute = function()
{
  let ctx = this.getInputData(0);
  let obj = tryCustomPropOutput(this, simpleNumber, [0, 1, 2]);
  let obj1 = tryCustomPropOutput(this, simpleArray, [3, 4]);
  let result = { };
  Object.assign(result, obj, obj1);
  this.setOutputData( 0, result );
}


function CTX()
{
  this.properties = { precision: 1 };
  this.addInput("ctx", "pixijs");
  tryAddBasicInput(this, 
    {type:"string", key:"ip"}, 
    {type:"string", key:"global_name"}, 
  )
}
CTX.title = "CTX";
CTX.prototype.onExecute = function()
{
  let ctx = this.getInputData(0);
  let target = {ctx:true, obj:ctx};
  target = JSON.stringify(target);
  console.log(target);
  socket.send(target);
}

export { ctx, Window, CTX, Sprite, Text, Graphics }