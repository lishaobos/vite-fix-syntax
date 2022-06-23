# vite-fix-syntax

该插件主要解决的是 vue-cli 项目迁移到 vite 中部分语法的转换，使之在 webpack 和 vite 中都可以运行。

目前特性：
  1. require 语法转换
  2. import 引入 vue 文件的路径补全


## 效果

同步语法
```
// 转换前
import demo from '@/components/demo'

// 转换后（文件真实路径，.vue || /index.vue）
// const demo = () => import('@/components/demo/index.vue')
const demo = () => import('@/components/demo.vue')
```

异步语法
```
// 转换前
const demo = () => import('@/components/demo')

// 转换后（文件真实路径，.vue || /index.vue）
// const demo = () => import('@/components/demo/index.vue')
const demo = () => import('@/components/demo.vue')
```

引入资源
```
// 转换前
const svg = require('@/assets/name.svg')

// 转换后
import name from '@/assets/name.svg' // 提升至顶层

const svg = name
```

## install

```
npm i vite-fix-syntax -g
```

## options

* fixAll
  * Type: `boolean`
  * Default: `false`

* fixPath
  * Type: `boolean`
  * Default: `false`

* fixRequire
  * Type: `boolean`
  * Default: `false`

* config
  * Type: `string`
  * Default: `syntax-replace.js`


## config

* alias
  * Type: `object`
  * Default: `{}`
  * Description: `项目中自定义的别名，需要根据他来推测真实路径`

* globOptions
  * Type: `object`
  * Default: `{
                patterns: 'src/**/*.{js,jsx,vue}',
                options: { ignore: ['node_modules'], onlyFiles: true }
              }`
  * Description: `匹配文件选项，基于fast-glob`
  * Link:  [fast-glob](https://github.com/mrmlnc/fast-glob)



### 示例
```
const path = require('path')

module.exports = {
  alias: {
    '@': path.resolve('src')
  },
  globOptions: {
    patterns: 'src/**/*.{js,jsx,vue}',
    options: { ignore: ['**/a.js'] }
  }
}
```

## example

#### 修复路径

```
// 进入项目根目录
cd my-project

vite-fix-syntax --fixPath
```

#### 修复 require

```
cd my-project

vite-fix-syntax --fixRequire
```

#### 全部修复

```
cd my-project

vite-fix-syntax --fixAll
```

#### 指定自定义配置文件

```
cd my-project

vite-fix-syntax --fixAll --config my-syntax-replace.js
```
