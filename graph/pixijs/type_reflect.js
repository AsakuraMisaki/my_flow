import { tryCustomArrayOutput, simpleValue, tryAddBasicInput, tryCustomPropOutput, simpleArray, simpleNumber } from "./main.js";


let ctx = { group:"reflect" };

function R()
{
  this.addOutput("R", ctx.group);
  this.value_widget = this.addWidget("text", "", "id");
  this.widgets_up = true;
  this.size = [105, 40];
  this.properties = { precision: 1 };
}
R.title = "R";
R.prototype.onExecute = function(){
  let id = this.value_widget.value;
  this.setOutputData(0, { R:id, type:this.type });
}

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
  temp.prototype.onExecute = function(){
    StaticArray.onExecute.call(this, ...arguments);
  }
}

StaticArray.onExecute = function(){
  let indexs = [];
  this.inputs.forEach((data, i) => {
    indexs.push(i);
  });
  let array = tryCustomArrayOutput(this, simpleValue, indexs);
  this.setOutputData( 0, array );
}

let StaticObject = { };
for(let i=1; i<range; i++){
  let temp = function(){
    this.addOutput("object", "object");
    this.properties = { precision: 1 };
    for(let y=0; y<i; y++){
      this.addInput("", "");
      let p = `id${y}`;
      this.addProperty(p, p);
      this.value_widget = this.addWidget("text", p, "", p);
      this.widgets_up = true;
    }
  }
  // temp.prototype.setValue = function(){

  // }
  let title = `StaticObject${i}`;
  temp.title = title;
  StaticObject[title] = temp;
  temp.prototype.onExecute = function(){
    StaticObject.onExecute.call(this, ...arguments);
  }
}

StaticObject.onExecute = function(){
  let obj = { };
  this.inputs.forEach((data, i) => {
    if(!data.link) return;
    let value = this.getInputData(i);
    let key = this.widgets[i].value;
    obj[key] = value;
  });
  this.setOutputData( 0, obj );
  // let obj = tryCustomPropOutput(this, simpleValue, indexs);
  // this.setOutputData( 0, obj );
}

function Try_Copy()
{
  this.properties = { precision: 1 };
  this.addOutput("out", "array");
  tryAddBasicInput(this, 
    {key:"range", type:"number"},
  )
  this.addInput("value", "");
}
Try_Copy.title = "Try_Copy";
Try_Copy.prototype.onExecute = function(){
  let range=0;
  let obj = tryCustomPropOutput(this, simpleNumber, [0]);
  if(obj && typeof(obj.range) == "number"){
    range = obj.range;
  }
  let v = this.getInputData(1);
  let array = new Array(range).fill(v);
  this.setOutputData(0, array);
}

function Concat()
{
  this.addOutput("out", ["array", "object"]);
  this.addInput("a", ["array", "object"]);
  this.addInput("b", ["array", "object"]);
  this.properties = { precision: 1 };
}
Concat.title = "a + b";
Concat.prototype.onExecute = function(){
  if(typeof(obja) == typeof(objb) == "object"){
    let obja = tryCustomPropOutput(this, simpleValue, [0]);
    let objb = tryCustomPropOutput(this, simpleValue, [1]);
  }
}

function Assign()
{
  this.addOutput("out", ["array", "object"]);
  this.addInput("a", ["array", "object"]);
  this.addInput("b", ["array", "object"]);
  this.properties = { precision: 1 };
}
Assign.title = "a : {b}";


let ex = { ctx, R, Concat, Assign, Try_Copy };

Object.assign(ex, StaticObject, StaticArray);

export default ex;

