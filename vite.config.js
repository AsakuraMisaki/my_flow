import { defineConfig } from 'vite';


export default defineConfig({
  server: {
    open: './editor/index.html', // 自动打开的页面
    host: '0.0.0.0', // 监听所有网络接口
    port: 3000,
  },
});
