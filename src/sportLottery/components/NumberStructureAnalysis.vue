<template>
  <div class="number-structure-analysis">
    <div class="section-header">
      <h3>
        <el-icon><icon-ep-data-analysis /></el-icon>
        <span style="margin-left: 8px">号码结构分析</span>
        <span class="period-range" v-if="periodRange">
          ( 第 {{ periodRange.start }} 期 - 第 {{ periodRange.end }} 期 , 共 {{ records.length }} 期 )
        </span>
      </h3>
    </div>

    <div class="stats-grid" v-if="records.length">
      <div v-for="item in summaryCards" :key="item.label" class="stats-card">
        <span class="stats-label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <span class="stats-sub">{{ item.subtext }}</span>
      </div>
    </div>

    <div v-if="records.length" class="structure-table-wrap">
      <el-table
        :data="structureRows"
        stripe
        border
        height="520"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="period" label="期号" width="110" align="center" fixed />
        <el-table-column prop="date" label="开奖日期" width="120" align="center" />
        <el-table-column label="开奖号码" min-width="260" align="center">
          <template #default="{ row }">
            <div class="ball-group">
              <span
                v-for="(ball, index) in row.drawResult"
                :key="`${row.period}-${ball}-${index}`"
                class="ball"
                :class="{ 'ball-blue': index < 5, 'ball-red': index >= 5 }">
                {{ ball }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="前区结构" align="center">
          <el-table-column prop="frontOddEven" label="奇偶比" width="100" align="center" />
          <el-table-column prop="frontBigSmall" label="大小比" width="100" align="center" />
          <el-table-column prop="frontSum" label="和值" width="90" align="center" sortable />
          <el-table-column prop="frontSpan" label="跨度" width="90" align="center" sortable />
          <el-table-column prop="frontConsecutive" label="连号" min-width="160" align="center" />
        </el-table-column>

        <el-table-column label="后区结构" align="center">
          <el-table-column prop="backOddEven" label="奇偶比" width="100" align="center" />
          <el-table-column prop="backBigSmall" label="大小比" width="100" align="center" />
          <el-table-column prop="backSum" label="和值" width="90" align="center" sortable />
          <el-table-column prop="backSpan" label="跨度" width="90" align="center" sortable />
        </el-table-column>
      </el-table>
    </div>

    <el-empty v-else description="暂无可展示的号码结构数据" :image-size="96" />
  </div>
</template>

<script setup name="NumberStructureAnalysis">
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
 * 计算当前数据的期号范围。
 * 为避免受父组件传入顺序影响，统一按期号升序后再取起止值。
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
 * 统计一组号码的奇偶个数。
 * @param {number[]} numbers 号码数组
 * @returns {{ odd: number, even: number }}
 */
const getOddEvenCount = (numbers) => {
  return numbers.reduce(
    (result, num) => {
      if (num % 2 === 0) result.even += 1
      else result.odd += 1
      return result
    },
    { odd: 0, even: 0 }
  )
}

/**
 * 统计一组号码的大小个数。
 * 前区阈值使用 17，后区阈值使用 6。
 * @param {number[]} numbers 号码数组
 * @param {number} threshold 大小分界值
 * @returns {{ small: number, big: number }}
 */
const getBigSmallCount = (numbers, threshold) => {
  return numbers.reduce(
    (result, num) => {
      if (num <= threshold) result.small += 1
      else result.big += 1
      return result
    },
    { small: 0, big: 0 }
  )
}

/**
 * 提取连号片段。
 * 例如 [1,2,4,5,6] => "01-02，04-05-06"。
 * @param {number[]} numbers 已开奖号码数组
 * @returns {string}
 */
const getConsecutiveText = (numbers) => {
  const sorted = [...numbers].sort((a, b) => a - b)
  const groups = []
  let currentGroup = [sorted[0]]

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] === sorted[index - 1] + 1) {
      currentGroup.push(sorted[index])
    } else {
      if (currentGroup.length > 1) groups.push(currentGroup)
      currentGroup = [sorted[index]]
    }
  }

  if (currentGroup.length > 1) groups.push(currentGroup)

  if (!groups.length) return '—'

  return groups.map((group) => group.map((num) => String(num).padStart(2, '0')).join('-')).join('，')
}

/**
 * 将开奖记录转换为结构分析明细。
 */
const structureRows = computed(() => {
  return props.records.map((record) => {
    const frontNumbers = record.lotteryDrawResult.slice(0, 5).map(Number)
    const backNumbers = record.lotteryDrawResult.slice(5, 7).map(Number)

    const frontOddEven = getOddEvenCount(frontNumbers)
    const backOddEven = getOddEvenCount(backNumbers)
    const frontBigSmall = getBigSmallCount(frontNumbers, 17)
    const backBigSmall = getBigSmallCount(backNumbers, 6)

    return {
      period: record.lotteryDrawNum,
      date: record.lotteryDrawTime,
      drawResult: record.lotteryDrawResult,
      frontOddEven: `${frontOddEven.odd}:${frontOddEven.even}`,
      frontBigSmall: `${frontBigSmall.big}:${frontBigSmall.small}`,
      frontSum: frontNumbers.reduce((sum, num) => sum + num, 0),
      frontSpan: Math.max(...frontNumbers) - Math.min(...frontNumbers),
      frontConsecutive: getConsecutiveText(frontNumbers),
      backOddEven: `${backOddEven.odd}:${backOddEven.even}`,
      backBigSmall: `${backBigSmall.big}:${backBigSmall.small}`,
      backSum: backNumbers.reduce((sum, num) => sum + num, 0),
      backSpan: Math.max(...backNumbers) - Math.min(...backNumbers),
    }
  })
})

/**
 * 统计分布并找出出现次数最多的结构。
 * @param {string[]} values 结构标签列表
 * @returns {{ label: string, count: number }}
 */
const getTopPattern = (values) => {
  if (!values.length) return { label: '—', count: 0 }

  const counter = values.reduce((result, item) => {
    result[item] = (result[item] || 0) + 1
    return result
  }, {})

  const [label, count] = Object.entries(counter).sort(
    (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))
  )[0]

  return {
    label,
    count,
  }
}

/**
 * 顶部结构汇总卡片。
 */
const summaryCards = computed(() => {
  const rows = structureRows.value
  if (!rows.length) return []

  const average = (list) => (list.reduce((sum, num) => sum + num, 0) / list.length).toFixed(1)
  const frontSums = rows.map((item) => item.frontSum)
  const frontSpans = rows.map((item) => item.frontSpan)
  const backSums = rows.map((item) => item.backSum)
  const backSpans = rows.map((item) => item.backSpan)

  const topFrontOddEven = getTopPattern(rows.map((item) => item.frontOddEven))
  const topFrontBigSmall = getTopPattern(rows.map((item) => item.frontBigSmall))
  const topBackOddEven = getTopPattern(rows.map((item) => item.backOddEven))
  const topBackBigSmall = getTopPattern(rows.map((item) => item.backBigSmall))

  return [
    {
      label: '前区高频奇偶比',
      value: topFrontOddEven.label,
      subtext: `出现 ${topFrontOddEven.count} 期`,
    },
    {
      label: '前区高频大小比',
      value: topFrontBigSmall.label,
      subtext: `出现 ${topFrontBigSmall.count} 期`,
    },
    {
      label: '前区平均和值 / 跨度',
      value: `${average(frontSums)} / ${average(frontSpans)}`,
      subtext: '和值 / 跨度',
    },
    {
      label: '后区高频奇偶比',
      value: topBackOddEven.label,
      subtext: `出现 ${topBackOddEven.count} 期`,
    },
    {
      label: '后区高频大小比',
      value: topBackBigSmall.label,
      subtext: `出现 ${topBackBigSmall.count} 期`,
    },
    {
      label: '后区平均和值 / 跨度',
      value: `${average(backSums)} / ${average(backSpans)}`,
      subtext: '和值 / 跨度',
    },
  ]
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stats-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  background: #fcfcfc;
}

.stats-label {
  font-size: 12px;
  color: #909399;
}

.stats-card strong {
  font-size: 20px;
  color: #303133;
  line-height: 1.2;
}

.stats-sub {
  font-size: 12px;
  color: #909399;
}

.structure-table-wrap {
  border-radius: 10px;
  overflow: hidden;
}

.ball-group {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 6px 0;
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  font-family: Consolas, Monaco, monospace;
}

.ball-red {
  background: linear-gradient(135deg, #f78989, #e74c3c);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.25);
}

.ball-blue {
  background: linear-gradient(135deg, #66b1ff, #409eff);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.25);
}

@media (max-width: 768px) {
  h3 {
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
