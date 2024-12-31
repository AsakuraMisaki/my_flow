import { Container, Sprite, Text, Texture, Transform } from "pixi.js";
import { EV } from "./ev.js";


Texture.prototype.cut = function(rect, orig=false){
  this.frame = rect;
  orig ? this.orig = rect : null;
  this.updateUvs();
}
Container.prototype.remove = function update(destroy) {
  if(this.parent){
    this.parent.removeChild(this);
  }
  destroy ? this.destroy() : null;
  this.emit("remove");
}
Container.prototype.update = function update(delta) {
  this._updateChildren();
  if(!this._entity) return;
  this._entity.update(this, delta);
}
Container.prototype._updateChildren = function _updateChildren(delta) {
  let children = Array.from(this.children).reverse();
  let length = children.length;
  for (let i = 0; i < length; i++) {
    let c = children[i];
    c.update ? c.update(delta) : null;
  }
}

export class EnityBase extends EV{
  constructor(){
    super();
    this._delta = 0;
    this._timeScale = 1;
    this._pauses = new Set();
    this.features();
  }
  features(){ }
  async ready(target){
    this.onReady(target);
  }

  onReady(target){
    this.emit("ready");
  }

  pause(id){
    this._pauses.add(id);
  }

  resume(id){
    this._pauses.remove(id);
  }

  update(delta){
    if(this._pauses.size) return;
    this.onUpdate(delta);
    this.emit("update", delta);
  }

  onUpdate(delta){
    
  }
}

export class Enity extends EnityBase{

  static async attach(gameObject, entity=new Enity()){
    await entity.ready(gameObject);
    gameObject._entity = entity;
    entity._gameObject = gameObject;
    return entity;
  }

  static disAttach(entity=new Enity()){
    if(!entity.gameObject) return;
    if(entity.gameObject._entity == entity){
      entity.gameObject._entity = null;
    }
    entity._gameObject = null;
  }

  constructor(){
    super();
  }

  features(){
    this._tags = new Set();
    this._components = new Map();
  }

  addTag(tag) {
    this._tags.add(tag);
  }
  removeTag(tag) {
    this._tags.remove(tag);
  }
  findChildrenByTag(c, tag) {
    if (c._tags && c._tags.has(tag)) {
      return true;
    }
  }
  findChildrenByClass(c, tClass, isSub) {
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

  onUpdate(delta){
    this._updateComponents(delta);
  }

  async addComponent(id, target=new Component()){
    target._E = this;
    await target.ready();
    this._components.set(id, target);
    return target;
  }

  removeComponent(id){
    let target = this.getComponent(id);
    target ? target.destroy() : null;
  }

  getComponent(id){
    return this._components.get(id);
  }

  _updateComponents(delta){
    this._components.forEach((c, id, map)=>{
      if(c._destroy){
        if(c._onDestroy) return;
        c.onDestroy().then(()=>{
          map.delete(id);
          c._E = null;
        })
        return;
      }
      c.update ? c.update(delta) : null;
    })
  }

  get delta(){
    return this._delta * this._timeScale;
  }

  get gameObject(){
    return this._gameObject;
  }
  get children(){
    return this.gameObject.children;
  }

}

export class Component extends EnityBase{
  constructor(){
    super();
  }

  features(){
    this._E = null;
    this._destroy = false;
  }

  get E(){
    return this._E;
  }
  get delta(){
    return this.E.delta;
  }
  get gameObject(){
    return this.E.gameObject;
  }

  destroy(){
    this._destroy = true;
  }

  async onDestroy(){
    this._onDestroy = true;
  }

}
