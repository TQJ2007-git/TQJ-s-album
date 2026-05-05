# 摄影作品展示网站 — 设计文档

日期：2026-05-05

## 概述

极简暗色风格的摄影作品展示网站，所有作品统一展示不分分类，支持灯箱放大浏览，响应式适配桌面/平板/手机。

## 方案

使用自动构建脚本生成纯静态网站。图片放在文件夹中，运行脚本生成 HTML。零运行时依赖，可部署到任意静态服务器。

## 项目结构

```
ownWeb/
├── photos/              ← 源图片（手动放入）
│   ├── DSC0001.jpg
│   └── ...
├── public/              ← 构建产物（部署目录）
│   ├── index.html
│   ├── style.css
│   └── photos/          ← 构建时从 photos/ 复制
├── scripts/
│   └── build.js         ← 构建脚本
└── package.json
```

## 布局

- 暗色背景，CSS Grid 自适应网格布局
- 图片保持原始宽高比，等宽不等高，小间距
- 桌面 4-5 列，平板 2-3 列，手机 1-2 列
- 使用 `grid-template-columns: repeat(auto-fill, minmax(...))` 实现自动适配

## 灯箱

- 点击照片打开：背景变暗遮罩，图片居中按比例放大（最大 90vh/90vw）
- 键盘 ← → 方向键切换照片
- 手机端支持触摸左右滑动
- Esc 或点击背景关闭
- 纯原生 JS，无第三方依赖

## 构建脚本

`npm run build` 执行：
1. 扫描 `photos/` 目录，收集所有图片文件（jpg/jpeg/png/webp）
2. 按文件名排序
3. 清空并重建 `public/` 目录
4. 复制图片到 `public/photos/`
5. 生成 `index.html`（内嵌所有 `<img>` 标签）
6. 写入 `style.css` 和灯箱 JS

添加新照片：放入 `photos/` → `npm run build` → 完成。

## 部署

`public/` 目录即为完整站点，可直接部署到 GitHub Pages、Vercel、Netlify 或任意静态文件服务器。
