import { Button, Flex, FloatButton, Segmented, Radio } from 'antd';
import { useState } from 'react';
import { GEV, Utils } from './Utils';

export const BaseComponents = ()=>{
  let coms = {
    select: "./workflow/font/select.svg",
    frame: "./workflow/font/frame.svg",
    sprite: "./workflow/font/sprite.svg",
    text: "./workflow/font/text.svg",
    graphics: "./workflow/font/graphics.svg",
  }
  function onClick(key){
    setCurrent(coms[key]);
    Utils._tool = key;
    setOpen(false);
  }
  const [current, setCurrent] = useState(coms.select);
  const [open, setOpen] = useState(false);
  return (
    <>
      <FloatButton icon={<img src="./workflow/font/component.svg" style={{width:30, height:30, insetInlineEnd: 94}}/>} />
      <FloatButton.Group
        open={open}
        trigger="click"
        type="primary"
        onClick={()=>setOpen(true)}
        icon={<img src={current} style={{width:30, height:30}}/>}
      >
        {Object.keys(coms).map((key)=>{
          return <FloatButton key={key} icon={<img src={coms[key]} style={{width:30, height:30}} onClick={onClick.bind({}, key)}/>} />
        })}
      </FloatButton.Group>
    </>
  )
  
}
