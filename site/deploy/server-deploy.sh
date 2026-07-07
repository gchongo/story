#!/bin/bash
# 网站根目录: /www/wwwroot/read.howhy.day

set -euo pipefail

SITE_ROOT="${SITE_ROOT:-/www/wwwroot/read.howhy.day}"

echo "→ 拉取最新代码…"
cd "$SITE_ROOT"
git -c safe.directory="$SITE_ROOT" pull origin main

echo "→ 安装依赖并构建…"
cd "$SITE_ROOT/site"
npm ci
npm run build

echo "→ 发布前端到站点根目录…"
STAGING="$(mktemp -d)"
rsync -a "$SITE_ROOT/site/dist/" "$STAGING/"
rsync -a "$STAGING/" "$SITE_ROOT/"
rm -rf "$STAGING"

echo "→ 修正权限（不改动 .git，避免 root 无法 pull）…"
WEB_USER="www"
id www &>/dev/null || WEB_USER="www-data"

for item in index.html favicon.svg assets data books.json; do
  [[ -e "$SITE_ROOT/$item" ]] && chown -R "$WEB_USER:$WEB_USER" "$SITE_ROOT/$item"
done
for dir in "$SITE_ROOT"/红楼梦* "$SITE_ROOT"/西游记*; do
  [[ -d "$dir" ]] && chown -R "$WEB_USER:$WEB_USER" "$dir"
done
find "$SITE_ROOT/index.html" "$SITE_ROOT/assets" "$SITE_ROOT/data" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$SITE_ROOT/index.html" "$SITE_ROOT/assets" "$SITE_ROOT/data" -type f -exec chmod 644 {} + 2>/dev/null || true

if [[ ! -f "$SITE_ROOT/index.html" ]]; then
  echo "✗ 错误：$SITE_ROOT/index.html 不存在，构建可能失败"
  exit 1
fi

echo "✓ 部署完成"
echo "  访问: https://read.howhy.day/"
echo "  JS: $(basename "$(ls "$SITE_ROOT/assets/"*.js 2>/dev/null | head -1)")"
