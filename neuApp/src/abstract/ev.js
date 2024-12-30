class EV {
  constructor() {
    this.events = new Map();
  }
  on(name, cb, z = 1, once = false) {
    let list = this.events.get(name);
    if (!list) {
      this.events.set(name, new Map());
      return this.on(...arguments);
    }
    let size = list.size;
    list.set(cb, { z, once, size });
    let newList = this.sort(list);
    this.events.set(name, newList);
    return cb;
  }
  sort(list) {
    let temp = Array.from(list.entries());
    temp.sort((a, b) => {
      let z = b.z - a.z; //层级越高 越先执行
      if (!z) {
        return a.size - b.size; //按添加顺序执行
      }
      return z;
    })
    return new Map(temp);
  }
  clear(name) {
    if(name){
      return this.events.delete(name);
    }
    this.events.clear();
  }
  once(name, cb, z = 1) {
    return this.on(name, cb, z, true);
  }
  off(name, cb) {
    if (!cb) {
      this.events.delete(name);
      return;
    }
    let list = this.events.get(name);
    list.delete(cb);
  }
  emitonly(name, cb, ...args) {
    let list = this.events.get(name);
    if (!list) return;
    let options = list.get(cb);
    this._emit(options, cb, list, args);
  }
  emit(name, ...args) {
    let list = this.events.get(name);
    if (!list) return;
    list.forEach((options, cb, list) => {
      this._emit(options, cb, list, ...args);
    })
    return;
  }
  _emit(options, cb, list, ...args) {
    cb(...args);
    if (options.once) {
      list.delete(cb);
    }
  }
}

export {EV};