import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './workflow/Main.jsx';
import { init, os, events } from '@neutralinojs/lib';


const root = createRoot(document.body);
root.render(<Main/>);

init();
events.on('ready', ()=>{
  console.log("ok");
})



