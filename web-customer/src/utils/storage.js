const PREFIX = 'campus_'

/** 持久化登录信息（token + user） */
export function setLoginAuth(auth) {
  localStorage.setItem(`${PREFIX}auth`, JSON.stringify(auth))
}

/** 读取本地登录信息，无则返回 null */
export function getLoginAuth() {
  try {
    const raw = localStorage.getItem(`${PREFIX}auth`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 清除本地登录信息 */
export function removeLoginAuth() {
  localStorage.removeItem(`${PREFIX}auth`)
}
