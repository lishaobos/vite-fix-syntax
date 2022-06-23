const path = require('path')
const fs = require('fs/promises')
const fg = require('fast-glob')

const srcReg = '(\'|")(.)+(\'|")'
const importReg = `import(.)+from(.)+${srcReg}`
const asyncImportReg = 'import\\((.)+\\)'
const requireReg = `require\\(${srcReg}\\)`
const scriptReg = /<script(.)*>/g

async function existSuffix (filePath, suffix) {
  await fs.access(filePath)
  return suffix
}

function exactReplace (start, end, str, replaceStr) {
  return `${str.slice(0, start)}${replaceStr}${str.slice(end)}`
}

async function fixPath (filePath, fileContent, alias) {
  async function replacePath (reg, type) {
    const aliasArr = Object.keys(alias)
    const isSync = type === 'sync'

    let data
    while (data = reg.exec(fileContent)) {
      data = data[0]
      const addressReg = new RegExp(srcReg, 'gm')
      const [fullAddress] = addressReg.exec(data)
      const address = fullAddress.slice(1, fullAddress.length - 1)

      // 不是以 alias 或者 ./ ../ 开头的直接忽略，确定到文件的也忽略
      if (
        (!address.startsWith('.') && !aliasArr.some(key => address.startsWith(`${key}/`) || address === key)) ||
        path.extname(address)
      ) {
        continue
      }

      const isAlias = !address.startsWith('.')
      const dirPath = path.dirname(filePath)
      const aliasStr = aliasArr.find(key => address.startsWith(`${key}/`) || address === key)
      const relativePath = path.resolve(dirPath, isAlias ? address.replace(aliasStr, alias[aliasStr]) : address)

      try {
        const result = await Promise.allSettled([
          existSuffix(path.resolve(relativePath, 'index.vue'), '/index.vue'),
          existSuffix(`${relativePath}.vue`, '.vue')
        ])

        const { value } = result.find(item => item.status === 'fulfilled') || {}

        if (value) {
          const start = reg.lastIndex - fullAddress.length + (isSync ? 1 : 0)
          const end = reg.lastIndex - 2 + (isSync ? 1 : 0)
          fileContent = exactReplace(start, end, fileContent, address + value)
        }
      } catch (e) {
        console.log(`没有找到匹配文件，路径是：${address}，位于${filePath}文件中`)
      }
    }

    return fileContent
  }

  fileContent = await replacePath(new RegExp(importReg, 'gm'), 'sync')
  fileContent = await replacePath(new RegExp(asyncImportReg, 'gm'), 'async')

  return fileContent
}

async function fixRequire (filePath, fileContent) {
  const extname = path.extname(filePath)
  const reg = new RegExp(requireReg, 'gm')
  const addressReg = new RegExp(srcReg, 'gm')
  const replaceMap = {}
  const replaceArr = []

  let data
  while (data = reg.exec(fileContent)) {
    data = data[0]

    if (!extname) continue

    const [address] = data.match(addressReg)
    const addressContent = address.slice(1, address.length - 1)
    const extnameItem = path.extname(addressContent)
    const name = `${path.basename(addressContent, extnameItem)}${extnameItem.replace('.', '')}`

    if (!replaceMap[data]) replaceMap[data] = []
    replaceMap[data].push(`${name}${replaceMap[data].length || ''}`)
    replaceArr.push([data, address])
  }

  let str = ''
  for (const [src, address] of replaceArr) {
    const name = replaceMap[src].shift().replace(/(-|_)/g, '')
    str += `import ${name} from ${address}\n`
    fileContent = fileContent.replace(src, name)
  }

  if (extname === '.vue') {
    const [startTag] = fileContent.match(scriptReg)
    fileContent = fileContent.replace(startTag, `${startTag}${str.length ? '\n' : ''}${str}`)
  } else {
    fileContent = `${str}${fileContent}`
  }

  return fileContent
}

const defaultGlobOptions = {
  patterns: 'src/**/*.{js,jsx,vue}',
  options: { ignore: ['node_modules'], onlyFiles: true }
}

const commandMap = {
  fixPath: true,
  fixRequire: true,
}

exports.fix = async function (params) {
  try {
    const { globOptions, alias = {} } = { globOptions: defaultGlobOptions, ...require(path.resolve(params.config || 'syntax-replace.js')) }
    const data = await fg(globOptions.patterns, globOptions.options || {})
    
    if (params.fixAll) Object.assign(params, commandMap)

    for (const filePath of data) {
      let fileContent = await fs.readFile(filePath, { encoding: 'utf-8' })

      if (!fileContent) continue

      if (params.fixPath) fileContent = await fixPath(filePath, fileContent, alias)
      if (params.fixRequire) fileContent = await fixRequire(filePath, fileContent)

      await fs.writeFile(filePath, fileContent)
    }

    console.log('修复完成')
  } catch (e) {
    throw e
  }
}