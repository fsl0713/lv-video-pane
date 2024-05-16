import videoPane from './components/videoPane/index.vue';

const components = [
  videoPane
]

const install = function (Vue) {
  if (install.installed) return;
  install.installed = true;
  components.map(component => {
    Vue.component(component.name, component);
  })
}
export default {
  install,
  videoPane
}