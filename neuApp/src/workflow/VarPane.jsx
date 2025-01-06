import React, { useEffect, useState } from 'react';
import { Flex, Splitter, Typography, Menu, Collapse, List, Button, Tabs, Card } from 'antd';

import { GEV, Utils } from './Utils';

import Shower from './Block';
import Outline from './Outline';
import AssetOutline from './AssetOutline';
import TextArea from 'antd/es/input/TextArea';
import MetaVar from './MetaVar';
import { Editor } from '../core/editor';


const VarPane = ({param, id, name}) => {
  
  useEffect(()=>{
    console.log(param);
    let pane = Editor.createPane(document.getElementById(id));
    Editor._applyPaneParam(param, name, pane);
  }, [param])

  let container = <div id={id}></div>
  
  
  return container;
};

export default VarPane

