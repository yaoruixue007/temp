// request.ts
import axios from "./index";
import qs from "qs";
 class Request {
  /**
   * get方法
   * @param {string} url 路径
   * @param {object} params 参数
   */
  get = (url, params) => {
    return new Promise((resolve, reject) => {
      axios.get(url, { params: params }).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      })
    })
  }

  post = (url, params) => {
    return new Promise((resolve, reject) => {
      axios.post(url, qs.stringify(params)).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      })
    })
  }
}

export default new Request()
