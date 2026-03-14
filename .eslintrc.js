module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  parser: 'vue-eslint-parser',
  plugins: ['vue', 'prettier'],

  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended', // 必须放在最后
  ],
  presets: ['@vue/cli-plugin-babel/preset'],

  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  rules: {
    // 自定义规则
    'vue/multi-word-component-names': 'off', // 允许单文件组件名
    // 关闭与 Prettier 冲突的规则
    'vue/html-indent': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',

    // 与 Prettier 对齐的规则
    'quotes': ['error', 'single'], // 单引号
    'semi': ['error', 'never'], // 无分号
    'indent': ['error', 2], // 2空格缩进
    'comma-dangle': ['error', 'always-multiline'], // 尾随逗号

    'no-console': 'off',
    'no-debugger': 'off',

    // 自定义规则
    'vue/component-tags-order': [
      'error',
      {
        order: ['script', 'template', 'style'],
      },
    ],
    'vue/attribute-hyphenation': ['error', 'always'],
    'vue/v-on-event-hyphenation': ['error', 'always'],
  },
}
