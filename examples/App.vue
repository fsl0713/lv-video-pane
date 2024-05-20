<template>
  <div id="app">
    <div style="width: 1200px">
      <video-pane
        ref="videoPaneRef"
        :height="18" 
        :select-data="videoTypeList"
        template-type="1"
        :is-show-select="true"
        :endThreShold="24" />
      
      <div class="video-data" @click="handleClick">获取录像计划数据</div>
    </div>
  </div>
</template>

<script>
import videoPane from '../packages/components/videoPane/index.vue';
export default {
  name: 'App',
  components: {
    videoPane
  },
  data() {
    return {
      videoTypeList: [
        { label: "定时录像", value: "1", bgColor: "#637dec" },
        { label: "移动侦测录像", value: "2", bgColor: "#74b557" },
        { label: "报警录像", value: "3", bgColor: "#951d20" },
        { label: "移动侦测和报警同时触发 ", value: "4", bgColor: "#b9e2fe" },
      ], // 录像类型
    }
  },
  methods: {
    handleClick() {
      console.log(this.$refs.videoPaneRef.getValue())
    }
  },
}
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
}
#app {
  padding: 20px;
  padding-top: 150px;
}
.video-data {
  border: 1px solid #ccc; 
  text-align: center; 
  height: 30px; 
  line-height: 30px; 
  border-radius: 4px;
  cursor: pointer;
}
</style>
