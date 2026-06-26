---
layout: post
title: 零基础搭建自己的 github.io 个人网站
date: 2026-06-26
tags: [tutorial, github-pages]
---

GitHub Pages 的个人站点仓库通常命名为 `用户名.github.io`。这个仓库推送到 GitHub 后，就可以通过 `https://用户名.github.io` 访问。

<!-- more -->

## 最小可用结构

如果只是纯静态网站，只需要 `index.html`、`styles.css` 这些文件。

但如果想长期写文章，更推荐使用 Jekyll 结构：

```text
_config.yml
_layouts/
_includes/
_posts/
index.html
about.md
tags/index.html
```

## 发布步骤

把文件提交并推送到 GitHub：

```bash
git add .
git commit -m "Build personal site"
git push
```

如果 Pages 没有自动打开，可以到仓库的 Settings -> Pages 里选择从 `main` 分支发布。
