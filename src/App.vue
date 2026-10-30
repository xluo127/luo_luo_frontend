<template>
  <div class="container">
    <h1>我的个人大平台</h1>
    <!-- Element Plus 的树形组件 -->
    <el-tree
      :data="treeData"
      :props="defaultProps"
      @node-click="handleNodeClick"
      class="my-tree"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElTree } from 'element-plus'
import 'element-plus/dist/index.css'

// 1. 定义树的数据源
const treeData = ref([])
const defaultProps = {
  children: 'children',
  label: 'title'
}

// 2. 挂载时向后端请求数据
onMounted(async () => {
  try {
    // 注意这里请求 /api/nav，Vite 会帮我们代理到后端的 /nav
    const response = await axios.get('/api/nav')
    treeData.value = response.data
  } catch (error) {
    console.error('获取数据失败:', error)
  }
})

// 3. 点击节点时的动作
const handleNodeClick = (data: any) => {
  console.log('点击了节点:', data)
  if (data.url) {
    window.open(data.url, '_blank') // 如果节点有 url，就打开新窗口
  }
}
</script>

<style scoped>
.container {
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
}
h1 {
  color: #333;
  margin-bottom: 20px;
}
.my-tree {
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 8px;
}
</style>