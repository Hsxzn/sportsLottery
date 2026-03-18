/**
 * 体彩数据
 * 来源  https://m.lottery.gov.cn/mkjdlt/
 */

// 自动导入 dataConfig 目录下所有以数字命名的 JSON 数据源，并按年份从新到旧合并
const dataModules = import.meta.glob('./dataConfig/[0-9]*.json', {
  eager: true,
  import: 'default',
})

export const list = Object.entries(dataModules)
  .sort(([pathA], [pathB]) => {
    const yearA = Number(pathA.match(/(\d{4})\.json$/)?.[1] || 0)
    const yearB = Number(pathB.match(/(\d{4})\.json$/)?.[1] || 0)
    return yearB - yearA
  })
  .flatMap(([, records]) => records)
