<script setup>
  import aHeader from '@/components/header/index.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { reactive, onMounted, onUnmounted, ref, getCurrentInstance, computed } from 'vue'
  import { showNotify, showConfirmDialog, showLoadingToast, closeToast, showToast  } from 'vant'
  import banner from '@/assets/img/banner.png'
  import banner1 from '@/assets/img/banner1.png'
  import successIcon from '@/assets/img/success-icon.png'
  import tongzhiIcon from '@/assets/img/tongzhi.png'
  import moreIcon from '@/assets/img/more.png'
  import loadingIcon from '@/assets/img/loading-icon.png'
  const { proxy: { $api, $constant, $refs } } = getCurrentInstance()
  const router = useRouter()
  const { query, meta: { title, show } } = useRoute()
  const filterRef = ref(null)
  const totalSize = ref(0)
  const loadTotal = ref(0)
  
  const state = reactive({
    isBind: false, // 是否绑定设备
    showSearchPopup: false, // 是否显示底部弹窗
    searchLoading: false, // 搜索设备loading
    eventLoading: false, // 事件列表loading
    showPreview: false, // 图片预览显示
    showConfrimPopup: false, // 删除确认提示
    pageMode: '', // 页面模式 init default  edit
    listMode: '', // 数据显示模式 default-主页面 other-列表页
    deviceList: [], // 未部署的设备列表
    eventList: [], // 事件列表
    eventListLength: 0, // 事件列表包含多少事件
    bitAlbum: {}, // 点滴长图,
    preImgs: [], // 图片预览数据
    unbindList: [], // 未绑定设备列表
    bindList: [], // 已绑定设备列表
    delIds: [], // 选中删除的事件id
    deviceId: '', // 当前设备id
    isDot: false, // 是否展示小红点
    page: 1,
    pageSize: 32,
    scrollLoading: false,
    finished: false,
    isEmpty: false, // 是否显示空数据状态展示 
    configInfo: {}, // 设置信息
    actions: [{ text: '应用设置', key: 'setting' }], // 左上菜单
    images: [{ url: banner, title: '宠物抓拍', text: '抓拍宠物每个精彩瞬间' }, { url: banner1, title: '点滴长图', text: '生成点滴长图，留下美好回忆' }], // 轮播图数据
  })
  const scrollLoading = ref(false)
  let timer = 1
  const isAll = computed(() => (state.eventListLength === state.delIds.length) && state.delIds.length)

  onMounted(async () => {
    // getInfoData()
    showLoadingToast({
      message: '正在加载...',
      forbidClick: true,
      duration: 2000,
      icon: loadingIcon,
      loadingType: 'spinner'
    })
    await getConfigInfo()
    if (query.isAdmin === '1') {
      state.actions = [
        { text: '添加部署设备', key: 'add' },
        { text: '应用设置', key: 'setting' },
        { text: '选择文件', key: 'edit' }
      ]
    } else {
      state.actions = [
        { text: '应用设置', key: 'setting' },
      ]
    }
    if (query.isAdmin !== '1' && !state.configInfo?.isShare) {
      state.pageMode = 'init'
      return
    }
    
    state.pageSize = Math.floor(filterRef.value.clientHeight / 76) * 4
    loadTotal.value = state.pageSize
    await getbindDeviceList(true)
    console.log(state.bindList, '-----state.bindList')
    if (state.bindList.length > 1) {
      getEventList(false)
    }
    if (state.configInfo?.msgNotify) { // 消息通知开关开启轮询消息通知
      getNoticeList()
    }
    closeToast()
    
    // state.pageMode = 'default'
  })
  onUnmounted(() => {
    timer = null
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
    console.log(bindRes)
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
    if (isBind) { // 已绑定
      if (res.devices.length) {
        state.pageMode = 'default'
      } else {
        state.pageMode = 'init'
      }
      state.bindList = res.devices.map(item => ({ ...item, text: item.labels[1].split('=')[1], key: item.name })) || []
      state.bindList.unshift({ text: '全部', key: '' })
    } else { // 未绑定
      state.searchLoading = false
      state.unbindList = res?.devices || []
      if (res?.devices?.length) {
          router.push({ path: '/arrange', query })
      }
    }
  }
  // 获取消息列表
  const getNoticeList = async () => {
    if (!timer) return 
    const res = await $api.get('getMessageList', { page: 1, pageSize: 9999 }).catch((err) => {
      showNotify({ type: 'danger', message: err.message });
    })
    if (!res) return
    setTimeout(() => {
      getNoticeList()
    }, 2000)
    state.isDot = res.AlgMessageList.some(item => !item.hasRead)
  }
  /**
   * 获取点击长图信息
   */
  const getInfoData = async () => {
    state.eventLoading = true
    const res = await $api.get('algInfo', { page: 1, pageSize: 9999 }).catch(err => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    state.eventLoading = false
    if (!res) return
    state.pageMode = 'default'
    state.bitAlbum = res.bitAlbum || []
  }
  /**
   * 获取配置信息
   */
  const getConfigInfo = async () => {
    const res = await $api.get('getAppSetting', { isBind: 0 }).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    closeToast()

    if (!res) return 
    state.configInfo = res.data
  }
  /**
   * 获取事件信息
   * @param {boolean} flag false不需要loading
   */
  const getEventList = async (flag = true, isScorll = false) => {
    console.log(query, '-------query')
    
    if (flag) {
      state.eventLoading = true
    }
    if (query.isAdmin !== '1' && !state.configInfo?.isShare) {
      // 普通成员并且在管理员没有开启共享状态不能查看事件
      return
    }
    if (isScorll && loadTotal.value >= totalSize.value) {
      state.finished = true
      return
    } else {
      state.finished = false
    }
    console.log(state.page, state.pageSize)
    const res = await $api.get('algEventList', { page: state.page, pageSize: state.pageSize, deviceId: state.deviceId }).catch(err => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    state.eventLoading = false
    scrollLoading.value = false
    if (!res) return
    totalSize.value = res.total

    if (!isScorll) {
      state.eventList = res.AlgEventList
    } else {
      loadTotal.value += state.pageSize
      let list1 = state.eventList
      let list2 = res.AlgEventList
      if (state.eventList[state.eventList.length - 1].date === res.AlgEventList[0].date) {
        // 最后一条和新数据第一条时间一样代表是一天数据，需要手动合并
        list1 = state.eventList[state.eventList.length - 1].AlgEvent = [...state.eventList[state.eventList.length - 1].AlgEvent, ...res.AlgEventList[0].AlgEvent]
        res.AlgEventList.splice(0, 1)
        list2 = res.AlgEventList
      }
      // state.eventList = [...list1, ...list2]
    }
    state.listMode = !state.deviceId && !state.eventList.length ? 'default' : 'other'
    state.isEmpty = !state.eventList.length
    state.eventListLength = 0
    state.eventList.forEach(item => {
      item.AlgEvent && item.AlgEvent.forEach(info => {
        state.eventListLength += 1
      })
    })

    
    
  }
  // 删除事件
  const delEvent = async () => {
    showLoadingToast({
      message: '正在删除事件...',
      forbidClick: true,
      duration: 2000,
      icon: loadingIcon,
      loadingType: 'spinner'
    })
    const res = await $api.delete('delEvent', { ids: state.delIds }).catch(err => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' });
    })
    if (!res) return
    showLoadingToast({
      message: `事件删除成功`,
      icon: successIcon,
      duration: 2000,
    })
    state.showConfrimPopup = false   
    initListPageData()
    getEventList(false)
    state.delIds = []
  }
  const initListPageData = () => {
    state.page = 1
    state.finished = false
    loadTotal.value = state.pageSize
  }
  /**
   * 操作相关
   */
  // 点击编辑返回/退出
  const handleNav = (flag) => {
    console.log(flag, '-----flag')
    if (flag === 'del') {
      state.pageMode = 'default'
      state.delIds = []
      handleSelectAll(false)
    } else {
      const obj = { type: "exitLightApp" };
      window?.ReactNativeWebView?.postMessage(JSON.stringify(obj));
    }
  }
  // 点击消息通知按钮
  const handleJumpNotice = () => {
    router.push({ path: '/notice', query })
  }

  // 操作右上角菜单 
  const handleRightMenu = ({ key }) => {
    switch (key) {
      case 'add':
        state.searchLoading = true
        state.showSearchPopup = true
        getbindDeviceList(false)
        break
      case 'edit':
        if (!state.eventListLength) {
          showToast({
            message: '暂无可操作事件',
            forbidClick: true,
            duration: 2000,
          })
          return
        }
        state.pageMode = 'edit'
        break
      case 'setting':
        router.push({ path: '/setting', query })

        break

      default:
        break
    }
  }
  // 点击设备筛选
  const handleSelectDevice = ({ key }) => {
    state.deviceId = key
    initListPageData()
    getEventList()
  }
  // 点击预览图片视频
  const handlePreview = (preInfo) => {
    // 视频预览
    state.showPreview = true
    state.preImgs = [
      {
        url: $constant.OPEN_URL + preInfo.url + '?token=' + query.token,
        isVideo: preInfo.fileType === 2
      }
    ]
  }
  // 点击全选
  const handleSelectAll = (flag) => {
    showLoadingToast({
      message: '正在处理...',
      forbidClick: true,
      duration: 0,
      icon: loadingIcon,
      loadingType: 'spinner'
    })
    state.eventList = state.eventList.map(item => {
      item.AlgEvent = item.AlgEvent && item.AlgEvent.map(info => {
        info.checked = flag
        return info
      })
      return item
    })
    closeToast()
  }
  // 选择事件
  const handlCheckItem = () => {
    state.delIds = []
    state.eventList.forEach(item => {
      item.AlgEvent && item.AlgEvent.forEach(info => {
        if (info.checked) {
          state.delIds.push(info.id)
        }
      })
    })
  }
  // 删除事件
  const handleDelEvent = () => {
    
    if (!state.delIds.length) {
      showNotify({ type: 'warning', message: '请选择要删除的事件' });
      return
    }
    state.showConfrimPopup = true
  }
  // 触底加载
  const onLoad = (e) => {
    console.log(e, '------e')
    state.page += 1
    scrollLoading.value = true
    getEventList(false, true)
  }
</script>
<template>
  <div class="page">
    <!-- header -->
    <van-sticky>
      <aHeader v-if="state.pageMode === 'edit'" :title="`已选中${state.delIds.length}张照片`" isDelete @handleLeft="handleNav">
        <template #right>
          <div class="select-all" @click="handleSelectAll(!isAll)">{{ isAll ? '全不选' : '全选'}}</div>
        </template>
      </aHeader>
      <aHeader v-else :title="show ? title : ''" backFlag="custom" @handleLeft="handleNav">
        <template #right>
          
          <span class="notice-icon" @click="handleJumpNotice">
            <van-badge :dot="state.isDot">
              <img :src="tongzhiIcon" alt="">
            </van-badge>
          </span>
          
          <van-popover
            placement="bottom-end"
            :actions="state.actions"
            position="top-start"
            @select="handleRightMenu"
          >
            <template #reference>
              <span class="notice-icon more-icon">
                <img :src="moreIcon" alt="">
              </span>
            </template>
          </van-popover>
        </template>
      </aHeader>
      
    </van-sticky>

    <!-- 内容主体 -->
    <div class="page-content">
      <!-- 未产生数据展示 -->
      <div v-if="state.pageMode === 'init'">
        <!-- banner -->
        <van-swipe
          class="page-banner"
          :autoplay="3000"
          lazy-render
        >
          <van-swipe-item v-for="(image, index) in state.images" :key="index">
            <img :src="image.url" />
            <div class="swipe-bar">
              <div class="bar-title">{{ image.title }}</div>
              <div class="bar-text">{{ image.text }}</div>
            </div>
          </van-swipe-item>
        </van-swipe>
        <!-- 已绑定摄像头 -->
        <!-- <van-empty v-if="state.bindList.length" description="没有发现任何风吹草动~" /> -->
        <div v-if="query.isAdmin === '1'" class="add-device" plain type="primary" @click="handleRightMenu({ key: 'add' })"
          ><span class="iconfont icon-jia"></span> 请点击添加部署设备</div
        >
        <div v-if="query.isAdmin === '0'" class="empty empty-class">
          <div class="empty-img"></div>
          <div class="empty-text">暂无相关事件数据</div>
        </div>
      </div>

      <!-- 产生数据展示 -->
      <div v-else class="content-inner">
        <!-- 点滴长图 -->
        <!-- <div v-if="state.pageMode === 'default'" class="droplet-plot">
          <div class="plot-title"><span class="title-text">点滴长图</span></div>
          <div class="plot-list">
            <div v-if="state.bitAlbum.length" class="list-item">
              <van-image
                fit="conver"
                :src="state.bitAlbum[0].url"
              />
            </div>
            <div v-if="state.bitAlbum.length > 1" class="list-item">
              <div v-if="state.bitAlbum.length >= 2" class="item-inner">
                <van-image
                  fit="conver"
                  :src="state.bitAlbum[1].url"
                />
              </div>
              <div v-if="state.bitAlbum.length === 3" class="item-inner">
                <van-image
                  fit="conver"
                  :src="state.bitAlbum[2].url"
                />
              </div>
            </div>
          </div>
        </div> -->
        <!-- 全部事件 -->
        <div ref="filterRef" class="filter-event">
          <van-swipe
            v-if="state.listMode === 'default'"
            class="page-banner"
            :autoplay="3000"
            lazy-render
          >
            <van-swipe-item v-for="(image, index) in state.images" :key="index">
              <img :src="image.url" />
              <div class="swipe-bar">
                <div class="bar-title">{{ image.title }}</div>
                <div class="bar-text">{{ image.text }}</div>
              </div>
            </van-swipe-item>
          </van-swipe>
          <!-- 标题筛选 -->
          <!-- <van-sticky v-if="state.eventList.length" :container="filterRef" offset-top="44"> -->
          <div v-if="state.listMode === 'other'" class="event-title">
            <span class="title-text">全部事件</span>
            <van-popover
              placement="bottom-end"
              :actions="state.bindList"
              position="top-start"
              @select="handleSelectDevice"
            >
              <template #reference>
                <span class="title-option"
                  >全部设备<span class="iconfont icon-shaixuan"></span
                ></span>
              </template>
            </van-popover>
          </div>
          <!-- </van-sticky> -->

          <!-- 事件内容 -->
          <van-loading v-if="state.eventLoading" size="24px">加载中...</van-loading>
          <div v-else-if="!state.eventLoading && state.eventList.length" class="list-inner">
            <van-list
              class="event-list"
              v-model:loading="scrollLoading"
              :finished="state.finished"
              finished-text="没有更多了"
              :immediate-check="false"
              :offset="2"
              @load="onLoad"
            >
              <div class="list-item" v-for="(item) in state.eventList" :key="item.date">
                <div class="item-title">{{ item.date }}</div>
                <div class="item-imgs">
                  <div class="imgs-wrapper" v-for="(info) in item.AlgEvent" :key="info.id">
                    <van-image
                      class="img"
                      fit="conver"
                      lazy-load
                      :src="$constant.OPEN_URL + info.url + '?token=' + query.token + '&view=imageView2/1/w/50/h/50'"
                      @click="handlePreview(info)"
                    >
                      <template v-slot:loading>
                        <van-loading type="spinner" size="20" />
                      </template>
                    </van-image>
                    <span v-if="info.fileType === 2" class="time">{{ info.dur || '00:00' }} </span>
                    <div v-if="state.pageMode === 'edit'" class="img-mask" >
                      <van-checkbox v-model="info.checked" icon-size="14px" @change="handlCheckItem"></van-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            </van-list>
          </div>
          
          <div v-if="state.listMode === 'default' || state.isEmpty" class="empty empty-class">
            <div class="empty-img"></div>
            <div class="empty-text">暂无相关事件数据</div>
          </div>
          
          <van-sticky save v-if="state.pageMode === 'edit' && !state.eventLoading" position="bottom">
            <div class="top-shadow bottom-bar van-safe-area-bottom" @click="handleDelEvent">
              <span class="iconfont icon-shanchu"></span>
              <div>删除</div>
            </div>
          </van-sticky>
        </div>
      </div>
      
    </div>

    <!-- 搜索可部署设备 -->
    <van-popup v-model:show="state.showSearchPopup" position="bottom" :style="{ height: '30%' }">
      <div class="popup-inner">
        <div class="popup-inner-top">添加部署设备</div>
        <div class="popup-inner-center">
          <img v-if="state.searchLoading" class="search"  src="@/assets/img/search-icon.png" alt="" />
          <img v-if="!state.searchLoading && !state.unbindList.length" src="@/assets/img/empty-icon.png" alt="" />
          <span v-if="state.searchLoading" class="icon-fangdajing">
            <img src="@/assets/img/fangdajing.png" alt="">
          </span>
        </div>
        <div class="popup-inner-bottom">
          {{ state.searchLoading ? '正在加载可部署设备...' : '未加载到需要部署摄像头设备' }}
        </div>
      </div>
    </van-popup>
    <!-- 确认操作弹框 -->
    <van-popup v-model:show="state.showConfrimPopup" position="bottom" :style="{ height: '30%' }">
      <div class="popup-inner">
        <div class="popup-inner-top">确认删除文件吗?</div>
        <div class="popup-inner-text">
          文件选择删除后，存放其他位置对应的文件也将被永久删除，且不能恢复
        </div>
        <div class="bar-bottom">
          <van-button class="cancel-btn" @click="state.showConfrimPopup = false">取消</van-button>
          <van-button type="primary" @click="delEvent">删除</van-button>
        </div>
      </div>
    </van-popup>
    <!-- 图片预览 -->
    <van-image-preview v-model:show="state.showPreview" :images="state.preImgs">
      <template #image="{ src: info }">
        <van-image v-if="!info.isVideo" class="img" fit="conver" :src="info.url"  />
        <video v-else style="object-fit: conver; width: 100%" controls autoplay name="media">
          <source :src="info.url" type="video/mp4">
          您的浏览器不支持 video 标签。
        </video>
      </template>
    </van-image-preview>
  </div>
</template>

<style scoped lang="scss">
  .page {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: $main-bg;

    display: flex;
    flex-direction: column;
    .page-content {
      flex: 1;
      overflow-y: auto;
      .page-banner {
        margin-bottom: 20px;
        .van-swipe-item {
          height: 200px;
          img {
            width: 100%;
            height: 100%;
          }
        }
      }
      .add-device {
        margin: $content-padding-top $content-padding-right $content-padding-bottom
          $content-padding-left;
        padding: 30px 0;
        font-size: $main-size;
        text-align: center;
        border-radius: $radius;
        background-color: $content-bg;
        .icon-jia {
          font-size: $main-size;
          margin-right: $icon-margin-right;
        }
      }

      .content-inner {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        .droplet-plot {
          width: 100%;

          .plot-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: $title-padding-top $title-padding-right $title-padding-bottom
              $title-padding-left;
            background-color: #ffffff;
            .title-text {
              color: $title-font-color;
              font-size: $title-size;
              font-weight: $title-weight;
            }
          }
          .plot-list {
            display: flex;
            height: 150px;
            img {
              display: block;
              width: 100%;
              height: 100%;
            }
            .list-item {
              flex: 1;
              display: flex;
              flex-direction: column;
              
              .item-inner {
                flex: 1;
                height: 50%;
              }
            }
          }
        }

        .filter-event {
          width: 100%;
          display: flex;
          overflow: hidden;
          flex-direction: column;
          flex: 1;
          .event-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: $title-padding-top $title-padding-right $title-padding-bottom
              $title-padding-left;
            background-color: #ffffff;
            .title-text {
              color: $title-font-color;
              font-size: $title-size;
              font-weight: $title-weight;
            }
            .title-option {
              display: flex;
              align-items: center;
              color: $title-option-font-color;
              font-size: $title-size-low;
              .icon-shaixuan {
                font-size: $title-size-low;
                margin-left: $icon-margin-left;
              }
            }
          }
          .list-inner {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            background-color: $content-bg;
          }
          .event-list {
            
            .list-item {
              margin-bottom: $item-margin-top;
              &:last-child {
                margin-bottom: 0;
              }
              .item-title {
                font-size: $title-size-low;
                color: $title-font-color;
                padding-bottom: $item-title-padding-bottom;
                padding-left: $item-title-padding-left;
              }
              .item-imgs {
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-start;
                .imgs-wrapper {
                  position: relative;
                  width: 24%;
                  height: 76px;
                  margin: 0.5%;
                  .time {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    color: #fff;
                    z-index: 1;
                    font-size: $time-size;
                  }
                  .img-mask {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 2;
                    .van-checkbox {
                      position: absolute;
                      right: 5px;
                      top: 5px;
                    }
                  }
                }
              }
            }
          }
          .bottom-bar {
            height: 49px;
            background-color: $content-bg;
            display: flex;
            flex-direction: column;
            align-items: center;
            .icon-shanchu {
              margin: 5px 0 3px 0;
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
        height: 126px;
        margin-top: 30px;
        margin-bottom: 20px;
        .icon-fangdajing {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          img {
            width: 100%;
            height: 100%;
          }
        }
        .search {
          animation: run 2s linear infinite;
        }
        img {
          height: 100%;
        }
      }
    }
  }
  .notice-icon {
    display: inline-block;
    width: 18px;
    height: 18px;
    margin-right: 20px;
    img {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
  .more-icon {
    margin-right: 0;
  }
  .select-all {
    font-size: $main-size;
    color: $main-color;
  }

  @keyframes run {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  .empty-class {
    flex: 1;
    margin-top: 15vh;
  }
  .van-swipe-item {
    position: relative;
    .swipe-bar {
      color: #ffffff;
      position: absolute;
      width: 100%;
      height: 60px;
      bottom: 0;
      padding: 12px 15px;
      background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.56) 100%);
      border-radius: 0px 0px 0px 0px;
      opacity: 1;
      font-size: $main-size;
      .bar-text {
        margin-top: 4px;
        font-size: 12px;
      }
    }
  }
  .van-image__loading {
    .van-loading {
      margin: 0;
    }
  }

  .refrash-loading {
    width: 100%;
    display: flex;
    justify-content: space-around;
    padding-bottom: $content-margin-bottom;
    .van-loading {
      margin: 0;
    }
  }
  
</style>
