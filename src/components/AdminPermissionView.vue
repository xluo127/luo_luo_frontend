<template>
  <main class="permission-main">
    <header class="permission-header">
      <div><span class="section-kicker">ADMIN CONSOLE</span><h1>权限中心<em>.</em></h1><p>管理用户、菜单结构和每个用户的可见范围。</p></div>
      <div class="permission-actions"><span class="admin-badge">管理员 · {{ user.displayName }}</span><button class="outline-button" @click="emit('close')">返回学习工作台</button><button class="outline-button danger-button" @click="emit('logout')">退出登录</button></div>
    </header>
    <div class="permission-tabs"><button :class="{ active: tab === 'users' }" @click="tab = 'users'">用户与授权</button><button :class="{ active: tab === 'menus' }" @click="tab = 'menus'">菜单配置</button></div>
    <section v-if="tab === 'users'" class="permission-grid">
      <article class="permission-card">
        <div class="permission-card-heading"><div><span class="section-kicker">USERS</span><h2>用户列表</h2></div><button class="outline-button" :disabled="saving" @click="loadUsers">刷新</button></div>
        <p class="permission-explanation">新用户可在登录页自行注册。管理员在这里分配菜单或删除账号。</p>
        <div class="user-list">
          <div v-for="item in users" :key="item.id" class="user-list-item" :class="{ selected: selectedUser?.id === item.id }">
            <button class="user-select" :disabled="saving" @click="selectUser(item)"><span class="avatar">{{ item.displayName.slice(0, 1).toUpperCase() }}</span><span><strong>{{ item.displayName }}</strong><small>@{{ item.username }} · {{ item.isAdmin ? '管理员' : '普通用户' }}</small></span></button>
            <button v-if="item.id !== user.id" class="delete-user" :disabled="saving" :aria-label="`删除用户 ${item.displayName}`" @click="removeUser(item)">×</button>
          </div>
        </div>
      </article>
      <article class="permission-card">
        <div class="permission-card-heading"><div><span class="section-kicker">MENU ACCESS</span><h2>{{ selectedUser ? `授权给 ${selectedUser.displayName}` : '选择一个用户' }}</h2></div><button v-if="selectedUser && !selectedUser.isAdmin" class="primary-button" :disabled="saving || grantsLoading || !grantsReady" @click="saveUserMenus">{{ saving ? '保存中...' : '保存授权' }} ↗</button></div>
        <p class="permission-explanation">{{ selectedUser?.isAdmin ? '管理员自动拥有全部菜单和管理权限，无需单独授权。' : '每项单独授权，不自动勾选父子菜单。父目录会自动保留但不可点击；授权“学习记录”开放全部分类，授权“前端学习”开放其全部后代内容。隐藏菜单及其子菜单暂不可访问。' }}</p>
        <p v-if="grantsLoading" class="permission-explanation">正在读取授权...</p>
        <div v-if="selectedUser" class="menu-check-list">
          <label v-for="menu in flatMenus" :key="menu.id" class="menu-check-item" :style="{ paddingLeft: `${14 + menuDepth(menu) * 18}px` }"><input v-model="selectedMenuIds" type="checkbox" :disabled="saving || grantsLoading || !grantsReady || selectedUser.isAdmin" :value="menu.id" /><span><strong>{{ menu.title }}{{ menu.visible ? '' : '（已隐藏）' }}</strong><small>{{ menu.permissionKey || '无权限标识' }}</small></span></label>
        </div>
        <div v-else class="empty-state"><span class="empty-icon">⌁</span><strong>请先选择用户</strong><p>普通用户只有被授权后才能看到对应菜单。</p></div>
      </article>
    </section>
    <section v-else class="permission-grid menu-config-grid">
      <article class="permission-card"><div class="permission-card-heading"><div><span class="section-kicker">MENU TREE</span><h2>现有菜单</h2></div><button class="outline-button" @click="startCreate">＋ 新建菜单</button></div><div class="menu-admin-list"><button v-for="menu in flatMenus" :key="menu.id" class="menu-admin-item" :class="{ selected: editingMenu?.id === menu.id }" @click="startEdit(menu)"><span :style="{ paddingLeft: `${menuDepth(menu) * 18}px` }">{{ menu.title }}</span><small>{{ menu.permissionKey }}</small></button></div></article>
      <article class="permission-card"><div class="permission-card-heading"><div><span class="section-kicker">MENU EDITOR</span><h2>{{ editingMenu ? '编辑菜单' : '新建菜单' }}</h2></div><button v-if="editingMenu" class="text-danger" @click="removeMenu">删除</button></div><form class="menu-form" @submit.prevent="saveMenu"><label class="form-label">菜单名称<input v-model.trim="menuForm.title" required maxlength="100" /></label><label class="form-label">权限标识<input v-model.trim="menuForm.permissionKey" required maxlength="100" pattern="[a-z][a-z0-9._-]{1,99}" placeholder="例如 learning.vue" /></label><label class="form-label">菜单地址<input v-model.trim="menuForm.url" maxlength="500" placeholder="/learning?category=vue 或 https://..." /></label><label class="form-label">父菜单<select v-model.number="menuForm.parentId"><option :value="null">顶级菜单</option><option v-for="menu in flatMenus.filter((item) => item.id !== editingMenu?.id)" :key="menu.id" :value="menu.id">{{ menu.title }}</option></select></label><label class="form-label">排序<input v-model.number="menuForm.sortOrder" type="number" min="0" /></label><label class="switch-label"><input v-model="menuForm.visible" type="checkbox" /> 在导航中显示</label><button class="primary-button" :disabled="saving" type="submit">{{ saving ? '保存中...' : '保存菜单' }} ↗</button></form></article>
    </section>
    <transition name="toast"><div v-if="message" class="toast-message">{{ message }}</div></transition>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { errorMessage } from '../api/learning'
import { permissionApi } from '../api/permission'
import type { AuthUser, MenuNode, UserSummary } from '../types/auth'

defineProps<{ user: AuthUser }>()
const emit = defineEmits<{ close: []; logout: [] }>()
const tab = ref<'users' | 'menus'>('users')
const users = ref<UserSummary[]>([])
const flatMenus = ref<MenuNode[]>([])
const selectedUser = ref<UserSummary | null>(null)
const selectedMenuIds = ref<number[]>([])
const editingMenu = ref<MenuNode | null>(null)
const saving = ref(false)
const grantsLoading = ref(false)
const grantsReady = ref(false)
let selectionRevision = 0
const message = ref('')
const menuForm = reactive({ title: '', permissionKey: '', url: '', parentId: null as number | null, sortOrder: 0, visible: true })

function notify(text: string) { message.value = text; window.setTimeout(() => { message.value = '' }, 2600) }
async function loadUsers() {
  try {
    users.value = await permissionApi.users()
    const target = users.value.find((user) => user.id === selectedUser.value?.id) || users.value[0]
    if (target) await selectUser(target)
    else { selectedUser.value = null; selectedMenuIds.value = [] }
  } catch (reason) { notify(errorMessage(reason)) }
}
async function loadMenus() {
  const result = await permissionApi.menus()
  const flatten = (menus: MenuNode[]): MenuNode[] => menus.flatMap((menu) => [menu, ...flatten(menu.children || [])])
  flatMenus.value = flatten(result.items)
}
async function selectUser(user: UserSummary) {
  const revision = ++selectionRevision
  selectedUser.value = user; selectedMenuIds.value = []; grantsLoading.value = true; grantsReady.value = false
  try {
    const result = await permissionApi.userMenus(user.id)
    if (revision !== selectionRevision) return
    selectedMenuIds.value = user.isAdmin ? flatMenus.value.map((menu) => menu.id) : result.menuIds
    grantsReady.value = true
  } catch (reason) { if (revision === selectionRevision) notify(errorMessage(reason)) }
  finally { if (revision === selectionRevision) grantsLoading.value = false }
}
async function saveUserMenus() {
  if (!selectedUser.value || !grantsReady.value || grantsLoading.value || saving.value) return
  saving.value = true
  try { selectedMenuIds.value = (await permissionApi.setUserMenus(selectedUser.value.id, selectedMenuIds.value)).menuIds; notify('菜单授权已保存') }
  catch (reason) { notify(errorMessage(reason)) }
  finally { saving.value = false }
}
async function removeUser(user: UserSummary) {
  if (saving.value || !window.confirm(`确定删除用户“${user.displayName}”吗？此操作不可恢复。`)) return
  saving.value = true
  try { await permissionApi.deleteUser(user.id); await loadUsers(); notify('用户已删除') }
  catch (reason) { notify(errorMessage(reason)) }
  finally { saving.value = false }
}
function resetMenuForm() { Object.assign(menuForm, { title: '', permissionKey: '', url: '', parentId: null, sortOrder: 0, visible: true }) }
function startCreate() { editingMenu.value = null; resetMenuForm(); tab.value = 'menus' }
function startEdit(menu: MenuNode) { editingMenu.value = menu; Object.assign(menuForm, { title: menu.title, permissionKey: menu.permissionKey || '', url: menu.url || '', parentId: menu.parentId, sortOrder: menu.sortOrder, visible: menu.visible }) }
async function saveMenu() { saving.value = true; try { const payload = { ...menuForm, url: menuForm.url || null }; if (editingMenu.value) await permissionApi.updateMenu(editingMenu.value.id, payload); else await permissionApi.createMenu(payload); await loadMenus(); startCreate(); notify('菜单已保存') } catch (reason) { notify(errorMessage(reason)) } finally { saving.value = false } }
async function removeMenu() { if (!editingMenu.value || !window.confirm('确定删除这个菜单吗？')) return; saving.value = true; try { await permissionApi.deleteMenu(editingMenu.value.id); await loadMenus(); startCreate(); notify('菜单已删除') } catch (reason) { notify(errorMessage(reason)) } finally { saving.value = false } }
function menuDepth(menu: MenuNode) { let depth = 0; let parentId = menu.parentId; const visited = new Set<number>(); while (parentId !== null && !visited.has(parentId)) { visited.add(parentId); depth += 1; parentId = flatMenus.value.find((item) => item.id === parentId)?.parentId ?? null } return depth }
onMounted(async () => { try { await loadMenus(); await loadUsers() } catch (reason) { notify(errorMessage(reason)) } })
</script>
