<script setup lang="ts">
import { watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true })

// "Offline ready" is informational: hide it on its own so it never covers the player controls
watch(offlineReady, (ready) => {
  if (ready) setTimeout(() => (offlineReady.value = false), 4000)
})

function close() {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <Transition name="fade">
    <div v-if="offlineReady || needRefresh" class="toast" role="status">
      <span v-if="needRefresh">发现新版本</span>
      <span v-else>已缓存，可离线使用 ✓</span>
      <button v-if="needRefresh" class="btn btn-sm btn-primary" @click="updateServiceWorker()">
        更新
      </button>
      <button class="btn btn-sm btn-ghost" @click="close">关闭</button>
    </div>
  </Transition>
</template>

<style scoped>
.btn-ghost {
  color: inherit;
}
</style>
