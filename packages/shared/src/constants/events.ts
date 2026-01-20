export const WS_EVENTS = {
  // 客户端事件
  CLIENT_AUTH: 'client:auth',
  CLIENT_EXECUTE: 'client:execute',
  CLIENT_ABORT: 'client:abort',  // 中止当前执行
  CLIENT_INPUT_RESPONSE: 'client:input_response',  // 用户交互输入响应
  CLIENT_FILE: 'client:file',
  CLIENT_TERMINAL: 'client:terminal',
  CLIENT_GIT: 'client:git',
  CLIENT_PING: 'client:ping',

  // 服务器事件
  SERVER_AUTH_RESULT: 'server:auth_result',
  SERVER_THINKING: 'server:thinking',
  SERVER_STREAM: 'server:stream',
  SERVER_TOOL_CALL: 'server:tool_call',
  SERVER_TOOL_RESULT: 'server:tool_result',  // 工具执行结果
  SERVER_COMPLETE: 'server:complete',
  SERVER_ABORTED: 'server:aborted',  // 任务已中止
  SERVER_FILE_RESULT: 'server:file_result',
  SERVER_TERMINAL_OUTPUT: 'server:terminal_output',
  SERVER_GIT_RESULT: 'server:git_result',
  SERVER_AGENT_STATUS: 'server:agent_status',
  SERVER_AGENT_LIST: 'server:agent_list',
  SERVER_AGENT_CONNECTED: 'server:agent_connected',
  SERVER_AGENT_DISCONNECTED: 'server:agent_disconnected',
  SERVER_SESSION_CREATED: 'server:session_created',
  SERVER_INPUT_REQUIRED: 'server:input_required',  // 需要用户输入
  SERVER_ERROR: 'server:error',
  SERVER_PONG: 'server:pong',

  // Agent事件
  AGENT_AUTH: 'agent:auth',
  AGENT_THINKING: 'agent:thinking',
  AGENT_STREAM: 'agent:stream',
  AGENT_TOOL_CALL: 'agent:tool_call',
  AGENT_TOOL_RESULT: 'agent:tool_result',  // 工具执行结果
  AGENT_RESPONSE: 'agent:response',
  AGENT_ABORTED: 'agent:aborted',  // 任务已中止
  AGENT_FILE_RESULT: 'agent:file_result',
  AGENT_TERMINAL_OUTPUT: 'agent:terminal_output',
  AGENT_GIT_RESULT: 'agent:git_result',
  AGENT_INPUT_REQUIRED: 'agent:input_required',  // Agent 需要用户输入
  AGENT_STATUS: 'agent:status',
  AGENT_PING: 'agent:ping',

  // 服务器到Agent事件
  SERVER_AGENT_AUTH_RESULT: 'server:agent_auth_result',
  SERVER_EXECUTE: 'server:execute',
  SERVER_ABORT: 'server:abort',  // 中止当前执行
  SERVER_INPUT_RESPONSE: 'server:input_response',  // 转发用户输入响应给 Agent
  SERVER_FILE: 'server:file',
  SERVER_TERMINAL: 'server:terminal',
  SERVER_GIT: 'server:git',
} as const

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS]
