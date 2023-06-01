// index.ts
import axios, { AxiosRequestConfig, Method } from 'axios'
import router from '@/router'
import store from '@/store'
import { showNotify } from 'vant'
import { storage } from '@/utils/storage'

/**
 * 请求失败后的错误统一处理
 * @param {Number} status 请求失败的状态码
 */
const errorHandle = (status, other) => {
  // 状态码判断
  switch (status) {
    case 302:
      message.error('接口重定向了！')
      break
    case 400:
      showNotify({ type: 'danger', message: '服务器异常' })
      break
    // 401: 未登录
    // 未登录则跳转登录页面，并携带当前页面的路径
    // 在登录成功后返回当前页面，这一步需要在登录页操作。
    case 401: //重定向
      showNotify({ type: 'danger', message: '登录失效' })
      // 需要跳转登录
      break
    // 403 token过期
    // 清除token并跳转登录页
    case 403:
      showNotify({ type: 'danger', message: '登录过期' })
      // 需要跳转登录
      break
    case 404:
      showNotify({ type: 'danger', message: '请求未定义' })
      break

    case 500:
      showNotify({ type: 'danger', message: '服务器异常' })
      break

    default:
      showNotify({ type: 'danger', message: '位置错误' })
  }
}

const CancelToken = axios.CancelToken

// 移除重复请求
const removePending = (config) => {
  for (const key in pending) {
    const item = +key
    const list = pending[key]
    // 当前请求在数组中存在时执行函数体
    if (
      list.url === config.url &&
      list.method === config.method &&
      JSON.stringify(list.params) === JSON.stringify(config.params) &&
      JSON.stringify(list.data) === JSON.stringify(config.data)
    ) {
      // 执行取消操作
      list.cancel('操作太频繁，请稍后再试')
      // 从数组中移除记录
      pending.splice(item, 1)
    }
  }
}

/* 实例化请求配置 */
const instance = axios.create({
  headers: {
    //php 的 post 传输请求头一定要这个 不然报错 接收不到值
    'Content-Type': 'application/json;charset=UTF-8',
    'Access-Control-Allow-Origin-Type': '*'
  },
  // 请求时长
  timeout: 1000 * 30,
  // 请求的base地址 TODO:这块以后根据不同的模块调不同的api
  // baseURL: process.env.VUE_APP_API_URL,
  //     ? "测试"
  //     : "正式",
  // 表示跨域请求时是否需要使用凭证
  withCredentials: false
})

/**
 * 请求拦截器
 * 每次请求前，如果存在token则在请求头中携带token
 */
instance.interceptors.request.use(
  (config) => {
    removePending(config)
    config.cancelToken = new CancelToken((c) => {
      pending.push({
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data,
        cancel: c
      })
    })
    // 登录流程控制中，根据本地是否存在token判断用户的登录情况
    // 但是即使token存在，也有可能token是过期的，所以在每次的请求头中携带token
    // 后台根据携带的token判断用户的登录情况，并返回给我们对应的状态码
    // 而后我们可以在响应拦截器中，根据状态码进行一些统一的操作。
    // const token = store.state.token;
    // localStorage.setItem('token', token);

    if (storage.get(store.state.Roles)) {
      store.state.Roles
      config.headers.Authorization = storage.get(store.state.Roles)
    }
    return config
  },
  (error) => {
    message.error(error.data.error.message)
    return Promise.reject(error.data.error.message)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  function (config) {
    removePending(config.config)
    // 请求成功
    if (config.status === 200 || config.status === 204) {
      return Promise.resolve(config)
    } else {
      return Promise.reject(config)
    }
    // 请求失败
  },
  function (error) {
    const { response } = error
    if (response) {
      errorHandle(response.status, response.data.message)

      // 超时重新请求
      const config = error.config
      // 全局的请求次数,请求的间隙
      const [RETRY_COUNT, RETRY_DELAY] = [3, 1000]

      if (config && RETRY_COUNT) {
        // 设置用于跟踪重试计数的变量
        config.__retryCount = config.__retryCount || 0
        // 检查是否已经把重试的总数用完
        if (config.__retryCount >= RETRY_COUNT) {
          return Promise.reject(response || { message: error.message })
        }
        // 增加重试计数
        config.__retryCount++
        // 创造新的Promise来处理指数后退
        const backoff = new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, RETRY_DELAY || 1)
        })
        // instance重试请求的Promise
        return backoff.then(() => {
          return instance(config)
        })
      }

      return Promise.reject(response)
    } else {
      // 处理断网的情况
      // eg:请求超时或断网时，更新state的network状态
      // network状态在app.vue中控制着一个全局的断网提示组件的显示隐藏
      // 后续增加断网情况下做的一些操作
      store.commit('networkState', false)
    }
  }
)
// 只需要考虑单一职责，这块只封装axios
export default instance
