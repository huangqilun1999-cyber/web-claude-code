#!/usr/bin/env node

import { Command } from 'commander'
import { Agent } from './agent'
import { ConfigManager } from './config'
import chalk from 'chalk'

const program = new Command()

program
  .name('wcc-agent')
  .description('Web Claude Code Local Agent')
  .version('0.1.0')

program
  .command('config')
  .description('Configure the agent')
  .option('-s, --server <url>', 'Server WebSocket URL')
  .option('-k, --key <key>', 'Agent secret key')
  .action(async (options) => {
    const config = new ConfigManager()

    if (options.server) {
      config.set('serverUrl', options.server)
      console.log(chalk.green('Server URL saved'))
    }

    if (options.key) {
      config.set('secretKey', options.key)
      console.log(chalk.green('Secret key saved'))
    }

    if (!options.server && !options.key) {
      console.log('Current configuration:')
      console.log(`  Server URL: ${config.get('serverUrl') || chalk.gray('(not set)')}`)
      console.log(`  Secret Key: ${config.get('secretKey') ? chalk.gray('****') : chalk.gray('(not set)')}`)
    }
  })

program
  .command('start')
  .description('Start the agent')
  .option('-s, --server <url>', 'Server WebSocket URL')
  .option('-k, --key <key>', 'Agent secret key')
  .action(async (options) => {
    const config = new ConfigManager()
    const serverUrl = options.server || config.get('serverUrl')
    const secretKey = options.key || config.get('secretKey')

    if (!serverUrl) {
      console.error(chalk.red('Error: Server URL not configured'))
      console.log('Run: wcc-agent config -s <server-url>')
      process.exit(1)
    }

    if (!secretKey) {
      console.error(chalk.red('Error: Secret key not configured'))
      console.log('Run: wcc-agent config -k <secret-key>')
      process.exit(1)
    }

    console.log(chalk.blue('Starting Web Claude Code Agent...'))
    console.log(`Connecting to: ${serverUrl}`)

    const agent = new Agent({
      serverUrl,
      secretKey,
      autoReconnect: true,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
    })

    await agent.connect()
  })

program.parse()
