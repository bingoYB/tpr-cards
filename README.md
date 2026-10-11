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
- **手动翻卡**：左右滑动或按钮切换，播放页可直接调节语速；支持保持屏幕常亮（Wake Lock）
- **Simon Says 模式**：随机给指令加 "Simon says" 前缀，直接当课堂游戏用
- **自定义卡组**：新建 / 编辑 / 复制内置卡组 / 每张卡片上传、替换和移除图片 / 批量粘贴导入（`emoji | English | 中文` 每行一张）
- **数据导入导出**：自定义卡组导出为 JSON，换设备可导入；卡组文字和图片 ID 保存在本机 localStorage，上传的图片以 Blob 保存在 IndexedDB（`tpr-card-images` / `images`），导出备份包含图片，可在另一台设备恢复
- **PWA**：Service Worker 预缓存应用和 1 岁图片，其余图片在浏览时缓存，已浏览的图片可离线查看；下载包需要联网下载；有新版本时提示更新；支持 Android 安装提示与 iOS "添加到主屏幕"
- 自适应深色模式、刘海屏安全区、横屏布局

上传支持 PNG、JPG、WebP、GIF 和 AVIF，单张最大 20 MB。图片在保存卡组时写入 IndexedDB，刷新或离线仍可展示；上传图片优先于内置插画，移除后恢复内置插画或表情。

## 图片压缩

159 张卡片 PNG 已通过 Tinify 压缩，从 250.7 MiB 降至 84.1 MiB，减少 66.44%。保持 1122 × 1402 尺寸及透明度；Tinify 使用经用户确认的有损颜色优化。下载包保留此套压缩后的原尺寸图片，页面使用下方的响应式图片。

逐图路径、大小与 SHA-256 记录见 [压缩报告](docs/tinify-compression-report.json)。本机完整原图保存在 `image-originals/2026-10-11/`，该目录不提交或发布；压缩前版本也保留在 Git 历史中。

## 响应式图片

根据当前 CSS 展示尺寸，159 张内置图片生成三套 WebP：预览图 160 × 200、标准图 320 × 400、二倍图 640 × 800（等比缩放、不裁切）。首页卡组封面最大 90px、首屏插画最大 147px；卡片列表小于 320px；播放页最大 320px，因此以 320px 作为标准尺寸。

`CardVisual` 使用 `srcset` 的 160w / 320w / 640w 和各场景对应的 `sizes`，浏览器按实际显示宽度与设备像素密度选择资源。三套总计约 13.4 MiB，原网页图片约 84.1 MiB。自定义上传图片也通过 Canvas 生成三档展示 Blob，IndexedDB 和导出备份保留原文件。

原尺寸 PNG 保存在 `assets/card-originals/`，供构建下载包使用，不单独发布为网页图片。`scripts/resize-cards.mjs` 使用 Sharp 生成展示资源及内容哈希；构建会自动执行。逐图尺寸及大小见 [响应式图片报告](docs/responsive-images-report.json)。1 岁的三套图片预缓存，其他卡片按实际访问缓存。

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
  illustrations/one-year/ # 1 岁生图提示词及下载包
  illustrations/commands/ # manifest.json（完整提示词与对应关系）
  illustrations/responsive/ # 三套 WebP 展示图片
  downloads/              # 构建时生成的 11 个卡组 ZIP，不提交 Git
scripts/package-cards.mjs # 验证图片、生成带内容哈希的映射和下载包
```

## 键盘快捷键（播放页）

| 按键 | 作用 |
| --- | --- |
| `←` / `→` / `PageUp` / `PageDown` | 上一张 / 下一张（兼容翻页笔） |
| `空格` | 朗读当前指令 |
| `H` | 显示 / 隐藏中文 |
| `Esc` | 退出 |
