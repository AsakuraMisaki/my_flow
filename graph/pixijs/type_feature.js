let ctx = { group:"feature" };
let ex = { ctx };
function Cut_Tile()
{
  this.addOutput("self", ctx.group)
  this.addInput("index", ["number", "reflect"]);
  this.addInput("pw", ["number", "reflect"]);
  this.addInput("ph", ["number", "reflect"]);
  this.properties = { precision: 1 };
}
Cut_Tile.title = "Cut_Tile";

Cut_Tile.prototype.onExecute = function()
{
  console.log(this);
  
}


function Cut()
{
  this.addOutput("self", ctx.group)
  this.addInput("x", ["number", "reflect"]);
  this.addInput("y", ["number", "reflect"]);
  this.addInput("pw", ["number", "reflect"]);
  this.addInput("ph", ["number", "reflect"]);
  this.properties = { precision: 1 };
}
Cut.title = "Cut";

function Cut_Object()
{
  this.addOutput("self", ctx.group)
  this.addInput("object", ["object", "reflect"]);
  this.properties = { precision: 1 };
}
Cut_Object.title = "Cut_Object";


function Drag()
{
  this.properties = { precision: 1 };
}
Drag.title = "Drag";

function Scroll()
{
  this.addOutput("self", ctx.group)
  this.addInput("touch", ["boolean", "reflect"]);
  this.addInput("wheel", ["boolean", "reflect"]);
  this.properties = { precision: 1 };
}
Scroll.title = "Scroll";

function Dynamic_Grid()
{
  this.addOutput("self", "layout")
  this.addInput("col", ["number", "reflect"]);
  this.properties = { precision: 1 };
}
Dynamic_Grid.title = "Dynamic_Grid";

function Dynamic()
{
  this.addOutput("self", ctx.group)
  this.addInput("layout", "layout");
  this.addInput("source", "array");
  this.addInput("instances", "array");
  this.properties = { precision: 1 };
}
Dynamic.title = "Dynamic";

function Self()
{
  this.addOutput("self", ctx.group)
  this.addInput("r", "reflect");
  this.properties = { precision: 1 };
}
Self.title = "Self";

function Size_Flag()
{
  this.addOutput("self", ctx.group)
  this.addInput("align_x", ["number", "reflect"]);
  this.addInput("align_y", ["number", "reflect"]);
  this.addInput("margin", ["array", "reflect"]);
  this.properties = { precision: 1 };
}
Size_Flag.title = "Size_Flag";


function Style()
{
  this.addOutput("self", ctx.group)
  this.addInput("size", ["number", "reflect"]);
  this.addInput("color", ["color", "reflect", "string"]);
  this.addInput("outline", ["color", "reflect", "string"]);
  this.addInput("outline_width", ["number", "reflect"]);
  this.addInput("align", ["string", "reflect"]);
  this.properties = { precision: 1 };
}
Style.title = "Style";

function Mask()
{
  this.addOutput("self", ctx.group)
  this.addInput("mask", ["pixijs", "reflect"]);
  this.properties = { precision: 1 };
}
Mask.title = "Mask";

function Anchor()
{
  this.addOutput( "self", ctx.group )
  this.addInput("x", ["number", "reflect"]);
  this.addInput("y", ["number", "reflect"]);
  this.properties = { precision: 1 };
}
Anchor.title = "Anchor";

function Note()
{
  this.addOutput("self", ctx.group)
  this.addInput("name", ["string", "reflect"]);
  this.addInput("others", "");
  this.properties = { precision: 1 };
}
Note.title = "Note";

Object.assign(ex, 
  { Self, Cut_Tile, Cut, Cut_Object, Drag, Scroll, Size_Flag, Anchor, Mask, Style, Dynamic_Grid, Dynamic }
);

export default ex;


















export {}