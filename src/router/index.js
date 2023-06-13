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
        title: '智能摄像头300w',
        show: true,
      },
      component: () => import('@/views/home/index.vue')
    },
  ]
})

export default router
