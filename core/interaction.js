
import { Assets, EventBoundary, Loader, Point, Rectangle, Resolver, extensions } from "pixi.js";
import { EV } from "./ev.js";
// import { app } from "./editor.js";

const STATIC = { MOUSE0: { key:"m0" }, MOUSE1: {key: "m1"}, MOUSE2: { key: "m2"}  };
for(let key in STATIC){
  STATIC[key].parent = STATIC;
}

let app = null;
const InputEmitter = new EV();
class Pointer{
  constructor(){
    this.x = -Infinity;
    this.y = 0;
    this._x = -Infinity;
    this._y = 0;
    this._wx = 0;
    this._wy = 0;
    this.wx = 0;
    this.wy = 0;
    this.ids = new Map();
  }
}
let tempLocalMapping = new Point();
class InputEventBoundary extends EventBoundary{
  constructor(){
    super();
  }
  init(rootTarget){
    this.rootTarget = rootTarget;
    this.watchs = new Map();
    this.hitTestCaches = new Map();
    this.tester = { };
    this.setHitFn();
    return;
  }
  addHitWatch(target, maxDeep=0, testFn=null){
    let data = this.watchs.get(target);
    if(!data) data = { maxDeep: 0, gc:0, testFn, hitTest:undefined };
    data.maxDeep = Math.max(data.maxDeep, maxDeep);
    data.gc++;
    this.watchs.set(target, data);
  } 
  reduceHitWatch(target){
    let data = this.watchs.get(target);
    if(!data) return;
    data.gc--;
    if(data.gc <= 0){
      this.watchs.delete(target);
    }
  }
  hitTestFn(container, point){
    if(container.containsPoint){
      return super.hitTestFn(container, point);
    }
    else if(container.getBounds){
      let bound = container.getBounds();
      let rect = new Rectangle(bound.x, bound.y, bound.width, bound.height);
      return rect.contains(point.x, point.y);
    }
    return false;
  }
  getPaths(target){

  }
  setHitFn(testFn=this.hitTestFn, pruneFn=this.hitPruneFn){
    this.tester.testFn = testFn;
    this.tester.pruneFn = pruneFn;
  }

  _hitTest(point){
    this.watchs.forEach((ref, target)=>{
      this._hitTestUppper(target, point);
    })
    this.watchs.forEach((ref, target)=>{
      if(this.hitTestCaches.get(target) != true) return;
      this._hitTestLower(target, point);
    })
    this.hitTestCaches.clear();
  }
  _hitTestUppper(target, point){
    if(!target) return;
    let result = this.hitTestCaches.get(target);
    if(result != undefined){
      return result;
    }
    let prune = this.tester.pruneFn(target, point);
    if(!prune){
      result = this.tester.testFn(target, point);
    }
    else{
      result = false;
    }
    this.hitTestCaches.set(target, result);
    let parentResult = this._hitTestUppper(target.parent, point);
    if(parentResult != undefined){
      this.hitTestCaches.set(target, parentResult);
    }
  }
  _hitTestLower(target, point){
    let ref = this.watchs.get(target);
    let deep = 0;
    let test = (target, point)=>{
      let children = Array.from(target.children);
      let length = children.length;
      for(let i=length-1; i>=0; i--){
        let result = this.hitTestCaches.get(children[i]);
        if(result == undefined){
          let prune = this.tester.pruneFn(children[i], point);
          if(!prune){
            result = this.tester.testFn(children[i], point);
          }
          else{
            result = false;
          }
        }
        this.hitTestCaches.set(children[i], result);
        if(result){
          return children[i];
        }
      }
      return;
    }
    let next = true;
    while((deep++) < ref.maxDeep && next){
      next = test(target, point);
    }
  }
  hitTest(currentTarget, point, testFn, pruneFn){
    if(pruneFn(currentTarget, point)) return;
    let children = Array.from(currentTarget.children);
    let length = children.length;
    for(let i=length-1; i>=0; i--){
      if(this.hitTest(children[i], point, testFn, pruneFn)){

      }
    }
  }
  hitPaths(filter=null, paths=[], testFn=this.hitTestFn, pruneFn=this.hitPruneFn){

  } 
  hitTestFnBounds(target, point){
    if(target.hitArea){
      return true;
    }
    let bound = target.getBounds();
    let rect = new Rectangle(bound.x, bound.y, bound.width, bound.height);
    return rect.contains(point.x, point.y);
  }
  hitTestSimple(target, point, testFn=this.hitTestFnBounds, pruneFn=this.hitPruneFn){
    if(!target) return true;
    let result = false;
    let prune = pruneFn(target, point);
    if(!prune){
      result = testFn(target, point);
    }
    else{
      result = false;
    }
    if(!result){
      return false;
    }
    let parentResult = this.hitTestSimple(target.parent, point, testFn, pruneFn);
    if(parentResult != undefined){
      return parentResult;
    }
  }
}

//可能不会使用pixijs原生交互, 一是在多全屏layer情况下的触发问题, 二是使交互判定尽量一致, 如键盘/鼠标/手柄等
class Input { 
  static async setup(_app) {
    let mapper = await Assets.load("../core/input.yaml");
    const pf = { passive: false };
    app = _app;
    this.bound = new InputEventBoundary(app.stage);
    this.bound.init(app.stage);
    this.itemAbles = new Set();

    this.interactionSets = new Set();
    
    
    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
    document.addEventListener("pointerdown", this._onPointerDown.bind(this));
    document.addEventListener("pointermove", this._onPointerMove.bind(this));
    document.addEventListener("pointerup", this._onPointerUp.bind(this));
    document.addEventListener("wheel", this._onWheel.bind(this), pf);
    window.addEventListener("blur", this.clear.bind(this, true));
    this.clear();
    this._mapper = mapper;
    this._repeatInterval = 100;
  }

  static addHitWatch(target, maxDeep=0, testFn=null){
    this.bound.addHitWatch(target, maxDeep, testFn);
  }
  static reduceHitWatch(target){
    this.bound.reduceHitWatch(target);
  } 

  static clear(blur=false) {
    this._hitTestCaches = new Map();
    this._currentState = new Map();
    this._gcing = new Map();
    this._pointer = new Pointer();
    this._blur = blur;
  }

  static _onKeyDown(e) {
    if (e.repeat) return;
    let { key, keyCode } = e;
    key = key.toLocaleLowerCase();
    this._currentState.set(key, { press: -1 });
    InputEmitter.emit("keydown", key);
    console.warn(this.mapper, e);
  }

  static _onKeyUp(e) {
    let { key, keyCode } = e;
    key = key.toLocaleLowerCase();
    const data = this._currentState.get(key);
    if (data) {
      data.press = 1;
      this._gcing.set(key, data);
    }
    this._currentState.delete(key);
    InputEmitter.emit("keyup", key);
  }

  static pointerKey(e) {
    let key = 'm0';
    if (e.pointerType == 'mouse') {
      key = `m${e.button}`;
      this._currentState.set(key, { press: -1 });
    }
    else if (e.pointerType == 'touch') {
      this._pointer.ids.set(e.pointerId, true); //240718 多点触碰需要测试和修改
      if (this._pointer.ids.length >= 2) {
        key = 'm2';
      }
    }
    return key;
  }

  static updatePointer(e) {
    this._pointer._x = e.clientX - app.canvas.offsetLeft;
    this._pointer._y = e.clientY - app.canvas.offsetTop;
  }

  static _onPointerDown(e) {
    this.updatePointer(e);
    let key = this.pointerKey(e);
    this._onKeyDown({ key, keyCode: 0 });
    InputEmitter.emit("pointerdown", this.pointer);
    console.warn(this.mapper, e);
  }

  static addInteractionFlags(e, flag){
    e.interactionFlags = e.interactionFlags || new Set();
    e.interactionFlags.add(flag);
  }

  static updateInteractionFlags(stage, flag){
    let children = stage.children.reverse();
    for(let i = 0; i<children.length; i++){
      let e = children[i];
      if(e.interactionFlags && e.interactionFlags.has(flag)){
        return e;
      }
      return this.updateInteractionFlags(e, flag);
    }
  }

  static _onPointerMove(e) {
    this.updatePointer(e);
    InputEmitter.emit("pointermove", this.pointer);
    this.updatePaths();
  }

  static updatePaths(){

  }

  static _onPointerUp(e) {
    this.updatePointer(e);
    let key = this.pointerKey(e);
    this._onKeyUp({ key, keyCode: 0 });
    InputEmitter.emit("pointerup", this.pointer);
  }

  static _onWheel(e) {
    this._pointer._wx += e.deltaX;
    this._pointer._wy += e.deltaY;
    InputEmitter.emit("wheel", this.pointer);
  }

  static get mapper(){
    const userAgent = navigator.userAgent;
    if(/Win/i.test(userAgent)){
      return this._mapper.win64;
    }
    return this._mapper.win64;
  }

  static get pointer() {
    const { x, y, wx, wy } = this._pointer;
    return { x, y, wx, wy };
  }

  static get wheel() {
    const { wx, wy } = this._pointer;
    return { wx, wy };
  }

  static set repeatInterval(value = 200) {
    this._repeatInterval = value;
  }
  static get repeatInterval() {
    return this._repeatInterval;
  }

  static update(delta) {
    if(!this._currentState) return;
    this._hitTestCaches.clear();
    // 更新未释放的
    this._currentState.forEach((pressing, key) => {
      if (pressing.press < 0) {
        pressing.press++;
        return;
      }
      // console.log(key, pressing);
      pressing.press += delta;
    })
    // 更新释放的
    this._gcing.forEach((pressing, key, gc) => {
      if (pressing.press > 0) {
        pressing.press--;
        return;
      }
      pressing.press -= delta;
      if (pressing.press <= -this.repeatInterval) {
        gc.delete(key);
      }
    })

    this._pointer.wx = this._pointer._wx;
    this._pointer.wy = this._pointer._wy;

    this._pointer.x = this._pointer._x;
    this._pointer.y = this._pointer._y;

    this._pointer._wx = 0;
    this._pointer._wy = 0;

    // this.updateInteractionFlags(app.stage, "drag");
    // this.updateInteractionFlags(app.stage, "pointerup");
    // this.updateInteractionFlags(app.stage, "drop");
    
  }

  static isPointerMove() {
    const { x, y, _x, _y } = this._pointer;
    return ( (x != _x) || (y != _y) );
  }

  static isAnyTriggered(mouse = false) {
    let find;
    this._currentState.forEach((data, key) => {
      if (find) return;
      if (!mouse && /^m/i.test(key)) return;
      let triggered = this.isTriggered(key);
      find = (triggered ? { key, data } : null);
    })
    return find;
  }

  static isTriggered(key) {
    if(key.parent == STATIC){
      let state = this._currentState.get(key.key);
      return state && state.press == 0;
    }
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      let t = this.isTriggered(k);
      if (t) return t;
    }
    let state = this._currentState.get(key);
    return state && state.press == 0;
  }

  static isPressed(key, time = 300) {
    if(key.parent == STATIC){
      let state = this._currentState.get(key.key);
      return state && state.press >= time;
    }
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      let p = this.isPressed(k, time);
      if (p) return p;
    }
    if (this._currentState) {
      this;
    }
    let state = this._currentState.get(key);
    return state && state.press >= time;
  }

  static isReleased(key) {
    if(key.parent == STATIC){
      let state = this._gcing.get(key.key);
      return state && state.press == 0;
    }
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      // if (this.isPressed(k, 0)) return;
      let r = this.isReleased(k);
      if (r) return r;
    }
    let state = this._gcing.get(key);
    return state && state.press == 0;
  }

  static isRepeated(key, time = this.repeatInterval) {
    if(key.parent == STATIC){
      let trigger = this.isTriggered(key.key);
      let gcing = this._gcing.get(key.key);
      if (key.key == 'm0' && trigger) {
        console.log(gcing);
      }
      if (time) {
        return trigger && gcing && (gcing.press >= -time);
      }
      return trigger && gcing;
    }
    const data = this.mapper[key];
    if(!data) return;
    for (let k in data) {
      let r = this.isRepeated(k, time);
      if (r) return r;
    }
    let trigger = this.isTriggered(key);
    let gcing = this._gcing.get(key);
    
    if (time) {
      return trigger && gcing && (gcing.press >= -time);
    }
    return trigger && gcing;
  }

  
  static hitTest(e, pointer, testFn, pruneFn) { 
    if(this._hitTestCaches.has(e)){ //一帧之内查询多次的处理
      return this._hitTestCaches.get(e);
    }
    const { x, y } = this._pointer;
    pointer = pointer || { x, y };
    let result = this.bound.hitTestSimple(e, pointer, testFn, pruneFn);
    this._hitTestCaches.set(e, result);
    return result;
  }

  static hitTestBase(e) {
    return false;
    const { x, y } = this._pointer;
    let inside = this.bound.hitPruneFn(e, { x, y });
    return inside;
  }

}

export { Input, InputEmitter, STATIC }
