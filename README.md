# 小墨识字 🐼

给小朋友学写汉字的 Web 应用，针对平板（iPad / 安卓）的触屏操作做了优化。输入一个汉字，可以看到：

- **认一认**：拼音（多音字的每个读音分开列出）、部首、笔画数和简单释义，点一下就能朗读
- **组一组**：6–8 个常用词，上方标注拼音，点一下就能朗读；多音字的组词按读音分行显示
- **写一写**：在田字格里看笔顺动画、一笔一笔跟着学，或者自己用手指描红（写错时会给出提示）
- **小墨讲给你听**（可选）：由 Claude 用孩子听得懂的话讲解字义，再给一个记字小窍门和一句例句

写完一个字会按出错次数得 1–3 颗星，并获得一张贴纸。生字本里能看到贴纸墙、连续学习天数和识字徽章，还可以挑星星少的字复习。

## 快速开始

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev          # 前端开发服务器 http://localhost:5173
npm run dev:server   # 另开一个终端：后端 API（AI 讲解用），端口 8787
```

生产环境运行：

```bash
npm run build
ANTHROPIC_API_KEY=sk-ant-... npm start   # http://localhost:8787
```

不设置 `ANTHROPIC_API_KEY` 也能正常使用，只是不会显示「小墨讲给你听」按钮。

### Docker

```bash
docker build -t hanzi-kids .
docker run -d -p 8787:8787 -e ANTHROPIC_API_KEY=sk-ant-... -v hanzi-kids-data:/app/data hanzi-kids
```

AI 讲解的结果会缓存在 `/app/data/explanations.json` 里，同一个字只会调用一次 Claude，所以总花费有上限（字典一共 3498 个字）。

### 在 iPad 上使用

1. 在家里的电脑或 NAS 上运行服务，让 iPad 和它连在同一个局域网里
2. 在 iPad 的 Safari 中打开 `http://<电脑的局域网 IP>:8787`
3. 点「分享」→「添加到主屏幕」，之后从主屏幕打开就和普通 App 一样

通过 HTTPS 访问时（比如部署到 Cloudflare 或套一层 Cloudflare Tunnel），查过的字会缓存在本地，之后断网也能打开。用局域网 `http://` 地址访问时，iPad 不会启用离线缓存，所有功能都能用，但服务器关掉后就打不开了。

## 配置

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 无 | 设置后开启 AI 讲解 |
| `CLAUDE_MODEL` | `claude-haiku-5-5` | AI 讲解使用的模型 |
| `PORT` | `8787` | 服务端口 |
| `CACHE_FILE` | `data/explanations.json` | AI 讲解缓存文件 |

学习进度（星星、贴纸、连续天数）保存在浏览器的 localStorage 里，换设备或清除浏览器数据后会丢失。

## 字典数据

`public/data/chars/` 下是预先生成好的字典数据，每个字一个 JSON 文件，覆盖《通用规范汉字表》中的 3500 个常用字（去掉了 2 个不适合儿童的字）。需要重新生成时运行：

```bash
npm run build:dict
```

脚本会把源数据下载到 `.cache/`，再按下面的规则处理：

- 释义：每个读音最多取 3 条，去掉字源说明、「姓」等条目，以及不适合儿童的释义
- 组词：按 jieba 词频排序，优先选两字词，去掉包含关系重复的词（比如有了「行政」就不再收「行政区」），多音字的每个读音至少保留 2 个词
- `scripts/blocked-words.txt` 和 `scripts/blocked-chars.txt`：屏蔽不适合儿童的词语和汉字
- `scripts/overrides.json`：手工修正个别字的释义（比如「的」「吗」「们」这类虚词）

笔顺数据来自 `hanzi-writer-data`，在 `npm run dev` 和 `npm run build` 之前会自动复制到 `public/data/strokes/`（这个目录不进 git）。

| 数据 | 来源 | 许可证 |
|---|---|---|
| 汉字、释义、词语拼音 | [mapull/chinese-dictionary](https://github.com/mapull/chinese-dictionary) | MIT |
| 词语表 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) | MIT |
| 词频 | [fxsjy/jieba](https://github.com/fxsjy/jieba) | MIT |
| 笔顺 | [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)（源自 Make Me a Hanzi） | Arphic Public License |

字典释义偏向传统辞书的写法，有些条目对孩子来说不太好懂。遇到这种情况，可以用「小墨讲给你听」，或者在 `overrides.json` 里手工修改。

## 项目结构

```
scripts/            字典生成、笔顺数据复制
public/data/chars/  生成好的字典数据
server/             Hono 后端：静态文件 + AI 讲解接口
src/
  views/            页面：首页（查字 + 学字）、生字本
  components/char/  字卡、组词、笔顺面板、AI 讲解
  components/common/ 吉祥物、星星
  composables/      字典加载、朗读、学习进度
  utils/            推荐字、贴纸、音效
```

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/features` | `{ "aiExplanation": true }`，表示是否开启了 AI 讲解 |
| GET | `/api/characters/{字}/explanation` | 返回 `{ meaning, memoryTip, sentence }`；字不在字典里返回 404，没有配置 Key 返回 503 |
