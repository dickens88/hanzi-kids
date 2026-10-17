<script setup>
import { reactive, ref } from 'vue'
import { useAiSettings } from '../../composables/useAiSettings.js'
import { loadChar } from '../../composables/useDict.js'
import { DEFAULT_MODEL, explainCharacter } from '../../utils/ark.js'

const emit = defineEmits(['close'])
const { settings } = useAiSettings()

const draft = reactive({ apiKey: settings.apiKey, model: settings.model })
const testing = ref(false)
const testResult = ref(null)

async function test() {
  testing.value = true
  testResult.value = null
  try {
    const result = await explainCharacter(await loadChar('森'), draft)
    testResult.value = { ok: true, text: `连接成功：${result.meaning}` }
  } catch (err) {
    // fetch throws TypeError when the request is blocked (CORS) or the network is down
    const text = err instanceof TypeError ? '请求被浏览器拦截或网络不通（可能是跨域限制）' : err.message
    testResult.value = { ok: false, text: `连接失败：${text}` }
  } finally {
    testing.value = false
  }
}

function save() {
  settings.apiKey = draft.apiKey.trim()
  settings.model = draft.model.trim() || DEFAULT_MODEL
  emit('close')
}

function clearKey() {
  draft.apiKey = ''
  settings.apiKey = ''
  testResult.value = null
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" @click.self="emit('close')">
    <div class="card w-full max-w-lg space-y-4">
      <h2 class="flex items-center gap-2 text-2xl font-black">
        <span class="material-symbols-rounded">settings</span>家长设置：AI 讲解
      </h2>
      <p class="text-base text-gray-500">
        填写火山方舟的 API Key 后，字卡里会出现「小墨讲给你听」。Key 只保存在这台设备的浏览器里，会直接发送给火山方舟。
      </p>
      <label class="block">
        <span class="mb-1 block font-bold">API Key</span>
        <input v-model="draft.apiKey" type="password" autocomplete="off" class="w-full rounded-2xl border-4 border-sun/50 bg-cream px-4 py-2 text-lg outline-none focus:border-sun" placeholder="粘贴火山方舟 API Key" />
      </label>
      <label class="block">
        <span class="mb-1 block font-bold">模型 ID</span>
        <input v-model="draft.model" autocomplete="off" class="w-full rounded-2xl border-4 border-sun/50 bg-cream px-4 py-2 text-lg outline-none focus:border-sun" :placeholder="DEFAULT_MODEL" />
      </label>
      <p v-if="testResult" class="rounded-2xl p-3 text-base break-all" :class="testResult.ok ? 'bg-leaf/15 text-leaf' : 'bg-berry/15 text-berry'">
        {{ testResult.text }}
      </p>
      <div class="grid grid-cols-3 gap-3">
        <button class="btn bg-sky text-white" :disabled="!draft.apiKey || testing" @click="test">
          <span class="material-symbols-rounded" :class="testing && 'animate-spin'">{{ testing ? 'progress_activity' : 'wifi_tethering' }}</span>测试
        </button>
        <button class="btn bg-gray-100" :disabled="!settings.apiKey && !draft.apiKey" @click="clearKey">
          <span class="material-symbols-rounded">delete</span>清除
        </button>
        <button class="btn bg-leaf text-white" @click="save">
          <span class="material-symbols-rounded">check</span>保存
        </button>
      </div>
    </div>
  </div>
</template>
