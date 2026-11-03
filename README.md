# Vue 3 + TypeScript + Vite

## 登录与权限

- 启动：`pnpm dev`（Vite 端口 1111），后端通过 `/api` 代理到本机 3000。
- 首次访问先注册自己的账号。新账号默认没有菜单，不会自动获得管理员权限。
- 在后端项目目录执行 `pnpm user:promote -- 你的用户名`，然后刷新页面，就能进入「权限中心」。没有内置的管理员默认密码。
- 管理员可以查看/删除用户、配置多级菜单、勾选并保存用户菜单授权。普通用户侧栏只显示授权菜单，祖先只作为目录保留。
- 用户被授权后点击「刷新菜单权限」即可更新侧栏。撤权或删除用户后，后端立即拒绝后续无权限请求；会话失效时页面返回登录。
- 登录使用服务端 Cookie 会话，不使用 localStorage 保存令牌。生产部署要求同源 HTTPS 代理；详情见后端 `PERMISSIONS.md`。
- 菜单权限同时约束学习分类接口，但现有笔记/进度仍是共享数据，本次未改为每用户独立存储。
- 构建检查：`pnpm build`。

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
