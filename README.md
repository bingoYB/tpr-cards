# TPR 指令卡

面向亲子英语互动及英语/语言教师的 **TPR（Total Physical Response，全身反应教学法）指令卡** 工具。
纯前端、可安装的 PWA，支持离线使用，手机 / 平板 / 投影都能用。

[在线使用](https://bingoyb.github.io/tpr-cards/) · [GitHub 仓库](https://github.com/bingoYB/tpr-cards)

## 功能

- **按年龄段选择**：1 岁（约 11–23 个月）、2 岁、3 岁、4–6 岁；首次默认 1 岁，记住上次选择，随机播放仅混合当前年龄段。年龄是活动难度参考，不是发育测评。
- **新增 48 张年龄主题卡**：每个年龄段各 12 张；1 岁优先完成拍手、挥手、身体认知和亲子玩耍，含家长示范提示。全部内置卡片都配有逐张独立生成的英文插画，可按卡组下载 ZIP 打印。164 张卡片使用 159 张独立图片，相同英文指令复用图片。
- **原有 7 组内置卡组**（教室指令、身体动作、动物模仿、日常生活、情绪表情、方位左右、数字颜色），保留原有 116 张卡，加上新卡共 164 张；共 11 组
- **播放模式**：全屏大字卡片，左右滑动或键盘切换；顺序 / 随机；点任意一张从它开始；"全部随机" 混合所有卡组
- **语音朗读**：Web Speech API 英文朗读，可选声音、调节语速，切卡自动朗读
- **自动播放**：按设定间隔自动翻卡，播放时保持屏幕常亮（Wake Lock）
- **Simon Says 模式**：随机给指令加 "Simon says" 前缀，直接当课堂游戏用
- **自定义卡组**：新建 / 编辑 / 复制内置卡组 / 批量粘贴导入（`emoji | English | 中文` 每行一张）
- **数据导入导出**：自定义卡组导出为 JSON，换设备可导入；所有数据只存本机 localStorage
- **PWA**：Service Worker 预缓存应用和 1 岁图片，其余图片在浏览时缓存，已浏览的图片可离线查看；下载包需要联网下载；有新版本时提示更新；支持 Android 安装提示与 iOS "添加到主屏幕"
- 自适应深色模式、刘海屏安全区、横屏布局

## 开发

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 产物在 dist/
pnpm preview    # 本地预览构建产物（可用来测 PWA 安装）
```

> Service Worker 只在 `build` 后的产物里启用（`pnpm preview`），`dev` 模式不注册 SW。
>
> 需要 pnpm ≥ 10（已在 pnpm 12 上验证）。pnpm 12 默认启用 `minimumReleaseAge` 供应链策略，锁文件已按该策略解析；esbuild 的 postinstall 在 `pnpm-workspace.yaml` 里已批准。

## 部署

GitHub Pages 地址：<https://bingoyb.github.io/tpr-cards/>。推送 `main` 后，`.github/workflows/deploy-pages.yml` 会自动安装锁定依赖、检查 TypeScript、构建并部署。

Pages 构建设置 `VITE_BASE_PATH=/tpr-cards/`，本地默认仍使用相对路径 `./`。


`dist/` 是纯静态文件，`base` 设为相对路径，路由用 hash 模式，所以丢到任何静态托管即可（GitHub Pages、Cloudflare Pages、Nginx 子路径都行）。PWA 需要 HTTPS（或 localhost）。

## 目录结构

```
src/
  data/decks.ts          # 原有内置卡组数据与年龄分类
  data/ageDecks.ts        # 各年龄段新增卡片
  data/ages.ts            # 年龄段与亲子使用提示
  composables/
    useDecks.ts          # 内置 + 自定义卡组（localStorage）
    useSettings.ts       # 设置（localStorage）
    useSpeech.ts         # 语音朗读封装
    useInstallPrompt.ts  # PWA 安装提示
  views/
    HomeView.vue         # 首页 / 卡组列表
    DeckView.vue         # 卡组详情
    PlayView.vue         # 播放（核心）
    EditDeckView.vue     # 自定义卡组编辑
    SettingsView.vue     # 设置 / 数据导入导出
  components/            # 通用组件（图标、头部、卡组卡片、更新提示）
public/                  # 图标与 PWA 资源
  illustrations/one-year/ # 12 张 1 岁英文图片卡及生图提示词
  illustrations/commands/ # 147 张其他图片及 manifest.json（完整提示词与对应关系）
  downloads/              # 构建时生成的 11 个卡组 ZIP，不提交 Git
scripts/package-cards.mjs # 验证图片、生成带内容哈希的映射和下载包
```

## 键盘快捷键（播放页）

| 按键 | 作用 |
| --- | --- |
| `←` / `→` / `PageUp` / `PageDown` | 上一张 / 下一张（兼容翻页笔） |
| `空格` | 朗读当前指令 |
| `回车` | 自动播放 开/关 |
| `H` | 显示 / 隐藏中文 |
| `Esc` | 退出 |
