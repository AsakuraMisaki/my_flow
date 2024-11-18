class objectPool {
  constructor(){
    this.caches = new Map();
  }

  save(id, object){
    this.caches.set(id, object);
  }

  tryRead(id, object){
    this.caches.set(id, object);
  }
}