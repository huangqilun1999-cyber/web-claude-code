import Conf from 'conf'

interface AgentConfig {
  serverUrl?: string
  secretKey?: string
  allowedPaths?: string[]
}

export class ConfigManager {
  private config: Conf<AgentConfig>

  constructor() {
    this.config = new Conf<AgentConfig>({
      projectName: 'wcc-agent',
      schema: {
        serverUrl: { type: 'string' },
        secretKey: { type: 'string' },
        allowedPaths: { type: 'array', items: { type: 'string' } },
      },
    })
  }

  get<K extends keyof AgentConfig>(key: K): AgentConfig[K] {
    return this.config.get(key)
  }

  set<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]): void {
    this.config.set(key, value)
  }

  getAll(): AgentConfig {
    return this.config.store
  }

  clear(): void {
    this.config.clear()
  }
}
