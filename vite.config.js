import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 需要引入 path 模块
import { fileURLToPath } from 'url'
import vueSetupExtend from 'vite-plugin-vue-setup-extend'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers' // 自动导入 Element Plus 组件
import Inspect from 'vite-plugin-inspect'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function printUrlsAfterRebuild() {
  let timer
  let lastPrintedAt = 0
  /** @type {() => void} */
  let schedulePrint = () => {}
  return {
    name: 'print-urls-after-rebuild',
    apply: 'serve',
    configureServer(server) {
      const logger = server.config.logger

      const doPrint = () => {
        const now = Date.now()
        // 避免一次 HMR 触发多次重复输出
        if (now - lastPrintedAt < 800) return
        lastPrintedAt = now

        // 不清屏：保留完整日志；在底部追加打印最新地址，便于一眼看到
        logger.info('\n\n\n\n\n\n──────── 当前运行地址 (dev) ────────')
        server.printUrls()
        logger.info('')
      }

      const schedule = () => {
        clearTimeout(timer)
        timer = setTimeout(doPrint, 150)
      }

      schedulePrint = schedule

      // 文件改动触发 HMR / 重编译时，重新打印地址
      server.watcher.on('change', schedule)
      server.watcher.on('add', schedule)
      server.watcher.on('unlink', schedule)

      // 首次启动也补打一遍，确保在最下面
      server.httpServer?.once('listening', () => schedule())
    },
    handleHotUpdate() {
      // 兜底：某些场景下 watcher 事件可能不够及时
      schedulePrint()
    },
  }
}

// eslint-disable-next-line no-unused-vars
export default defineConfig(({ command, mode }) => {
  const pathSrc = path.resolve(__dirname, 'src')
  return {
    // Vite 的 clearScreen 是顶层配置（放到 server 里不会生效）
    clearScreen: false,
    base: '/',
    // 确保 public 目录正确解析
    publicDir: 'public',
    build: {
      outDir: 'vue3',
      assetsDir: 'public',
      sourcemap: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          assetFileNames: 'static/css/[name].[hash][extname]',
          chunkFileNames: 'static/js/[name].[hash].chunk.js',
          entryFileNames: 'static/js/[name].[hash].js',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus')) {
                return 'chunk-element-plus'
              }
              return 'chunk-vendors'
            }
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // 移除 console
        },
        format: {
          comments: false,
        },
      },
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          // 静音 Dart Sass “legacy-js-api” 弃用警告，避免刷屏影响地址显示
          // 说明：这是 Sass 的编译选项，会透传给 sass.render/renderSync 的 options
          silenceDeprecations: ['legacy-js-api'],
          quietDeps: true,
        },
      },
    },
    server: {
      open: false,
      cors: true,
      port: 666,
      host: true,
      hmr: {
        overlay: true,
      },
      fs: {
        strict: false, // 放开文件系统访问权限（一般不用改）
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    optimizeDeps: {
      include: ['element-plus'], // 替代 transpileDependencies
      exclude: ['package-manager-detector'],
    },
    resolve: {
      alias: {
        '@': pathSrc,
      },
    },
    plugins: [
      vue({
        script: {
          // 开启defineModel
          defineModel: true,
        },
        template: {
          compilerOptions: {
            whitespace: 'condense', // 压缩空白
          },
        },
      }),
      vueSetupExtend(),

      AutoImport({
        imports: ['vue', 'vue-router', 'vuex'],
        dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
        },
        resolvers: [
          ElementPlusResolver(),
          // Auto import icon components
          // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
        dirs: ['src/components'],
      }),
      Components({
        resolvers: [
          // Auto register Element Plus components
          // 自动导入 Element Plus 组件
          ElementPlusResolver(),
          // Auto register icon components
          // 自动注册图标组件
          IconsResolver({
            prefix: 'Icon',
            // this is optional, default enabling all the collections supported by Iconify
            // https://icon-sets.iconify.design/ep/?keyword=element
            enabledCollections: ['ep', 'emojione-v1', 'oui', 'material-symbols', 'mdi', 'octicon', 'fluent'],
            // 这是element-plus在iconify的集合名,  这行不配置也可以, 会识别iconify有的集合名 只要用了就自动下载 自动导入
          }),
        ],
        dirs: ['src/components'],
        dts: path.resolve(pathSrc, 'auto_components.d.ts'),
      }),

      Icons({
        compiler: 'vue3',
        // 自动安装 图标集
        autoInstall: true,
      }),
      Inspect(),
      printUrlsAfterRebuild(),
    ],
  }
})
