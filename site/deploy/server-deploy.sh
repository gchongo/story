#!/bin/bash
# aaPanel 服务器部署脚本
# 网站根目录（Git 仓库 + 站点）: /www/wwwroot/read.howhy.day
#
# 首次初始化：
#   cd /www/wwwroot
#   rm -rf read.howhy.day   # 若是空站点目录，先备份
#   git clone https://github.com/gchongo/story.git read.howhy.day
#   bash read.howhy.day/site/deploy/server-deploy.sh

set -euo pipefail

SITE_ROOT="${SITE_ROOT:-/www/wwwroot/read.howhy.day}"

echo "→ 拉取最新代码…"
cd "$SITE_ROOT"
git pull origin main

echo "→ 安装依赖并构建…"
cd "$SITE_ROOT/site"
npm ci
npm run build

echo "→ 发布前端到站点根目录…"
rsync -a --delete "$SITE_ROOT/site/dist/" "$SITE_ROOT/"

echo "✓ 部署完成"
echo "  站点根目录: $SITE_ROOT"
echo "  章节 txt:   $SITE_ROOT/红楼梦（脂本精校）/ …"
echo "  请确认 Nginx 已配置 /content/ → alias $SITE_ROOT/"
