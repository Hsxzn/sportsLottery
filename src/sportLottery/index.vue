<template>
  <div class="sport-lottery-container">
    <h2>体彩数据分析</h2>

    <div class="filter-section">
      <el-form :inline="true">
        <el-form-item label="期号区间" style="margin-bottom: 0">
          <el-select
            v-model="startNumInput"
            placeholder="起始期号"
            clearable
            filterable
            style="width: 150px"
            @change="activeQuickCount = 0">
            <el-option
              v-for="item in lotteryNumOptions"
              :key="item"
              :label="item"
              :value="item"
              :disabled="endNumInput ? item > endNumInput : false" />
          </el-select>
          <span style="margin: 0 10px">-</span>
          <el-select
            v-model="endNumInput"
            placeholder="结束期号"
            filterable
            :clearable="false"
            style="width: 150px"
            @change="activeQuickCount = 0">
            <el-option
              v-for="item in lotteryNumOptions"
              :key="item"
              :label="item"
              :value="item"
              :disabled="startNumInput ? item < startNumInput : false" />
          </el-select>
        </el-form-item>
        <el-form-item style="margin-bottom: 0">
          <el-button type="primary" @click="handleFilter">筛选</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item label="最近" style="margin-bottom: 0; margin-left: 10px">
          <el-button-group>
            <el-button size="default" :type="activeQuickCount === 20 ? 'primary' : ''" @click="handleQuickFilter(20)">
              20期
            </el-button>
            <el-button size="default" :type="activeQuickCount === 50 ? 'primary' : ''" @click="handleQuickFilter(50)">
              50期
            </el-button>
            <el-button size="default" :type="activeQuickCount === 100 ? 'primary' : ''" @click="handleQuickFilter(100)">
              100期
            </el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </div>

    <div class="summary-section">
      <div class="section-header">
        <h3>
          <el-icon><icon-ep-histogram /></el-icon>
          <span style="margin-left: 8px">前区蓝球频次汇总</span>
          (1-35)
        </h3>
        <el-button type="info" text bg size="small" @click="toggleSort(true)">
          {{ getSortBtnText(blueSortType) }}
          <el-icon class="el-icon--right">
            <component :is="getSortIcon(blueSortType)" />
          </el-icon>
        </el-button>
      </div>
      <div class="summary-grid">
        <div v-for="item in blueSortedList" :key="item.code" class="summary-item">
          <div class="ball ball-blue">{{ item.code }}</div>
          <div class="count">
            {{ item.count }}
            <span class="unit">次</span>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-section">
      <h3>
        <el-icon><icon-ep-trend-charts /></el-icon>
        <span style="margin-left: 8px">前区蓝球频次折线图</span>
        (1-35)
      </h3>
      <div ref="blueChartEl" class="chart" />
    </div>

    <div class="summary-section">
      <div class="section-header">
        <h3>
          <el-icon><icon-ep-histogram /></el-icon>
          <span style="margin-left: 8px">后区红球频次汇总</span>
          (1-12)
        </h3>
        <el-button type="info" text bg size="small" @click="toggleSort(false)">
          {{ getSortBtnText(redSortType) }}
          <el-icon class="el-icon--right">
            <component :is="getSortIcon(redSortType)" />
          </el-icon>
        </el-button>
      </div>
      <div class="summary-grid">
        <div v-for="item in redSortedList" :key="item.code" class="summary-item">
          <div class="ball ball-red">{{ item.code }}</div>
          <div class="count">
            {{ item.count }}
            <span class="unit">次</span>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-section">
      <h3>
        <el-icon><icon-ep-trend-charts /></el-icon>
        <span style="margin-left: 8px">后区红球频次折线图</span>
        (1-12)
      </h3>
      <div ref="redChartEl" class="chart" />
    </div>

    <div class="list-section">
      <h3 style="margin-bottom: 8px">
        <el-icon><icon-ep-list /></el-icon>
        <span style="margin-left: 8px">历史开奖数据</span>
        <span class="period-range" v-if="listFormat.length">
          ( 第 {{ listFormat[listFormat.length - 1].lotteryDrawNum }} 期 - 第 {{ listFormat[0].lotteryDrawNum }} 期 , 共
          {{ listFormat.length }} 期 )
        </span>
      </h3>
      <el-table
        :data="listFormat"
        stripe
        style="width: 100%"
        height="400"
        border
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="lotteryDrawNum" label="期号" width="120" align="center" sortable fixed />
        <el-table-column prop="lotteryDrawTime" label="开奖时间" width="150" align="center" sortable />
        <el-table-column label="开奖号码" min-width="300">
          <template #default="{ row }">
            <div class="ball-group">
              <span
                v-for="(ball, idx) in row.lotteryDrawResult"
                :key="idx"
                class="ball"
                :class="{ 'ball-blue': idx < 5, 'ball-red': idx >= 5 }">
                {{ ball }}
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { list } from './data'

/**
 * 筛选输入框：起始期号（用户输入）
 * @type {import('vue').Ref<string>}
 */
const startNumInput = ref('')
/**
 * 筛选输入框：结束期号（用户输入）
 * @type {import('vue').Ref<string>}
 */
const endNumInput = ref('')

/**
 * 当前生效的筛选：起始期号
 * @type {import('vue').Ref<string>}
 */
const startNum = ref('')
/**
 * 当前生效的筛选：结束期号
 * @type {import('vue').Ref<string>}
 */
const endNum = ref('')

// 当前选中的快捷筛选期数（0表示自定义）
const activeQuickCount = ref(100)

/**
 * 应用筛选条件
 * - 将输入框的值写入生效筛选条件
 */
const handleFilter = () => {
  // 如果是手动点击筛选，保持当前状态（如果是input change触发的清空，activeQuickCount已经是0了）
  startNum.value = startNumInput.value
  endNum.value = endNumInput.value
}

/**
 * 重置筛选条件 -> 恢复默认100期
 */
const handleReset = () => {
  handleQuickFilter(100)
}

/**
 * 快捷筛选：按结束期号往前推 N 期
 * @param {number} count 最近 N 期
 */
const handleQuickFilter = (count) => {
  activeQuickCount.value = count

  // 如果当前没有选结束期号，默认用最新一期
  const allNums = lotteryNumOptions.value
  if (!allNums.length) return

  if (!endNumInput.value) {
    endNumInput.value = allNums[allNums.length - 1]
  }

  // 找到结束期号在列表中的索引
  const endIndex = allNums.indexOf(endNumInput.value)
  if (endIndex === -1) return // 异常情况

  // 计算起始期号索引 (例如最近20期，就是从 endIndex 往前推 19 个)
  // Math.max(0, ...) 确保不越界
  const startIndex = Math.max(0, endIndex - count + 1)

  startNumInput.value = allNums[startIndex]

  // 触发筛选
  handleFilter()
}

/**
 * 所有可选的期号列表（去重并排序）
 * @type {import('vue').ComputedRef<string[]>}
 */
const lotteryNumOptions = computed(() => {
  const nums = list.map((item) => item.lotteryDrawNum)
  // 字符串排序，从小到大
  return Array.from(new Set(nums)).sort()
})

/**
 * 将原始数据格式化为页面可用结构
 * @type {Array<{lotteryDrawNum: string, lotteryDrawResult: string[], lotteryDrawTime: string}>}
 */
const parsedList = list.map((item) => {
  return {
    lotteryDrawNum: item.lotteryDrawNum,
    lotteryDrawResult: item.lotteryDrawResult.split(' '),
    lotteryDrawTime: item.lotteryDrawTime,
  }
})

/**
 * 筛选后的开奖列表（支持期号区间）
 * - 注意：期号是字符串时比较可能受字典序影响；当前数据若是等长数字字符串则安全
 */
const listFormat = computed(() => {
  return parsedList.filter((item) => {
    let match = true
    if (startNum.value && item.lotteryDrawNum < startNum.value) {
      match = false
    }
    if (endNum.value && item.lotteryDrawNum > endNum.value) {
      match = false
    }
    return match
  })
})

/**
 * 前区 1~35 频次统计（key 为 "01".."35"）
 * @returns {Record<string, number>}
 */
const blueBallMap = computed(() => {
  /** @type {Record<string, number>} */
  const map = {}
  for (let i = 1; i <= 35; i++) {
    const key = String(i).padStart(2, '0')
    map[key] = 0
  }

  listFormat.value.forEach((item) => {
    for (let i = 0; i < 5; i++) {
      const ball = item.lotteryDrawResult[i]
      if (map[ball] !== undefined) map[ball]++
    }
  })
  return map
})

/**
 * 后区 1~12 频次统计（key 为 "01".."12"）
 * @returns {Record<string, number>}
 */
const redBallMap = computed(() => {
  /** @type {Record<string, number>} */
  const map = {}
  for (let i = 1; i <= 12; i++) {
    const key = String(i).padStart(2, '0')
    map[key] = 0
  }

  listFormat.value.forEach((item) => {
    for (let i = 5; i < 7; i++) {
      const ball = item.lotteryDrawResult[i]
      if (map[ball] !== undefined) map[ball]++
    }
  })
  return map
})

// === 排序逻辑新增 ===
const blueSortType = ref('asc') // 'default' | 'asc' | 'desc'
const redSortType = ref('asc')

const toggleSort = (isBlue) => {
  const target = isBlue ? blueSortType : redSortType
  if (target.value === 'default') target.value = 'desc'
  else if (target.value === 'desc') target.value = 'asc'
  else target.value = 'default'
}

/**
 * 排序转换函数
 * @param {Record<string, number>} map 频次 Map
 * @param {number} total 总球数 (35 或 12)
 * @param {string} sortType 排序类型
 */
const getSortedList = (map, total, sortType) => {
  const list = []
  for (let i = 1; i <= total; i++) {
    const code = String(i).padStart(2, '0')
    list.push({ code, count: map[code] || 0 })
  }

  if (sortType === 'default') {
    return list // 默认按球号升序
  }

  return list.sort((a, b) => {
    if (sortType === 'desc') {
      // 次数降序，次数相同按球号升序
      return b.count - a.count || Number(a.code) - Number(b.code)
    } else {
      // 次数升序，次数相同按球号升序
      return a.count - b.count || Number(a.code) - Number(b.code)
    }
  })
}

const blueSortedList = computed(() => getSortedList(blueBallMap.value, 35, blueSortType.value))
const redSortedList = computed(() => getSortedList(redBallMap.value, 12, redSortType.value))

const getSortBtnText = (type) => {
  if (type === 'default') return '默认排序'
  if (type === 'desc') return '次数降序'
  return '次数升序'
}

const getSortIcon = (type) => {
  if (type === 'default') return 'icon-ep-d-caret'
  if (type === 'desc') return 'icon-ep-caret-bottom'
  return 'icon-ep-caret-top'
}
// =================

/**
 * ECharts 容器：蓝球图
 * @type {import('vue').Ref<HTMLDivElement | null>}
 */
const blueChartEl = ref(null)
/**
 * ECharts 容器：红球图
 * @type {import('vue').Ref<HTMLDivElement | null>}
 */
const redChartEl = ref(null)

/** @type {import('echarts').ECharts | null} */
let blueChart = null
/** @type {import('echarts').ECharts | null} */
let redChart = null

/**
 * X 轴：蓝球编号（"01".."35"）
 */
const blueKeys = computed(() => Array.from({ length: 35 }, (_, i) => String(i + 1).padStart(2, '0')))
/**
 * X 轴：红球编号（"01".."12"）
 */
const redKeys = computed(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')))

/**
 * Y 轴：蓝球频次序列，与 blueKeys 一一对应
 */
const blueSeriesData = computed(() => blueKeys.value.map((k) => Number(blueBallMap.value[k] ?? 0)))
/**
 * Y 轴：红球频次序列，与 redKeys 一一对应
 */
const redSeriesData = computed(() => redKeys.value.map((k) => Number(redBallMap.value[k] ?? 0)))

/**
 * 生成折线图通用配置
 * @param {{ xData: string[]; yData: number[]; color: string }} params
 * @returns {import('echarts').EChartsOption}
 */
const makeLineOption = ({ xData, yData, color }) => {
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: (params) => {
        const item = params[0]
        return `
          <div style="font-weight: bold; margin-bottom: 4px;">号码：${item.name}</div>
          <div style="display: flex; align-items: center;">
            <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>
            出现的频次：<span style="font-weight:bold; margin-left: 4px;">${item.value}</span> 次
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '3%', // 调整底部间距
      top: '70',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: {
        lineStyle: {
          color: '#ccc',
        },
      },
      axisLabel: {
        interval: 0,
        color: '#606266',
        formatter: (val) => String(val),
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
      name: '出现次数',
      minInterval: 1,
      nameTextStyle: {
        color: '#909399',
        padding: [0, 0, 0, 20],
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: '#606266',
      },
    },
    series: [
      {
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        label: {
          show: true,
          position: 'top',
          color: '#303133',
          fontWeight: 500,
          fontSize: 12,
          formatter: (params) => String(params?.value ?? ''),
        },
        lineStyle: {
          width: 3,
          color,
          shadowColor: 'rgba(0, 0, 0, 0.15)',
          shadowBlur: 10,
          shadowOffsetY: 5,
        },
        itemStyle: {
          color,
          borderWidth: 2,
          borderColor: '#fff',
        },
        areaStyle: {
          opacity: 0.2,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color },
            { offset: 1, color: 'rgba(255, 255, 255, 0)' },
          ]),
        },
        // 添加平均值标记线和最大值标记点
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' },
          ],
          label: {
            color: '#fff',
            fontWeight: 'bold',
          },
          itemStyle: {
            color: color,
          },
        },
        markLine: {
          data: [{ type: 'average', name: '平均值' }],
          lineStyle: {
            color: '#909399',
            type: 'dashed',
            width: 1,
          },
          label: {
            position: 'end',
            formatter: '平均: {c}',
            color: '#909399',
          },
        },
      },
    ],
  }
}

/**
 * 初始化 ECharts 实例（仅在实例不存在时创建）
 * - 避免 HMR 或多次更新导致重复 init
 */
const initCharts = () => {
  if (blueChartEl.value && !blueChart) blueChart = echarts.init(blueChartEl.value)
  if (redChartEl.value && !redChart) redChart = echarts.init(redChartEl.value)
}

/**
 * 使用当前统计数据刷新图表
 */
const updateCharts = () => {
  if (blueChart) {
    blueChart.setOption(
      makeLineOption({
        xData: blueKeys.value,
        yData: blueSeriesData.value,
        color: '#409eff',
      }),
      true
    )
  }

  if (redChart) {
    redChart.setOption(
      makeLineOption({
        xData: redKeys.value,
        yData: redSeriesData.value,
        color: '#f56c6c',
      }),
      true
    )
  }
}

/**
 * 窗口尺寸变化时自适应
 */
const resizeCharts = () => {
  blueChart?.resize()
  redChart?.resize()
}

onMounted(async () => {
  await nextTick()
  // 初始化：默认筛选最近100期
  handleQuickFilter(100)

  initCharts()
  updateCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  blueChart?.dispose()
  redChart?.dispose()
  blueChart = null
  redChart = null
})

watch(listFormat, async () => {
  // 过滤条件变化会触发重算 map；等待 DOM 稳定后更新图表
  await nextTick()
  initCharts()
  updateCharts()
})
</script>

<style scoped lang="scss">
.sport-lottery-container {
  padding: 0 12px 12px;
}

h2 {
  margin-top: 0;
  margin-bottom: 0px; // 移除底部margin
  color: #333;
  // 使标题粘性
  position: sticky;
  top: 0px;
  z-index: 100;
  background-color: #f5f7fa; // 与 body 背景色一致
  padding: 12px 0 16px 0; // 增加内边距来模拟之前的 margin
  border-bottom: 1px solid transparent; // 预留边框位置
}

h3 {
  margin-top: 0;
  margin-bottom: 0px; // 修改：由 header 接管间距
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
  padding-bottom: 8px; // 增加一点底部间距
  border-bottom: 1px dashed #ebeef5; // 增加分割线
}

.period-range {
  font-size: 13px;
  color: #909399;
  margin-left: 10px;
  font-weight: normal;
}

.filter-section,
.summary-section,
.list-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.05); // 加深阴影
  border: 1px solid #ebeef5; // 增加细边框

  &:last-child {
    margin-bottom: 0px;
  }
}

// 针对筛选区进行特别处理
.filter-section {
  position: sticky;
  top: 55px; // 避开 h2 的高度 (大概估算，h2 height + padding)
  z-index: 99;
  border-radius: 0 0 8px 8px; // 只有底部圆角
  margin-top: -16px; // 向上抵消 h2 的底部 padding
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.08); // 吸顶时阴影重一点
}

.summary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fcfcfc;
  border: 1px solid #e4e7ed; // 颜色加深一点
  border-radius: 6px; // 圆角稍微小一点
  padding: 12px 8px;
  width: 64px; // 稍微宽一点
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer; // 增加手型

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.15);
    border-color: #c6e2ff;

    .count {
      color: #409eff;
      font-weight: 700;
    }
  }
}

.count {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;

  .unit {
    font-size: 12px;
    color: #909399;
    font-weight: normal;
  }
}

.ball-group {
  display: flex;
  gap: 6px;
  justify-content: center; // 居中显示号码
}

.ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; // 稍微大一点
  height: 32px;
  border-radius: 50%;
  color: #fff;
  font-weight: bold;
  font-size: 15px; // 字体加大
  font-family: Consolas, Monaco, monospace; // 使用等宽字体数字更好看
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); // 增加文字投影
}

.ball-red {
  background: linear-gradient(135deg, #f78989, #e74c3c); // 调整渐变色
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3); // 增加投影深度
}

.ball-blue {
  background: linear-gradient(135deg, #66b1ff, #409eff); // 调整渐变色
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3); // 增加投影深度
}

.chart {
  width: 100%;
  height: 380px; // 稍微增高
}
</style>
