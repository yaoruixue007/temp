<script setup>
</script>
<template>
  <div class="page">
    <!-- header -->
    <aHeader :title="show ? title : ''" backFlag="custom" @handleLeft="router.push({ path: '/home', query })"></aHeader>

    <!-- 内容主体 -->
    <div class="page-content">
      PAGE2
    </div>
  </div>
</template>