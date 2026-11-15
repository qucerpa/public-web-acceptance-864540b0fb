/* 公开静态配置：Webhook 地址会在公开仓库和浏览器中可见。 */
window.CONSULTATION_CONFIG = Object.freeze({
  provider: 'feishu',
  submissionEnabled: true,
  webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/f19a0607-3478-4fb0-9b1c-fc2f11ccf1e7',
  keyword: '网站咨询',
  requestTimeoutMs: 15000,
  resubmitIntervalMs: 60000,
});
