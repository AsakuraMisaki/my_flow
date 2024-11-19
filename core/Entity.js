import { Container, Sprite, Text, Texture, Transform } from "pixi.js";
import { EV } from "./ev.js";

Container.prototype.remove = function(){
  if(!this.parent) return;
  this.parent.removeChild(this);
}
Texture.prototype.cut = function(rect){
  this.frame = rect;
  this.updateUvs();
}

class ContainerEntity extends Container{
  constructor(){
    super(...arguments);
    this.asEntity();
  }
}

class SpriteEntity extends Sprite{
  constructor(){
    super(...arguments);
    this.asEntity();
  }
}

class TextEntity extends Text{
  constructor(){
    super(...arguments);
    this.asEntity();
  }
}

const MixIn = function MixIn(targetClass, targetObject, ignores=[]){
  for (const [key, value] of Object.entries(targetObject)) {
    let pre = targetClass.prototype[key];
    if(pre && typeof(pre) == "function"){
      targetClass.prototype[key] = function(){
        pre.call(this, ...arguments);
        value.call(this, ...arguments);
      }
    }
    else if(typeof(value) == "function"){
      targetClass.prototype[key] = value;
    }
    else if(typeof(value) == "object"){
      Object.defineProperty(targetClass.prototype, key, value);
    }
  }
}

const Entity = {

  async asEntity(){
    this._delta = 0;
    this._timeScale = 1;
    this._tags = new Set();
    this._components = new Map();
    this._pause = true;
    await this.ready();
    this.onReady();
  },

  delta: {
    get: function(){
      return this._delta * this._timeScale;
    }
  },

  destroy(){
    this._destroy = true;
  },

  async ready() {
    
  },

  onReady() {
    this._pause = false;
    this.emit("ready");
  },

  async onDestroy() {
    this._onDestroy = true;
    super.destroy();
    this.remove();
    this._destroy = false;
  },

  onUpdate(delta) {
    this._updateChildren(delta);
    this._updateComponents(delta);
  },

  addTag(tag) {
    this._tags.add(tag);
  },

  removeTag(tag) {
    this._tags.remove(tag);
  },

  findChildrenByTag(c, tag) {
    if (c._tags && c._tags.has(tag)) {
      return true;
    }
  },

  findChildrenByClass(c, tClass, isSub) {
    if (isSub) {
      return c instanceof tClass;
    }
    return c.constructor === tClass;
  },

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
  },

  addComponent(id, target) {
    if(typeof(target) == "function" && target.prototype instanceof Component){
      target = new target();
    }
    target._E = this;
    this._components.set(id, target);
    return target;
  },

  removeComponent(id) {
    let target = this.getComponent(id);
    target ? target.destroy() : null;
  },

  getComponent(id){
    return this._components.get(id) || this._components.get(String(id).toLowerCase());
  },

  _updateChildren(delta) {
    let children = Array.from(this.children).reverse();
    let length = children.length;
    for (let i = 0; i < length; i++) {
      let c = children[i];
      if (c._destroy) {
        let index = i;
        i--;
        if(c._onDestroy) continue;
        c.onDestroy().then(()=>{
          this.removeChildAt(index);
        });
        continue;
      }
      c.update ? c.update(delta) : null;
    }
  },

  _updateComponents(delta) {
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
  },

  pause(){
    this._pause = true;
  },

  resume(){
    this._pause = false;
  },

  update(delta) {
    if(this._pause) return;
    this._delta = delta;
    let d = this.delta;
    this.onUpdate(d);
    this.emit("update", delta);
  },

  __bp__(data) { //blue print default support
    console.log(data);
  }
}

class Component extends EV{
  constructor(){
    super();
    this.setup();
  }

  async setup(){
    this._E = null;
    this._destroy = false;
    this._pause = true;
    await this.ready();
    this.onReady();
  }

  get E(){
    return this._E;
  }
  get delta(){
    return this.E._delta * this.E._timeScale;
  }

  async ready(){ 
    
  }

  onReady(){
    this._pause = false;
    this.emit("ready");
  }

  destroy(){
    this._destroy = true;
  }

  pause(){
    this._pause = true;
  }

  resume(){
    this._pause = false;
  }

  async onDestroy(){
    this._onDestroy = true;
  }

  onUpdate(delta){
    
  }

  update(delta){
    if(this._pause) return;
    this.onUpdate(delta);
    this.emit("update", delta);
  }

}

MixIn(ContainerEntity, Entity);
MixIn(SpriteEntity, Entity);
MixIn(TextEntity, Entity);

export { Entity, Component, TextEntity, SpriteEntity, ContainerEntity };