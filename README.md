# nothingyuancando.github.io

这是一个纯静态的 GitHub Pages 个人网站，风格接近传统个人博客：主页文章列表、关于页、分类页和文章详情页。

## 本地预览

直接打开 `index.html`，或在仓库目录启动一个静态服务：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://localhost:4173
```

## 修改内容

- 主页文章列表：改 `index.html`
- 关于页：改 `about.html`
- 分类页：改 `categories.html`
- 文章详情：在 `posts/` 下新增 HTML 文件
- 视觉样式：改 `styles.css`
- 主题切换：改 `theme.js`

## 发布到 GitHub Pages

把文件推送到仓库的 `main` 分支后，GitHub Pages 会使用这个仓库作为个人站点：

```bash
git add .
git commit -m "Build personal site"
git branch -M main
git push -u origin main
```

发布地址通常是：

```text
https://nothingyuancando.github.io
```
