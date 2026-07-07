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
- web/          → /www/wwwroot/read.howhy.day/
- content/      → 同样上传到 /www/wwwroot/read.howhy.day/（与 web 合并）
- nginx-snippet.conf → aaPanel 站点 Nginx 配置

## aaPanel 步骤
1. 站点根目录设为 /www/wwwroot/read.howhy.day
2. 上传 web/ 内所有文件到站点根目录
3. 上传 content/ 内的书籍文件夹到同一根目录
4. 粘贴 nginx-snippet.conf 到站点配置
5. 重载 Nginx
`
fs.writeFileSync(path.join(outRoot, 'DEPLOY.txt'), readme)

console.log('')
console.log('✓ 部署包已生成:', outRoot)
console.log('  web/     → /www/wwwroot/read.howhy.day/')
console.log('  content/ → 同上（合并到站点根目录）')
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
