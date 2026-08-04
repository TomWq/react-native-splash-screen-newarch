import { defineConfig, type HeadConfig, type TransformContext } from 'vitepress'

const repository = 'https://github.com/TomWq/react-native-splash-screen-newarch'
const siteBase = '/react-native-splash-screen-newarch/'
const siteOrigin = `https://tomwq.github.io${siteBase}`
const previewImage = `${siteOrigin}splash-preview.png`

function pageRoute(relativePath: string): string {
  if (relativePath === 'index.md') return '/'
  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'index.md'.length)}`
  }
  return `/${relativePath.replace(/\.md$/, '')}`
}

function canonicalUrl(route: string): string {
  return `${siteOrigin}${route.replace(/^\//, '')}`
}

function pageDescription(context: TransformContext): string {
  if (context.pageData.description) return context.pageData.description
  return context.pageData.relativePath.startsWith('en/')
    ? 'Native splash screens for React Native and Expo, with New Architecture support, transitions, and startup metrics.'
    : '面向 React Native 与 Expo 的原生启动屏文档，支持新架构、隐藏动画和启动性能指标。'
}

function seoHead(context: TransformContext): HeadConfig[] {
  const route = pageRoute(context.pageData.relativePath)
  const isEnglish = route.startsWith('/en/')
  const alternateRoute = isEnglish
    ? route.replace(/^\/en/, '') || '/'
    : route === '/'
      ? '/en/'
      : `/en${route}`
  const canonical = canonicalUrl(route)
  const alternate = canonicalUrl(alternateRoute)
  const title = context.pageData.title || 'react-native-splash-screen-newarch'
  const description = pageDescription(context)

  return [
    ['link', { rel: 'canonical', href: canonical }],
    ['link', { rel: 'alternate', hreflang: isEnglish ? 'en' : 'zh-CN', href: canonical }],
    ['link', { rel: 'alternate', hreflang: isEnglish ? 'zh-CN' : 'en', href: alternate }],
    ['link', { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl('/') }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: canonical }],
    ['meta', { property: 'og:locale', content: isEnglish ? 'en_US' : 'zh_CN' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
  ]
}

const zhSidebar = [
  {
    text: '开始使用',
    items: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '兼容性与选型', link: '/guide/compatibility' },
    ],
  },
  {
    text: '原生接入',
    items: [
      { text: 'Expo 配置', link: '/guide/expo' },
      { text: 'Android 配置', link: '/guide/android' },
      { text: 'iOS 配置', link: '/guide/ios' },
    ],
  },
  {
    text: '体验与性能',
    items: [
      { text: '隐藏动画', link: '/guide/animations' },
      { text: '启动性能', link: '/guide/performance' },
    ],
  },
  {
    text: '参考',
    items: [
      { text: 'API', link: '/api/' },
      { text: '故障排查', link: '/troubleshooting' },
    ],
  },
]

const enSidebar = [
  {
    text: 'Start',
    items: [
      { text: 'Quick start', link: '/en/guide/getting-started' },
      { text: 'Compatibility and modes', link: '/en/guide/compatibility' },
    ],
  },
  {
    text: 'Native setup',
    items: [
      { text: 'Expo', link: '/en/guide/expo' },
      { text: 'Android', link: '/en/guide/android' },
      { text: 'iOS', link: '/en/guide/ios' },
    ],
  },
  {
    text: 'Experience and performance',
    items: [
      { text: 'Hide transitions', link: '/en/guide/animations' },
      { text: 'Startup performance', link: '/en/guide/performance' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'API', link: '/en/api/' },
      { text: 'Troubleshooting', link: '/en/troubleshooting' },
    ],
  },
]

export default defineConfig({
  title: 'react-native-splash-screen-newarch',
  description: 'React Native 与 Expo 原生启动屏组件文档',
  lang: 'zh-CN',
  base: siteBase,
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: siteOrigin },
  transformHead: seoHead,
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: `${siteBase}brand-icon.png` }],
    ['meta', { name: 'theme-color', content: '#16877f' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: previewImage }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: previewImage }],
  ],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'react-native-splash-screen-newarch',
      description: '面向 React Native 与 Expo 的原生启动屏组件。',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: 'Expo', link: '/guide/expo' },
          { text: 'API', link: '/api/' },
        ],
        sidebar: zhSidebar,
        outline: { label: '本页内容', level: [2, 3] },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: { text: '最后更新于' },
        returnToTopLabel: '返回顶部',
        sidebarMenuLabel: '目录',
        darkModeSwitchLabel: '外观',
        editLink: {
          pattern: `${repository}/edit/main/website/docs/:path`,
          text: '在 GitHub 上编辑此页',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'react-native-splash-screen-newarch',
      description: 'Native splash screens for React Native and Expo.',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Quick start', link: '/en/guide/getting-started' },
          { text: 'Expo', link: '/en/guide/expo' },
          { text: 'API', link: '/en/api/' },
        ],
        sidebar: enSidebar,
        outline: { label: 'On this page', level: [2, 3] },
        editLink: {
          pattern: `${repository}/edit/main/website/docs/:path`,
          text: 'Edit this page on GitHub',
        },
      },
    },
  },
  themeConfig: {
    logo: '/brand-icon.png',
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: repository }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © TomWq',
    },
  },
})
