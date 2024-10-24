

let ctx = { group:"reflect" };

function R()
{
  this.addOutput("R", ctx.group);
  this.value_widget = this.addWidget("text", "", "");
  this.widgets_up = true;
  this.size = [105, 40];
  this.properties = { precision: 1 };
}
R.title = "R";

let StaticArray = { };
let range = 10;
for(let i=1; i<range; i++){
  let temp = function(){
    this.addOutput("array", "array");
    this.properties = { precision: 1 };
    for(let y=0; y<i; y++){
      this.addInput(y+1, "");
    }
  }
  let title = `StaticArray${i}`;
  temp.title = title;
  StaticArray[title] = temp;
}

let StaticObject = { };
for(let i=1; i<range; i++){
  let temp = function(){
    this.addOutput("object", "object");
    this.properties = { precision: 1 };
    for(let y=0; y<i; y++){
      this.addInput("", "");
      this.value_widget = this.addWidget("text", "value", "");
      this.widgets_up = true;
    }
  }
  let title = `StaticObject${i}`;
  temp.title = title;
  StaticObject[title] = temp;
}

function Concat()
{
  this.addOutput("out", ["array", "object"]);
  this.addInput("a", ["array", "object"]);
  this.addInput("b", ["array", "object"]);
  this.properties = { precision: 1 };
}
Concat.title = "a + b";

function Assign()
{
  this.addOutput("out", ["array", "object"]);
  this.addInput("a", ["array", "object"]);
  this.addInput("b", ["array", "object"]);
  this.properties = { precision: 1 };
}
Assign.title = "a : {b}";


let ex = { ctx, R, Concat, Assign };

Object.assign(ex, StaticObject, StaticArray);

export default ex;

