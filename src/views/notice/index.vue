<script setup>
  import { useRoute, useRouter } from 'vue-router'
  import { reactive, onMounted, getCurrentInstance } from 'vue'
  import aHeader from '@/components/header/index.vue'
  import { showNotify } from 'vant'
  const router = useRouter()
  const { query, meta: { title, show } } = useRoute()
  const { proxy: { $api, $constant } } = getCurrentInstance()
  const state = reactive({
    loading: false,
    noticeList: [], // 未部署的设备列表
    preImgs: [], // 预览列表
    showPreview: false, // 预览标识
  })

  onMounted(() => {
    getNoticeList()
  })
  /**
   * 接口相关
   */
  // 获取消息列表
  const getNoticeList = async () => {
    state.loading = true
    const res = await $api.get('getMessageList', { page: 1, pageSize: 9 }).catch((err) => {
      showNotify({ type: 'danger', message: err.message });
    })
    
    if (!res) return
    const res1 = await $api.get('deviceList', { page: 1, pageSize: 9999 }).catch((err) => {
      showNotify({ type: 'danger', message: '网络错误请稍后再试' })
    })
    state.loading = false
    if (!res1) return
    res.AlgMessageList = res.AlgMessageList.map(item => {
      res1.devices.forEach(info => {
        if (item.deviceId === info.name) {
          item.deviceName = info.labels[1].split('=')[1]
        }
      })
      return item
    })
    state.noticeList = res.AlgMessageList
  }
  // 获取item detail
  const getNoticeDetail = async (preInfo) => {
    const params = {
        app_id: query.appId,
        uid: query.userId,
        id: preInfo.id + ''
    }
    const res = await $api.put('getMessage', params).catch((err) => {
      showNotify({ type: 'danger', message: err.message });
    })
    // if (!res) return
    state.noticeList = state.noticeList.map(item =>{
      if (item.id === preInfo.id) {
        item.hasRead = true
      }
      return item
    })
    state.preImgs = [
      {
        url: $constant.OPEN_URL + preInfo.file + '?token=' + query.token,
        isVideo: preInfo.fileType === 2
      }
    ]
    state.showPreview = true
    // getNoticeList()
  }
  // 全部已读
  const readAll = async () => {
    const params = {
      app_id: query.appId,
      uid: query.userId
    }
    const res = await $api.put('readAllMessage', params).catch((err) => {
      showNotify({ type: 'danger', message: err.message });
    })
    if (!res) return
    getNoticeList()
  }
  // 清空已读
  const cleanReadItems = async () => {
    const res = await $api.delete('delReadMessage').catch((err) => {
      showNotify({ type: 'danger', message: err.message });
    })
    if (!res) return
    getNoticeList()
  }
  /**
   * 操作相关
   */
  // 点击查看信息
  const handleOpenItem = (item) => {
    console.log(item)
    getNoticeDetail(item)
  }
</script>
<template>
  <div class="page">
    <!-- header -->
    <aHeader :title="show ? title : ''" backFlag="custom" @handleLeft="router.push({ path: '/home', query })" />

    <!-- 内容主体 -->
    <div class="page-content">
      <div class="list-title">
        <div @click="readAll">全部已读</div>
        <div @click="cleanReadItems">清空全部已读</div>
      </div>
      <van-loading v-if="state.loading" size="24px">加载中...</van-loading>
      <div v-if="!state.loading && state.noticeList.length" class="content-list">
        <div class="list-item" v-for="(item, index) in state.noticeList" :key="index" @click="handleOpenItem(item)" >
          <div class="item-left">
            <van-badge :dot="!item.hasRead">
              <img v-if="item.fileType === 1" src="../../assets/img/lang-photo-icon.png" alt="">
              <img v-else src="../../assets/img/photo-icon.png" alt="">
            </van-badge>
          </div>
          <div class="item-right">
            <div class="right-top">{{  $constant.ENUM_TYPE[item.mediaType] }}</div>
            <div class="right-bottom">
              <div>{{ item.deviceName }}</div>
              <div class="right-bottom-desc">{{ item.desc }}</div>
              <div>{{ item.date }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!state.loading && !state.noticeList.length" class="empty empty-class">
        <div class="empty-img"></div>
        <div class="empty-text">暂无消息通知</div>
      </div>
    </div>
    <!-- 图片预览 -->
    <van-image-preview v-model:show="state.showPreview" :images="state.preImgs">
      <template #image="{ src: info }">
        <van-image v-if="!info.isVideo" class="img" fit="conver" :src="info.url" :key="info.url" />
        <video v-else style="object-fit: conver; width: 100%" controls autoplay name="media" :key="info.url">
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
    display: flex;
    flex-direction: column;
    .page-content {
      flex: 1;
      padding: $content-padding-top $content-padding-right $content-padding-bottom
        $content-padding-left;
      overflow-y: auto;
      .list-title {
        display: flex;
        justify-content: space-between;
        font-size: $tip-size;
      }
      .content-list {
        .list-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 25px;
          .item-left {
            height: 41px;
            width: 41px;
            border-radius: 5px;
            margin-right: $item-margin-right;
            img {
              width: 100%;
              height: 100%;
            }
          }
          .item-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            .right-top {
              font-size: $main-size;
            }
            .right-bottom {
              flex: 1;
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              margin-top: $item-margin-top;
              color: $sce-font-color;
              .right-bottom-desc {
                flex: 1;
                color: $desc-font-color;
              }
            }
          }
          .item-icon {
            margin-right: $icon-margin-right;
          }
          .item-name {
            margin-right: 20px;
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
          transform: translateY(2px);
        }
        .protocol-text {
          margin-left: $icon-margin-left;
          font-size: $tip-size;
        }
        .protocol-link {
          color: $main-color;
          font-size: $tip-size;
        }
      }
      .bar-bottom {
        display: flex;
        margin-top: $item-margin-top;
        .van-button {
          flex: 1;
          margin-right: $content-margin-right;
          &:last-child {
            margin: 0;
          }
        }
      }
    }
  }
</style>
