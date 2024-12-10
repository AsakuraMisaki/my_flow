import React from 'react';
import { Flex, Layout, Splitter, Space, Menu, theme, Dropdown, Button, message } from 'antd';
import { Utils } from './Utils';


const onClick = ({key}) => {
  let data = JSON.parse(key);
  console.log(data);
  Utils.LoadProject(data.type, data.path);
}


const Toolbar = ({ title, items }) => (
  <Space>
    <Button> NEW </Button>
    <Dropdown
      menu={{items, onClick}}
      trigger={['click']}
    >
      <Button> LAST </Button>
    </Dropdown>
    <Button type="disable"> SAVE </Button>
    <Button type="disable"> LOAD </Button>
  </Space>
)
      
export default Toolbar;