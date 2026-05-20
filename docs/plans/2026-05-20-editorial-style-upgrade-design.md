# 视觉风格升级（Editorial 方向） — 设计文档

日期：2026-05-20

## 背景

当前站点（[public/index.html](public/index.html)、[public/style.css](public/style.css)）功能完整：构建脚本生成静态页、CSS Grid 图墙、原生 JS 灯箱。但视觉风格停留在"能用"，缺少作品集应有的精致度。本次升级只改视觉精致度（C），保留布局结构（B）、灯箱功能、构建流程不动。

## 目标

把当前图片墙升级为有 editorial（编辑式画册）气质的摄影作品集：

- 加一个独立首屏（封面）作为入口
- 字体、配色、留白讲究起来
- 图墙保留 grid 结构，但加大间距让作品更透气
- 不动灯箱、不动构建流程、不引入新依赖

## 不在范围

- 不改图墙的布局结构（仍然是 auto-fill 等宽 grid）
- 不改灯箱的视觉风格和交互
- 不引入网络字体或第三方 CSS 库
- 不加导航、关于页、分类、暗色/亮色切换等额外功能

## 视觉系统

### 配色

暖色低饱和暗底，替换当前的纯黑（`#0d0d0d`）+ 灰字（`#ccc`）。

| 用途 | 颜色 |
| --- | --- |
| 页面背景 | `#0f0d0a`（暖黑） |
| 主文字（标题、引言） | `#e8e2d6`（米色） |
| 次文字（副标、署名、页脚） | `#a89888`（暖灰） |
| 弱文字 / 装饰线 | `#5a4d3d`（深暖灰） |
| 灯箱遮罩 | `rgba(0, 0, 0, 0.92)` —— 保持不动 |

### 字体

只用系统字体，不引入网络字体。

- 英文衬线（标题、引言）：`Georgia, "Times New Roman", serif`
- 中文衬线（副标）：`"Songti SC", "Source Han Serif SC", "Noto Serif SC", serif`
- 无衬线（小标签、署名、页脚）：保留现有的 `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

字距：英文 `letter-spacing` 0.5px–4px 不等（小标签拉宽），中文 `letter-spacing` 5–6px 拉开呼吸感。

### 装饰元素

- 28px 宽 × 1px 高的横线（颜色 `#5a4d3d`）作为分隔元素
- 不使用图标、不使用边框

## 首屏（Hero）

`100vh` 整屏区块，垂直居中、水平居中收窄到 `max-width: 720px`，左对齐排版。桌面与手机使用相同结构，仅字号缩放。

### 内容结构

```
[顶部小标签]   PORTFOLIO · 2026

[英文大标题]   Album
[中文副标]     摄影作品

[分隔线]       ——

[引言]         You will never walk alone
[作者]         — tqj

[底部提示]     ↓ SCROLL
```

### 关键尺寸

| 元素 | 颜色 | 桌面 | 手机 (≤600px) |
| --- | --- | --- | --- |
| 英文标题 `Album` | `#e8e2d6` | 64px | 40px |
| 中文副标 `摄影作品` | `#a89888` | 18px | 14px |
| 分隔线 | `#5a4d3d`（28×1px） | — | — |
| 引言 `You will never walk alone` | `#e8e2d6` | 16px，Georgia italic | 14px |
| 作者署名 `— tqj` | `#a89888` | 12px，无衬线 | 11px |
| 顶部标签 `PORTFOLIO · 2026` / 底部提示 `↓ SCROLL` | `#5a4d3d` | 11px，letter-spacing 4px，uppercase，无衬线 | 同 |
| 元素间垂直间距 | — | 标题→副标 8px；副标→分隔线 24px；分隔线→引言 24px；引言→署名 12px | 比例缩小 |

### 滚动提示

底部 `↓ SCROLL` 加一个 1.5s 循环上下浮动的轻动画（`@keyframes` 4px 位移）。点击它会平滑滚动到图墙（`scroll-behavior: smooth` + 锚点 `#gallery`）。

## 图墙（保留结构，加大留白）

复用现有 `.gallery` + `<img>` 结构，仅调整间距和列宽。

| 属性 | 当前值 | 新值 |
| --- | --- | --- |
| 桌面 `gap` | 4px | **24px** |
| 桌面 `padding` | 4px | **32px** |
| 桌面列宽 | `minmax(280px, 1fr)` | `minmax(320px, 1fr)` |
| 手机 `gap` (≤600px) | 2px | **12px** |
| 手机 `padding` (≤600px) | 2px | **16px** |
| 手机列宽 (≤600px) | `minmax(160px, 1fr)` | `minmax(160px, 1fr)`（保持） |

### Hover 效果

把当前的 `opacity: 0.85` 改成更克制的：

```
transition: opacity 0.3s ease, transform 0.3s ease;
:hover { opacity: 0.7; transform: scale(0.99); }
```

## 页脚

图墙底下加一个简单页脚：

- 与图墙之间 80px 上间距
- 居中显示：28px 分隔线 + `© 2026 tqj`（`#a89888` 暖灰，11px，无衬线，letter-spacing 2px）
- 底部 60px 留白

## 灯箱

完全保留现有功能与样式。`lightbox.js` 不修改，CSS 中 `.lightbox` 相关规则不修改。

## 实现位置

所有改动都在 [scripts/build.js](scripts/build.js) 内部的 `writeStaticAssets()` 函数和 HTML 模板字符串里：

1. **HTML 模板**（`build()` 函数中的 `html` 字符串）：在 `<body>` 顶部插入 `<section class="hero">` 块；给图墙包一个 `<main id="gallery">`；底部加 `<footer>`。
2. **CSS 模板**（`writeStaticAssets()` 中的 `css` 字符串）：
   - 替换 `body` 的 `background` 和默认 `color`
   - 新增 `.hero` 及其内部元素样式
   - 调整 `.gallery` 的 `gap` / `padding` / `grid-template-columns`
   - 调整 `.gallery img:hover`
   - 新增 `footer` 样式
   - 新增 `@keyframes` 给 SCROLL 提示用
   - 移动端媒体查询同步调整
3. **JS 模板**（`writeStaticAssets()` 中的 `js` 字符串）：不修改。
4. **构建命令**：不变，仍然 `npm run build`。
5. **文件输出结构**：不变，仍然输出到 `public/`。

## 风险与回退

- 系统中文衬线在 Linux 服务器或部分 Windows 设备上可能缺失 → 通过多级 fallback 保证最差情况退化为系统默认衬线，不会破坏布局。
- 加大间距后单屏可见图减少 → 这是设计意图，符合 editorial 气质目标。
- 首屏增加了一屏滚动距离 → SCROLL 提示明确指引下滑；移动端因 100vh 整屏不会比图墙更长。
