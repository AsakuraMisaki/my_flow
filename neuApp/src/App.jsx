import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './workflow/Main.jsx';
import { Utils } from './workflow/Utils.js';
// import { trigger } from './workflow/DragToMake.js';


const root = createRoot(document.getElementById("workspace"));
root.render(<Main/>);


// Utils._ready();





