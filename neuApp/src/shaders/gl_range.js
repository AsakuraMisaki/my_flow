return {
  prepare: function(user={}){
    
    let uniforms = {
      u_time : 0,
      u_flow : [0, 5],
      u_speed: 2
    }
    Object.assign(uniforms, user);
    return uniforms;
  },
  resume: function(uniforms){
    
  },
  update: function(uniforms){
    uniforms.u_time = SCQ_customFilters.u_time / 1000;
  }
}
