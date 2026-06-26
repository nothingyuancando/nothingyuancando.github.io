# nothingyuancando.github.io

这是一个基于 Jekyll 的 GitHub Pages 个人博客，整体结构参考 `pianfan/pianfan.github.io`：左侧个人信息栏、文章列表、搜索、分类页、Markdown 文章和主题切换。

## 本地预览

这个版本需要 Jekyll 构建。GitHub Pages 会在远端自动构建；本地预览需要安装 Ruby/Jekyll 后执行：

```bash
bundle exec jekyll serve
```

然后访问：

```text
http://localhost:4000
```

## 修改内容

- 站点信息、导航、头像、页脚：改 `_config.yml`
- 关于页：改 `about.md`
- 新文章：在 `_posts/` 下新增 `YYYY-MM-DD-title.md`
- 分类页：改 `tags/index.html`
- 视觉样式：改 `style.scss` 和 `_sass/`
- 主题切换：改 `_includes/theme-toggle.html`

## 发布到 GitHub Pages

把文件推送到仓库的 `main` 分支后，GitHub Pages 会使用这个仓库作为个人站点：

```bash
git add .
git commit -m "Update personal site"
git push
```

发布地址通常是：

```text
https://nothingyuancando.github.io
```
