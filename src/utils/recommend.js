// Common characters from primary school grades 1-3 textbooks
const CHARS = [...'春夏秋冬风雨雪花草树木林森山水河海天地日月星云光火土石田'
  + '爸妈爷奶哥姐弟妹朋友老师同学家门窗桌椅书本笔纸画字词句'
  + '猫狗鸟鱼虫马牛羊鸡鸭兔熊龙蛇猴虎'
  + '红黄蓝绿白黑大小多少高低长短快慢新旧美好'
  + '看听说读写走跑跳飞游唱笑哭吃喝玩想爱帮问答'
  + '上下左右前后里外东南西北早晚今明年'
  + '手口耳目头脚心身衣服米饭菜果瓜糖']

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// Picks the same characters for everyone on a given day.
export function dailyPicks(count, date = new Date()) {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const rand = seededRandom(seed)
  const pool = [...CHARS]
  const picks = []
  while (picks.length < count) picks.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])
  return picks
}
