<template>
  <div class="trend-analysis">
    <div class="section-header">
      <h3>
        <el-icon><icon-ep-trend-charts /></el-icon>
        <span style="margin-left: 8px">开奖号码走势图</span>
        <span class="period-range" v-if="periodRange">
          ( 第 {{ periodRange.start }} 期 - 第 {{ periodRange.end }} 期 , 共 {{ records.length }} 期 )
        </span>
      </h3>
    </div>

    <div v-if="records.length" class="trend-scroll">
      <table class="trend-table">
        <thead>
          <tr class="area-group-row">
            <th rowspan="2" class="sticky-col period-col">期号</th>
            <th :colspan="35" class="area-title front-title">前区走势</th>
            <th :colspan="12" class="area-title back-title">后区走势</th>
          </tr>
          <tr>
            <th v-for="(num, idx) in frontTrendData.numbers" :key="`f-num-${idx}`" class="number-col front-col">
              {{ num }}
            </th>
            <th v-for="(num, idx) in backTrendData.numbers" :key="`b-num-${idx}`" class="number-col back-col">
              {{ num }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in combinedRows" :key="row.period">
            <td class="sticky-col period-col">
              <div class="period-main">{{ row.period }}</div>
              <div class="period-sub">{{ row.date }}</div>
            </td>
            <!-- 前区单元格 -->
            <td
              v-for="(cell, cIndex) in row.frontCells"
              :key="`f-${row.period}-${cIndex}`"
              :class="['trend-cell', 'front-col', cell.hit ? `is-hit ${areaConfigMap.front.hitClass}` : 'is-miss']">
              <span v-if="cell.hit" class="hit-ball">{{ cell.code }}</span>
              <span v-else class="omit-text">{{ cell.omit }}</span>
            </td>
            <!-- 后区单元格 -->
            <td
              v-for="(cell, cIndex) in row.backCells"
              :key="`b-${row.period}-${cIndex}`"
              :class="['trend-cell', 'back-col', cell.hit ? `is-hit ${areaConfigMap.back.hitClass}` : 'is-miss']">
              <span v-if="cell.hit" class="hit-ball">{{ cell.code }}</span>
              <span v-else class="omit-text">{{ cell.omit }}</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th class="sticky-col period-col">出现次数</th>
            <td v-for="(item, idx) in frontTrendData.stats" :key="`f-freq-${idx}`" class="footer-cell front-col">
              {{ item.frequency }}
            </td>
            <td v-for="(item, idx) in backTrendData.stats" :key="`b-freq-${idx}`" class="footer-cell back-col">
              {{ item.frequency }}
            </td>
          </tr>
          <tr>
            <th class="sticky-col period-col">最大遗漏</th>
            <td v-for="(item, idx) in frontTrendData.stats" :key="`f-max-${idx}`" class="footer-cell front-col">
              {{ item.maxOmission }}
            </td>
            <td v-for="(item, idx) in backTrendData.stats" :key="`b-max-${idx}`" class="footer-cell back-col">
              {{ item.maxOmission }}
            </td>
          </tr>
          <tr>
            <th class="sticky-col period-col">当前遗漏</th>
            <td v-for="(item, idx) in frontTrendData.stats" :key="`f-cur-${idx}`" class="footer-cell front-col">
              {{ item.currentOmission }}
            </td>
            <td v-for="(item, idx) in backTrendData.stats" :key="`b-cur-${idx}`" class="footer-cell back-col">
              {{ item.currentOmission }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <el-empty v-else description="暂无可展示的走势图数据" :image-size="96" />
  </div>
</template>

<script setup name="TrendAnalysis">
/**
 * 开奖记录列表。
 * 每条记录至少包含：
 * - `lotteryDrawNum`：期号
 * - `lotteryDrawTime`：开奖日期
 * - `lotteryDrawResult`：已拆分后的号码数组，前区 5 个 + 后区 2 个
 */
const props = defineProps({
  records: {
    type: Array,
    default: () => [],
  },
})

/**
 * 不同区域的基础配置。
 * 用于统一描述：标题、展示范围、号码数量、在开奖结果数组中的切片区间以及命中样式类。
 */
const areaConfigMap = {
  front: {
    title: '前区走势',
    rangeText: '01 - 35',
    count: 35,
    start: 0,
    end: 5,
    hitClass: 'front-hit',
  },
  back: {
    title: '后区走势',
    rangeText: '01 - 12',
    count: 12,
    start: 5,
    end: 7,
    hitClass: 'back-hit',
  },
}

/**
 * 当前数据区间的起止期号。
 * 由于传入记录的展示顺序不一定固定，因此这里通过数值排序统一求出最早期号和最新期号。
 */
const periodRange = computed(() => {
  if (!props.records.length) return null

  const sortedRecords = [...props.records].sort((a, b) => Number(a.lotteryDrawNum) - Number(b.lotteryDrawNum))

  return {
    start: sortedRecords[0]?.lotteryDrawNum || '',
    end: sortedRecords[sortedRecords.length - 1]?.lotteryDrawNum || '',
  }
})

/**
 * 根据开奖数据和区域配置构建走势图所需的完整结构。
 *
 * 处理结果包含三部分：
 * - `numbers`：表头号码列表
 * - `rows`：每一期的单元格数据，命中时显示号码，未命中时显示遗漏值
 * - `stats`：底部统计行，包含出现次数、最大遗漏、当前遗漏
 *
 * 注意：
 * 1. 统计遗漏时需要按期号从旧到新遍历，因此先升序排序；
 * 2. 表格展示习惯上是最新一期在上方，因此最终将 `rows` 反转；
 * 3. `maxOmission` 只在未命中时更新，表示该号码历史连续未出现的最长期数。
 *
 * @param {Array<{ lotteryDrawNum: string, lotteryDrawTime: string, lotteryDrawResult: string[] }>} records 开奖记录列表
 * @param {{ title: string, rangeText: string, count: number, start: number, end: number, hitClass: string }} config 区域配置
 * @returns {{
 *   numbers: string[],
 *   rows: Array<{
 *     period: string,
 *     date: string,
 *     cells: Array<{ code: string, hit: boolean, omit: number }>
 *   }>,
 *   stats: Array<{ code: string, frequency: number, maxOmission: number, currentOmission: number }>
 * }} 走势图表格数据
 */
const buildTrendData = (records, config) => {
  // 生成完整号码池：前区 01-35，后区 01-12
  const numbers = Array.from({ length: config.count }, (_, index) => String(index + 1).padStart(2, '0'))
  // 频次统计：某号码总共命中多少次
  const frequencyMap = Object.fromEntries(numbers.map((num) => [num, 0]))
  // 最大遗漏：某号码历史上最长连续未命中多少期
  const maxOmissionMap = Object.fromEntries(numbers.map((num) => [num, 0]))
  // 当前遗漏：遍历到当前期时，该号码已经连续遗漏多少期
  const currentOmissionMap = Object.fromEntries(numbers.map((num) => [num, 0]))

  const rows = []
  // 为保证遗漏值计算正确，需要按期号从小到大处理
  const sortedRecords = [...records].sort((a, b) => Number(a.lotteryDrawNum) - Number(b.lotteryDrawNum))

  sortedRecords.forEach((record) => {
    // 提取当前区域的命中号码，并转成 Set 便于 O(1) 查询
    const hitSet = new Set(record.lotteryDrawResult.slice(config.start, config.end))

    const cells = numbers.map((code) => {
      const hit = hitSet.has(code)

      if (hit) {
        frequencyMap[code] += 1
        currentOmissionMap[code] = 0
        return {
          code,
          hit: true,
          omit: 0,
        }
      }

      currentOmissionMap[code] += 1
      maxOmissionMap[code] = Math.max(maxOmissionMap[code], currentOmissionMap[code])

      return {
        code,
        hit: false,
        omit: currentOmissionMap[code],
      }
    })

    rows.push({
      period: record.lotteryDrawNum,
      date: record.lotteryDrawTime,
      cells,
    })
  })

  /**
   * 底部汇总统计。
   * - frequency：出现次数
   * - maxOmission：历史最大遗漏
   * - currentOmission：截至当前最新一期的遗漏值
   */
  const stats = numbers.map((code) => ({
    code,
    frequency: frequencyMap[code],
    maxOmission: maxOmissionMap[code],
    currentOmission: currentOmissionMap[code],
  }))

  return {
    numbers,
    rows: rows.reverse(),
    stats,
  }
}

/**
 * 前区走势图数据。
 * 基于 `records` 实时计算，适用于 01-35 号码范围。
 */
const frontTrendData = computed(() => buildTrendData(props.records, areaConfigMap.front))
/**
 * 后区走势图数据。
 * 基于 `records` 实时计算，适用于 01-12 号码范围。
 */
const backTrendData = computed(() => buildTrendData(props.records, areaConfigMap.back))

/**
 * 组合后的走势图行数据，包含了同一期的前区和后区记录。
 */
const combinedRows = computed(() => {
  return frontTrendData.value.rows
    .map((fRow, index) => {
      const bRow = backTrendData.value.rows[index]
      return {
        period: fRow.period,
        date: fRow.date,
        frontCells: fRow.cells,
        backCells: bRow.cells,
      }
    })
    .reverse()
})
</script>

<style scoped lang="scss">
h3 {
  margin-top: 0;
  margin-bottom: 0px;
  color: #606266;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
  display: flex;
  align-items: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ebeef5;
}

.period-range {
  font-size: 13px;
  color: #909399;
  margin-left: 10px;
  font-weight: normal;
}

.trend-scroll {
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 10px;
}

.trend-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
}

.trend-table th,
.trend-table td {
  min-width: 32px;
  height: 32px;
  padding: 0;
  text-align: center;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
}

.trend-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #f8fafc;
  color: #606266;
  font-weight: 600;
}

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
}

.trend-table thead .sticky-col,
.trend-table tfoot .sticky-col {
  z-index: 4;
  background: #f8fafc;
}

.period-col {
  min-width: 80px !important;
  padding: 0 8px !important;
}

.period-main {
  font-weight: 600;
  color: #303133;
}

.period-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #909399;
}

.area-title {
  padding: 8px 0 !important;
  font-size: 14px !important;
  font-weight: bold;
}
.front-title {
  color: #409eff !important;
  background: #ecf5ff !important;
  border-right: 2px solid #dcdfe6 !important;
}
.back-title {
  color: #f56c6c !important;
  background: #fef0f0 !important;
}

.trend-table th.front-col:last-of-type,
.trend-table td.front-col:last-of-type {
  border-right: 2px solid #dcdfe6 !important;
}

.trend-cell {
  background: #fff;
}

.trend-cell.is-miss {
  color: #c0c4cc;
  background: #fcfcfd;
}

.hit-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.front-hit .hit-ball,
.trend-cell.front-hit .hit-ball {
  background: linear-gradient(135deg, #66b1ff, #409eff);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25);
}

.back-hit .hit-ball,
.trend-cell.back-hit .hit-ball {
  background: linear-gradient(135deg, #f78989, #f56c6c);
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.25);
}

.omit-text {
  color: #c0c4cc;
}

.trend-table tfoot th,
.trend-table tfoot td {
  position: sticky;
  bottom: 0;
  background: #f8fafc;
  z-index: 3;
  font-weight: 600;
}

.footer-cell {
  color: #606266;
}

.trend-table tr > *:last-child {
  border-right: none;
}

.trend-table tbody tr:last-child td,
.trend-table tbody tr:last-child th {
  border-bottom: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .trend-toolbar {
    width: 100%;
  }
}
</style>
