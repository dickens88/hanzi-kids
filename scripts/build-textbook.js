// Builds public/data/textbook.json: 2016 统编版 lessons with their 写字表 and 识字表.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cacheFile = path.join(root, '.cache/zishi-volumes.json')
const outFile = path.join(root, 'public/data/textbook.json')
const SOURCE = 'https://raw.githubusercontent.com/fsiceangel/zishi/5dc2df5d3c4c524de8f41336ecf7b87d17758b4c/src/data/volumes.json'

async function load() {
  if (!fs.existsSync(cacheFile)) {
    console.log(`downloading ${SOURCE}`)
    const res = await fetch(SOURCE)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
    fs.writeFileSync(cacheFile, await res.text())
  }
  return JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
}

async function main() {
  const books = (await load()).map((v) => ({
    id: v.id,
    name: v.name,
    short: v.short,
    lessons: v.units
      .flatMap((u) => u.lessons)
      .map((id) => v.lessons[id])
      .filter((l) => l.xiezi.length || l.shizi.length)
      .map((l) => ({ id: l.id, kind: l.kind, num: l.num, title: l.title, xiezi: l.xiezi, shizi: l.shizi })),
  }))
  fs.writeFileSync(outFile, JSON.stringify(books))
  const count = (key) => new Set(books.flatMap((b) => b.lessons.flatMap((l) => l[key]))).size
  console.log(`wrote ${books.length} books: ${count('xiezi')} 写字表 and ${count('shizi')} 识字表 characters`)
}

main()
