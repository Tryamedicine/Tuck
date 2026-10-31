# Tuck

Tuck 是一款 macOS 本地事项收集与每日安排应用，使用 Electron、React 和 Motion。当前源码版本为 `0.1.30-preview.1`，用于预览与设计验证。

## 开发

需要 Node.js/npm；原生运行和打包需要 macOS。

```sh
npm ci
npm run test:mac
npm run build:mac-ui
npm run start:mac
```

打包 Apple Silicon 测试版：`npm run pack:mac`。当前配置生成 Tuck Review 预览包，未配置 Developer ID 签名与公证。

## 源码

- `mac/main.cjs`：Electron 主进程、窗口、IPC、截图识别、凭据与人物记忆。
- `mac/preload.cjs`：受限的渲染进程接口。
- `mac/store.cjs`：本地事项和设置持久化。
- `mac/renderer.jsx` 与同目录组件/CSS：事项、收集、欢迎与设置界面。
- `mac/assets`：图标、字体和示例素材；相关许可文件随素材保留。
- `vendor/lucide`：应用实际使用的 Lucide React 原始模块及依赖，保留 ISC 许可。

## 数据与识别配置

应用可手动管理事项。截图识别需在设置中提供匹配服务地区的 API Key，调用受支持的百炼/千问 HTTPS 地址；启用真实识别时，图片发送至所配置服务。API Key 经 Electron `safeStorage` 加密后保存在应用数据目录，源码不包含用户密钥。渲染页面通过受限 IPC 请求主进程执行识别。

预览版本使用按版本隔离的应用数据目录。用户事项、截图、加密配置、工作记忆和本地缓存不包含在本仓库中。

## 来源与验证边界

首次上传基于本地 `tuck-github-source-0.1.30` 快照，保留应用源码与所需素材。未上传历史设计探索、测试截图、安装包、生成后的 UI、node_modules 或本地用户数据。现有自动化测试与构建通过不等于完成真实 AI 服务、Gatekeeper、系统剪贴板、多屏及完整人工体验验收。
