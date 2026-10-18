import { computed, ref, watch } from 'vue'
import { useProgress } from './useProgress.js'

const KEY = 'hanzi-kids:book'

function readBook() {
  try {
    return localStorage.getItem(KEY) || '2a'
  } catch {
    return '2a'
  }
}

const books = ref([])
const bookId = ref(readBook())
let request = null

watch(bookId, (id) => {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // storage unavailable, choice lives for this session only
  }
})

export function lessonLabel(l) {
  const prefix = { 课文: `第 ${l.num} 课`, 识字: `识字 ${l.num}`, 汉语拼音: `拼音 ${l.num}` }[l.kind]
  return prefix ? `${prefix} ${l.title}` : l.title
}

export function useTextbook() {
  const { starsFor } = useProgress()

  request ??= fetch('/data/textbook.json')
    .then((res) => res.json())
    .then((data) => (books.value = data))
    .catch(() => (request = null))

  const book = computed(() => books.value.find((b) => b.id === bookId.value) || books.value[0] || null)
  const writeChars = computed(() => book.value?.lessons.flatMap((l) => l.xiezi) || [])

  // first lesson with a 写字表 character not practiced yet
  const currentLesson = computed(() => book.value?.lessons.find((l) => l.xiezi.some((c) => !starsFor(c))) || null)

  // next unpracticed 写字表 character after the given one, in textbook order
  function nextChar(char) {
    const list = writeChars.value
    const start = list.indexOf(char)
    return [...list.slice(start + 1), ...list.slice(0, Math.max(start, 0))].find((c) => c !== char && !starsFor(c)) || null
  }

  return { books, bookId, book, currentLesson, nextChar }
}
