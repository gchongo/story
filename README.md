# story

古典名著阅读站：3D 书架 + 原文 / 白话 / 读书记对照。

- 仓库：<https://github.com/gchongo/story>
- 建议域名：`read.howhy.day`

## 本地开发

```bash
cd site
npm install
npm run dev
```

## 打包上传（手动部署）

```bash
cd site
npm run deploy
# 产物在 site/deploy/output/
#   web/     → 网站根目录
#   content/ → /www/wwwroot/story-content/
```

## aaPanel + GitHub 部署

### 1. 服务器首次初始化

```bash
cd /www/wwwroot
git clone https://github.com/gchongo/story.git story-src
# 安装 Node.js 18+（aaPanel → 软件商店 → Node 版本管理器）
bash story-src/site/deploy/server-deploy.sh
```

### 2. aaPanel 建站

- 域名：`read.howhy.day`
- 根目录：`/www/wwwroot/read.howhy.day`
- 在站点 Nginx 配置中加入 `site/deploy/nginx-snippet.conf`
- 将其中 `alias` 改为：

```nginx
location /content/ {
    alias /www/wwwroot/story-src/;
    charset utf-8;
    default_type text/plain;
}
```

### 3. 以后更新

```bash
bash /www/wwwroot/story-src/site/deploy/server-deploy.sh
```

或在 aaPanel **Git 部署** 里绑定仓库，Webhook 触发上述脚本。

## 目录说明

| 路径 | 说明 |
|------|------|
| `books.json` | 书库索引 |
| `红楼梦（脂本精校）/` | 原文 + 白话 |
| `西游记（李卓吾批评本）/` | 原文 |
| `site/` | 前端项目 |
