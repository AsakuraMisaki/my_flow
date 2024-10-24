

let ctx = { group:"pixijs" };

function tryAddBasicInput(_this, ...props){
  props.forEach((p)=>{
    let type = p.type;
    _this.addInput(p.key, type);
    _this[`${p.key}_widget`] = _this.addWidget(type, p.key, "");
  })
  // _this.widgets_up = true;
}
function simpleNumber(value){
  value = value || 0;
  return Number(value);
}
function simpleArray(value){
  value = value || [];
  return value;
}
function simpleArray(value){
  value = value || [];
  return value;
}
function tryCustomPropOutput(_this, trans, indexs){
  let obj = { };
  indexs.forEach((i)=>{
    let temp = _this.getInputData(i);
    if(temp == undefined){
      temp = _this.widgets[i].value;
    }
    let value = trans(temp);
    let key = _this.getInputInfo(i).name;
    obj[key] = value;
  })
  return obj;
}
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
  this.setOutputData( 0, obj );
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

//name to show
Text.title = "Text";

function CTX()
{
  this.addInput("ctx", "pixijs");
  tryAddBasicInput(this, 
    {type:"number", key:"ip"}, 
    {type:"number", key:"global_name"}, 
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