<script setup>
  import { useRoute, useRouter } from 'vue-router'
  import { reactive, onMounted, getCurrentInstance } from 'vue'
  import { showLoadingToast, closeToast, showNotify } from 'vant'
  import aHeader from '@/components/header/index.vue'
  import loadingIcon from '@/assets/img/loading-icon.png'
  const { proxy: { $api } } = getCurrentInstance()
  const router = useRouter()
  const { query, meta: { title, show } } = useRoute()
  const state = reactive({
    showArgeeConfrimPopup: false, // 是否同意协议弹框
    showArgeeContentPopup: false, // 是否显示协议内容弹框
    showConfrimPopup: false, // 删除确认
    loading: false,
    deviceList: [], // 未部署的设备列表
    agreeTitle: '', // 协议标题
    agreeContent: [] // 协议内容
  })

  onMounted(() => {
    getbindDeviceList(false)
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
        return item
      }
    })
    if (!isBind) { // 未绑定
      state.deviceList = res?.devices || []
    }
  }
  // 部署设备
  const installDevice = async (deviceIds) => {
    const params = {
      userId: query.userId,
      appId: query.appId,
      deviceIds
    }
    return await $api.post('start', params).catch((err) => {
      console.log(err, '-------err')
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    
  }
  /**
   * 操作相关
   */
  // 点击部署
  const handleArrange = async () => {
    const selectItemIds = state.deviceList.filter(item => item.checked).map(item => item.name)
    if (!selectItemIds.length) {
      showNotify({ type: 'warning', message: '请选择要部署的设备' });
      return
    }
    if (!state.isArgee) {
      state.showArgeeConfrimPopup = true
      return
    }
    showLoadingToast({
      message: '正在部署设备...',
      forbidClick: true,
      duration: 2000,
      icon: loadingIcon,
      loadingType: 'spinner'
    })

    const res = await installDevice(selectItemIds)

    closeToast()
    if (!res) return
    router.push({ path: '/arrangeResault', query })
    
  }
  /**
   * 显示用户协议
   * @param {string} flag user-用户协议 其它-隐私协议
   */
  const handleArgee = (flag) => {
    state.showArgeeContentPopup = true
    if (flag === 'user') {
      state.agreeTitle = '用户协议'
    } else {
      state.agreeTitle = '隐私协议'
    }
  }
  // 点击同意协议
  const handleArgeeConfrim = () => {
    state.isArgee = true
    state.showArgeeConfrimPopup = false
  }
  // 点击取消
  const handleCancel = () => {
    router.push({ path: '/home', query: route.query})
  }
</script>
<template>
  <div class="page">
    <!-- header -->
    <aHeader :title="show ? title : ''" backFlag="custom" @handleLeft="router.push({ path: '/home', query })"></aHeader>

    <!-- 内容主体 -->
    <div class="page-content">
      <div class="list-title">请选择添加部署设备</div>
      <div class="content-list">
        <div class="list-item" v-for="(item) in state.deviceList" :key="item.id">
          <div class="item-left">
            <div class="item-icon">
              <img src="@/assets/img/camera-icon.png" alt="">
            </div>
            <div class="item-content">
              <div class="item-name">{{ item.labels[1].split('=')[1] }}</div>
              <div :class="['item-status', { online: item.operatingState === 'UP' }, { offline: item.operatingState !== 'UP' }]">{{ item.operatingState === 'UP' ? '在线' : '离线' }}</div>
            </div>
            
          </div>
          <div class="item-right">
            <div class="item-check">
              <van-checkbox
                v-model="item.checked"
                icon-size="14px"
                :disabled="item.operatingState !== 'UP'"
              ></van-checkbox>
            </div>
          </div>
        </div>
      </div>
      <div class="list-tip">
        提示：摄像头部署成功后,可在家庭算力主机/我的应用/宠物抓拍文件夹内同步查看
      </div>
    </div>

    <div class="bottom-bar">
      <div class="bar-top">
        <van-checkbox class="top-checkbox" v-model="state.isArgee" icon-size="14px"></van-checkbox>
        <span class="protocol-text"
          >已阅读并同意<span class="protocol-link" @click="handleArgee('user')">《用户协议》</span>和<span
            class="protocol-link"
            @click="handleArgee()"
            >《隐私策略》</span
          ></span
        >
      </div>
      <div class="bar-bottom">
        <van-button @click="handleCancel">取消</van-button>
        <van-button type="primary" @click="handleArrange">部署</van-button>
      </div>
    </div>

    <!-- 协议内容 -->
    <van-popup v-model:show="state.showArgeeContentPopup" position="bottom" :style="{ height: '80% !important' }">
      <div class="popup-inner">
        <div class="popup-inner-top">{{ state.agreeTitle }}</div>
        <div class="popup-inner-center">
        </div>
        <div class="bar-bottom">
          <!-- <van-button @click="state.showArgeeContentPopup = false">关闭</van-button> -->
        </div>
      </div>
    </van-popup>
    
    <!-- 是否同意用户协议 -->
    <van-popup v-model:show="state.showArgeeConfrimPopup" position="bottom" :style="{ height: '30%' }">
      <div class="popup-inner">
        <div class="popup-inner-top">提示</div>
        <div class="popup-inner-center">
          <span class="protocol-text"
            >请先同意<span class="protocol-link" @click="handleArgee('user')">《用户协议》</span>和<span
              class="protocol-link"
              @click="handleArgee()"
              >《隐私策略》</span
            ></span
          >
        </div>
        <div class="bar-bottom">
          <van-button @click="state.showArgeeConfrimPopup = false">取消</van-button>
          <van-button type="primary" @click="handleArgeeConfrim">同意</van-button>
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
      .list-title {
        font-size: $tip-size;
        margin-bottom: $title-margin-bottom;
      }
      .content-list {
        .list-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: $item-margin-top;
          padding: $item-padding-top $item-padding-right $item-padding-bottom
        $item-padding-left;
          border-radius: $radius;
          background-color: $content-bg;
          &:first-child {
            margin-top: 0;
          }
          .item-left,
          .item-right {
            display: flex;
            align-items: center;
          }
          .item-left {
            flex: 1;
            align-items: normal;
          }
          .item-icon {
            width: 50px;
            height: 50px;
            display: flex;
            margin-right: $item-margin-right;
            background-color: #F0F2F4;
            border-radius: $radius;
            overflow: hidden;
            img {
              width: 100%;
              height: 100%;
            }
          }
          .item-content {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 4px 0;
          }
          .item-name {
            margin-right: 20px;
            font-size: $main-size;
          }
          .item-status {
            position: relative;
            font-size: $tip-size;
            font-weight: 400;
            color: #818181;
            padding-left: 17px;
            &.offline::before {
              content: "";
              position: absolute;
              width: 8px;
              height: 8px;
              top: 50%;
              left: 0;
              transform: translateY(-50%);
              background-color: $disabled-font-color;
              border-radius: 8px;
            }
            &.online::before {
              content: "";
              position: absolute;
              width: 8px;
              height: 8px;
              top: 50%;
              left: 0;
              transform: translateY(-50%);
              background-color: $success-font-color;
              border-radius: 8px;
            }
          }
          .item-arran {
            margin-right: 20px;
          }
        }
      }
      .list-tip {
        margin-top: $item-margin-top;
        color: $tip-font-color;
        font-size: $tip-size;
        line-height: 20px;
      }
    }
    .bottom-bar {
      padding: $content-padding-top $content-padding-right $content-padding-bottom
        $content-padding-left;
      display: flex;
      flex-direction: column;
      .bar-top {
        display: flex;
        align-items: flex-start;
        .top-checkbox {
          transform: translateY(4px);
        }
        .protocol-text {
          margin-left: $icon-margin-left;
          font-size: $tip-size;
          color: $sce-font-color;
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
  .popup-inner-center {
    position: relative;
    min-height: 50px;
    margin-top: 30px;
    margin-bottom: 20px;
  }
}
  
</style>
