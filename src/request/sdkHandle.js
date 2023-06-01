import { showNotify } from 'vant';
const api = {}
const methodArr = ['get', 'post', 'put', 'delete']

methodArr.forEach(method => {
  api[method] = async (url, data, msg) => {
    return new Promise((resolve, rejected) => {
     const searchPrams = location.hash.slice(location.hash.indexOf('?'))
      const queryParams = Object.fromEntries(new URLSearchParams(searchPrams))
      window.LightEngine?.upload({
        url: url,
        method: method.toUpperCase(),
        data: {
          dev: false,
          ...queryParams,
          postData: data,
          ...data,
        },
      }).then(res =>{
        if (res.errno === -1 || res.data.errno !== 0) {
          showNotify({ type: 'danger', message: res.message || res.data.message });
          resolve(null)
          return
        }
        if (res.data?.data.code === -1) {
          rejected(res.data?.data)
        } else {
          resolve(res.data?.data)
        }
      }).catch((err) => {
        rejected(err)
        // showNotify({ type: 'danger', message: err.message || '网络连接超时' });
      })
    })
  }
})

export default api