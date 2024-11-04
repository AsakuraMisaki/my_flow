import { Container, Transform } from "pixi.js";
import { BaseContainer } from "../components/displayObject";

Container.prototype.remove = function(){
  if(!this.parent) return;
  this.parent.removeChild(this);
}
/**
 * @abstract
 */
class Entity extends BaseContainer{
  constructor() {
    super();
    this._delta = 0;
    this._timeScale = 1;
    this._tags = new Set();
    this._components = new Map();
  }

  get delta() {
    return this._delta * this._timeScale;
  }
  destroy(){
    this._destroy = true;
  }

  async onReady() {
    
  }

  async onDestroy() {
    this._onDestroy = true;
    super.destroy();
    this.remove();
    this._destroy = false;
  }

  onUpdate(delta) {
    this._updateChildren(delta);
    this._updateComponents(delta);
  }

  addTag(tag) {
    this._tags.add(tag);
  }

  removeTag(tag) {
    this._tags.remove(tag);
  }

  static findChildrenByTag(c, tag) {
    if (c._tags && c._tags.has(tag)) {
      return true;
    }
  }

  static findChildrenByClass(c, tClass, isSub) {
    if (isSub) {
      return c instanceof tClass;
    }
    return c.constructor === tClass;
  }

  findChildren(valid, temp = []) {
    this.children.forEach((c) => {
      if (valid(c)) {
        temp.push(c);
      }
      if (c.children && c.findChildren) {
        return c.findChildren(valid, temp);
      }
    })
    return temp;
  }

  addComponent(id, targetClass, ...args) {
    let target = new targetClass();
    target._E = this;
    target.onAdd(...args);
    this._components.set(id, target);
  }

  removeComponent(id) {
    let target = this.getComponent(id);
    target ? target._destroy = true : null;
  }

  getComponent(id){
    return this._components.get(id) || this._components.get(String(id).toLowerCase());
  }

  _updateChildren(delta) {
    let length = this.children.length;
    for (let i = 0; i < length; i++) {
      let c = this.children[i];
      if (c._destroy) {
        if(!c._onDestroy){
          c.onDestroy().then(()=>{
            this.removeChildAt(i);
          });
        }
        i--;
        continue;
      }
      c.update ? c.update(delta) : null;
    }
  }

  _updateComponents(delta) {
    this._components.forEach((c, id, map)=>{
      if(c._destroy){
        c.onDestroy().then(()=>{
          map.delete(id);
        })
        return;
      }
      c.update ? c.update(delta) : null;
    })
  }


  update(delta) {
    this._delta = delta;
    let d = this.delta;
    this.onUpdate(d);
  }

  __bp__(data) { //blue print default support
    console.log(data);
  }

}

class Component{
  constructor(){
    this._E = null;
    this._destroy = false;
  }

  get E(){
    return this._E;
  }

  get delta(){
    return this.E._delta * this.E._timeScale;
  }

  destroy(){
    this._destroy = true;
  }

  onAdd(){
    
  }

  onDestroy(){
    this._E = null;
  }

  onUpdate(delta){
    
  }

  update(delta){
    this.onUpdate(delta);
  }

}

export { Entity, Component };