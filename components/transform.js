import Component from "../core/component";

class Tranform extends Component{
  constructor(){
    super(...arguments);
  }

  get x(){
    return this._x;
  }
  set x(v){
    this._x = (Number(v) || 0);
  }
  get y(){
    return this._x;
  }
  set y(v){
    this._y = (Number(v) || 0);
  }

  update(delta){
    super.update(delta);
  }
}