import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 配置相关
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),

  // 登录相关
  login: (params: { serverUrl: string; email: string; password: string }) =>
    ipcRenderer.invoke('login', params),

  // Agent 连接相关
  connectAgent: (params: { wsServerUrl: string; secretKey: string; agentId: string }) =>
    ipcRenderer.invoke('connect-agent', params),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  getStatus: () => ipcRenderer.invoke('get-status'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 事件监听
  onConnectionStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('connection-status', (_, status) => callback(status))
  },
  onAuthResult: (callback: (result: any) => void) => {
    ipcRenderer.on('auth-result', (_, result) => callback(result))
  },

  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})

// TypeScript 类型声明
declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<{
        serverUrl: string
        email: string
        password: string
        rememberCredentials: boolean
      }>
      saveConfig: (config: any) => Promise<boolean>
      login: (params: { serverUrl: string; email: string; password: string }) => Promise<{
        success: boolean
        agents?: any[]
        wsServerUrl?: string
        error?: string
      }>
      connectAgent: (params: { wsServerUrl: string; secretKey: string; agentId: string }) => Promise<{ success: boolean; error?: string }>
      disconnect: () => Promise<{ success: boolean }>
      getStatus: () => Promise<{ connected: boolean; authenticated: boolean }>
      minimizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      onConnectionStatus: (callback: (status: any) => void) => void
      onAuthResult: (callback: (result: any) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}
