# AGENTS.md

面向 AI Agent 的仓库工作说明。修改代码前请先读完本文件。

## 项目是什么

Code Overview：一个 VS Code 扩展。它读取当前激活文档的符号（Symbol），按「类型 / 枚举 / 变量 / 函数 / 类 / 属性 / 构造器 / 方法 / 其他」分组，渲染在右侧次要侧边栏（Secondary Sidebar）的 Webview 面板中；面板中的分组可折叠，点击具体项会让编辑器滚动并选中对应代码位置。

## 仓库结构（pnpm workspace）

```
packages/code-overview   VS Code 扩展宿主（TypeScript + vscode API），产物 out/
packages/ui              Webview 前端（Preact + Vite），构建产物直接输出到 packages/code-overview/out/ui
```

- `packages/code-overview/src/extension.ts`：`activate` 入口，注册 `codeOverview` WebviewViewProvider。
- `packages/code-overview/src/codeOverview.ts`：核心类 `CodeOverviewProvider`，负责取符号、分组、拼 HTML、收发 Webview 消息、跳转定位。
- `packages/code-overview/src/utils/handlers/`：语言策略层。`baseHandler.ts` 定义 `IBaseHandler`，`tsAndJsHandler.ts` 是 TS/JS 实现，`index.ts` 的 `getLanguageHandler(languageId)` 做分发。
- `packages/ui/src/components/`：`Modules`（列表容器）/`ModuleItem`（分组标题 + 折叠 + 子项点击）/`Icon/arrow`。
- `packages/ui/src/context.tsx`：包裹 `acquireVsCodeApi()`，在纯浏览器下退化为空实现，方便本地 `vite dev` 调试。

## 常用命令

在仓库根目录执行（包管理器固定 `pnpm@10.32.1`）：

```bash
pnpm install                 # 首次或依赖变更后
pnpm build                   # 先 ui 构建，再 tsc 编译扩展（顺序不能颠倒，见「坑」）
pnpm build:ui                # 只构建 Webview 前端
pnpm watch                   # 扩展侧 tsc -watch
pnpm --filter ui build:watch # 扩展 tsc 之外，前端增量重建
pnpm --filter codeoverview lint   # eslint src
pnpm --filter codeoverview test   # vscode-test，会真实拉起 Electron 窗口
```

日常调试：VS Code 中按 F5（`.vscode/launch.json` 的 "Run Extension"，preLaunch 走默认构建任务 `build:all` = build:ui → build:extension(watch)）。

## 数据流与通信协议

修改任何一侧的数据结构时，两侧必须同步。

1. 扩展侧 `vscode.executeDocumentSymbolProvider` 取 `DocumentSymbol[]`。
2. `generateStructData()` 用 handler 的 `getSymbolKindLabel()` 归组，产出 `StructData[]`：`{ kinds: SymbolKind[], label: string, children: StructItem[] }`；`StructItem` 为 `{ name, kind, location: {start:{line,character}, end:{...}, uri}, children? }`。
3. 扩展 → Webview：`{ type: 'symbols', data: StructData[] }`。
4. Webview → 扩展：`{ command: 'requestSymbols' }` 或 `{ command: 'gotoTarget', location }`。

`location` 取自 `symbol.selectionRange`（不是 `range`），跳转时用它构造 `vscode.Range`。

## 必须知道的坑

- **构建顺序**：`vite build` 的 `outDir` 指向 `packages/code-overview/out/ui` 且 `emptyOutDir: true`。先跑扩展 `compile` 再跑 ui 构建是安全的，但**单独跑 tsc 不会更新 UI**；而扩展打包（`vscode:prepublish`）只跑 `compile`，所以 UI 改动必须显式 `pnpm build:ui`。
- **`out/` 已被 gitignore，是纯产物目录**：不要手工编辑或阅读 `out/**` 来判断代码结构（其中可能残留已删除的源文件，例如 `out/utils/textEditor.js` 在 `src/` 已无对应文件）。源码目录 `src/**`、配置文件被 `.vscodeignore` 排除，打包产物实际只含 `out/`、`media/` 和清单文件。
- **扩展侧 import 带 `.js` 后缀**：`tsconfig.json` 为 `module: Node16`，`import { X } from './codeOverview.js'` 是有意写法，改成 `.ts` 或省略扩展名都会编译失败。
- **不支持的语言会抛错**：`getLanguageHandler()` 对未知 `languageId` 直接 `throw`，目前调用处没有 try/catch，非 TS/JS 文档下面板表现为空且有未捕获异常。新增语言支持时优先考虑这一点。
- **归组顺序是字符串耦合**：`getSymbolKindOrder()` 返回的字符串数组必须覆盖 `getSymbolKindLabel()` 所有可能的返回值（含 `'Others'`），否则排序里 `indexOf` 得到 -1，分组顺序会错乱。
- **两套类型定义重复**：扩展侧 `codeOverview.ts` 与 Webview 侧 `ui/src/types.ts` 各自声明了 `StructItem` / `SymbolItem`（后者 `kinds: number[]`、`location: any`）。协议变更需同时改两处。
- **只有 Class 会递归展开成员**：`generateStructData` 里仅 `SymbolKind.Class` 递归 children，其它顶层符号按平铺处理。
- **触发刷新有两处**：激活编辑器变化（50ms 防抖）与保存当前激活文档。新增刷新时机应在 `CodeOverviewProvider` 构造函数里注册并 push 进 `context.subscriptions`。
- **Webview HTML**：从 `out/ui/index.html` 读字符串，用正则把**所有** `href`/`src` 重写为 `webview.asWebviewUri(joinPath(out/ui, link))`，仅 `href="#"` 保留原样。当前 Vite 产物是 `/assets/xxx` 这种根相对路径，靠 `joinPath` 拼成合法本地 URI；因此前端不要引入任何 `http(s)` 外链资源，否则会被重写成本地路径而失效。`localResourceRoots` 只允许扩展目录，也不要往面板里加远程脚本。

## 代码风格

- 扩展侧：`strict: true`，ESLint 用 `packages/code-overview/eslint.config.mjs`（typescript-eslint），只对 `src` 生效。
- Webview 侧：Preact + hooks，函数组件默认导出，样式用同目录 `index.css` + `code-overview-` 前缀的 BEM 式类名。
- 注释与提交信息沿用现状：注释中文、简洁；commit 采用 `feat: / fix: / docs: / chore:` 前缀 + 中文描述。
- 不做无关重构，不新增抽象层；新增语言支持就按 `IBaseHandler` 加一个 handler 并在 `index.ts` 注册。

## 验证清单

改完至少执行：`pnpm build`（确认 TS 与前端都能编译打包）。涉及交互（折叠、点击定位、刷新时机）时，按 F5 打开扩展开发窗口，实际点开一个 `.ts` 文件与一个 `.js` 文件核对分组与跳转，不要只依赖编译通过。新增语言支持需另测一个未支持语言（如 `.py`）确认不崩。
