const autoImport = () => {
  let listMap = {}
  let fun = (data) => {
    console.log('🚀 ~ fun ~ fun:', data)
    const { list = [], pageNo, pages } = data
    if (!list || !list.length) {
      console.log('No data available')
      return
    }

    if (pageNo > pages) {
      console.log('Reached the last page')
      return
    }

    for (let index = 0; index < list.length; index++) {
      const item = list[index]
      const key = item.lotteryDrawNum.slice(0, 2)
      if (!listMap[key]) {
        listMap[key] = []
      }
      listMap[key].push(item)
    }
    console.log('🚀 ~ listMap:', listMap)

    setTimeout(() => {
      mkjCommonFun.getMore()
    }, 500)
  }

  mkjCommonFun.curPage = 0
  mkjCommonFun.postData.pageSize = 100
  mkjCommonFun.callBackFun = fun
  mkjCommonFun.getMore()
}

// -------------------------------------------------------------
// 本地使用：Node.js 运行此文件，将 all.json 拆分写入各个年份的 json
// 运行命令：node src/sportLottery/dataConfig/setJSON.js
// -------------------------------------------------------------
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const splitAllJson = () => {
  try {
    // 获取当期目录的 ESM 版处理方式
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const allJsonPath = path.join(__dirname, 'all.json')

    // 检查文件是否存在
    if (!fs.existsSync(allJsonPath)) {
      console.log('❌ 找不到 all.json 文件，请确认路径:', allJsonPath)
      return
    }

    // 读取并解析 all.json
    const allDataRaw = fs.readFileSync(allJsonPath, 'utf8')
    const allData = JSON.parse(allDataRaw)

    // 遍历所有 key
    for (const key in allData) {
      if (Object.hasOwnProperty.call(allData, key)) {
        const fileContent = allData[key]
        const fileName = `20${key}.json`
        const outputPath = path.join(__dirname, fileName)

        // 写入对应文件
        fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2), 'utf8')
        console.log(`✅ 成功写入: ${fileName}`)
      }
    }
    console.log('🎉 所有数据拆分完成！')
  } catch (error) {
    console.error('❌ 拆分失败:', error)
  }
}

// 执行拆分方法
splitAllJson()
