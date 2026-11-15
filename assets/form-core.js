(function attachConsultationCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ConsultationCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function createConsultationCore() {
  'use strict';

  const FIELD_NAMES = Object.freeze(['name', 'company', 'contact', 'position', 'city', 'feishuStatus', 'description']);
  const FIELD_LABELS = Object.freeze({
    name: '姓名',
    company: '公司名称',
    contact: '联系方式',
    position: '职位',
    city: '所在城市',
    feishuStatus: '是否已采购飞书',
    description: '需求描述',
  });
  const ALLOWED_FEISHU_STATUSES = Object.freeze(['已采购飞书', '正在评估或采购中', '尚未采购飞书', '不清楚']);
  const LIMITS = Object.freeze({ name: 40, company: 100, contact: 80, position: 60, city: 60, description: 1000 });

  function normalizeValues(input) {
    const values = {};
    for (const field of FIELD_NAMES) {
      const raw = input && typeof input[field] === 'string' ? input[field] : '';
      values[field] = raw.replace(/\r\n?/g, '\n').trim();
    }
    return values;
  }

  function validateValues(input) {
    const values = normalizeValues(input);
    const errors = {};
    for (const field of FIELD_NAMES) {
      if (field !== 'description' && !values[field]) errors[field] = `请填写${FIELD_LABELS[field]}`;
      if (values[field].length > LIMITS[field]) errors[field] = `${FIELD_LABELS[field]}不能超过 ${LIMITS[field]} 个字符`;
    }
    if (values.feishuStatus && !ALLOWED_FEISHU_STATUSES.includes(values.feishuStatus)) {
      errors.feishuStatus = '请选择有效的飞书采购状态';
    }
    if (values.contact && values.contact.length < 5) errors.contact = '请填写至少 5 个字符的有效联系方式';
    return { values, errors, valid: Object.keys(errors).length === 0 };
  }

  function buildMessage(input, keyword, submittedAt) {
    const { values, valid } = validateValues(input);
    if (!valid) throw new Error('表单尚未通过校验');
    const safeKeyword = typeof keyword === 'string' && keyword.trim() ? keyword.trim() : '网站咨询';
    const timestamp = submittedAt instanceof Date ? submittedAt : new Date(submittedAt || Date.now());
    if (Number.isNaN(timestamp.getTime())) throw new Error('提交时间无效');
    const lines = [
      `${safeKeyword}｜预约方案咨询`,
      '',
      `姓名：${values.name}`,
      `公司名称：${values.company}`,
      `联系方式：${values.contact}`,
      `职位：${values.position}`,
      `所在城市：${values.city}`,
      `是否已采购飞书：${values.feishuStatus}`,
      `需求描述：${values.description || '未填写'}`,
      `提交时间：${timestamp.toLocaleString('zh-CN', { hour12: false })}`,
      '来源：GitHub Pages 咨询表单',
    ];
    return lines.join('\n');
  }

  function buildFeishuPayload(input, config, submittedAt) {
    const keyword = config && config.keyword;
    return {
      msg_type: 'text',
      content: { text: buildMessage(input, keyword, submittedAt) },
    };
  }

  return Object.freeze({
    FIELD_NAMES,
    FIELD_LABELS,
    LIMITS,
    normalizeValues,
    validateValues,
    buildMessage,
    buildFeishuPayload,
  });
});
