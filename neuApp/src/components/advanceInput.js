import { Assets, EventBoundary, Rectangle } from "pixi.js";
import { Utils } from "../workflow/Utils";
import { Component } from "../core/entity";
import { EV } from "../core/ev";


class InputEventBoundary extends EventBoundary {
  constructor() {
    super();
  }
  init(rootTarget) {
    this.rootTarget = rootTarget;
    this.watchs = new Map();
    this.hitTestCaches = new Map();
    this.tester = {};
    this.setHitFn();
    return;
  }
  addHitWatch(target, maxDeep = 0, testFn = null) {
    let data = this.watchs.get(target);
    if (!data) data = { maxDeep: 0, gc: 0, testFn, hitTest: undefined };
    data.maxDeep = Math.max(data.maxDeep, maxDeep);
    data.gc++;
    this.watchs.set(target, data);
  }
  reduceHitWatch(target) {
    let data = this.watchs.get(target);
    if (!data) return;
    data.gc--;
    if (data.gc <= 0) {
      this.watchs.delete(target);
    }
  }
  hitTestFn(container, point) {
    if (container.containsPoint) {
      return super.hitTestFn(container, point);
    }
    else if (container.getBounds) {
      let bound = container.getBounds();
      let rect = new Rectangle(bound.x, bound.y, bound.width, bound.height);
      return rect.contains(point.x, point.y);
    }
    return false;
  }
  getPaths(target) {

  }
  setHitFn(testFn = this.hitTestFn, pruneFn = this.hitPruneFn) {
    this.tester.testFn = testFn;
    this.tester.pruneFn = pruneFn;
  }

  _hitTest(point) {
    this.watchs.forEach((ref, target) => {
      this._hitTestUppper(target, point);
    })
    this.watchs.forEach((ref, target) => {
      if (this.hitTestCaches.get(target) != true) return;
      this._hitTestLower(target, point);
    })
    this.hitTestCaches.clear();
  }
  _hitTestUppper(target, point) {
    if (!target) return;
    let result = this.hitTestCaches.get(target);
    if (result != undefined) {
      return result;
    }
    let prune = this.tester.pruneFn(target, point);
    if (!prune) {
      result = this.tester.testFn(target, point);
    }
    else {
      result = false;
    }
    this.hitTestCaches.set(target, result);
    let parentResult = this._hitTestUppper(target.parent, point);
    if (parentResult != undefined) {
      this.hitTestCaches.set(target, parentResult);
    }
  }
  _hitTestLower(target, point) {
    let ref = this.watchs.get(target);
    let deep = 0;
    let test = (target, point) => {
      let children = Array.from(target.children);
      let length = children.length;
      for (let i = length - 1; i >= 0; i--) {
        let result = this.hitTestCaches.get(children[i]);
        if (result == undefined) {
          let prune = this.tester.pruneFn(children[i], point);
          if (!prune) {
            result = this.tester.testFn(children[i], point);
          }
          else {
            result = false;
          }
        }
        this.hitTestCaches.set(children[i], result);
        if (result) {
          return children[i];
        }
      }
      return;
    }
    let next = true;
    while ((deep++) < ref.maxDeep && next) {
      next = test(target, point);
    }
  }
  hitTest(currentTarget, point, testFn, pruneFn) {
    if (pruneFn(currentTarget, point)) return;
    let children = Array.from(currentTarget.children);
    let length = children.length;
    for (let i = length - 1; i >= 0; i--) {
      if (this.hitTest(children[i], point, testFn, pruneFn)) {

      }
    }
  }
  hitPaths(filter = null, paths = [], testFn = this.hitTestFn, pruneFn = this.hitPruneFn) {

  }
  hitTestFnBounds(target, point) {
    if (target.hitArea) {
      return true;
    }
    let bound = target.getBounds();
    let rect = new Rectangle(bound.x, bound.y, bound.width, bound.height);
    return rect.contains(point.x, point.y);
  }
  hitTestSimple(target, point, testFn = this.hitTestFnBounds, pruneFn = this.hitPruneFn) {
    if (!target) return true;
    let result = false;
    let prune = pruneFn(target, point);
    if (!prune) {
      result = testFn(target, point);
    }
    else {
      result = false;
    }
    if (!result) {
      return false;
    }
    let parentResult = this.hitTestSimple(target.parent, point, testFn, pruneFn);
    if (parentResult != undefined) {
      return parentResult;
    }
  }
}

const hiter = new InputEventBoundary();
const hitTestCaches = new Map();
export const InputEvents = new EV();
export const hitTest = function(e, pointer = AdvanceInputSystem.pointer, testFn, pruneFn){
  if (hitTestCaches.has(e)) { //一帧之内查询多次的处理
    return hitTestCaches.get(e);
  }
  let result = hiter.hitTestSimple(e, pointer, testFn, pruneFn);
  hitTestCaches.set(e, result);
  return result;
}
export class ConfigAdvanceInput {
  static async _init() {
    this.motions = new Map();
    this.keys = new Set();
    this._initTypes();
  }
  static _initTypes(){
    this.POINTRE_0 = "m0";
    this.POINTRE_1 = "m1";
    this.POINTRE_2 = "m2";
    this.STATES_POINTER_MOVE = "STATES_POINTER_MOVE";
    this.STATES_UP = "STATES_UP";
    this.STATES_DOWN = "STATES_DOWN";
    this.STATES_PRESS = "STATES_PRESS";
    this.STATES_REPEAT = "STATES_REPEAT";
    this.STATES_WHEEL = "STATES_WHEEL";
  }
  
  static makeKey(keys, sort = true) {
    let key = "";
    if (sort) {
      keys = keys.sort();
    }
    keys.forEach((k) => {
      let tk = k.toLowerCase();
      this.keys.add(k);
      key += tk + " ";
    })
    return key.trim();
  }
  static create(...keys) {
    let config = new ConfigAdvanceInput(...keys);
    return config;
  }
  static getMotions(key, state) {
    let data = this.motions.get(key);
    if (!data) return;
    if (!data[state]) return;
    return Array.from(data[state]);
  }

  constructor(...keys) {
    this.key = keys;
  }
  makeKey() {
    if (typeof (this.key) == 'string') return;
    this.key = ConfigAdvanceInput.makeKey(this.key);
  }
  sort() {
    this.key = this.key.sort();
    return this;
  }
  motion(motion, state = ConfigAdvanceInput.STATES_DOWN, stateTime = 0) {
    this.makeKey();
    let data = ConfigAdvanceInput.motions.get(this.key);
    if (!data) {
      data = {};
      ConfigAdvanceInput.motions.set(this.key, data);
    }
    data[state] = data[state] || new Set();
    data[state].add({ stateTime, motion });
    return this;
  }
}

export class AdvanceInputSystem {
  static async _init() {
    let mapper = await Assets.load("../core/input.yaml");
    const pf = { passive: false };
    console.warn(mapper);

    ConfigAdvanceInput._init();
    
    this.watches = new Set();
    this.caches = new Map();

    this.setupEvents();
  }

  static setupEvents() {
    document.addEventListener('pointerdown', (e) => {
      this.onPointerDown(e);
    })
    document.addEventListener('pointermove', (e) => {
      this.onPointerMove(e);
    })
    document.addEventListener('pointerup', (e) => {
      this.onPointerUp(e);
    })
    document.addEventListener('keydown', (e) => {
      this.onKeyDown(e);
    })
    document.addEventListener('keyup', (e) => {
      this.onKeyUp(e);
    })
    document.addEventListener('wheel', (e) => {
      this.onWheel(e);
    })
    Utils.app.ticker.add(this.update, this);
  }


  static update(delta) {
    this.updateGC();
    let minInterval = -Infinity;
    let combineKey = [];
    this.caches.forEach((info, key, map) => {
      info.interval += delta * info.press;
      let i = info.interval;
      if (i <= -this.maxRepeatInterval()) {
        map.delete(key);
      }
      if (info.press >= 1) {
        combineKey.push(key);
        minInterval = Math.min(i, minInterval);
      }
      this.possiblePress(key, info.interval);
    })
    if (combineKey.length) {
      this.possiblePress(ConfigAdvanceInput.makeKey(combineKey), minInterval);
    }
  }

  static updateGC(){
    hitTestCaches.clear();
    if(!this.watches.size) return;
    let removed = [];
    this.watches.forEach((input)=>{
      const gameObject = input.gameObject;
      if(!gameObject || (gameObject && !gameObject.parent && gameObject != Utils.app.stage)){
        removed.push(input);
      }
    })
    removed.forEach((input)=>{
      this.watches.delete(input);
    })
  }

  static maxRepeatInterval() {
    return 1500;
  }

  static _saveConfig() {

  }

  static _loadConfig() {

  }

  static get pointer() {
    if (!Utils.app) return;
    return Utils.app.renderer.events.pointer.global;
  }

  static onPointerMove(e) {
    InputEvents.emit("pointermove", e);
    this.triggerMotions([
      { key: ConfigAdvanceInput.POINTRE_0, state: ConfigAdvanceInput.STATES_POINTER_MOVE }
    ], undefined, this.pointer)
  }

  static onWheel(e) {
    InputEvents.emit("wheel", e);
    const { x, y } = e;
    this.triggerMotions([
      { key: ConfigAdvanceInput.POINTRE_0, state: ConfigAdvanceInput.STATES_WHEEL }
    ], undefined, { x, y })
  }

  static onPointerDown(e) {
    if (e.button != undefined) {
      let key = `m${e.button}`;
      this.onKeyDown({ key }, this.pointer);
    }
  }

  static onPointerUp(e) {
    if (e.button != undefined) {
      let key = `m${e.button}`;
      this.onKeyUp({ key }, this.pointer);
    }
  }

  static triggerMotions(data, filter, ...args) {
    if(!this.watches.size) return;
    data.forEach(({ key, state }) => {
      let motions = ConfigAdvanceInput.getMotions(key, state);
      if (!motions) return;
      if (filter) {
        motions = motions.filter(filter);
      }
      motions.forEach((data) => {
        this.watches.forEach((advanceInput)=>{
          advanceInput.emit(data.motion, ...args);
        })
      })
    })
  }

  static onKeyDown(e, ...args) {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (!ConfigAdvanceInput.keys.has(key)) return;
    InputEvents.emit(`keydown:${key}`);
    this.possibleRepeat(key);
    this.caches.set(key, { interval: 0, press: 1 });
    this.triggerMotions([
      { key: key, state: ConfigAdvanceInput.STATES_DOWN },
    ], undefined, ...args)

    let tempKeys = [];
    Array.from(this.caches.entries()).forEach(([key, value]) => {
      if (value.press < 0) return;
      tempKeys.push(key);
    })
    if(tempKeys.length > 1){
      let combineKey = ConfigAdvanceInput.makeKey(tempKeys);
      InputEvents.emit(`keydown:${combineKey}`);
      console.log(ConfigAdvanceInput.motions, combineKey);
      this.triggerMotions([
        { key: combineKey, state: ConfigAdvanceInput.STATES_DOWN },
      ], undefined, ...args)
    }
  }

  static possibleRepeat(key) {
    let info = this.caches.get(key);
    if (!info) return;
    let i = info.interval;
    this.triggerMotions([
      { key: key, state: ConfigAdvanceInput.STATES_REPEAT },
    ], (data) => {
      return -data.stateTime >= i;
    })
  }

  static possiblePress(key, interval = 0) {
    this.triggerMotions([
      { key, state: ConfigAdvanceInput.STATES_PRESS },
    ], (data) => {
      return data.stateTime <= interval;
    })
  }

  static onKeyUp(e, ...args) {
    
    const key = e.key.toLowerCase();
    if (!ConfigAdvanceInput.keys.has(key)) return;
    InputEvents.emit(`keyup:${key}`);
    this.caches.set(key, { interval: -1, press: -1 });
    this.triggerMotions([
      { key: key, state: ConfigAdvanceInput.STATES_UP },
    ], undefined, ...args)
  }

}

export class AdvanceInput extends Component{
  constructor(){
    super();
  }
  update(){
    if(AdvanceInputSystem.watches.has(this)) return;
    AdvanceInputSystem.watches.add(this);
  }
}