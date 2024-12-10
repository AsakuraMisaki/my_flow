import React from 'react';
import { Flex, Layout, Splitter, Menu, theme } from 'antd';
import Toolbar from './Toolbar';
import Workspace from './Workspace';
import Statebar from './Statebar';
import * as YAML from 'js-yaml';
const { Header, Footer, Sider, Content } = Layout;
const headerStyle = {
  height: 48,
};
const contentStyle = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  height: '100%'
};
const footerStyle = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#4096ff',
};
const layoutStyle = {
  borderRadius: 0,
  overflow: 'hidden',
  width: '100%',
  height: '100%',
};

// let _userData = await fetch("./workflow/user.yaml");
// _userData = await _userData.text();
// _userData = YAML.load(_userData);

let _userData = { lastests:[] };


let items = _userData.lastests.map((data)=>{
  return { key: JSON.stringify(data), label: `[${data.type}] ${data.path}` };
})

let userData = { items, ctx:"sadasa" }
console.log(userData);

const Main = () => (
  <Layout style={layoutStyle}>
    <Toolbar style={headerStyle} items={items} title={userData.ctx}/>
    <Content style={contentStyle}>
      <Workspace/>
    </Content>
    <Footer style={footerStyle}>
      <Statebar/>
    </Footer>
  </Layout>
);
export default Main;