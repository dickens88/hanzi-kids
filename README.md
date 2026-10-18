# 小墨识字

给小朋友学写汉字的 Web 应用，针对平板（iPad / 安卓）的触屏操作做了优化。输入一个汉字，可以看到：

- **认一认**：拼音（多音字的每个读音分开列出）、部首、笔画数和简单释义，点一下就能朗读
- **组一组**：6–8 个常用词，上方标注拼音，点一下就能朗读；多音字的组词按读音分行显示
- **写一写**：在田字格里看笔顺动画、一笔一笔跟着学，或者自己用手指描红（写错时会给出提示）
- **小墨讲给你听**：由火山引擎的豆包大模型用孩子听得懂的话讲解字义，再给一个记字小窍门和一句例句

首页按课本选册、选课：默认是 2016 版统编教材二年级上册，显示「接着学」那一课的写字表（写一写）和识字表（认一认），每个字点开就能学。写完一个字会按出错次数得 1–3 颗星，并获得一张贴纸，还能直接跳到写字表里的下一个字。生字本里能看到贴纸墙、连续学习天数和识字徽章，还可以挑星星少的字复习。

网站主体是纯静态的，所有数据和学习进度都在浏览器里；只有「小墨讲给你听」走一个 Cloudflare Pages Function（`functions/api/explain.js`），由它拿着 API Key 去调用火山方舟。

## 部署到 Cloudflare Pages

1. GitHub 仓库准备好（就是这个仓库）
2. Cloudflare → Workers & Pages → Create → **Pages** → Connect to Git → 选中 `hanzi-kids`
3. 构建设置：
   - Framework preset: **None**
   - Build command: **npm run build**
   - Build output directory: **dist**
   - Production branch: **main**
4. Deploy，拿到 `xxx.pages.dev` 先自测
5. 想用自己的域名：Custom domains → 绑定域名（Cloudflare 自动签 HTTPS 证书）

以后更新：push 到 `main`，几分钟后自动上线。

Pages 免费版每次部署最多 2 万个文件，本项目约 7200 个。

## 在 iPad 上使用

1. 在 iPad 的 Safari 里打开部署后的地址
2. 点「分享」→「添加到主屏幕」，之后从主屏幕打开就和普通 App 一样

查过的字会缓存在 iPad 上，之后断网也能打开。

## AI 讲解

「小墨讲给你听」调用同域名下的 `/api/explain`。这个接口是 Cloudflare Pages Function，火山方舟的 API Key 只保存在 Cloudflare 上，浏览器拿不到。

部署前要在火山方舟准备好 Key：

1. 登录 [火山方舟控制台](https://console.volcengine.com/ark)
2. 在「开通管理」里开通要用的模型（默认是 `doubao-seed-2-1-lite-260915`）
3. 在「API Key 管理」里创建一个 Key

再到 Cloudflare → Workers & Pages → hanzi-kids → Settings 里配置（Production 环境）：

| 名称 | 类型 | 说明 |
|---|---|---|
| `ARK_API_KEY` | Variables and Secrets → **Secret** | 火山方舟 API Key，必填 |
| `ARK_MODEL` | Variables and Secrets → Text | 换模型时填方舟模型列表里的完整 ID，可不填 |
| `EXPLANATIONS` | Bindings → KV namespace | 按字缓存讲解结果，同一个字全站只调用一次模型；可不绑，但建议绑 |

改完设置后要重新部署一次（Deployments → 最新一次 → Retry deployment）才会生效。

防止接口被刷：

- 接口只接受一个汉字，prompt 和模型都写死在服务端；讲解依据的是网站自己的字典文件，不是请求里的内容
- 只接受本站页面发来的请求（检查 `Origin`）
- 建议在 Cloudflare → 域名 → Security → WAF → Rate limiting rules 加一条规则：路径等于 `/api/explain` 时按 IP 限速（比如每 10 秒 10 次），超出就 Block
- 改了 prompt 或模型后，把 `functions/api/explain.js` 里的 `CACHE_VERSION` 加一，旧缓存就不会再用了

讲解结果在每台设备上也会缓存一份（localStorage），看过的字不会重复请求。程序会关闭模型的深度思考，让回答更快、更省钱。

学习进度（星星、贴纸、连续天数）和选的课本同样保存在 localStorage 里，换设备或清除浏览器数据后会丢失。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev:functions  # 另开一个终端：构建并在 :8788 运行 Pages Function，dev 服务器会把 /api 转发过去
npm run build          # 构建到 dist/
npm run lint
```

本地调试 AI 讲解时，在项目根目录建一个 `.dev.vars` 文件（已在 `.gitignore` 里，不会提交），写一行 `ARK_API_KEY=你的Key`。

## 字典数据

`public/data/textbook.json` 是课本 12 册每课的写字表和识字表；`public/data/chars/` 下是字典数据，每个字一个 JSON 文件，覆盖《通用规范汉字表》中的 3500 个常用字（去掉了 2 个不适合儿童的字），再加上课本里有、但不在常用字表里的 97 个字。需要重新生成时运行（会先重建课本数据，再重建字典）：

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
| 课本写字表、识字表 | [fsiceangel/zishi](https://github.com/fsiceangel/zishi)（2016 版统编教材 1–6 年级 12 册，固定在提交 `5dc2df5`） | 仓库未声明许可证，仅供家庭学习使用 |
| 汉字、释义、词语拼音 | [mapull/chinese-dictionary](https://github.com/mapull/chinese-dictionary) | MIT |
| 词语表 | [pwxcoo/chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua) | MIT |
| 词频 | [fxsjy/jieba](https://github.com/fxsjy/jieba) | MIT |
| 兔子头像 | 由 `scripts/build-avatars.js` 生成的 20 个等级 SVG（`public/avatars/`） | — |
| 笔顺 | [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)（源自 Make Me a Hanzi） | Arphic Public License |

字典释义偏向传统辞书的写法，有些条目对孩子来说不太好懂。遇到这种情况，可以用「小墨讲给你听」，或者在 `overrides.json` 里手工修改。

## 项目结构

```
scripts/            课本数据和字典生成、笔顺数据复制
public/data/        生成好的课本数据（textbook.json）和字典数据（chars/）
src/
  views/            页面：首页（查字 + 学字）、生字本
  components/char/  字卡、组词、笔顺面板、AI 讲解
  components/textbook/ 课本选册选课
  components/common/ 吉祥物、星星
  composables/      字典加载、课本、朗读、学习进度、AI 讲解缓存
  utils/            贴纸、音效
functions/api/      Cloudflare Pages Function：/api/explain
server/             火山方舟接口和 prompt（只在 Function 里用）
```
