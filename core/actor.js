import ev from "./ev";

class Actor extends ev {
  constructor() {
    this._config = {};
    this._components = new Map();
    this._tags = new Set();
    this._destroy = false;
    this._transform = new Transform();
    this.addTag(this.constructor.name);
  }

  addComponent(id, cClass, ...args) {
    let c = new cClass(...args);
    this._components.set(id, c);
    c.onAdd();
  }

  getComponent(id){
    let c = this._components.get(id);
    return c;
  }

  removeComponent(id) {
    let c = this._components.get(id);
    this._components.delete(id);
    if (c) {
      c.onDestroy();
    }
  }

  config(id, value) {
    this._config[id] = value;
  }

  addTag(tag) {
    this._tags.add(tag);
  }

  removeTag(tag) {
    this._tags.remove(tag);
  }

  onEnterScene() {

  }

  onExitScene() {

  }

  onDestroy() {
    this._destroy = true;
  }

  update(delta) {
    // this.emit("update", delta);
    this._updateComponents();
  }

  _updateComponents() {
    this._components.forEach((c, id, map) => {
      c.update(delta);
      if (c._destroy) {
        this.removeComponent(id);
      }
    })
  }

}

class Vector{
  constructor(x, y, z=1){
    this.x = x;
    this.y = y;
    this.z = z;
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
  get z(){
    return this._z;
  }
  set z(v){
    this._z = (Number(v) || 0);
  }
}

class Transform{
  constructor(){
    this.position = new Vector(0, 0, 0);
    this.scale = new Vector(1, 1, 1);
    this.rotation = new Vector(0, 0, 0);
  }
}

export default Actor;