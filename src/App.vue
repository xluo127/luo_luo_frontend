<template>
  <div v-if="authLoading" class="auth-loading"><div class="loading-orbit"></div><p>正在连接工作台...</p></div>
  <section v-else-if="startupError" class="auth-loading"><h2>暂时无法连接服务</h2><p role="alert">{{ startupError }}</p><button class="primary-button" @click="bootstrap">重新连接</button></section>
  <LoginView v-else-if="!currentUser" @authenticated="handleAuthenticated" />
  <AdminPermissionView v-else-if="showPermissionCenter && currentUser.isAdmin" :user="currentUser" @close="closePermissionCenter" @logout="logout" />
  <div v-else class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <aside class="sidebar">
      <div class="brand-row">
        <div class="brand-mark">L</div>
        <div v-if="!sidebarCollapsed" class="brand-copy">
          <strong>LUO / LAB</strong>
          <span>个人成长操作台</span>
        </div>
        <button class="icon-button" title="收起侧栏" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>

      <div v-if="!sidebarCollapsed" class="workspace-switcher">
        <span class="workspace-dot"></span>
        <span>My Knowledge Base</span>
        <span class="workspace-chevron">⌄</span>
      </div>

      <div class="sidebar-scroll">
        <nav class="primary-nav">
          <button class="nav-item" @click="refreshPermissions">
            <span class="nav-icon">↻</span><span v-if="!sidebarCollapsed">刷新菜单权限</span>
          </button>
          <button v-if="currentUser.isAdmin" class="nav-item" @click="showPermissionCenter = true">
            <span class="nav-icon">⚿</span><span v-if="!sidebarCollapsed">权限中心</span>
          </button>
        </nav>

        <div v-if="!sidebarCollapsed" class="sidebar-label">我的授权菜单</div>
        <el-tree class="category-tree authorized-tree" node-key="id" :data="navItems" :props="{ children: 'children', label: 'title' }" default-expand-all :expand-on-click-node="false" @node-click="handleMenuClick">
          <template #default="{ data }">
            <div class="category-node" :class="{ selected: activeMenuId === data.id, 'directory-only': !data.clickable }" :title="data.clickable ? data.title : `${data.title}（目录）`">
              <span class="category-icon">{{ data.clickable ? '◈' : '⌁' }}</span>
              <span class="category-name">{{ data.title }}</span>
            </div>
          </template>
        </el-tree>

        <p v-if="!navItems.length && !sidebarCollapsed" class="sidebar-empty">暂无菜单，请联系管理员授权。</p>
      </div>

      <div v-if="!sidebarCollapsed" class="sidebar-footer">
        <div class="streak-card"><span class="streak-symbol">✹</span><div><strong>保持节奏</strong><small>今天也学一点点</small></div><b>{{ stats.averageProgress }}%</b></div>
        <div class="profile-row"><span class="avatar">{{ currentUser.displayName.slice(0, 1) }}</span><div><strong>{{ currentUser.displayName }}</strong><small>{{ currentUser.isAdmin ? '管理员' : '普通用户' }}</small></div><button class="logout-button" @click="logout">退出</button></div>
      </div>
    </aside>

    <main v-if="activeLearningMenu" :key="contentRevision" class="main-area">
      <header class="topbar">
        <div class="breadcrumb"><span>学习记录</span><b>/</b><strong>{{ selectedCategory?.name || '总览' }}</strong></div>
        <div class="topbar-actions">
          <label class="search-box"><span>⌕</span><input v-model="searchQuery" type="search" placeholder="搜索知识点、关键词..." /><kbd>⌘ K</kbd></label>
          <button class="notification" @click="showToast('目前没有新的提醒')">♢<i></i></button>
          <button class="outline-button" @click="logout">退出</button>
          <button class="primary-button" @click="openNewPointDialog">＋ 新建知识点</button>
        </div>
      </header>

      <div class="content-scroll">
        <section class="hero-section">
          <div><div class="eyebrow"><span></span> PERSONAL LEARNING OS</div><h1>{{ selectedCategory?.name || '我的学习记录' }}<em>.</em></h1><p>{{ selectedCategory?.description || '把零散的知识，整理成可以持续复习和实践的系统。' }}</p></div>
          <div class="hero-stats"><div><strong>{{ stats.total }}</strong><span>知识点</span></div><div><strong>{{ stats.inProgress }}</strong><span>学习中</span></div><div><strong>{{ stats.completed }}</strong><span>已掌握</span></div><div class="ring-stat"><div class="progress-ring" :style="progressRingStyle"><span>{{ stats.averageProgress }}%</span></div><span>整体进度</span></div></div>
        </section>

        <section class="workspace-grid">
          <div class="points-column">
            <div class="section-heading"><div><span class="section-kicker">CURRENT FOCUS</span><h2>知识点库</h2></div><div class="view-actions"><button class="view-button active">▦</button><button class="view-button">☷</button></div></div>
            <div class="filter-row"><button v-for="filter in filters" :key="filter.value" class="filter-chip" :class="{ active: activeFilter === filter.value }" @click="activeFilter = filter.value">{{ filter.label }}<span v-if="filter.value === 'all'">{{ filteredPoints.length }}</span></button><span class="result-label">{{ filteredPoints.length }} 个结果</span></div>
            <div v-if="loading" class="empty-state"><div class="loading-orbit"></div><p>正在加载学习空间...</p></div>
            <div v-else-if="!filteredPoints.length" class="empty-state"><div class="empty-icon">⌁</div><strong>还没有匹配的知识点</strong><p>换个关键词，或创建一个新的知识点。</p><button class="outline-button" @click="openNewPointDialog">新建知识点</button></div>
            <div v-else class="point-list">
              <button v-for="point in filteredPoints" :key="point.id" class="point-card" :class="{ selected: selectedPoint?.id === point.id }" @click="selectPoint(point.id)">
                <div class="point-card-top"><span class="point-category">{{ point.category.name }}</span><span class="point-status" :class="{ 'status-in_progress': point.status === 'in_progress', 'status-not_started': point.status === 'not_started', 'status-completed': point.status === 'completed' }">{{ statusLabel(point.status) }}</span></div>
                <h3>{{ point.title }}</h3><p>{{ point.summary }}</p>
                <div class="point-card-bottom"><div class="mini-progress"><span :style="progressStyle(point.progress)"></span></div><span>{{ point.progress }}%</span><div class="card-meta"><span v-if="point._count.questions">☷ {{ point._count.questions }}</span><span v-if="point._count.examples">&lt;/&gt; {{ point._count.examples }}</span></div></div>
              </button>
            </div>
          </div>

          <article class="detail-panel">
            <div v-if="selectedPoint" class="detail-content">
              <div class="detail-topline"><span class="detail-icon">{{ categoryIcon(selectedPoint.category.slug) }}</span><span>{{ selectedPoint.category.name }}</span><b>/</b><span>知识点详情</span><button class="detail-more" @click="openPointEditor">编辑 ↗</button></div>
              <h2>{{ selectedPoint.title }}</h2><p class="detail-summary">{{ selectedPoint.summary }}</p>
              <div class="detail-progress-row"><span>学习进度</span><strong>{{ selectedPoint.progress }}%</strong><div class="detail-progress"><span :style="progressStyle(selectedPoint.progress)"></span></div><button class="progress-add" @click="updateProgress(Math.min(100, selectedPoint.progress + 10))">+10</button></div>
              <div class="detail-tabs"><button v-for="tab in detailTabs" :key="tab.value" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}<span v-if="tab.value === 'quiz' && selectedPoint.questions.length">{{ selectedPoint.questions.length }}</span></button></div>

              <div v-if="activeTab === 'notes'" class="tab-content notes-content">
                <div class="content-block"><div class="block-heading"><div><span class="block-index">01</span><h3>核心要点</h3></div><span>KEY TAKEAWAYS</span></div><textarea v-model="noteForm.keyPoints" class="note-input key-points-input" placeholder="记录这个知识点最重要的概念、原则和易错点..."></textarea></div>
                <div class="content-block"><div class="block-heading"><div><span class="block-index">02</span><h3>我的笔记</h3></div><span>PERSONAL NOTES</span></div><textarea v-model="noteForm.body" class="note-input body-input" placeholder="把你的理解、联想和实践过程写在这里..."></textarea></div>
                <div class="note-actions"><span v-if="lastSavedLabel" class="saved-label">✓ {{ lastSavedLabel }}</span><button class="primary-button" :disabled="savingNote" @click="saveNote">{{ savingNote ? '保存中...' : '保存笔记' }} ↗</button></div>
              </div>

              <div v-else-if="activeTab === 'quiz'" class="tab-content quiz-content">
                <div v-if="!selectedPoint.questions.length" class="empty-inline"><span>∅</span><strong>还没有配置练习题</strong><p>在编辑器中为这个知识点添加题目。</p></div>
                <template v-else><div class="quiz-intro"><div class="quiz-mark">?</div><div><strong>验证一下你的掌握程度</strong><p>完成下面的练习，系统会记录最近一次答题结果。</p></div></div><div v-for="(question, index) in selectedPoint.questions" :key="question.id" class="question-card"><div class="question-number">{{ String(index + 1).padStart(2, '0') }}</div><h3>{{ question.prompt }}</h3><div class="options"><button v-for="option in question.options || []" :key="option" :class="{ chosen: quizAnswers[question.id] === option }" @click="quizAnswers[question.id] = option"><span class="option-radio"></span>{{ option }}</button></div><p v-if="quizResult?.results.find((result) => result.questionId === question.id)" class="answer-explanation">{{ quizResult.results.find((result) => result.questionId === question.id)?.correct ? "回答正确。" : `正确答案：${quizResult.results.find((result) => result.questionId === question.id)?.correctAnswer}` }} {{ quizResult.results.find((result) => result.questionId === question.id)?.explanation }}</p></div><div class="quiz-actions"><span v-if="quizResult" class="quiz-score">{{ quizResult.score }} 分 · {{ quizResult.correctCount }}/{{ quizResult.totalCount }} 正确</span><button class="primary-button" @click="submitQuiz">提交答案 →</button></div></template>
              </div>

              <div v-else class="tab-content examples-content"><div class="examples-heading"><div><span class="block-index">03</span><h3>代码实验室</h3></div><span>LEARN BY DOING</span></div><div v-if="!selectedPoint.examples.length" class="empty-inline"><span>&lt;/&gt;</span><strong>还没有代码示例</strong><p>在编辑器中添加一个可以运行或参考的代码片段。</p></div><CodeRunner v-for="example in selectedPoint.examples" v-else :key="example.id" :example="example" /></div>
            </div>
            <div v-else class="detail-empty"><div class="detail-empty-mark">✦</div><h2>选择一个知识点</h2><p>从左侧列表开始，整理你的理解、练习和代码实验。</p></div>
          </article>
        </section>
      </div>
    </main>
    <main v-else class="main-area no-access-main"><section class="detail-empty"><div class="detail-empty-mark">⌁</div><h2>{{ navItems.length ? '选择一个可用菜单' : '等待菜单授权' }}</h2><p>{{ navItems.length ? '从侧栏进入学习记录，或打开已授权的工具链接。' : '你的账号已创建，请联系管理员为你分配菜单。' }}</p><div class="empty-actions"><button class="outline-button" @click="refreshPermissions">刷新权限</button><button class="outline-button" @click="logout">退出登录</button></div></section></main>

    <KnowledgePointEditor v-if="showEditor && activeLearningMenu" :point="editorPoint" :categories="categoryOptions" :saving="savingEditor" @save="saveEditor" @cancel="closeEditor" />
    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { ElTree } from 'element-plus'
import 'element-plus/dist/index.css'
import CodeRunner from './components/CodeRunner.vue'
import KnowledgePointEditor from './components/KnowledgePointEditor.vue'
import LoginView from './components/LoginView.vue'
import AdminPermissionView from './components/AdminPermissionView.vue'
import { api, errorMessage, learningApi } from './api/learning'
import { authApi } from './api/auth'
import type { AuthUser, MenuNode } from './types/auth'
import type { Category, CategoryOption, Note, PointDetail, PointInput, PointSummary, QuizAttempt, Stats } from './types/learning'

const categories = ref<Category[]>([])
const points = ref<PointSummary[]>([])
const selectedPoint = ref<PointDetail | null>(null)
const selectedCategory = ref<Category | null>(null)
const selectedCategorySlug = ref('')
const stats = ref<Stats>({ total: 0, completed: 0, inProgress: 0, averageProgress: 0 })
const loading = ref(true)
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const activeFilter = ref('all')
const activeTab = ref<'notes' | 'quiz' | 'examples'>('notes')
const noteForm = reactive<Note>({ keyPoints: '', body: '' })
const savingNote = ref(false)
const lastSavedLabel = ref('')
const quizAnswers = reactive<Record<number, string>>({})
const quizResult = ref<QuizAttempt | null>(null)
const showEditor = ref(false)
const savingEditor = ref(false)
const editorPoint = ref<PointInput | null>(null)
const toastMessage = ref('')
const currentUser = ref<AuthUser | null>(null)
const authLoading = ref(true)
const startupError = ref('')
const navItems = ref<MenuNode[]>([])
const activeMenuId = ref<number | null>(null)
const activeLearningMenu = ref(false)
const showPermissionCenter = ref(false)
const contentRevision = ref(0)
let requestRevision = 0

const categoryOptions = computed<CategoryOption[]>(() => { const result: CategoryOption[] = []; const walk = (items: Category[], depth = 0) => items.forEach((item) => { if (item.canAccess !== false) result.push({ id: item.id, label: `${'　'.repeat(depth)}${item.name}`, category: item }); if (item.children) walk(item.children, depth + 1) }); walk(categories.value); return result })
const filters = [{ value: 'all', label: '全部' }, { value: 'not_started', label: '未开始' }, { value: 'in_progress', label: '学习中' }, { value: 'completed', label: '已掌握' }]
const detailTabs = [{ value: 'notes', label: '笔记' }, { value: 'quiz', label: '练习' }, { value: 'examples', label: '代码示例' }] as const
const filteredPoints = computed(() => points.value.filter((point) => { const query = searchQuery.value.trim().toLowerCase(); return (!query || `${point.title} ${point.summary} ${point.category.name}`.toLowerCase().includes(query)) && (activeFilter.value === 'all' || point.status === activeFilter.value) }))
const progressRingStyle = computed(() => ({ '--progress': `${stats.value.averageProgress}%` }))

function progressStyle(progress: number) { return { width: `${progress}%` } }
function categoryIcon(slug: string) { return slug.includes('javascript') ? 'JS' : slug.includes('css') ? '◇' : slug.includes('vue') ? 'V' : '⌘' }
function statusLabel(status: string) { return status === 'completed' ? '已掌握' : status === 'in_progress' ? '学习中' : '未开始' }
function showToast(message: string) { toastMessage.value = message; window.setTimeout(() => { toastMessage.value = '' }, 2600) }
function findCategory(items: Category[], slug: string): Category | undefined { for (const item of items) { if (item.slug === slug) return item; const found = item.children && findCategory(item.children, slug); if (found) return found } }
async function loadOverview(category = selectedCategorySlug.value) {
  const revision = ++requestRevision
  loading.value = true
  try {
    const data = await learningApi.overview(category)
    if (revision !== requestRevision || !currentUser.value) return
    categories.value = data.categories; points.value = data.points; stats.value = data.stats
    selectedCategory.value = findCategory(categories.value, category) || null
    const pointId = points.value.some((point) => point.id === selectedPoint.value?.id) ? selectedPoint.value?.id : points.value[0]?.id
    await selectPoint(pointId)
  } catch (error) { if (revision === requestRevision) showToast(errorMessage(error)) }
  finally { if (revision === requestRevision) loading.value = false }
}
async function selectPoint(id?: number) {
  const revision = requestRevision
  if (!id) { selectedPoint.value = null; return }
  try {
    const point = await learningApi.detail(id)
    if (revision !== requestRevision || !currentUser.value) return
    selectedPoint.value = point
    noteForm.keyPoints = point.note?.keyPoints || ''; noteForm.body = point.note?.body || ''
    Object.keys(quizAnswers).forEach((key) => delete quizAnswers[Number(key)])
    quizResult.value = null; activeTab.value = 'notes'
  } catch (error) { if (revision === requestRevision) showToast(errorMessage(error)) }
}
async function updateProgress(progress: number) { if (!selectedPoint.value) return; try { const data = await learningApi.progress(selectedPoint.value.id, progress); selectedPoint.value.progress = data.progress; const listPoint = points.value.find((point) => point.id === data.id); if (listPoint) { listPoint.progress = data.progress; listPoint.status = data.status }; stats.value = { ...stats.value, averageProgress: Math.round(points.value.reduce((sum, point) => sum + point.progress, 0) / Math.max(points.value.length, 1)) }; showToast('学习进度已更新') } catch (error) { showToast(errorMessage(error)) } }
async function saveNote() { if (!selectedPoint.value) return; savingNote.value = true; try { await learningApi.note(selectedPoint.value.id, noteForm); selectedPoint.value.note = { ...noteForm }; lastSavedLabel.value = '刚刚保存'; showToast('笔记已保存') } catch (error) { showToast(errorMessage(error)) } finally { savingNote.value = false } }
async function submitQuiz() { if (!selectedPoint.value || selectedPoint.value.questions.some((question) => !quizAnswers[question.id])) { showToast('请先完成所有题目'); return }; try { const data = await learningApi.quiz(selectedPoint.value.id, quizAnswers); quizResult.value = data; await updateProgress(Math.max(selectedPoint.value.progress, data.score)); showToast(`练习完成，得分 ${data.score}`) } catch (error) { showToast(errorMessage(error)) } }
function openNewPointDialog() { editorPoint.value = null; showEditor.value = true }
async function openPointEditor() { if (!selectedPoint.value) return; try { editorPoint.value = await learningApi.editor(selectedPoint.value.id); showEditor.value = true } catch (error) { showToast(errorMessage(error)) } }
function closeEditor() { showEditor.value = false; editorPoint.value = null }
async function saveEditor(payload: PointInput) { savingEditor.value = true; const editing = Boolean(editorPoint.value); try { const point = editing ? await learningApi.update(selectedPoint.value!.id, payload) : await learningApi.create(payload); closeEditor(); await loadOverview(selectedCategorySlug.value); await selectPoint(point.id); showToast(editing ? '知识点已更新' : '知识点已创建') } catch (error) { showToast(errorMessage(error)) } finally { savingEditor.value = false } }
function clearWorkspace() {
  requestRevision += 1
  categories.value = []; points.value = []; selectedPoint.value = null; selectedCategory.value = null
  stats.value = { total: 0, completed: 0, inProgress: 0, averageProgress: 0 }
  noteForm.keyPoints = ''; noteForm.body = ''; quizResult.value = null; lastSavedLabel.value = ''
  closeEditor(); activeLearningMenu.value = false; contentRevision.value += 1
}
function expireSession() { clearWorkspace(); currentUser.value = null; navItems.value = []; activeMenuId.value = null; showPermissionCenter.value = false; toastMessage.value = '' }
function flattenMenus(items: MenuNode[]): MenuNode[] { return items.flatMap((item) => [item, ...flattenMenus(item.children || [])]) }
async function handleMenuClick(menu: MenuNode) {
  if (!menu.clickable || !menu.url) return
  if (/^https?:\/\//i.test(menu.url)) { window.open(menu.url, '_blank', 'noopener,noreferrer'); return }
  const url = new URL(menu.url, window.location.origin)
  if (url.pathname !== '/learning') { showToast('该模块尚未接入页面，请配置已实现的菜单地址'); return }
  clearWorkspace(); activeMenuId.value = menu.id; selectedCategorySlug.value = url.searchParams.get('category') || ''; activeLearningMenu.value = true
  await loadOverview()
}
async function loadNavigation() {
  const result = await api.get<MenuNode[]>('/nav')
  navItems.value = result.data
  const menus = flattenMenus(navItems.value)
  const target = menus.find((menu) => menu.id === activeMenuId.value && menu.clickable && menu.url?.startsWith('/learning')) || menus.find((menu) => menu.clickable && menu.url?.startsWith('/learning'))
  clearWorkspace()
  if (target) await handleMenuClick(target)
}
async function handleAuthenticated(user: AuthUser) { currentUser.value = user; try { await loadNavigation() } catch (error) { startupError.value = errorMessage(error) } }
async function refreshPermissions() { try { currentUser.value = await authApi.me(); await loadNavigation() } catch (error) { if (axios.isAxiosError(error) && error.response?.status === 401) expireSession(); else showToast(errorMessage(error)) } }
async function closePermissionCenter() { showPermissionCenter.value = false; await refreshPermissions() }
async function logout() { try { await authApi.logout(); expireSession() } catch (error) { if (axios.isAxiosError(error) && error.response?.status === 401) expireSession(); else showToast(errorMessage(error)) } }
async function bootstrap() {
  authLoading.value = true; startupError.value = ''
  try { currentUser.value = await authApi.me(); await loadNavigation() }
  catch (error) { if (axios.isAxiosError(error) && error.response?.status === 401) expireSession(); else startupError.value = errorMessage(error) }
  finally { authLoading.value = false }
}
onMounted(() => { window.addEventListener('auth-expired', expireSession); void bootstrap() })
onUnmounted(() => window.removeEventListener('auth-expired', expireSession))
watch(selectedPoint, (point) => { if (point) { noteForm.keyPoints = point.note?.keyPoints || ''; noteForm.body = point.note?.body || '' } })
</script>
