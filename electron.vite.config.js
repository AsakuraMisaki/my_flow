import { defineConfig } from "electron-vite"
// electron.vite.config.js
export default defineConfig({
  main: {
    build:{
      outDir:"./out/main",
      lib:{
        entry:"./main.js"
      }
    }
  },
  // preload: {
  //   // vite config options
  // },
  renderer: {
    build:{
      outDir: "./out/renderer",
      lib:{
        entry:"./index.html"
      }
    }
  }
})