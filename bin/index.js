#!/usr/bin/env node

const { program } = require('commander')
const pkg = require('../package.json')
const { fix } = require('../index')

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

program
  .option('-fa, --fixAll', '执行所有修复命令')
  .option('-fp, --fixPath', '补全引用 vue 文件的路径')
  .option('-fr, --fixRequire', 'require 引入资源方式转换为 es 语法')
  .option('-c, --config <fileName>', '指定配置文件')
  .action(fix)


program.parse(process.argv)
