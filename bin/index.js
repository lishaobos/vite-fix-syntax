#!/usr/bin/env node

const path = require('path')
const fs = require('fs/promises')
const minimist = require('minimist')
const fg = require('fast-glob')
const { fixPath, fixRequire } = require('../index')

const defaultGlobOptions = {
  patterns: 'src/**/*.{js,jsx,vue}',
  options: { ignore: ['node_modules'], onlyFiles: true }
}

async function fix() {
  try {
    const params = minimist(process.argv.slice(2))
    const { globOptions, alias = {} } = { globOptions: defaultGlobOptions, ...require(path.resolve(params.config || 'syntax-replace.js')) }
    const data = await fg(globOptions.patterns, globOptions.options || {})

    for (const filePath of data) {
      let fileContent = await fs.readFile(filePath, { encoding: 'utf-8' })
      if (params.fixPath) fileContent = await fixPath(filePath, fileContent, alias)
      if (params.fixRequire) fileContent = await fixRequire(filePath, fileContent)
      await fs.writeFile(filePath, fileContent)
    }

    console.log('修复完成')
  } catch (e) {
    throw e
  }
}

fix()
