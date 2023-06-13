import request from '@/request/request'

// 调整camera方向
export const setCameraDirection = async (commandName, msg) => {
  const searchPrams = location.hash.slice(location.hash.indexOf('?'))
  const queryParams = Object.fromEntries(new URLSearchParams(searchPrams))
  return request.put(`/light-app/open-api/core-command/api/v2/device/name/${queryParams.deviceID}/${commandName}`, {[commandName]: 5}, msg)
}

export default {}