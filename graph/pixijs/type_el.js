

let ctx = { group:"pixijs" };

function tryAddBasicInput(_this, ...props){
  props.forEach((p)=>{
    let type = p.type;
    _this.addInput(p.key, type);
    _this[`${p.key}_widget`] = _this.addWidget(type, p.key, "");
  })
  // _this.widgets_up = true;
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
  // var A = this.getInputData(0);
  // if( A === undefined )
  //   A = 0;
  // var B = this.getInputData(1);
  // if( B === undefined )
  //   B = 0;
  // this.setOutputData( 0, A + B );
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



export { ctx, Window, CTX, Sprite, Text, Graphics }