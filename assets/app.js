(function initializeConsultationForm() {
  'use strict';

  const form = document.getElementById('consultation-form');
  if (!form) return;
  const config = window.CONSULTATION_CONFIG;
  const core = window.ConsultationCore;
  const submitButton = document.getElementById('submit-button');
  const status = document.getElementById('form-status');
  const description = document.getElementById('description');
  const descriptionCount = document.getElementById('description-count');
  const fields = ['name', 'company', 'contact', 'position', 'city', 'feishuStatus', 'description'];
  let submitting = false;

  function setStatus(kind, message) {
    status.className = `form-status${kind ? ` status-${kind}` : ''}`;
    status.textContent = message || '';
  }

  function setFieldError(field, message) {
    const input = form.elements[field];
    const error = document.getElementById(`${field}-error`);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message || '';
  }

  function clearErrors() {
    for (const field of fields) setFieldError(field, '');
  }

  function readValues() {
    return Object.fromEntries(fields.map((field) => [field, String(form.elements[field]?.value || '')]));
  }

  function setSubmitting(value) {
    submitting = value;
    submitButton.disabled = value;
    submitButton.classList.toggle('is-loading', value);
    submitButton.setAttribute('aria-busy', String(value));
    for (const field of fields) {
      const input = form.elements[field];
      if (input) input.readOnly = value && input.tagName !== 'SELECT';
      if (input && input.tagName === 'SELECT') input.disabled = value;
    }
  }

  function readLastSuccess() {
    try {
      return Number.parseInt(window.localStorage.getItem('consultation:last-success') || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  function rememberSuccess() {
    try { window.localStorage.setItem('consultation:last-success', String(Date.now())); } catch { /* Storage is optional. */ }
  }

  function updateDescriptionCount() {
    descriptionCount.textContent = `${description.value.length} / 1000`;
  }

  function validateAndFocus() {
    clearErrors();
    const result = core.validateValues(readValues());
    for (const [field, message] of Object.entries(result.errors)) setFieldError(field, message);
    if (!result.valid) {
      setStatus('error', '还有必填项未完成，请检查标红的内容。');
      const firstField = fields.find((field) => result.errors[field]);
      form.elements[firstField]?.focus();
      return null;
    }
    return result.values;
  }

  async function sendToDingTalk(values) {
    if (!config?.webhookUrl || !config?.keyword) throw new Error('MISSING_CONFIG');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs || 15000);
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(core.buildDingTalkPayload(values, config, new Date())),
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      const responseText = await response.text();
      let result = null;
      try { result = responseText ? JSON.parse(responseText) : null; } catch { /* handled below */ }
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      if (!result || typeof result.errcode !== 'number') throw new Error('INVALID_DINGTALK_RESPONSE');
      if (result.errcode !== 0) throw new Error(`DINGTALK_${result.errcode}`);
      return result;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function friendlyError(error) {
    if (error?.name === 'AbortError') return '提交超时，请检查网络后重试。你填写的内容已保留。';
    if (error instanceof TypeError) return '浏览器未能连接钉钉，可能是网络或跨域限制。你填写的内容已保留，请稍后重试。';
    if (error?.message === 'MISSING_CONFIG') return '提交配置缺失，请联系网站维护人员处理。';
    if (error?.message === 'INVALID_DINGTALK_RESPONSE') return '钉钉返回了无法识别的结果，暂未确认提交成功。你填写的内容已保留。';
    if (/^HTTP_\d+$/.test(error?.message || '')) return `钉钉服务暂时不可用（${error.message.slice(5)}），请稍后重试。`;
    if (/^DINGTALK_\d+$/.test(error?.message || '')) return `钉钉未接收这条消息（错误码 ${error.message.slice(9)}），请联系网站维护人员检查机器人配置。`;
    return '提交未完成，请稍后重试。你填写的内容已保留。';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    setStatus('', '');

    // 对自动填充隐藏项的机器人返回通用结果，但不发送网络请求。
    if (String(form.elements.website?.value || '').trim()) {
      form.reset();
      updateDescriptionCount();
      setStatus('info', '当前仅提供表单校验，内容未发送，也未保存。');
      return;
    }

    const values = validateAndFocus();
    if (!values) return;

    if (config?.submissionEnabled !== true) {
      setStatus('info', '信息校验通过。在线提交通道尚未启用，本次内容未发送，也未保存。');
      status.focus({ preventScroll: true });
      return;
    }

    const lastSuccess = readLastSuccess();
    const elapsed = Date.now() - lastSuccess;
    const interval = config?.resubmitIntervalMs || 60000;
    if (elapsed < interval) {
      setStatus('info', `刚刚已提交过，请在 ${Math.ceil((interval - elapsed) / 1000)} 秒后再试。`);
      return;
    }

    setSubmitting(true);
    setStatus('info', '正在提交，请稍候……');
    try {
      await sendToDingTalk(values);
      rememberSuccess();
      form.reset();
      clearErrors();
      updateDescriptionCount();
      setStatus('success', '提交成功，顾问会尽快与你联系。');
      status.focus({ preventScroll: true });
    } catch (error) {
      setStatus('error', friendlyError(error));
      status.focus({ preventScroll: true });
    } finally {
      setSubmitting(false);
    }
  });

  for (const field of fields) {
    const input = form.elements[field];
    input?.addEventListener('input', () => {
      setFieldError(field, '');
      if (status.classList.contains('status-error')) setStatus('', '');
    });
    input?.addEventListener('change', () => setFieldError(field, ''));
  }
  description.addEventListener('input', updateDescriptionCount);
  updateDescriptionCount();
})();
