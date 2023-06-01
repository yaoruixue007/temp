<script setup>
  import { useRoute, useRouter } from 'vue-router'
  import { reactive, onMounted, getCurrentInstance } from 'vue'
  import { showLoadingToast, closeToast, showNotify, showConfirmDialog } from 'vant'
  import aHeader from '@/components/header/index.vue'
  import successIcon from '@/assets/img/success-icon.png'
  import loadingIcon from '@/assets/img/loading-icon.png'
  const router = useRouter()
  const { proxy: { $api } } = getCurrentInstance()
  const { query, meta: { title, show } } = useRoute()
  let infoItem = {}
  const state = reactive({
    showConfrimPopup: false, // 是否显示底部弹窗
    loading: false,
    successDeviceList: [], // 成功部署的设备
    // errorDeviceList: [], // 失败部署的设备
    agreeContent: [] // 协议内容
  })

  onMounted(() => {
    getbindDeviceList(true)
  })
  /**
   * 接口相关
   */
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
      state.successDeviceList = res.devices || []
    }
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
 // 点击关闭开启算法
  const handleSwitchDevice = (value, item) => {
    if (value) return
    infoItem = item
    state.showConfrimPopup = true
  }
  // 点击取消
  const handleCancel = () => {
    state.successDeviceList = state.successDeviceList.map(item => {
      if (item.name === infoItem.name) {
        item.checked = !infoItem.checked
      }
      return item
    })
    infoItem = {}
    state.showConfrimPopup = false
  }
  // 点击关闭
  const handleClose = () => {
    router.replace({ path: '/home', query })
  }
</script>
<template>
  <div class="page">
    <!-- header -->
    <aHeader :title="show ? title : ''" backFlag="custom" @handleLeft="router.push({ path: '/arrange', query })"/>

    <!-- 内容主体 -->
    <div class="page-content">
      <div class="content-top">
        <div class="top-img"></div>
        <div class="top-title">宠物抓拍</div>
      </div>
      <div class="content-list">      
        <!-- 部署失败列表 -->
        <!-- <div class="device-list">
          <div class="list-item" v-for="(item, index) in state.errorDeviceList" :key="index">
            <div class="item-left">
              <div class="item-name">{{ item.deviceName }}</div>
              <div class="item-status error">部署失败</div>
            </div>
            <div class="item-back iconfont icon-youjiantou"></div>
          </div>
        </div> -->
        <div class="device-tip">默认开启宠物靓照算法事件记录</div>
        <!-- 部署成功列表 -->
        <div class="device-list">
          <div class="list-item" v-for="(item, index) in state.successDeviceList" :key="index">
            <div class="item-left">
              <div class="item-name">{{ item.labels[1].split('=')[1] }}</div>
              <div class="item-status success">部署成功</div>
            </div>
            <van-switch v-model="item.checked" size="24px" @change="(e) => handleSwitchDevice(e, item)"/>
          </div>
        </div>
      </div>
      <div class="device-tip desc">可在应用设置中查看部署设备, 开启/关闭算法应用</div>
    </div>

    <van-sticky position="bottom">
      <div class="bar-bottom van-safe-area-bottom">
        <van-button type="primary" @click="handleClose">关闭</van-button>
      </div>
    </van-sticky>
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
      padding: $content-padding-top $content-padding-right $content-padding-bottom
        $content-padding-left;
      overflow-y: auto;
      .content-top {
        margin-top: 25px;
        display: flex;
        flex-direction: column;
        align-items: center;
        .top-img {
          width: 72px;
          height: 72px;
          margin-bottom: 20px;
          background: url('../../assets/img/camrea-img.png') no-repeat;
          background-size: 100% 100%;
        }
        .top-title {
          font-size: $header-size;
          margin-bottom: 32px;
          font-weight: 600;
        }
      }
      .content-list {
        .device-list {
          width: 100%;
          .list-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: $item-margin-top;
            padding: $item-padding-top $item-padding-right $item-padding-bottom
        $item-padding-left;
            background-color: $content-bg;
            border-radius: $radius;
            &:first-child {
              margin-top: 0;
            }
            .item-left {
              flex: 1;
            }
          }
          .item-name {
            font-size: $main-size;
          }
          .item-status {
            margin-top: 15px;
            font-size: $tip-size;
            &.success {
              color: $success-font-color;
            }
            &.error {
              color: $error-font-color;
            }
          }
        }
      }
      .device-tip {
        margin-top: $item-margin-top;
        margin-bottom: $title-margin-bottom;
        color: $main-font-color;
        font-size: $tip-size;
        &.desc {
          color: $tip-font-color;
        }
      }
    }
    .bar-bottom {
      width: auto;
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin: 0 $content-margin-right $content-margin-bottom $content-margin-left;
      .van-button {
        width: 100%;
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
