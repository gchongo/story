#!/bin/bash
# aaPanel 服务器部署脚本
# 用法（SSH 登录服务器后）：
#   bash /www/wwwroot/story-src/site/deploy/server-deploy.sh
#
# 首次请先：
#   cd /www/wwwroot && git clone https://github.com/gchongo/story.git story-src

set -euo pipefail

REPO_DIR="${REPO_DIR:-/www/wwwroot/story-src}"
WEB_DIR="${WEB_DIR:-/www/wwwroot/read.howhy.day}"
CONTENT_ALIAS="${CONTENT_ALIAS:-/www/wwwroot/story-src}"

echo "→ 拉取最新代码…"
cd "$REPO_DIR"
git pull origin main

echo "→ 安装依赖并构建…"
cd "$REPO_DIR/site"
npm ci
npm run build

echo "→ 发布前端到 $WEB_DIR …"
mkdir -p "$WEB_DIR"
rsync -a --delete "$REPO_DIR/site/dist/" "$WEB_DIR/"

echo "→ 内容目录：Nginx /content/ 应 alias 到 $CONTENT_ALIAS"
echo "✓ 部署完成。请重载 Nginx 后访问站点。"
