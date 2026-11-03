<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Example } from '../types/learning'
import { buildPreview } from '../utils/sandbox'

const props = defineProps<{ example: Example }>()
const draft = ref(props.example.code)
const preview = ref('')
const previewKey = ref(0)
const running = ref(false)
const message = ref('')
watch(() => props.example.code, (code) => { draft.value = code; preview.value = '' })

async function run() {
  running.value = true
  message.value = ''
  try {
    preview.value = await buildPreview(props.example.language, draft.value)
    previewKey.value += 1
  } catch (error) {
    message.value = error instanceof Error ? error.message : '运行失败'
  } finally {
    running.value = false
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(draft.value)
    message.value = '代码已复制'
  } catch {
    message.value = '复制失败，请手动选择代码复制。'
  }
}
</script>

<template>
  <section class="example-card">
    <div class="example-header">
      <div><strong>{{ example.title }}</strong><p>{{ example.description }}</p></div>
      <div class="example-actions"><span class="language-badge">{{ example.language }}</span><button type="button" @click="copy">复制</button><button type="button" @click="draft = example.code; preview = ''">还原</button><button v-if="example.runnable" type="button" :disabled="running" @click="run">{{ running ? '准备中' : '运行 ▶' }}</button></div>
    </div>
    <textarea v-model="draft" class="code-draft" :aria-label="example.title + '代码编辑区'" spellcheck="false"></textarea>
    <p class="runner-hint">临时修改不自动保存；使用“编辑知识点”持久化。运行区禁用网络与主页面访问，请勿运行死循环。</p>
    <p v-if="message" role="status" class="runner-hint">{{ message }}</p>
    <iframe v-if="preview" :key="previewKey" :title="example.title + '运行结果'" class="example-output" sandbox="allow-scripts" referrerpolicy="no-referrer" :srcdoc="preview"></iframe>
  </section>
</template>

<style scoped>
.code-draft { display: block; width: 100%; min-height: 220px; resize: vertical; border: 0; padding: 18px; background: #193a37; color: #d6ecdf; font: 13px/1.8 Consolas, monospace; tab-size: 2; }
.runner-hint { margin: 0; padding: 9px 14px; font-size: 12px; color: #71877b; background: #f5f9f5; }
.example-output { height: 280px; resize: vertical; }
</style>
