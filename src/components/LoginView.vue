<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="brand-mark auth-brand">L</div>
      <span class="section-kicker">LUO / LAB ACCESS</span>
      <h1>{{ mode === 'login' ? '欢迎回来' : '创建你的账号' }}<em>.</em></h1>
      <p class="auth-description">{{ mode === 'login' ? '登录后继续整理你的学习记录。' : '注册后由管理员为你配置可见菜单。' }}</p>
      <form @submit.prevent="submit">
        <label class="form-label">用户名<input v-model.trim="form.username" required minlength="3" maxlength="50" pattern="[a-zA-Z0-9][a-zA-Z0-9_.-]{2,49}" autocomplete="username" placeholder="3–50 位字母、数字、下划线、点或短横线" /></label>
        <label v-if="mode === 'register'" class="form-label">显示名称<input v-model.trim="form.displayName" maxlength="80" autocomplete="name" placeholder="你的称呼" /></label>
        <label class="form-label">密码<input v-model="form.password" required minlength="10" maxlength="128" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" placeholder="至少 10 位字符" /></label>
        <label v-if="mode === 'register'" class="form-label">确认密码<input v-model="confirmation" required minlength="10" maxlength="128" type="password" autocomplete="new-password" placeholder="再次输入密码" /></label>
        <button class="primary-button auth-submit" :disabled="loading" type="submit">{{ loading ? '处理中...' : mode === 'login' ? '登录工作台 →' : '注册并登录 →' }}</button>
      </form>
      <p v-if="error" class="auth-error">{{ error }}</p>
      <button class="auth-switch" type="button" @click="toggleMode">{{ mode === 'login' ? '还没有账号？注册一个' : '已有账号？返回登录' }}</button>
      <small class="auth-hint">新账号默认无菜单权限，请联系管理员授权。</small>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/learning'
import type { AuthUser } from '../types/auth'

const emit = defineEmits<{ authenticated: [AuthUser] }>()
const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const error = ref('')
const confirmation = ref('')
const form = reactive({ username: '', password: '', displayName: '' })

function toggleMode() { mode.value = mode.value === 'login' ? 'register' : 'login'; error.value = ''; form.password = ''; confirmation.value = '' }
async function submit() {
  if (mode.value === 'register' && form.password !== confirmation.value) { error.value = '两次输入的密码不一致'; return }
  loading.value = true
  error.value = ''
  try {
    const user = mode.value === 'login' ? await authApi.login({ username: form.username, password: form.password }) : await authApi.register(form)
    emit('authenticated', user)
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    loading.value = false
  }
}
</script>
