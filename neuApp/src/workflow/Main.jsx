import React, { Component, useEffect, useState } from 'react';
import { Flex, Layout, Splitter, Menu, theme } from 'antd';
import Toolbar from './Toolbar';
import Workspace from './Workspace';
import Statebar from './Statebar';


import { GEV, Utils } from './Utils';
import { BaseComponents } from './baseComponents';
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




// let userData = { items, ctx:"sadasa" }
// console.log(userData);

const Main = () => {
  const [userData, setUserData] = useState({items:[], ctx:"sadasa"});
  GEV.on("project:data:get", (data)=>{
    setUserData(data);
  })
  useEffect(()=>{
    Utils._ready();
  }, [])
  
  return <Layout style={layoutStyle}>
    {/* <Toolbar style={headerStyle} items={userData.items} title={userData.ctx}/> */}
    <Content style={contentStyle}>
      <Workspace/>
    </Content>
    <BaseComponents/>
    {/* <Footer style={footerStyle}>
      <Statebar/>
    </Footer> */}
  </Layout>
};
export default Main;