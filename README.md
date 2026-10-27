# 考研词汇 · 50 天冲刺

一款针对考研英语阅读的简洁 PWA（可安装网页 App）。

## 词表与计划

本项目直接使用用户提供的最终版《词汇乱序·释义精简版.md》：

- **4,924 条词汇**，保留原顺序（词频降序、同频按原文件顺序），不重写释义。
- 考频 **≥4：2,393 条**，默认必背范围，前 42 天平均约 57 个新词/天。
- 考频 **≥3：2,873 条**，冲刺范围，前 42 天约 69 个新词/天。
- 考频 **≥2：3,642 条**，加练范围，前 42 天约 87 个新词/天。
- 还可以选择全部 4,924 词，或从主页单独加餐 **10 个考频 1 的词**。
- 前 42 天学新词，第 43—50 天集中复习；每天自动根据剩余未学词和剩余天数计算目标。

> 考频不是重新核查的真题出现次数：`30+` 为用户原词表中的特殊标记，部分新增词的数字本身来自原表的估算。此处只沿用这些标记进行排序和筛选。

## 学习方式

1. 看英文和音标（可听发音），先**主动回想**精简中文释义。
2. 点击「显示中文释义」，与自己的回忆比较。
3. 选择「不会（10 分钟）／模糊（1 天）／记得（递增间隔）／熟练（更长间隔）」。
4. 系统优先安排到期复习，再按**原词表顺序**安排当天新词。
5. 「已掌握」至少要求跨不同日期两次成功回忆，并达到 7 天以上的间隔；第一次认识不算掌握。

复习规则是简化的间隔记忆算法，不是严格的 FSRS 算法，也无法保证所有人达到相同效果。

## 主要功能

- 可安装到手机桌面的 PWA；首次加载后，网页和词表可以缓存以供离线查看。
- 浏览器英语语音（美式/英式、速度控制），使用系统 `SpeechSynthesis`；在某些设备或离线情况下语音包可能不可用。
- 精简释义与音标、原始考频标记；检索单词和中文释义、收藏、浏览已掌握/待复习词。
- 可仅对难词写一句**自己的记忆钩子**（词根联想、语境、谐音等），避免为所有单词强行增加冗长的助记内容。
- 50 天冲刺目标、每日新词额度、到期数量、掌握进度、最近 7 天答题情况。
- **浏览器本地保存进度**，支持 JSON 导出与导入；不上传学习数据，换设备不会自动同步。
- 键盘快捷键：空格揭示释义、P 朗读、显示释义后按 1—4 评分。

## 本地运行与构建

项目无第三方前端运行依赖，只需 **Node.js 20+**：

```bash
npm test
npm run build
npm run dev
```

访问 `http://localhost:4173`。本地运行会从 `src/` 提供静态资源；`npm run build` 会严格检查 4,924 条数据的完整性与考频排序，再输出到 `dist/`。

**提示**：不要直接双击 `src/index.html`，浏览器通常会阻止 `file://` 页面中的 `fetch` 读取词表；若想双击打开，请使用另外提供的「单文件离线版.html」。

## 发布到 GitHub Pages

1. 在 GitHub 新建空仓库，例如 `kaoyan-vocab-50d`。希望免费部署 GitHub Pages 时，优先新建 **Public** 仓库（这会公开词表内容）。
2. 在项目根目录执行以下命令，将项目推送到你的仓库（将 `YOUR_GITHUB_NAME` 替换为你的账号）：

```bash
git init
git add .
git commit -m "Build 50-day vocabulary app"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_NAME/kaoyan-vocab-50d.git
git push -u origin main
```

3. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 之后每次 push 到 `main`，`.github/workflows/deploy.yml` 都会先运行单元测试、构建项目，再通过 GitHub Actions 发布到 Pages。首次发布可在仓库 Actions 查看状态。
5. 访问类似 `https://YOUR_GITHUB_NAME.github.io/kaoyan-vocab-50d/` 的地址，再通过 Chrome/Safari 浏览器菜单「添加到主屏幕」。

GitHub 官方说明：
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 可靠性、数据与版权说明

- 本项目仅包含用户提供的中文释义，不宣称对它们完成了官方词典逐义核验；请遇到歧义时结合英语二原文。
- 复习进度保存在此浏览器的 `localStorage`，清理网站数据或使用隐私窗口可能造成记录丢失；**建议每周导出备份**。
- 词汇数据可能来自多种资料，公开发布前请确保你有权公开相关内容。如果不适合公开，请使用本地版本或有权限的私有托管。
- 语音在浏览器中按设备可用语音合成；可能与表中个别音标的英美读音不完全对应。

## 项目结构

```text
src/
  index.html          页面
  styles.css          手机优先响应式界面
  app.js              交互与本地进度管理
  core.mjs            50 天计划和复习算法
  vocab.json          最终版 4,924 词，保留原始顺序
  manifest.webmanifest
  sw.js               PWA 离线缓存
scripts/
  build.mjs           无依赖构建与词表校验
  generate_vocab.py   从指定原 Markdown 重新生成 vocab.json（需传文件路径）
  e2e_check.py        可选浏览器冒烟测试，需额外安装 Playwright
.github/workflows/deploy.yml
  GitHub Actions 自动构建与发布
```