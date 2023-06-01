import { createRouter, createWebHashHistory } from 'vue-router'
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      meta: {
        title: '宠物靓照',
        show: true,
      },
      component: () => import('@/views/home/index.vue')
    },
    {
      path: '/setting',
      name: 'setting',
      meta: {
        title: '应用设置',
        show: true,
      },
      component: () => import('@/views/setting/index.vue')
    },
    {
      path: '/arrange',
      name: 'arrange',
      meta: {
        title: '选择设备',
        show: true,
      },
      component: () => import('@/views/arrange/index.vue')
    },
    {
      path: '/arrangeResault',
      name: 'arrangeResault',
      meta: {
        title: '设备部署',
        show: true,
      },
      component: () => import('@/views/arrangeResault/index.vue')
    },
    {
      path: '/notice',
      name: 'notice',
      meta: {
        title: '消息通知',
        show: true,
      },
      component: () => import('@/views/notice/index.vue')
    }
  ]
})

export default router
