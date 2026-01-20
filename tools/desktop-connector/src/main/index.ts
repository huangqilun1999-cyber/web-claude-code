import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { AgentConnection } from './agent-connection'

// 配置存储
const store = new Store({
  defaults: {
    serverUrl: '',
    email: '',
    password: '',
    rememberCredentials: false,
  }
})

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let agentConnection: AgentConnection | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    resizable: false,
    frame: false,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: join(__dirname, '../../resources/icon.png'),
    show: false,
  })

  // 开发模式加载本地服务器，生产模式加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (agentConnection?.isConnected()) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  // 创建简单的托盘图标
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKUSURBVFiF7ZdNaBNBFMd/s5tsYmxS0qQfVFAQQfCgVlBEEBU8eBAvXrx49ebJi3jy5MGDBy9+IF48efLgwYugKIgIIoKIoCiKilJRTNM0TbLZnfEw2WzSJrtJGvDgH4ZlZ+fN/N6bmZ0d+M8/DqOehL7+Mxht2IqmHcaQsq/1L2xdvdGxGOOO4DcBt4E9QDOQBz4C94F7wMQ/DGBnV2x97rFDB7Y1xFt6EUINSPIWeCnk4sKFqamZb0NDZ6amZn4sJbYogK2bN/R29Z0YOTJ6OJKqaqANGAWmgUfAOeAH5QGbAkgmGla1bt3eu2n7pr6WSxdWrlgV8zC0KwCaYgktBU+zUsqskkK1QIJgc09na5a8aq1V3nO3x+MNsVabsgD1ADQlooEh7OwaMy2lnBBSToQgKu/5M9vZ/P6VFf3nVgxk4olESwBQegF4gBGJhI5pmqWTL4CiAEzL/JqaThWu3R9P37k+/vXBpPYRuI3yrPcDJeBMPU5bsRhaF3ADJzQhFxeCmRAYAuTiZ8Z3Cqm6UQWBKJi+ysKhGqg1gG1b2qGd8S6g15DUBI3eFgYQDqAdOBYWQH0hOF0PgNoJXC2+VwNhAYRdxEpwCVgTlmB5AQ7UAxAawHd2bPQZuFmLaemLqF6RhwAu1UhVv4g9APYCe8MSLCfAa0BnWAIvwBmgNSyB1xO4BTwNS+AF0AJcrgegvhYo8CIsCQvg+v37fEAdJOUJkjUY1CNAFphcLoDeAGYIQvDBsvfRqG40qEdD+wP0A+EzeD0BJoA2YE9Ygv8xwJwEqkGolwC7wEeBb0AqlFoygG3ABSAZlqCeECS1KcCmMv1fxPUGkMJnPJSIJGsJYFvWFWANsLNeJ/6FI+8v2lRtGqBJrgQAAAAASUVORK5CYII='
  )

  tray = new Tray(icon)

  updateTrayMenu()

  tray.setToolTip('WCC Desktop Connector')

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    } else {
      createWindow()
    }
  })
}

function updateTrayMenu() {
  const connected = agentConnection?.isConnected() ?? false

  const contextMenu = Menu.buildFromTemplate([
    {
      label: connected ? '✓ 已连接' : '○ 未连接',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        } else {
          createWindow()
        }
      }
    },
    {
      label: connected ? '断开连接' : '连接',
      click: () => {
        if (connected) {
          agentConnection?.disconnect()
        } else {
          if (mainWindow) {
            mainWindow.show()
          } else {
            createWindow()
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        agentConnection?.disconnect()
        app.quit()
      }
    }
  ])

  tray?.setContextMenu(contextMenu)
}

// 注册 IPC 处理器
function setupIpcHandlers() {
  ipcMain.handle('get-config', () => {
    return {
      serverUrl: store.get('serverUrl'),
      email: store.get('email'),
      password: store.get('password'),
      rememberCredentials: store.get('rememberCredentials'),
    }
  })

  ipcMain.handle('save-config', (_, config) => {
    if (config.serverUrl !== undefined) store.set('serverUrl', config.serverUrl)
    if (config.email !== undefined) store.set('email', config.email)
    if (config.password !== undefined) store.set('password', config.password)
    if (config.rememberCredentials !== undefined) store.set('rememberCredentials', config.rememberCredentials)
    return true
  })

  // 登录到 Web UI
  ipcMain.handle('login', async (_, { serverUrl, email, password }) => {
    try {
      // 创建 AgentConnection 实例（如果还没有）
      if (!agentConnection) {
        agentConnection = new AgentConnection()
      }

      // 登录并获取 Agent 列表
      const result = await agentConnection.login(serverUrl, email, password)
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 连接到指定的 Agent
  ipcMain.handle('connect-agent', async (_, { wsServerUrl, secretKey, agentId }) => {
    try {
      if (!agentConnection) {
        agentConnection = new AgentConnection()
      }

      // 移除旧的监听器
      agentConnection.removeAllListeners()

      // 监听连接状态变化
      agentConnection.on('connected', () => {
        mainWindow?.webContents.send('connection-status', { status: 'connected' })
        updateTrayMenu()
      })

      agentConnection.on('disconnected', () => {
        mainWindow?.webContents.send('connection-status', { status: 'disconnected' })
        updateTrayMenu()
      })

      agentConnection.on('error', (error: string) => {
        mainWindow?.webContents.send('connection-status', { status: 'error', error })
        updateTrayMenu()
      })

      agentConnection.on('auth-result', (result: { success: boolean; error?: string; agentId?: string }) => {
        mainWindow?.webContents.send('auth-result', result)
        updateTrayMenu()
      })

      // 连接到 Agent
      const result = await agentConnection.connectAgent(wsServerUrl, secretKey, agentId)
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('disconnect', () => {
    agentConnection?.disconnect()
    return { success: true }
  })

  ipcMain.handle('get-status', () => {
    return {
      connected: agentConnection?.isConnected() ?? false,
      authenticated: agentConnection?.isAuthenticated() ?? false,
    }
  })

  ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('close-window', () => {
    if (agentConnection?.isConnected()) {
      mainWindow?.hide()
    } else {
      mainWindow?.close()
    }
  })
}

// 应用生命周期
app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // 在 macOS 上，关闭窗口不退出应用
  if (process.platform !== 'darwin') {
    if (!agentConnection?.isConnected()) {
      app.quit()
    }
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  agentConnection?.disconnect()
})
