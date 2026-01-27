/**
 * 구조화된 로깅 시스템
 *
 * 프로덕션 환경에서 효과적인 모니터링을 위한 구조화된 로거
 * - 로그 레벨 구분 (DEBUG, INFO, WARN, ERROR)
 * - 컨텍스트 정보 포함 (userId, requestId, timestamp)
 * - JSON 형식 출력 (프로덕션)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  requestId?: string
  action?: string
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    name?: string
  }
}

const isProduction = process.env.NODE_ENV === 'production'

/**
 * 로그 레벨 우선순위
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * 현재 환경의 최소 로그 레벨
 */
const MIN_LOG_LEVEL: LogLevel = isProduction ? 'info' : 'debug'

/**
 * 로그 레벨이 출력되어야 하는지 확인
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL]
}

/**
 * 로그 엔트리 생성
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error | unknown
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }

  if (error) {
    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    } else {
      entry.error = {
        message: String(error),
      }
    }
  }

  return entry
}

/**
 * 로그 출력
 */
function output(entry: LogEntry): void {
  // 프로덕션: JSON 형식
  if (isProduction) {
    const output = JSON.stringify(entry)
    switch (entry.level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      default:
        console.log(output)
    }
    return
  }

  // 개발 환경: 가독성 좋은 형식
  const prefix = `[${entry.level.toUpperCase()}]`
  const timestamp = entry.timestamp.split('T')[1]?.slice(0, 8) || ''
  const contextStr = entry.context
    ? ` ${JSON.stringify(entry.context)}`
    : ''

  switch (entry.level) {
    case 'error':
      console.error(`${prefix} ${timestamp} ${entry.message}${contextStr}`)
      if (entry.error?.stack) {
        console.error(entry.error.stack)
      }
      break
    case 'warn':
      console.warn(`${prefix} ${timestamp} ${entry.message}${contextStr}`)
      break
    case 'debug':
      console.debug(`${prefix} ${timestamp} ${entry.message}${contextStr}`)
      break
    default:
      console.log(`${prefix} ${timestamp} ${entry.message}${contextStr}`)
  }
}

/**
 * 메인 로거 객체
 */
export const logger = {
  /**
   * 디버그 레벨 로그 (개발 환경에서만 출력)
   */
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return
    const entry = createLogEntry('debug', message, context)
    output(entry)
  },

  /**
   * 정보 레벨 로그
   */
  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return
    const entry = createLogEntry('info', message, context)
    output(entry)
  },

  /**
   * 경고 레벨 로그
   */
  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return
    const entry = createLogEntry('warn', message, context)
    output(entry)
  },

  /**
   * 에러 레벨 로그
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!shouldLog('error')) return
    const entry = createLogEntry('error', message, context, error)
    output(entry)
  },

  /**
   * API 요청 로그 헬퍼
   */
  apiRequest(
    method: string,
    path: string,
    context?: LogContext
  ): void {
    this.info(`${method} ${path}`, { action: 'api_request', ...context })
  },

  /**
   * API 응답 로그 헬퍼
   */
  apiResponse(
    method: string,
    path: string,
    status: number,
    duration?: number,
    context?: LogContext
  ): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    const msg = `${method} ${path} -> ${status}${duration ? ` (${duration}ms)` : ''}`

    if (level === 'error') {
      this.error(msg, undefined, { action: 'api_response', status, ...context })
    } else if (level === 'warn') {
      this.warn(msg, { action: 'api_response', status, ...context })
    } else {
      this.info(msg, { action: 'api_response', status, ...context })
    }
  },

  /**
   * AI 생성 작업 로그 헬퍼
   */
  aiGeneration(
    type: 'avatar' | 'image-ad' | 'video-ad' | 'music' | 'tts',
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `AI ${type} generation ${status}`
    if (status === 'failed') {
      this.error(message, undefined, { action: 'ai_generation', type, status, ...context })
    } else {
      this.info(message, { action: 'ai_generation', type, status, ...context })
    }
  },

  /**
   * 크레딧 트랜잭션 로그 헬퍼
   */
  creditTransaction(
    type: 'deduct' | 'add' | 'refund',
    amount: number,
    context?: LogContext
  ): void {
    this.info(`Credit ${type}: ${amount}`, {
      action: 'credit_transaction',
      type,
      amount,
      ...context,
    })
  },
}

/**
 * 요청별 로거 생성 (requestId 자동 포함)
 */
export function createRequestLogger(requestId: string, userId?: string) {
  const baseContext: LogContext = { requestId }
  if (userId) baseContext.userId = userId

  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...baseContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      logger.error(message, error, { ...baseContext, ...context }),
  }
}

export default logger
