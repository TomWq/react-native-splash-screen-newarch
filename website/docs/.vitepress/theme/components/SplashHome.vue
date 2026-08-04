<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = withDefaults(defineProps<{ locale?: 'zh' | 'en' }>(), {
  locale: 'zh',
})

const content = computed(() =>
  props.locale === 'en'
    ? {
        eyebrow: 'Native splash control for React Native 0.76+ and Expo SDK 52+',
        title: 'react-native-splash-screen-newarch',
        lead:
          'Keep native launch artwork visible until the first screen is ready, then leave with a measured, accessible transition.',
        start: 'Quick start',
        api: 'View API',
        npm: 'Open on npm',
        modesLabel: 'Choose the Android path that matches the product',
        modesTitle: 'Fast system launch or full-screen creative control.',
        modesLead:
          'Both modes share the same JavaScript API. The tradeoff is native startup work versus visual flexibility.',
        systemName: 'System mode',
        systemMeta: 'Centered logo + solid color',
        systemText:
          'Uses AndroidX SplashScreen and avoids inflating a full-screen layout or creating a Dialog.',
        systemLink: 'Optimize startup',
        dialogName: 'Dialog mode',
        dialogMeta: 'Full-screen artwork + transitions',
        dialogText:
          'Keeps the launch artwork in a native overlay and supports custom hide animations and show() after startup.',
        dialogLink: 'Configure Android',
        flowLabel: 'One handoff, three native phases',
        flowTitle: 'Keep the launch sequence continuous.',
        phases: [
          ['01', 'System launch', 'The operating system paints the earliest launch frame.'],
          ['02', 'Native retention', 'The package holds matching artwork while React Native starts.'],
          ['03', 'First screen', 'JavaScript calls hide() only when the initial UI is ready.'],
        ],
        installLabel: 'Install',
        installTitle: 'Start with one package.',
        installNote: 'Expo Go is not supported. Use prebuild or a development build.',
        installLink: 'Read the setup guide',
      }
    : {
        eyebrow: '适用于 React Native 0.76+ 与 Expo SDK 52+ 的原生启动屏控制',
        title: 'react-native-splash-screen-newarch',
        lead: '让原生启动画面一直保持到首屏真正准备完成，再用可测量、尊重系统偏好的动画自然退出。',
        start: '快速开始',
        api: '查看 API',
        npm: '前往 npm',
        modesLabel: '根据产品形态选择 Android 路径',
        modesTitle: '系统级快速启动，或完整的全屏视觉控制。',
        modesLead: '两种模式共用同一套 JavaScript API，区别在于原生启动开销与视觉自由度。',
        systemName: 'System 模式',
        systemMeta: '居中 Logo + 纯色背景',
        systemText: '直接使用 AndroidX SplashScreen，不创建 Dialog，也不加载全屏启动 layout。',
        systemLink: '优化启动速度',
        dialogName: 'Dialog 模式',
        dialogMeta: '全屏图片 + 隐藏动画',
        dialogText: '用原生覆盖层继续保持启动画面，支持自定义隐藏动画，也支持启动后再次 show()。',
        dialogLink: '配置 Android',
        flowLabel: '一次衔接，三个原生阶段',
        flowTitle: '让启动过程保持连续。',
        phases: [
          ['01', '系统启动画面', '操作系统负责绘制最早出现的启动帧。'],
          ['02', '原生画面保持', 'React Native 启动时，组件继续显示匹配的原生画面。'],
          ['03', '首屏接管', '初始 UI 准备完成后，JavaScript 再调用 hide()。'],
        ],
        installLabel: '安装',
        installTitle: '从一个包开始。',
        installNote: '不支持 Expo Go；Expo 项目需要使用 prebuild 或 development build。',
        installLink: '阅读接入指南',
      }
)

const prefix = props.locale === 'en' ? '/en' : ''
const docsLink = (path: string) => withBase(`${prefix}${path}`)
</script>

<template>
  <main class="splash-home">
    <section class="splash-hero">
      <div class="splash-hero__inner">
        <p class="splash-eyebrow">{{ content.eyebrow }}</p>
        <h1>{{ content.title }}</h1>
        <p class="splash-hero__lead">{{ content.lead }}</p>
        <div class="splash-actions">
          <a class="splash-action splash-action--primary" :href="docsLink('/guide/getting-started')">
            {{ content.start }}
          </a>
          <a class="splash-action" :href="docsLink('/api/')">{{ content.api }}</a>
          <a class="splash-text-link" href="https://www.npmjs.com/package/react-native-splash-screen-newarch">
            {{ content.npm }}
          </a>
        </div>
        <div class="splash-compat" aria-label="Compatibility">
          <span>New Architecture</span>
          <span>Bridge fallback</span>
          <span>Expo config plugin</span>
        </div>
      </div>
    </section>

    <section class="splash-section splash-section--modes">
      <div class="splash-section__intro">
        <p class="splash-section__label">{{ content.modesLabel }}</p>
        <h2>{{ content.modesTitle }}</h2>
        <p>{{ content.modesLead }}</p>
      </div>
      <div class="splash-mode-grid">
        <article class="splash-mode splash-mode--system">
          <div class="splash-mode__number">01</div>
          <p class="splash-mode__meta">{{ content.systemMeta }}</p>
          <h3>{{ content.systemName }}</h3>
          <p>{{ content.systemText }}</p>
          <a :href="docsLink('/guide/performance')">{{ content.systemLink }}</a>
        </article>
        <article class="splash-mode splash-mode--dialog">
          <div class="splash-mode__number">02</div>
          <p class="splash-mode__meta">{{ content.dialogMeta }}</p>
          <h3>{{ content.dialogName }}</h3>
          <p>{{ content.dialogText }}</p>
          <a :href="docsLink('/guide/android')">{{ content.dialogLink }}</a>
        </article>
      </div>
    </section>

    <section class="splash-section splash-flow">
      <div class="splash-section__intro">
        <p class="splash-section__label">{{ content.flowLabel }}</p>
        <h2>{{ content.flowTitle }}</h2>
      </div>
      <ol class="splash-flow__steps">
        <li v-for="phase in content.phases" :key="phase[0]">
          <span>{{ phase[0] }}</span>
          <h3>{{ phase[1] }}</h3>
          <p>{{ phase[2] }}</p>
        </li>
      </ol>
    </section>

    <section class="splash-install">
      <div>
        <p class="splash-section__label">{{ content.installLabel }}</p>
        <h2>{{ content.installTitle }}</h2>
        <p>{{ content.installNote }}</p>
      </div>
      <div class="splash-install__command">
        <code>npm install react-native-splash-screen-newarch</code>
        <a :href="docsLink('/guide/getting-started')">{{ content.installLink }}</a>
      </div>
    </section>
  </main>
</template>
