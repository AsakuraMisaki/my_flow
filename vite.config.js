import { defineConfig } from 'vite';


export default defineConfig({
  server: {
    open: false, // 自动打开的页面
    host: '0.0.0.0', // 监听所有网络接口
    port: 5173,
  },
});
