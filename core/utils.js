class UPromise{
  static new(){
    let resolve = null;
    let reject = null;
    let promise = new Promise(r, rj=>{
      resolve = r;
      reject = rj;
    })
    promise.resolve = resolve;
    promise.reject = reject;
    return promise;
  }
}