import DefaultTheme from 'vitepress/theme'
import SplashHome from './components/SplashHome.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SplashHome', SplashHome)
  },
}
