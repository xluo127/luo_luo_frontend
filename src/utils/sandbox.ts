const script = (code: string) => `<script>${code.replace(/<\/script/gi, '<\\/script')}</script>`

const consoleBridge = `
const output = document.getElementById('lab-console');
function print(level, values) {
  const line = document.createElement('div');
  line.className = level;
  line.textContent = values.map(value => {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value) ?? String(value); } catch { return String(value); }
  }).join(' ');
  output.append(line);
}
for (const level of ['log', 'info', 'warn', 'error']) {
  console[level] = (...values) => print(level, values);
}
window.addEventListener('error', event => print('error', [event.message]));
window.addEventListener('unhandledrejection', event => print('error', [String(event.reason)]));
`

export async function buildPreview(language: string, code: string): Promise<string> {
  const policy = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'"
  const style = 'body{font:14px/1.7 system-ui;padding:16px;color:#25473f}button{cursor:pointer;padding:9px 15px;border:0;border-radius:8px;background:#245b4a;color:#fff}#lab-console{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 monospace;margin-top:20px;border-top:1px solid #e3ece5;padding-top:8px}.error{color:#b64040}.warn{color:#9d6d22}'
  let runtime = ''
  let content = code
  if (language === 'vue') {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    content = `<pre style="white-space:pre-wrap;padding:14px;border-radius:10px;background:#eef6ef">${escaped}</pre>`
  } else if (language === 'javascript') {
    content = script(`(async () => {\n${code}\n})().catch(error => console.error(String(error)))`)
  } else if (language === 'css') {
    content = `<style>${code}</style><div class="demo"><div class="card">CSS 预览卡片</div><button class="button">示例按钮</button><div class="box">.box</div></div>`
  } else if (language !== 'html') {
    throw new Error('这个语言暂时只支持查看代码。')
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>${style}</style></head><body><div id="lab-console" aria-label="控制台输出"></div>${script(consoleBridge)}${runtime}${content}</body></html>`
}
