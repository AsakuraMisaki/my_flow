import { EV } from "./ev";

class Store extends EV{
  constructor(any){
    super();
    this.state = any;
    this.observers = new Set();
  }

  get state(){
    return this._state || null;
  }
  get state(){
    let last = this.state;
    this.state = value;
    if(last !== this.state){
      this.emit("change");
      this.notify(null, value, last);
    }
  }


  sub(observer, notify=false){
    this.observers.add(observer);
    if(notify){
      this.notify(observer);
    }
  }

  unsub(observer){
    this.observers.delete(observer);
  }

  clear(){
    this.observers.clear();
  }

  notify(observer, value=this.state, last=this.state){
    if(observer){
      observer.onNotify ? observer.onNotify(value, last) : observer(value, last);
      return;
    }
    this.observers.forEach((observer)=>{
      observer.onNotify ? observer.onNotify(value, last) : observer(value, last);
    })
  }

}