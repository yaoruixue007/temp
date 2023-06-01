<script setup>
  import { useRoute, useRouter } from 'vue-router'
  import { reactive, onMounted, getCurrentInstance } from 'vue'
  import { showDialog, showToast, showLoadingToast, showImagePreview, closeToast, showNotify, showConfirmDialog } from 'vant'
  import aHeader from '@/components/header/index.vue'
  import successIcon from '@/assets/img/success-icon.png'
  import loadingIcon from '@/assets/img/loading-icon.png'
  const {
    proxy: { $api }
  } = getCurrentInstance()
  const router = useRouter()
  const { query, meta: { title, show } } = useRoute()
  const state = reactive({
    visiable: false, // 弹窗显示标识F
    dialogFlag: 'time', // 弹框标识 time-天数
    itemInfo: {}, // 操作项信息
    loading: false,
    deviceList: [], // 设备列表
    noticeChecked: false,
    showConfrimPopup: false, // 确认弹框
    infoData: {
      msgNotify: false, // 消息通知
      eventRecordLimit: 7, // 保存上限
      devices: [], // 设备列表
      path: '', // 存储路径，
      isShare: false // 是否共享至家庭空间
    },
    bindList: [], // 设备列表
    selectDay: 7, // 默认选中保存天数
  })
  let infoItem = {}
  const dialogMap = {
    time: '应用事件保存上限'
  }

  const timeOptions = [
    {
      text: '7日',
      value: 7
    },
    {
      text: '15日',
      value: 15
    },
    {
      text: '30日',
      value: 30
    },
    {
      text: '永久',
      value: 0
    }
  ]

  onMounted(() => {
    getInfoData()
    getbindDeviceList(true)
  })
  /**
   * 接口相关
   */
  /**
   * 页面数据初始化
   */
  const getInfoData = async () => {
    const res = await $api.get('getAppSetting', { isBind: 0 }).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    
    if (!res) return
    console.log(res, '------res')
    state.infoData = res.data
    state.selectDay = res.data.eventRecordLimit
  }
  /**
   * 获取已绑定/未绑定设备列表
   * @param {Boolean} isBind false获取未绑定的列表 true获取已绑定的列表
   */
  const getbindDeviceList = async (isBind = true) => {
    const res = await $api.get('deviceList', { page: 1, pageSize: 9999 }).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    if (!res) return
    const params = {
      appId: query.appId,
      deviceIds: res.devices.map(item => item.name)
    }
    const bindRes = await $api.post('deviceAlgSettingInfo', params).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
      state.showSearchPopup = false
    })
    if (!bindRes) return
    const publishList = bindRes.data || []
    res.devices = res.devices?.filter(item => {
      let flag = false
      publishList.forEach(device => {
        if (item.name === device.deviceId && device.running === isBind) {
          flag = true
        }
      })
      if (flag) {
        item.checked = true
        return item
      }
    })
    if (isBind) { // 已绑定
      state.bindList = res.devices || []
    } 
  }
  /**
   * 打开关闭消息通知
   */
  const handleSwitchOpen = async (value) => {
    showLoadingToast({
      message: `正在${!value ? '关闭' : '开启'}消息通知...`,
      forbidClick: true,
      duration: 2000,
      loadingType: 'spinner',
      icon: loadingIcon,
    })
    const params = {
      uid: query.userId,
      app_id: query.appId,
      is_notify: value * 1,
    }
    const res = await $api.put('notify', params).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    closeToast()
    if (!res) return
    showLoadingToast({
      message: `${!value ? '关闭' : '开启'}消息通知成功`,
      icon: successIcon,
      duration: 2000,
    })
  }
  /**
   * 设置事件记录上限
   */
  const handleSaveDays = async () => {
    const params = {
      uid: query.userId,
      app_id: query.appId,
      peroid: state.selectDay,
    }
    const res = await $api.put('eventLimit', params).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    if (!res) return
    showToast({
      message: `设置成功`,
      icon: successIcon,
      duration: 2000,
    })
    intiDialog()
    getInfoData()
  }
  // 开启关闭共享
  const openOrCloseShare = async (value) => {
    console.log(value)
    showLoadingToast({
      message: `正在${!value ? '撤销' : '开启'}共享...`,
      forbidClick: true,
      duration: 2000,
      loadingType: 'spinner',
      icon: loadingIcon,
    })
    const params = {
      uid: query.userId,
      is_share: value * 1,
      app_id: query.appId
    }
    const res = await $api.put('share', params).catch((err) => {
      state.infoData.isShare = !value
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    if (!res) return
    showLoadingToast({
      message: `${!value ? '撤销' : '开启'}共享成功`,
      icon: successIcon,
      duration: 2000,
    })
    state.infoData.isShare = value
  }
  
   // 关闭打开算法
   const openOrCloseCom = async () => {
    const titleWorld = infoItem.checked ? '关闭' : '打开'
    showLoadingToast({
      message: '正在' + titleWorld + '算法...',
      forbidClick: true,
      duration: 2000,
      icon: loadingIcon,
      loadingType: 'spinner'
    })
    const params = {
      userId: query.userId,
      appId: query.appId,
      deviceIds: [infoItem.name]
    }
    const res = await $api.post('stop', params).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' });
    })
    closeToast()
    
    if (!res) return
    showLoadingToast({
      message: '操作成功',
      icon: successIcon,
      duration: 2000,
    })
    handleCancel()
    getbindDeviceList(true)
  }
  /**
   * 操作相关
   */
  // 选择保存天数
  const handleSelectDay = ({ selectedOptions }) => {
    state.selectDay = selectedOptions[0].value
  }
  // 设置保存事件上限确认
  const handleDialogConfirm = () => {
    switch (state.dialogFlag) {
      case 'time':
        handleSaveDays()
        break

      default:
        break
    }
  }

  // 点击开启关闭算法
  const handleSwitchDevice = (value, item) => {
    if (value) return
    infoItem = item
    state.showConfrimPopup = true
  }

  // 点击取消
  const handleCancel = () => {
    state.bindList = state.bindList.map(item => {
      if (item.name === infoItem.name) {
        item.checked = !infoItem.checked
      }
      return item
    })
    infoItem = {}
    state.showConfrimPopup = false
  }
  
  // 初始话通用弹框
  const intiDialog = () => {
    state.visiable = false
    state.dialogFlag = 'time' // 弹框标识 time-天数
    state.itemInfo = {} // 操作项信息
  }
  /**点击显示弹框
   * @param {string} type 用来区分弹框类型
   * @param {Object} info 非必传， 操作项信息
   * @return null
   */
  const handleOpenDialog = (type, info = {}) => {
    if (query.isAdmin !== '1') {
      handleDisabledBtn()
      return
    }
    state.dialogFlag = type
    state.itemInfo = info
    state.visiable = true
  }
  
  // 点击预览图片视频
  const handlePreview = (preInfo) => {
    // 图片预览
    showImagePreview([preInfo.url])
    // 视频预览
    // state.showPreview = true
  }
  const handleDisabledBtn = () => {
    if (query.isAdmin !== '1') {
      showToast({
        message: '群组普通成员无操作权限',
        duration: 2000,
      })
    }
  }
</script>
<template>
  <div class="page">
    <!-- header -->
    <aHeader :title="show ? title : ''" backFlag="custom" @handleLeft="router.push({ path: '/home', query })" />

    <!-- 内容主体 -->
    <div class="page-content">
      <div class="content-desc"> 开启/关闭宠物靓照信息推送 </div>
      <div class="content-item">
        <div class="item-label">消息通知</div>
        <div class="item-inner">
          <van-switch v-model="state.infoData.msgNotify" size="24px" :disabled="query.isAdmin !== '1'" @click="handleDisabledBtn" @change="handleSwitchOpen" />
        </div>
      </div>

      <div class="content-desc"> 应用事件记录保存 </div>
      <div class="content-item">
        <div class="item-label">事件记录保存上限</div>
        <div class="item-inner">
          <div :class="['item-inner-text', { disabled: query.isAdmin !== '1' }]" @click="handleOpenDialog('time')">{{ state.infoData.eventRecordLimit === 0 ? '永久' :`${state.infoData.eventRecordLimit}日` }} <span class="iconfont icon-youjiantou"></span></div>
        </div>
      </div>

      <div class="content-desc"> 开启/关闭宠物靓照算法事件记录</div>

      <div class="content-item">
        <div v-if="state.bindList.length" class="device-list">
          <div
            class="device-item van-hairline--bottom"
            v-for="(item) in state.bindList"
            :key="item.name"
          >
            <div class="item-left">
              <div class="device-img">
                <img src="@/assets/img/camera-icon.png" alt="" />
              </div>
              <div class="item-name">{{ item.labels[1].split('=')[1] }}</div>
            </div>
            <div class="item-right">
              <van-switch v-model="item.checked" size="24px" :disabled="query.isAdmin !== '1'" @click="handleDisabledBtn" @change="(e) => handleSwitchDevice(e, item)"/>
            </div>
          </div>
        </div>
        <div v-else class="empty">
          <div class="empty-img"></div>
          <div class="empty-text">暂无部署摄像头设备</div>
        </div>
      </div>

      <div v-if="query.isAdmin === '1'" class="content-desc"> 存储路径 </div>
      <div v-if="query.isAdmin === '1'" class="content-desc tip"> 对应存储在家庭算力主机空间路径 </div>
      <div v-if="query.isAdmin === '1'" class="content-item">
        <div class="item-label">{{ state.infoData.path || '\\我的空间\\我的应用\\宠物抓拍' }}</div>
      </div>

      <div v-if="query.isAdmin === '1'" class="content-desc"> 文件共享 </div>
      <div v-if="query.isAdmin === '1'" class="content-desc tip">
        将家庭算力主机宠物靓照文件夹共享至家庭空间，群成员可查看事件记录
      </div>
      <div v-if="query.isAdmin === '1'" class="content-item">
        <div class="item-label">共享至家庭空间</div>
        <div class="item-inner">
          <van-switch v-model="state.infoData.isShare" size="24px" :disabled="query.isAdmin !== '1'" @click="handleDisabledBtn" @change="openOrCloseShare"/>
        </div>
      </div>
    </div>
    <!-- 确认操作弹框 -->
    <van-popup v-model:show="state.showConfrimPopup" position="bottom" :style="{ height: '30%' }">
      <div class="popup-inner">
        <div class="popup-inner-top">确认关闭算法事件记录?</div>
        <div class="popup-inner-text">
          关闭后,设备将停止事件记录,将从设备列表移除
        </div>
        <div class="bar-bottom">
          <van-button class="cancel-btn" @click="handleCancel">取消</van-button>
          <van-button type="primary" @click="openOrCloseCom">确认</van-button>
        </div>
      </div>
    </van-popup>
    <van-popup v-model:show="state.visiable" position="bottom" :style="{ height: '30%' }">
      <div class="dialog-inner">
        <!-- 应用事件保存上限 -->
        <div class="dialog-time">
          <div class="dialog-title">
            {{ dialogMap[state.dialogFlag] }}
          </div>
          <van-picker
            title="标题"
            :columns="timeOptions"
            @change="handleSelectDay"
          />
        </div>
        <div class="bar-bottom">
          <van-button class="cancel-btn" @click="intiDialog">取消</van-button>
          <van-button type="primary" @click="handleDialogConfirm">确认</van-button>
        </div>
      </div>
      
    </van-popup>
  </div>
</template>

<style scoped lang="scss">
  .page {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background-color: $main-bg;
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: $content-padding-top $content-padding-right $content-padding-bottom
        $content-padding-left;
      background-color: $main-bg;
      .content-desc {
        font-size: $tip-size;
        margin-bottom: $title-margin-bottom;
        &.tip {
          color: $tip-font-color;
          font-size: 13px;
        }
      }
      .content-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $item-padding-top $item-padding-right $item-padding-bottom $item-padding-left;
        margin-bottom: $item-margin-bottom;
        border-radius: $radius;
        background-color: $content-bg;
        .item-label {
          font-size: $main-size;
        }
        .item-inner {
          .item-inner-text {
            font-size: $main-size;
            display: flex;
            align-items: flex-end;
            &.disabled {
              cursor: not-allowed;
              opacity: var(--van-switch-disabled-opacity);
            }
          }
        }
        .inner-setting {
          background-color: #ccc;
          border-radius: $radius;
          padding: 4px 8px;
        }
        .device-list {
          width: 100%;
          .device-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: $item-margin-top 0 $item-margin-bottom 0;
            &:last-child {
              padding-bottom: 0;
              &::after {
                border-bottom-width: 0;
              }
            }
            &:first-child {
              padding-top: 0;
            }
            .item-left {
              display: flex;
              align-items: center;
              .device-img {
                width: 50px;
                height: 50px;
                margin-right: $item-margin-right;
                border-radius: $radius;
                img {
                  width: 100%;
                  height: 100%;
                }
              }
              .item-name {
                font-size: $main-size;
              }
            }
          }
        }
      }
    }

    .dialog-inner {
      padding: $content-padding-top $content-padding-right $content-padding-bottom
        $content-padding-left;
      .dialog-title {
        text-align: center;
        font-size: $dialog-title-size;
      }
      
      .dialog-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        .dialog-time-item {
          margin-top: $item-margin-top;
          &.active {
            color: $main-color;
          }
        }
      }
    }
  }

  .popup-inner {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    font-size: $main-size;
    padding: 25px 15px;
    .popup-inner-text {
      margin-top: 30px;
      margin-bottom: 20px;
    }
    .popup-inner-center {
      position: relative;
      min-height: 50px;
      margin-top: 30px;
      margin-bottom: 20px;
    }
    .bar-bottom {
      width: 100%;
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin: 0;
      .van-button {
        width: 100%;
      }
    }
  }
</style>
