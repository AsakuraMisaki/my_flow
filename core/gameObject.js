import { Transform } from "pixi.js";
import ev from "./ev";

/**
 * @abstract
 */
class GameObject {
  constructor() {
    super();
    this.children = [];
    this._delta = 0;
    this._timeScale = 1;
    this._tags = new Set();
    this._transform = new Transform();
  }

  get delta() {
    return this._delta * this._timeScale;
  }

  getTransform() {
    return this._transform;
  }

  onReady() {

  }

  onDestroy() {
    this._destroy = true;
  }

  onUpdate(delta) {
    this._updateChildren(delta);
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

  addChild(c) {
    let i = this.children.indexOf(c);
    if (i >= 0) return;
    this.children.push(c);
    c.parent = this;
  }

  addChildAt(c, i) {
    let i = this.children.indexOf(c);
    if (i >= 0) return;
    this.children = this.children.splice(0, i).concat([c]).concat(this.children.splice(i + 1, this.children.length));
    c.parent = this;
  }

  removeChild(c) {
    let i = this.children.indexOf(c);
    if (i < 0) return;
    this.children.splice(i, 1);
    c.parent = null;
  }

  removeChildAt(i) {
    let c = this.children[i];
    this.children.splice(i, 1);
    c.parent = null;
  }

  _updateChildren(delta) {
    let length = this.children.length;
    for (let i = 0; i < length; i++) {
      let c = this.children[i];
      c.update ? c.update(delta) : null;
      if (c._destroy) {
        this.removeChildAt(i);
        i--;
      }
    }
  }

  update(delta) {
    this._delta = delta;
    let delta = this.delta;
    this.onUpdate(delta);
  }

  get emitter() {
    return this._emitter;
  }
  set emitter(v) {
    if (v instanceof ev) {
      this._emitter = v;
    }
    else if (v) {
      this._emitter = new ev();
    }
  }

  /**
   * @abstract
   * @description when built from blueprint workflow
   */
  static fromBluePrint(data, targetClass, ...args) {
    if (!targetClass.prototype._fromBluePrint) return;
    let target = new targetClass(...args);
    target._fromBluePrint(data);
    return target;
  }

  _fromBluePrint(data) {
    console.log(data);
  }

}

export default GameObject;