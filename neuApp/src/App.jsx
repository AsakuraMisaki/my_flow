import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './workflow/Main.jsx';

import { Utils } from './workflow/Utils.js';


const root = createRoot(document.getElementById("app"));
root.render(<Main/>);

Utils._ready();





