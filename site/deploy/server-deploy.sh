#!/bin/bash
# 网站根目录: /www/wwwroot/read.howhy.day

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
# dist 位于 site/dist/ 内，直接 rsync 到父目录会触发 "file has vanished"
STAGING="$(mktemp -d)"
rsync -a "$SITE_ROOT/site/dist/" "$STAGING/"
rsync -a "$STAGING/" "$SITE_ROOT/"
rm -rf "$STAGING"

echo "→ 修正权限（aaPanel 一般为 www:www）…"
if id www &>/dev/null; then
  chown -R www:www "$SITE_ROOT"
elif id www-data &>/dev/null; then
  chown -R www-data:www-data "$SITE_ROOT"
fi
find "$SITE_ROOT" -type d -exec chmod 755 {} \;
find "$SITE_ROOT" -type f -exec chmod 644 {} \;

if [[ ! -f "$SITE_ROOT/index.html" ]]; then
  echo "✗ 错误：$SITE_ROOT/index.html 不存在，构建可能失败"
  exit 1
fi

echo "✓ 部署完成"
echo "  访问: https://read.howhy.day/"
echo "  index.html: $(wc -c < "$SITE_ROOT/index.html") bytes"
