import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(__dirname, '..')
const storyRoot = path.resolve(siteRoot, '..')
const outRoot = path.resolve(siteRoot, 'deploy', 'output')

const books = JSON.parse(fs.readFileSync(path.join(storyRoot, 'books.json'), 'utf-8'))

console.log('→ 构建前端…')
execSync('npm run build', { cwd: siteRoot, stdio: 'inherit' })

const webDir = path.join(outRoot, 'web')
const contentDir = path.join(outRoot, 'content')

fs.rmSync(outRoot, { recursive: true, force: true })
fs.mkdirSync(webDir, { recursive: true })
fs.mkdirSync(contentDir, { recursive: true })

copyDir(path.join(siteRoot, 'dist'), webDir)
fs.copyFileSync(path.join(storyRoot, 'books.json'), path.join(contentDir, 'books.json'))

for (const book of books.books) {
  const src = path.join(storyRoot, book.path)
  const dest = path.join(contentDir, book.path)
  copyDir(path.join(src, '章节'), path.join(dest, '章节'))
  const vernacular = path.join(src, '白话文', '章节')
  if (fs.existsSync(vernacular)) {
    copyDir(vernacular, path.join(dest, '白话文', '章节'))
  }
}

fs.copyFileSync(
  path.join(siteRoot, 'deploy', 'nginx-snippet.conf'),
  path.join(outRoot, 'nginx-snippet.conf')
)

const readme = `# 部署包说明

## 目录
- web/          → 上传到网站根目录（如 /www/wwwroot/read.howhy.day/）
- content/      → 上传到 /www/wwwroot/story-content/
- nginx-snippet.conf → 粘贴到 aaPanel 站点 Nginx 配置

## aaPanel 步骤
1. 网站 → 添加站点 → 域名 read.howhy.day
2. 将 web/ 内所有文件上传到站点根目录
3. 将 content/ 上传到 /www/wwwroot/story-content/
4. 站点设置 → 配置文件 → 加入 nginx-snippet.conf 内容
5. SSL → Let's Encrypt 申请证书（推荐）
6. 重载 Nginx

## 更新内容
本地运行 npm run deploy 重新打包，覆盖上传 web/ 和 content/ 即可。
`
fs.writeFileSync(path.join(outRoot, 'DEPLOY.txt'), readme)

console.log('')
console.log('✓ 部署包已生成:', outRoot)
console.log('  web/     → 站点根目录')
console.log('  content/ → /www/wwwroot/story-content/')
console.log('')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name)
    const d = path.join(dest, name)
    if (fs.statSync(s).isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}
