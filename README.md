# 小墨识字 🐼

给小朋友学写汉字的 Web 应用，针对平板（iPad / 安卓）的触屏操作做了优化。输入一个汉字，可以看到：

- **认一认**：拼音（多音字的每个读音分开列出）、部首、笔画数和简单释义，点一下就能朗读
- **组一组**：6–8 个常用词，上方标注拼音，点一下就能朗读；多音字的组词按读音分行显示
- **写一写**：在田字格里看笔顺动画、一笔一笔跟着学，或者自己用手指描红（写错时会给出提示）
- **小墨讲给你听**（可选）：由火山引擎的豆包大模型用孩子听得懂的话讲解字义，再给一个记字小窍门和一句例句

写完一个字会按出错次数得 1–3 颗星，并获得一张贴纸。生字本里能看到贴纸墙、连续学习天数和识字徽章，还可以挑星星少的字复习。

## 部署到 Cloudflare

整个应用跑在 Cloudflare Workers 上，不需要自己的服务器。免费版的额度对家庭使用来说足够：静态文件请求不限次数，接口每天 10 万次，KV 每天可写 1000 次。

AI 讲解用的 KV 缓存会在第一次部署时自动创建，不需要手动配置。

### 方式一：在 Cloudflare 控制台连接 GitHub（推荐，push 后自动上线）

1. Cloudflare 控制台 → **Workers & Pages** → **Create application** → **Import a repository**
   （注意选 Workers 下的这一项，不是 Pages）
2. 授权 GitHub，选择仓库 `hanzi-kids`
3. 项目设置：
   - Project name：**hanzi-kids**（必须和 `wrangler.jsonc` 里的 `name` 一致）
   - Build command：**npm run build**
   - Deploy command：**npx wrangler deploy**（默认值，不用改）
   - Production branch：选要上线的分支
4. 点 **Deploy**，等几分钟后拿到 `https://hanzi-kids.<你的子域名>.workers.dev` 地址
5. 进入这个 Worker → **Settings** → **Variables and Secrets** → **Add** → 类型选 **Secret**，名称填 `ARK_API_KEY`，值填火山方舟的 API Key（可选）

以后改了代码，push 到上线分支就会自动重新部署。

### 方式二：用命令行部署

需要 Node.js 20 或更高版本。

```bash
npm install
npx wrangler login                     # 浏览器里授权 Cloudflare 账号
npx wrangler secret put ARK_API_KEY    # 粘贴火山方舟的 API Key（可选）
npm run deploy
```

不设置 `ARK_API_KEY` 也能正常使用，只是不会显示「小墨讲给你听」按钮。

### 火山方舟 API Key

1. 登录 [火山方舟控制台](https://console.volcengine.com/ark)
2. 在「开通管理」里开通要用的模型（默认是 `doubao-seed-2-1-lite-260915`）
3. 在「API Key 管理」里创建一个 Key

想换模型的话，改 `wrangler.jsonc` 里的 `ARK_MODEL`，填控制台模型列表里的完整 Model ID，然后重新部署。程序会关闭模型的深度思考（`thinking: disabled`），让回答更快、更省钱。

AI 讲解的结果会缓存在 Cloudflare KV 里，同一个字只会调用一次模型，所以总花费有上限（字典一共 3498 个字）。

### 在 iPad 上使用

1. 在 iPad 的 Safari 里打开部署后的 `https://...workers.dev` 地址
2. 点「分享」→「添加到主屏幕」，之后从主屏幕打开就和普通 App 一样

查过的字会缓存在 iPad 上，之后断网也能打开。

## 本地开发

```bash
npm install
npm run dev            # 前端开发服务器 http://localhost:5173
```

要在本地调试 AI 讲解接口，先在项目根目录新建 `.dev.vars` 文件，写入 `ARK_API_KEY=你的Key`，然后另开一个终端：

```bash
npm run build && npm run dev:worker    # 本地 Worker，端口 8787，前端的 /api 请求会转发到这里
```

本地运行时，KV 用的是模拟存储，不会写到线上。

## 配置

| 名称 | 位置 | 说明 |
|---|---|---|
| `ARK_API_KEY` | `wrangler secret put` | 火山方舟 API Key，设置后开启 AI 讲解 |
| `ARK_MODEL` | `wrangler.jsonc` 的 `vars` | 模型 ID，默认 `doubao-seed-2-1-lite-260915` |
| `EXPLANATIONS` | `wrangler.jsonc` 的 `kv_namespaces` | AI 讲解缓存，首次部署时自动创建 |

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
worker/             Cloudflare Worker：AI 讲解接口（火山方舟）
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
| GET | `/api/characters/{字}/explanation` | 返回 `{ meaning, memoryTip, sentence }`；字不在字典里返回 404，没有配置 Key 返回 503，模型调用失败返回 502 |
