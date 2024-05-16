<template>
  <div class="video-pane-component">
    <div class="calibration">
      <span
        class="calibration-item"
        v-for="(item, index) in calibration" 
        :key="index"
        :style="{ width: setConbitionWidth(item) }">
        <span class="cab-text">{{ index * 2 }}</span>
      </span>
    </div>
    <div :id="el" />
    <!-- 轨道 start -->
    <div
      ref="parentCanvas"
      class="canvas-container"
      :style="canvasStyle"
      @mousedown="parentMouseDown">
        <!-- 滑块 start -->
        <div 
          v-for="item in videoArr" 
          :key="item.typeIndex"
          class="canvas-items"
          :style="{'left': item.startX + 'px', 'width': item.width + 'px'}"
          @click.stop="handleItemClick(item)"
          @dblclick.stop="handleItemDbClick(item)">
            <!-- 片段 start -->
            <div 
              class="middle-canvas"
              @mouseenter="handleVideoEnter(item)"
              @mouseleave="handleVideoLeave(item)"
              @mousedown.stop="(e) => middleMouseDown(e, item)"
              :style="{'background': setPaneStyle(item)}">
            </div>
            <!-- 片段 end -->
            <!-- 左右缩放 start -->
            <div
              v-show="item.isResize" 
              class="handle handle-ll" 
              @mousedown.stop="(e) => handleResizeDown(e, item, 'left')">
              <span v-show="item.isTipTrue" class="left-text">{{setTips(item, 'left')}}</span>
            </div>
            <div
              v-show="item.isResize"
              class="handle handle-rl"
              :style="{'left': item.width - 5 + 'px'}" 
              @mousedown.stop="(e) => handleResizeDown(e, item, 'right')">
              <span v-show="item.isTipTrue" class="right-text">{{setTips(item, 'right')}}</span>
            </div>
            <!-- 左右缩放 end -->
            <!-- 中间tips start -->
            <div
              v-show="item.isTiphover"
              class="center-tips">
              <span v-if="isShowSelect">{{setVideoType(item)}}</span>
              <span>{{setTips(item, 'left')}} - {{setTips(item, 'right')}}</span>
            </div>
            <!-- 中间tips end -->
            <!-- 中间模态框 start -->
            <div
              v-show="item.isModal" 
              class="modal-container" @click.stop>
              <div class="modal-header">
                <i  class="el-icon-close"  @click="handleClose(item)"></i>
              </div>
              <div class="modal-body">
                <div v-if="isShowSelect" class="modal-select">
                  <el-select 
                    v-model="item.checkedItem"
                    style="width: 100%;">
                    <el-option
                      v-for="(item, index) in selectData"
                      :key="index"
                      :label="item.label"
                      :value="item.value" />
                  </el-select>
                </div>
                <div class="modal-input">
                  <el-input-number
                    v-model="item.starthour"
                    :min="0" 
                    :max="23" 
                    :controls="false"
                    maxlength="2"
                    placeholder="时" />
                  <span style="padding: 0 5px">:</span>
                  <el-input-number
                    v-model="item.startminute"
                    :min="0" 
                    :max="59" 
                    maxlength="2" 
                    :controls="false"
                    placeholder="分" />
                  <template v-if="isShowSecond">
                    <span style="padding: 0 5px">:</span>
                    <el-input-number
                      v-model="item.startsecond"
                      :min="0" 
                      :max="59" 
                      maxlength="2" 
                      :controls="false"
                      placeholder="秒" />
                  </template>
                  <span style="padding: 0 5px">-</span>
                  <el-input-number
                    v-model="item.endhour"
                    :min="0" 
                    :max="23" 
                    maxlength="2" 
                    :controls="false"
                    placeholder="时" />
                  <span style="padding: 0 5px">:</span>
                  <el-input-number
                    v-model="item.endminute"
                    :min="0" 
                    :max="59" 
                    maxlength="2" 
                    :controls="false"
                    placeholder="分" />
                  <template v-if="isShowSecond">
                    <span style="padding: 0 5px">:</span>
                    <el-input-number
                      v-model="item.endsecond"
                      :min="0" 
                      :max="59" 
                      maxlength="2" 
                      :controls="false"
                      placeholder="秒" />
                  </template>
                </div>
              </div>
              <div class="modal-footer">
                <span @click.stop="handleDel(item)">删除</span>
                <span class="videoPaneSubmit dialog-sureBtn" @click.stop="handleSubmit(item)">确定</span>
              </div>
           </div>
            <!-- 中间模态框 end -->
        </div>
        <!-- 滑块 end -->
    </div>
    <!-- 轨道 end -->
  </div>
</template>
<script>
import _ from "lodash";
export default {
  name: 'videoPane',
  props: {
    el: { type: String, default: () => 'canvas' }, // canvas的id
    height: { type: Number, default: () => 22 }, // canvas的高度
    maxScale: { type: Number, default: () => 13 }, // 最大刻度
    background: { type: String, default: () => '#ccc' }, // 刻度尺背景
    backArr: { type: Array, default: () => [] }, // 后端返回的数组
    selectData: { type: Array, default: () => [] }, // 下拉选项框的数据
    templateType: { type: String, default: () => '' }, // 选择的模版(模版的颜色)
    mode: { type: String, default: () => 'operation' }, // 当前模式，操作：operation， 查看: view
    isShowSelect: { type: Boolean, default: () => true }, // 是否展示下拉框
    isShowSecond: { type: Boolean, default: () => false }, // 是否展示秒
  },
  data() {
    return {
      container: null, // container
      canvasheight: 10, // canvas的height
      width: null, // 当前的宽度
      calibration: this.maxScale, // 刻度数
      mouseDownStartX: 0, // 鼠标按下距离左边的距离
      mouseDownPagex: 0, // 鼠标按下距离可视页面左边的距离
      mouseMoveX: 0, // 移动的距离(鼠标距离可视页面左边的距离)
      videoArr: [], // 录像片段
      type: "", // 当前鼠标按下的是哪种类型
      mouseResizeDownOffsetWidth: 0, // 缩放大小鼠标按下该片段的宽度
      mouseResizeDownPageX: 0, // 缩放大小鼠标按下的pagex
      mouseResizeDownMoveX: 0, // 缩放大小鼠标移动的pagex
      mouseResizeDownStartX: 0, // 缩放大小鼠标按下距离左边的距离
      operationCurrentItem: {}, // 操作当前的片段对象
      leftCriticalValue: [], // 左边临界值
      rightCriticalValue: [], // 右边临界值
      checkSelectType: "", // 选中的录像类型
      isMouseDown: false, // 判断当前鼠标是否按下
    }
  },
  computed: {
    canvasStyle() {
      return {
        background: this.background,
        height: this.height + "px",
      };
    },
    setConbitionWidth() {
      let width = 0;
      return (item) => {
        if (this.width) {
          if (this.maxScale == item) {
            width = "0px";
          } else {
            width = (this.width / (this.maxScale - 1)).toFixed(2) + "px";
          }
        }
        return width;
      };
    },
    setPaneStyle() {
      return (item) => {
        let obj = this.selectData.find((v) => v.value == item.checkedItem);
        return obj ? obj.bgColor : 'green';
      };
    },
    setVideoType() {
      return (item) => {
        let obj = this.selectData.find((v) => v.value == item.checkedItem);
        return obj ? obj.label : '';
      };
    },
  },
  watch: {
    backArr: {
      handler(newVal) {
        if (newVal) {
          this.videoArr = JSON.parse(JSON.stringify(newVal));
        }
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    this.initCanvas(); // 初始化canvas
    this.widthResize();
    // 监听窗口发生变化
    window.addEventListener("resize", this.widthResize);
    // 监听鼠标移动事件
    document.addEventListener("mousemove", this.handleDocumentMove);
    // 监听鼠标弹起事件
    document.addEventListener("mouseup", this.handleDoucmentUp);
    // 监听document点击事件
    document.addEventListener("click", this.handleDocumentClick);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.widthResize);
    // 移除document鼠标移动事件
    document.removeEventListener("mousemove", this.handleDocumentMove);
    // 移除doucument鼠标弹起事件
    document.removeEventListener("mouseup", this.handleDoucmentUp);
    // 移出document点击事件
    document.removeEventListener("click", this.handleDocumentClick);
  },
  methods: {
    widthResize: _.debounce(function () {
      this.updateCanvas();
    }, 300),
    // 设置时间
    setTips(item, type) {
      if (type === "left") {
        let str = "";
        if (item.startTime) {
          str = item.startTime;
        } else {
          let leftX = (item.startX * (this.maxScale - 1) * 2) / this.width;
          str = this.translateDate(leftX.toFixed(3));
        }
        return str;
      } else if (type === "right") {
        let str2 = "";
        if (item.endTime) {
          str2 = item.endTime;
        } else {
          let rightX = ((item.startX + item.width) * (this.maxScale - 1) * 2) / this.width;
          str2 = this.translateDate(rightX.toFixed(3));
        }
        return str2;
      }
    },
    // 监听document点击事件
    handleDocumentClick(e) {
      let event = e || window.event;
      if (
        Object.prototype.toString.call(event.target.className) === "[object String]" &&
        event.target.className != "middle-canvas"
      ) {
        this.videoArr.forEach((item) => {
          item.isResize = false;
        });
      }
    },
    // 初始化canvas
    initCanvas() {
      this.container = document.querySelector(`#${this.el}`);
      this.width = this.container && this.container.offsetWidth;
    },
    // 修改canvas画布
    updateCanvas() {
      this.container = document.querySelector(`#${this.el}`);
      this.width = this.container && this.container.offsetWidth;
    },
    // 父级鼠标按下
    parentMouseDown(e) {
      if (this.mode === "view") return;
      this.isMouseDown = true;
      let event = e || window.event;
      event.stopPropagation();
      // 如果不是在父上按下，直接return
      if (event.target != this.$refs.parentCanvas) {
        return;
      }
      this.type = "create"; // 表示创建片段的类型
      // 鼠标距离左边为0刻度的距离
      this.mouseDownStartX = event.offsetX;
      // 鼠标距离可视页面最左边的距离
      this.mouseDownPagex = event.pageX;
      // 创建一天元素
      let startTime = this.setTips({ startX: event.offsetX }, "left");
      let endTime = this.setTips({ startX: event.offsetX, width: 0 }, "right");
      let obj = {
        typeIndex: this.videoArr.length + 1, // 唯一键id
        width: 0, // 方块的宽度
        startX: event.offsetX, // 方块距离左边0刻度的距离
        startTime: startTime, // 开始时间
        endTime: endTime, // 结束时间
        isModal: false, // 当前的弹窗是否显示
        isTiphover: false, // 中间的tip是否显示
        isTipTrue: false, // 两端tip是否显示
        isResize: false, // 两端缩放是否显示
        checkedItem: this.templateType, // 选中的录像类型
        starthour: this.calcuteTime(startTime, "hour"), // 弹窗里开始时间的时
        startminute: this.calcuteTime(startTime, "minute"), // 弹窗里开始时间的分
        startsecond: this.calcuteTime(startTime, 'second'), // 弹窗里开始时间的秒
        endhour: this.calcuteTime(endTime, "hour"), // 弹窗里结束时间的时
        endminute: this.calcuteTime(endTime, "minute"), // 弹窗里结束时间的分
        endsecond: this.calcuteTime(endTime, 'second'), // 弹窗里结束时间的秒
      };
      // 创建一个录像计划片段
      this.videoArr.push(obj);
    },
    // 鼠标在文档中移动
    handleDocumentMove(e) {
      if (this.isMouseDown) {
        let event = e || window.event;
        if (this.type === "create") {
          // 当前是创建片段
          // 鼠标距离左边可视页面的距离
          this.mouseMoveX = event.pageX;
          this.videoArr.forEach((item) => {
            if (Number(item.typeIndex) === this.videoArr.length) {
              if (this.mouseMoveX <= this.mouseDownPagex || this.mouseMoveX - this.mouseDownPagex <= 2) {
                item.width = 0;
                return;
              }
              item.isTipTrue = true;
              item.isTiphover = true;
              // 修改刚才创建的数组
              this.createVideoPine(item);
            }
          });
        } else if (this.type === "resize") {
          // 当前是修改片段
          this.mouseResizeDownMoveX = event.pageX;
          if (JSON.stringify(this.operationCurrentItem) != "{}") {
            this.videoArr.forEach((item) => {
              if (Number(item.typeIndex) === Number(this.operationCurrentItem.value.typeIndex)) {
                item.isTipTrue = true;
                // 修改录像片段
                this.updateVideoPine(item, this.operationCurrentItem.type);
              }
            });
          }
        } else if (this.type === "move") {
          // 移动当前片段
          this.mouseResizeDownMoveX = event.pageX;
          if (JSON.stringify(this.operationCurrentItem) != "{}") {
            this.videoArr.forEach((item) => {
              if (Number(item.typeIndex) === Number(this.operationCurrentItem.value.typeIndex)) {
                // 移动当前录像片段
                this.moveVideoPine(item);
              }
            });
          }
        }
      }
    },
    // 鼠标在文档中弹起
    handleDoucmentUp() {
      this.isMouseDown = false;
      this.type = "";
      this.videoArr.forEach((item, index) => {
        item.isTipTrue = false;
        item.isTiphover = false;
        item.isResize = false;
        if (item.width == 0) {
          this.videoArr.splice(index, 1);
        }
      });
    },
    // 创建一个录像计划片段
    createVideoPine(obj) {
      // 查找所有片段最开始的起始位置
      let rightEndX = [];
      this.videoArr.forEach((item) => {
        rightEndX.push(item.startX);
      });
      // 查找比当前大于的片段
      let rightEndMinX = [];
      rightEndX.forEach((item) => {
        if (item > obj.startX) {
          rightEndMinX.push(item);
        }
      });
      let width = this.mouseMoveX - this.mouseDownPagex;
      if (rightEndMinX.length > 0) {
        // 说明左边还有其他片段
        if (obj.startX + width >= Math.min.apply(null, rightEndMinX)) {
          width = Math.min.apply(null, rightEndMinX) - obj.startX;
        }
      } else {
        // 否则没有其他片段，可以拉到底
        if (width + obj.startX >= this.width) {
          width = this.width - obj.startX;
        }
      }
      obj.endTime = this.setTips({startX: obj.startX, width: width}, 'right');
      obj.endhour = this.calcuteTime(obj.endTime, 'hour');
      obj.endminute = this.calcuteTime(obj.endTime, 'minute');
      obj.endsecond = this.calcuteTime(obj.endTime, 'second');
      obj.width = Math.abs(width);
    },
    // 过滤片段右边临界值
    handleRightCommonPine(obj, width) {
      // 找到过滤其实位置中最小的位置，当前创建的片段结束距离不能大于过滤后的最小的起始位置
      if (this.leftCriticalValue.length > 0) {
        // 如果大于0，说明右边有片段
        // 表示当前创建的结束位置距离 大于等于 过滤后最小的值
        if (width + obj.startX >= Math.min.apply(null, this.leftCriticalValue)) {
          width = Math.min.apply(null, this.leftCriticalValue) - obj.startX;
        }
      } else {
        // 否则没有片段
        if (width + obj.startX >= this.width) {
          width = this.width - obj.startX;
        }
      }
      return width;
    },
    // 过滤左边临界值
    handleLeftCommonPine(obj, width, startX) {
      if (this.rightCriticalValue.length > 0) {
        // 说明左边有片段
        if (startX <= Math.max.apply(null, this.rightCriticalValue)) {
          startX = Math.max.apply(null, this.rightCriticalValue);
          width = this.mouseResizeDownOffsetWidth + (this.mouseResizeDownStartX - startX);
        }
      } else {
        // 左边没有任何片段
        if (startX <= 0) {
          startX = 0;
          width = this.mouseResizeDownStartX + this.mouseResizeDownOffsetWidth;
        }
      }
      return {
        LeftstartX: startX,
        Leftwidth: width,
      };
    },
    // 查找相关临界值
    handleRelativeValue(obj, type) {
      // 查询起始位置比当前位置大的元素的起始值
      if (type == "start") {
        let leftStartX = [];
        this.videoArr.forEach((item) => {
          leftStartX.push(item.startX);
        });
        // 查找比当前片段大的起始位置
        let leftMaxs = [];
        leftStartX.forEach((item) => {
          if (obj.startX < item && obj.startX != item) {
            leftMaxs.push(item);
          }
        });
        return leftMaxs;
      } else if (type == "end") {
        // 查询当前所有的结束片段
        let rightEndX = [];
        this.videoArr.forEach((item) => {
          rightEndX.push(item.startX + item.width);
        });
        // 查找比当前起始小于的结束片段
        let rightEndMinX = [];
        rightEndX.forEach((item) => {
          if (item <= obj.startX) {
            rightEndMinX.push(item);
          }
        });
        return rightEndMinX;
      }
    },
    // 修改录像片段
    updateVideoPine(obj, type) {
      let width = 0;
      let startX = 0;
      obj.isModal = false;
      if (type === "right") {
        // 表示操作的是右边的缩放
        width = this.mouseResizeDownOffsetWidth + this.mouseResizeDownMoveX - this.mouseResizeDownPageX;
        if (this.mouseResizeDownMoveX - this.mouseResizeDownPageX <= 0) {
          // 操作右边往左滑动
          // 当距离自己左边片段很近的时候，并且值为1的时候，此时不能在往左滑动
          if (width <= 1) {
            width = 1;
          }
        } else {
          // 操作右边往右滑动
          width = this.handleRightCommonPine(obj, width);
        }
        obj.width = Math.abs(width);
        obj.endTime = this.setTips({ startX: obj.startX, width: width }, "right");
        obj.endhour = this.calcuteTime(obj.endTime, "hour");
        obj.endminute = this.calcuteTime(obj.endTime, "minute");
        obj.endsecond = this.calcuteTime(obj.endTime, 'second');
      } else if (type === "left") {
        // 表示操作的是左边的缩放
        width = this.mouseResizeDownOffsetWidth + this.mouseResizeDownPageX - this.mouseResizeDownMoveX;
        startX = this.mouseResizeDownStartX - (this.mouseResizeDownPageX - this.mouseResizeDownMoveX);
        if (this.mouseResizeDownMoveX - this.mouseResizeDownPageX <= 0) {
          // 操作左边往左滑动
          let { LeftstartX, Leftwidth } = this.handleLeftCommonPine(obj, width, startX);
          width = Leftwidth;
          startX = LeftstartX;
        } else {
          // 操作左边往右滑动
          if (width <= 1) {
            width = 1;
            startX = this.mouseResizeDownStartX + this.mouseResizeDownOffsetWidth - 1;
          }
        }
        obj.startX = startX;
        obj.width = Math.abs(width);
        obj.startTime = this.setTips({ startX: startX }, "left");
        obj.starthour = this.calcuteTime(obj.startTime, "hour");
        obj.startminute = this.calcuteTime(obj.startTime, "minute");
        obj.startsecond = this.calcuteTime(obj.startTime, 'second');
      }
    },
    // 鼠标移入
    handleVideoEnter(item) {
      item.isTiphover = true;
    },
    // 鼠标移出
    handleVideoLeave(item) {
      item.isTiphover = false;
    },
    // 点击当前item
    handleItemClick(item) {
      if (this.mode === "view") return;
      this.isMouseDown = true;
      this.videoArr.forEach((v) => {
        v.isResize = false;
        v.isModal = false;
        v.isTipTrue = false;
        v.isTiphover = false;
        if (item.typeIndex == v.typeIndex) {
          v.isResize = true;
        }
      });
    },
    // 双击当前item
    handleItemDbClick(item) {
      if (this.mode === "view") return;
      this.isMouseDown = false;
      this.checkSelectType = item.checkedItem;
      this.videoArr.forEach((v) => {
        v.isResize = false;
        v.isModal = false;
        v.isTipTrue = false;
        v.isTiphover = false;
        if (item.typeIndex == v.typeIndex) {
          v.isModal = true;
        }
      });
    },
    // 两边缩放鼠标按下事件
    handleResizeDown(e, item, type) {
      this.type = "resize"; // 表示重置大小的类型
      let event = e || window.event;
      event.stopPropagation();
      this.mouseResizeDownOffsetWidth = item.width;
      this.mouseResizeDownStartX = item.startX;
      this.mouseResizeDownPageX = event.pageX;
      this.operationCurrentItem = {
        value: item,
        type,
      };
      this.leftCriticalValue = this.handleRelativeValue(item, "start");
      this.rightCriticalValue = this.handleRelativeValue(item, "end");
    },
    // 将小数转换为点
    translateDate(item) {
      let s = item * 3600;
      let hour = Math.floor(s / 3600);
      let minute = Math.floor((s % 3600) / 60);
      let second = Math.floor(s % 60);
      hour = hour >= 10 ? hour : '0' + hour;
      minute = minute >= 10 ? minute : '0' + minute;
      second = second >= 10 ? second : '0' + second;
      if(Number(hour) >= 24 && Number(minute) === 0 && Number(second) === 0) {
        return this.isShowSecond ? '23:59:59' : '23:59';
      } else {
        return this.isShowSecond ? hour + ":" + minute + ":" + second : hour + ":" + minute;
      }
    },
    // 片段按下
    middleMouseDown(e, item) {
      this.type = "move";
      let event = e || window.event;
      event.stopPropagation();
      this.mouseResizeDownOffsetWidth = item.width;
      this.mouseResizeDownStartX = item.startX;
      this.mouseResizeDownPageX = event.pageX;
      this.operationCurrentItem = {
        value: item,
      };
      this.leftCriticalValue = this.handleRelativeValue(item, "start");
      this.rightCriticalValue = this.handleRelativeValue(item, "end");
    },
    // 移动录像片段
    moveVideoPine(obj) {
      obj.isModal = false;
      obj.startX = this.mouseResizeDownStartX + this.mouseResizeDownMoveX - this.mouseResizeDownPageX;
      if (this.mouseResizeDownMoveX - this.mouseResizeDownPageX > 0) {
        // 表示往右移动
        if (this.leftCriticalValue.length > 0) {
          // 说明右边有其他片段
          if (obj.startX + obj.width >= Math.min.apply(null, this.leftCriticalValue)) {
            obj.startX = Math.min.apply(null, this.leftCriticalValue) - obj.width;
          }
        } else {
          // 否则没有其他片段，可以拉到底
          if (obj.startX + obj.width >= this.width) {
            obj.startX = this.width - obj.width;
          }
        }
      } else {
        // 表示往左移动
        if (this.rightCriticalValue.length > 0) {
          // 说明左边有其他片段
          if (obj.startX <= Math.max.apply(null, this.rightCriticalValue)) {
            obj.startX = Math.max.apply(null, this.rightCriticalValue);
          }
        } else {
          // 可以拉到最左边
          if (obj.startX <= 0) {
            obj.startX = 0;
          }
        }
      }
      obj.startTime = this.setTips({ startX: obj.startX }, "left");
      obj.endTime = this.setTips({ startX: obj.startX, width: obj.width }, "right");
      obj.starthour = this.calcuteTime(obj.startTime, "hour");
      obj.startminute = this.calcuteTime(obj.startTime, "minute");
      obj.startsecond = this.calcuteTime(obj.startTime, "second");
      obj.endhour = this.calcuteTime(obj.endTime, "hour");
      obj.endminute = this.calcuteTime(obj.endTime, "minute");
      obj.endsecond = this.calcuteTime(obj.endTime, "second");
    },
    // 关闭模态框
    handleClose(item) {
      item.isModal = false;
      item.starthour = this.calcuteTime(item.startTime, "hour");
      item.startminute = this.calcuteTime(item.startTime, "minute");
      item.startsecond = this.calcuteTime(item.startTime, "second");
      item.endhour = this.calcuteTime(item.endTime, "hour");
      item.endminute = this.calcuteTime(item.endTime, "minute");
      item.endsecond = this.calcuteTime(item.endTime, "second");
      item.checkedItem = this.checkSelectType === "" ? item.checkedItem : this.checkSelectType;
    },
    // 查找精确到秒的临界点
    handleVideoSecondPaneTime(item, type) {
      const starthour = this.calcuteTime(item.startTime, "hour");
      const startminute = this.calcuteTime(item.startTime, "minute");
      const startsecond = this.calcuteTime(item.startTime, "second");
      const startTs = Number(starthour) * 3600 + Number(startminute) * 60 + Number(startsecond);
      const startLeftX = (startTs / 3600).toFixed(3)
      const endhour = this.calcuteTime(item.endTime, "hour");
      const endminute = this.calcuteTime(item.endTime, "minute");
      const endsecond = this.calcuteTime(item.endTime, "second");
      const endTs = Number(endhour) * 3600 + Number(endminute) * 60 + Number(endsecond);
      const endLeftX = (endTs / 3600).toFixed(3);
      const funcPane = {
        startFunc() {
          // 拿到所有片段的起始距离
          let leftArrStartX = [];
          this.videoArr.forEach(vItem => {
            const leftAllStartHour = this.calcuteTime(vItem.startTime, "hour");
            const leftAllStartMinute = this.calcuteTime(vItem.startTime, "minute");
            const leftAllStartSecond = this.calcuteTime(vItem.startTime, "second");
            const startS = Number(leftAllStartHour) * 3600 + Number(leftAllStartMinute) * 60 + Number(leftAllStartSecond);
            const leftX = (startS / 3600).toFixed(3);
            leftArrStartX.push(leftX);
          });
          // 查找比当前片段大的起始位置
          let leftMaxs = [];
          leftArrStartX.forEach(vItem => {
            if(Number(startLeftX) < Number(vItem) && Number(vItem) != Number(startLeftX)) {
              leftMaxs.push(vItem);
            }
          });
          return leftMaxs;
        },
        endFunc() {
          // 查找所有的结束片段
          let rightEndX = [];
          this.videoArr.forEach(vItem => {
            const rightAllStartHour = this.calcuteTime(vItem.endTime, "hour");
            const rightAllStartMinute = this.calcuteTime(vItem.endTime, "minute");
            const rightAllStartSecond = this.calcuteTime(vItem.endTime, "second");
            const startS = Number(rightAllStartHour) * 3600 + Number(rightAllStartMinute) * 60 + Number(rightAllStartSecond);
            const rightX = (startS / 3600).toFixed(3);
            rightEndX.push(rightX);
          });
          // 查找比当前片段小于的结束片段
          let rightMaxs = [];
          rightEndX.forEach(vItem => {
            if(Number(vItem) < Number(endLeftX) && Number(vItem) != Number(endLeftX)) {
              rightMaxs.push(vItem);
            }
          });
          return rightMaxs;
        }
      };
      return funcPane[type].apply(this);
    },
    // 查找精确到分的临界点
    handleVideoMinutePaneTime(item, type) {
      const starthour = this.calcuteTime(item.startTime, "hour");
      const startminute = this.calcuteTime(item.startTime, "minute");
      const endhour = this.calcuteTime(item.endTime, "hour");
      const endminute = this.calcuteTime(item.endTime, "minute");
      const startTime = Number(starthour + "." + startminute);
      const endTime = Number(endhour + "." + endminute);
      const funcPane = {
        startFunc() {
          // 拿到所有片段起始位置
          let leftAllStartTime = [];
          this.videoArr.forEach(vItem => {
            const leftAllStartHour = this.calcuteTime(vItem.startTime, "hour");
            const leftAllStartMinute = this.calcuteTime(vItem.startTime, "minute");
            leftAllStartTime.push(Number(leftAllStartHour + "." + leftAllStartMinute));
          });
          // 查找比当前片段大的起始时间
          let leftMaxs = [];
          leftAllStartTime.forEach(vItem => {
            if(startTime < vItem && vItem != startTime) {
              leftMaxs.push(vItem);
            }
          });
          return leftMaxs;
        },
        endFunc() {
          // 拿到当前所有的结束片段
          let rightEndX = [];
          this.videoArr.forEach(vItem => {
            const rightAllEndHour = this.calcuteTime(vItem.endTime, "hour");
            const rightAllEndMinute = this.calcuteTime(vItem.endTime, "minute");
            rightEndX.push(Number(rightAllEndHour + "." + rightAllEndMinute));
          });
          // 查找比当前片段小于的结束片段
          let rightMaxs = [];
          rightEndX.forEach(vItem => {
            if(vItem < endTime && vItem != endTime) {
              rightMaxs.push(vItem);
            }
          });
          return rightMaxs;
        }
      };
      return funcPane[type].apply(this);
    },
    // 模态框确定
    handleSubmit(item) {
      if(this.isShowSecond) {
        // 如果精确到秒
        this.setValueHourMinuteSecond(item);
      } else {
        // 如果精确到分
        this.setValueHourMinute(item);
      }
    },
    // 确定精确到分
    setValueHourMinute(item) {
      if(Number(item.starthour) > Number(item.endhour)) {
        return this.$message.warning('开始时间不能大于结束时间！');
      }
      if(Number(item.starthour) === Number(item.endhour)) {
        if(Number(item.startminute) >= Number(item.endminute)) {
          return this.$message.warning('开始时间不能大于结束时间');
        }
      }
      // 查找比当前片段起始位置大的片段
      const bigPaneStart = this.handleVideoMinutePaneTime(item, 'startFunc');
      // 查找比当前片段结束位置小的结束片段
      const smallPaneEnd = this.handleVideoMinutePaneTime(item, 'endFunc');
      const startminute = parseInt((item.startminute * 100) / 60) >= 10 ? parseInt((item.startminute * 100) / 60) : '0'+parseInt((item.startminute * 100) / 60);
      const endminute = parseInt((item.endminute * 100) / 60) >= 10 ? parseInt((item.endminute * 100) / 60) : '0'+parseInt((item.endminute * 100) / 60);
      const leftX = Number(item.starthour + "." + startminute);
      const rightX = Number(item.endhour + "." + endminute);
      const startX = parseInt((this.width / ((this.maxScale - 1) * 2)) * leftX);
      const width = parseInt((this.width / ((this.maxScale - 1) * 2)) * (rightX - leftX));
      if (Number(item.starthour + "." + item.startminute) < Math.max.apply(null, smallPaneEnd)) {
        return this.$message.warning("当前片段起始时间与其他片段有重合，请重新填写");
      }
      if (Number(item.endhour + "." + item.endminute) > Math.min.apply(null, bigPaneStart)) {
        return this.$message.warning("当前片段结束时间与其他片段有重合，请重新填写！");
      }
      this.checkSelectType = "";
      this.videoArr.forEach((v) => {
        if (v.typeIndex === item.typeIndex) {
          v.startTime = this.transferFormatTime(item.starthour) + ":" + this.transferFormatTime(item.startminute);
          v.endTime = this.transferFormatTime(item.endhour) + ":" + this.transferFormatTime(item.endminute);
          v.startX = startX;
          v.width = width;
          v.isModal = false;
        }
      });
    },
    // 确定精确到秒
    setValueHourMinuteSecond(item) {
      if(Number(item.starthour) > Number(item.endhour)) {
        return this.$message.warning('开始时间不能大于结束时间');
      }
      if(Number(item.starthour) === Number(item.endhour)) {
        if(Number(item.startminute) > Number(item.endminute)) {
          return this.$message.warning('开始时间不能大于结束时间');
        }
        if(Number(item.startminute) === Number(item.endminute) && Number(item.startsecond) > Number(item.endsecond)) {
          return this.$message.warning('开始时间不能大于结束时间');
        }
      }
      // 查找比当前片段起始位置大的片段
      const bigPaneStart = this.handleVideoSecondPaneTime(item, 'startFunc');
      // 查找比当前片段结束位置小的结束片段
      const smallPaneEnd = this.handleVideoSecondPaneTime(item, 'endFunc');
      const startS = item.starthour * 3600 + item.startminute * 60 + item.startsecond;
      const endS = item.endhour * 3600 + item.endminute * 60 + item.endsecond;
      const leftX = Number((startS / 3600).toFixed(3));
      const rightX = Number((endS / 3600).toFixed(3));
      const startX = parseInt((this.width / ((this.maxScale - 1) * 2)) * leftX);
      const width = parseInt((this.width / ((this.maxScale - 1) * 2)) * (rightX - leftX));
      // 当编辑当前片段左边的位置，我们需要查找其他片段最大的结束位置上是哪个
      if(smallPaneEnd.length > 0) {
        const otherMax = Number(Math.max.apply(null, smallPaneEnd)) * 3600;
        if(startS < otherMax) {
          return this.$message.warning('当前片段起始时间与其他片段有重合，请重新填写！');
        }
      }
      if(bigPaneStart.length > 0) {
        const otherMin = Number(Math.min.apply(null, bigPaneStart)) * 3600;
        if(endS > otherMin) {
          return this.$message.warning('当前片段结束时间与其他片段有重合，请重新填写！');
        }
      }
      this.checkSelectType = "";
      this.videoArr.forEach(vItem => {
        if(vItem.typeIndex === item.typeIndex) {
          vItem.startTime = this.transferFormatTime(item.starthour) + ":" + this.transferFormatTime(item.startminute) + ":" + this.transferFormatTime(item.startsecond);
          vItem.endTime = this.transferFormatTime(item.endhour) + ":" + this.transferFormatTime(item.endminute) + ":" + this.transferFormatTime(item.endsecond);
          vItem.startX = startX;
          vItem.width = width;
          vItem.isModal = false;
        }
      });
    },
    // 获取该片段的值
    getValue() {
      return this.videoArr;
    },
    // 删除该片段
    handleDel(item) {
      let index = this.videoArr.findIndex((v) => v.typeIndex === item.typeIndex);
      this.videoArr.splice(index, 1);
      // 然后让大于该片段的唯一值递减，这样可以保持唯一
      this.videoArr.forEach((v) => {
        if (v.typeIndex > item.typeIndex) {
          v.typeIndex--;
        }
      });
    },
    calcuteTime(time, type) {
      if(!time) return 0;
      let str = time.toString().split(":");
      let params = {
        hour: str[0],
        minute: str[1],
        second: str[2]
      };
      return params[type];
    },
    transferFormatTime(time) {
      return Number(time) >= 10 ? time : "0" + time;
    },
  },
}
</script>
<style lang="scss" scoped>
@import './index.scss';
</style>