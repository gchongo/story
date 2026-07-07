# story

古典名著阅读站：3D 书架 + 原文 / 白话 / 读书记对照。

- 仓库：<https://github.com/gchongo/story>
- 站点：`read.howhy.day`
- **服务器目录：`/www/wwwroot/read.howhy.day`**（Git 仓库与网站根目录合一）

## 本地开发

```bash
cd site
npm install
npm run dev
```

## aaPanel 部署（推荐）

### 1. 建站

- 域名：`read.howhy.day`
- 根目录：**`/www/wwwroot/read.howhy.day`**

### 2. 首次克隆 + 构建

```bash
cd /www/wwwroot
git clone https://github.com/gchongo/story.git read.howhy.day
# aaPanel 安装 Node.js 18+
bash read.howhy.day/site/deploy/server-deploy.sh
```

### 3. Nginx

站点配置文件中加入 `site/deploy/nginx-snippet.conf` 内容（`/content/` 已指向同目录）。

### 4. 以后更新

```bash
bash /www/wwwroot/read.howhy.day/site/deploy/server-deploy.sh
```

## 服务器目录结构

```
/www/wwwroot/read.howhy.day/
├── index.html          ← 构建产物（dist 同步到此）
├── assets/
├── data/
├── books.json
├── 红楼梦（脂本精校）/
├── 西游记（李卓吾批评本）/
└── site/               ← 源码（Nginx 已禁止外网访问）
```

## 手动打包上传

```bash
cd site && npm run deploy
```

- `deploy/output/web/` 内文件 → 上传到 `/www/wwwroot/read.howhy.day/`
- `deploy/output/content/` 内书籍目录 → **合并上传到同一目录**（不是单独 story-content）
