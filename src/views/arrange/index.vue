<script setup>
</script>
<template>
  <div class="page">
    <!-- header -->
    <aHeader :title="show ? title : ''" backFlag="custom" @handleLeft="router.push({ path: '/home', query })"></aHeader>

    <!-- 内容主体 -->
    <div class="page-content">
      PAGE1
    </div>
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
