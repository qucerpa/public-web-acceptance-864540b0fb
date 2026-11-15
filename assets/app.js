(() => {
  'use strict';

  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const setText = (selector, value) => all(selector).forEach((element) => { element.textContent = value; });
  let clickCount = 0;

  setText('[data-js-status]', '运行正常');
  document.body.dataset.javascript = 'ready';

  all('[data-demo-button]').forEach((button) => {
    button.addEventListener('click', () => {
      clickCount += 1;
      setText('[data-click-count]', `${clickCount} 次`);
      setText('[data-demo-output]', `第 ${clickCount} 次交互自检完成：按钮事件与 DOM 更新正常。`);
      document.body.dataset.lastInteraction = String(clickCount);
    });
  });

  all('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const night = document.documentElement.dataset.theme !== 'night';
      document.documentElement.dataset.theme = night ? 'night' : 'day';
      all('[data-theme-toggle]').forEach((toggle) => {
        toggle.setAttribute('aria-pressed', String(night));
        toggle.textContent = night ? '切换日间' : '切换夜色';
      });
    });
  });

  async function verifyStaticJson() {
    try {
      const response = await fetch('assets/health.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const health = await response.json();
      if (health.status !== 'ok' || health.contract !== 'plaintext-static-v1') {
        throw new Error('Unexpected health payload');
      }
      setText('[data-api-status]', '读取成功');
      document.body.dataset.staticJson = 'ready';
    } catch (error) {
      setText('[data-api-status]', `读取失败：${error.message}`);
      document.body.dataset.staticJson = 'failed';
    }
  }

  verifyStaticJson();
})();
