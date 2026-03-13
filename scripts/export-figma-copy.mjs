#!/usr/bin/env node
/**
 * 从 Figma 导出跟单模块设计图到 public/figma/
 * 使用: FIGMA_ACCESS_TOKEN=xxx node scripts/export-figma-copy.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE_KEY = 'Fb7Prb9fea60XuCFX6ugMp'
const NODES = [
  { id: '20096:43786', file: 'copy-trader-detail.png' },
  { id: '20096:44377', file: 'copy-my.png' },
  { id: '20096:50002', file: 'copy-my-empty.png' },
  { id: '20774:6041', file: 'copy-plaza.png' },
]

const token = process.env.FIGMA_ACCESS_TOKEN
if (!token) {
  console.error('请设置环境变量 FIGMA_ACCESS_TOKEN')
  process.exit(1)
}

const outDir = path.join(__dirname, '..', 'public', 'figma')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const ids = NODES.map((n) => n.id).join(',')
const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=1`

console.log('请求 Figma 导出...')
const res = await fetch(url, {
  headers: { 'X-Figma-Token': token },
})
if (!res.ok) {
  console.error('Figma API 错误:', res.status, await res.text())
  process.exit(1)
}

const data = await res.json()
if (data.err) {
  console.error('Figma 返回错误:', data.err)
  process.exit(1)
}

const images = data.images || {}
for (const { id, file } of NODES) {
  const imageUrl = images[id]
  if (!imageUrl) {
    console.warn('未获取到:', id, file)
    continue
  }
  console.log('下载', file, '...')
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) {
    console.warn('下载失败', file, imgRes.status)
    continue
  }
  const buf = Buffer.from(await imgRes.arrayBuffer())
  const outPath = path.join(outDir, file)
  fs.writeFileSync(outPath, buf)
  console.log('已写入', outPath)
}
console.log('完成.')
