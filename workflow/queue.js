class QueueObject{
  constructor(){
    this.conditions = new Set();
    this.commands = new Set();
    this.localGetter = null;
  }
  exec(context=this){
    if(!this.checkConditions(context)) return;
    this.tryCommands(context);
  }
  checkConditions(context=this){
    let array = Array.from(this.conditions);
    for(let i=0; i<array.length; i++){
      let contexer = array[i];
      let valid = contexer.fn.call(context, ...contexer.args);
      if(!valid) return;
    }
    return true;
  }
  tryCommands(context=this){
    this.commands.forEach((data)=>{
      data.fn.call(context, ...data.args);
    })
  }
  checkLocalGetter(){
    
  }
}