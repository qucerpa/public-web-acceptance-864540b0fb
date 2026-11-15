/*
 * 公开静态配置：当前仅启用页面展示与本地校验。
 * 不向钉钉或其他服务发送数据，也不在本文件中存放 Webhook Token。
 */
window.CONSULTATION_CONFIG = Object.freeze({
  submissionEnabled: false,
  keyword: '网站咨询',
  requestTimeoutMs: 15000,
  resubmitIntervalMs: 60000,
});
