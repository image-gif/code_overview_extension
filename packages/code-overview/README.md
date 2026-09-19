# Code Overview

<p align="center">
  <img src="media/icon.svg" alt="Code Overview" width="72" height="72" />
</p>

> 一个极简的代码结构预览 VS Code 扩展 —— 把当前文件里的类型、变量、函数、类等模块按分组列在侧边栏，点一下就跳到对应代码。

## 功能特性

- **结构化概览**：读取当前激活文档的 Symbol，按语义分组展示，无需再靠滚动和搜索定位模块。
- **分组展示**：Type / Enum / Variable / Function / Class / Property / Constructor / Method / Others，按此顺序排列；无对应符号的分组不会出现。
- **可折叠**：点击分组标题即可展开或收起该组内容。
- **点击定位**：点击任意一项，编辑器会滚动到该符号所在位置并高亮选中，跳转固定在第一编辑列，避免面板挤占代码视图。
- **类的成员可下钻**：Class 分组下的类会递归展示其成员（属性、构造器、方法），形成第二层分组列表。
- **自动刷新**：切换激活编辑器（50ms 防抖）或保存当前文件时，面板数据自动同步，无需手动触发。

## 快速开始

### 安装

从 Marketplace 安装（发布后可用），或本地先打包再安装：

```bash
pnpm build                                     # 根目录完整构建
cd packages/code-overview && npx @vscode/vsce package   # 生成 codeoverview-<version>.vsix
code --install-extension codeoverview-0.0.2.vsix
```

### 打开面板

1. 打开任意 TypeScript / JavaScript 文件；
2. 视图注册在 **次要侧边栏（Secondary Sidebar）**，即编辑器右侧那一列活动栏：点击 Code Overview 图标（`media/icon.svg`）即可展开面板；若右侧栏被折叠，可先用命令面板执行 `View: Toggle Secondary Side Bar`（默认快捷键 `Ctrl+Alt+B`）；
3. 面板标题为 `Code Overview`，列表即为当前文件的模块结构。

## 支持的语言

当前仅支持 `typescript` 与 `javascript`（含其 Symbol 提供方给出的全部 SymbolKind）。其它语言在 `getLanguageHandler` 中未注册，会抛出 `Not Found the languageId.` 且当前无兜底，面板保持空白 —— 多语言支持在路线图上。

## 项目结构

pnpm workspace 单体仓库，分为扩展宿主与 Webview 前端两个包：

```
.
├── AGENTS.md                       # 面向 AI Agent 的仓库工作说明
└── packages
    ├── code-overview               # VS Code 扩展（TypeScript）
    │   ├── src
    │   │   ├── extension.ts        # activate 入口，注册 WebviewViewProvider
    │   │   ├── codeOverview.ts     # 核心：取符号 / 分组 / HTML / 消息 / 跳转
    │   │   └── utils/handlers/     # 语言策略层（IBaseHandler + TS/JS 实现 + 分发）
    │   └── out                     # tsc 与 vite 的产物目录（gitignore）
    └── ui                          # Webview 前端（Preact + Vite）
        └── src
            ├── app.tsx             # 消息收发与状态
            ├── context.tsx         # acquireVsCodeApi 封装
            └── components/         # Modules / ModuleItem / Icon
```

### 工作原理

```
VS Code Symbol Provider
        │  DocumentSymbol[]
        ▼
CodeOverviewProvider ──(按 languageId 选择 handler 归组、排序)──► StructData[]
        │  postMessage { type: 'symbols', data }
        ▼
   Preact 面板（Modules / ModuleItem 渲染分组，支持折叠）
        │  postMessage { command: 'gotoTarget', location }
        ▼
showTextDocument + Range ► 编辑器滚动并选中目标代码
```

## 开发

环境要求：Node.js 24.x、pnpm 10.x（`packageManager` 已固定）、VS Code `^1.137.0`。

```bash
pnpm install          # 安装依赖

pnpm watch            # 扩展侧 tsc -watch
pnpm build:ui         # 构建 Webview 前端（输出到 code-overview/out/ui）
pnpm build            # 完整构建：先 ui 再编译扩展

pnpm --filter codeoverview lint   # ESLint
pnpm --filter codeoverview test   # vscode-test，会拉起真实 Electron 窗口
```

**日常调试**：用 VS Code 打开本仓库后按 `F5`（配置项 `Run Extension`）。默认构建任务 `build:all` 会先构建 UI，再启动扩展的 tsc watch，随后弹出的扩展开发窗口中即可实时查看效果。

**改前端时注意**：`pnpm watch` 只监听扩展的 TS 代码，Webview 的改动需要 `pnpm build:ui` 或 `pnpm --filter ui build:watch` 才会反映到面板里。

**独立预览 UI**：`pnpm --filter ui dev` 在浏览器中启动 Vite；此时 `acquireVsCodeApi` 不存在，代码已降级为空实现，仅可看静态样式。

## 打包发布

`vscode:prepublish` 会在 `vsce package` 前自动执行扩展的 `compile`，但**不会**构建 UI，因此发布前务必先跑一次根目录的 `pnpm build:ui`（或直接 `pnpm build`）。`out/` 与 `media/` 之外的源码由 `.vscodeignore` 排除在包外。

## 已知限制

- 仅支持 TypeScript / JavaScript。
- 只有 Class 会展开子级成员，函数、模块级符号为平铺展示。
- 符号定位使用 `selectionRange`（即符号名所在区间），而非整个定义体，因此高亮范围较小、跳转更聚焦。
- 大文件下依赖 VS Code 的 Symbol Provider 性能，超大约定可能导致符号缺失。
- 面板不提供搜索/过滤入口。

## FAQ

**面板空白或提示 `Not found more symbols.`？**
当前文件不是 TS/JS，或该文件确实没有可导出的顶层符号；也可切换到已打开的代码文件再试。

**点击列表项没有跳转？**
跳转固定使用第一编辑列（`ViewColumn.One`）。若该列被其它编辑器占据，会在其中替换打开，请确认编辑器布局符合预期。

**改了代码但面板没变化？**
UI 改动忘记 `pnpm build:ui`，或扩展改动未重新加载开发窗口（`Ctrl+R`）。

## 贡献

欢迎 Issue 与 PR。提交前请本地跑通 `pnpm build` 与 `pnpm --filter codeoverview lint`，并遵循现有的 `feat: / fix: / docs: / chore:` + 中文描述的提交信息风格。

新增语言支持的推荐路径：在 `packages/code-overview/src/utils/handlers/` 下实现 `IBaseHandler`（提供 `getSymbolKindLabel` 与 `getSymbolKindOrder`），在 `index.ts` 的 `getLanguageHandler` 中注册，并保证排序数组覆盖所有 label（含 `Others`）。

## 许可证

MIT（见 `packages/code-overview/package.json`）· 作者：longyuan
