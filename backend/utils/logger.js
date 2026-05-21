/**
 * @file Structured logger utility.
 */

const levels = { error: 0, warn: 1, info: 2 };

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m"
};

/**
 * Gets current log level threshold.
 * @returns {number}
 */
function getLevelThreshold() {
  return levels[process.env.LOG_LEVEL || "info"] ?? levels.info;
}

/**
 * Checks if a log level is enabled.
 * @param {"info"|"warn"|"error"} level
 * @returns {boolean}
 */
function isEnabled(level) {
  return levels[level] <= getLevelThreshold();
}

/**
 * Safely serializes optional data payload.
 * @param {unknown} data
 * @returns {string|undefined}
 */
function serializeData(data) {
  if (typeof data === "undefined") {
    return undefined;
  }
  try {
    return JSON.stringify(data);
  } catch (_error) {
    return JSON.stringify({ note: "Failed to serialize data payload" });
  }
}

/**
 * Emits structured or human-readable logs.
 * @param {"info"|"warn"|"error"} level
 * @param {string} prefix
 * @param {string} color
 * @param {string} context
 * @param {string} message
 * @param {unknown} data
 * @returns {void}
 */
function emit(level, prefix, color, context, message, data) {
  if (!isEnabled(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const payload = {
    timestamp,
    level: level.toUpperCase(),
    context,
    message,
    ...(typeof data !== "undefined" ? { data } : {})
  };

  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
    return;
  }

  const dataString = serializeData(data);
  const base = `${color}${prefix}${colors.reset} ${timestamp} [${context}] ${message}`;
  // eslint-disable-next-line no-console
  console.log(dataString ? `${base} ${dataString}` : base);
}

/**
 * Logger implementation.
 */
export const logger = {
  /**
   * Logs informational message.
   * @param {string} context
   * @param {string} message
   * @param {unknown} [data]
   * @returns {void}
   */
  info(context, message, data) {
    emit("info", "[INFO]", colors.green, context, message, data);
  },

  /**
   * Logs warning message.
   * @param {string} context
   * @param {string} message
   * @param {unknown} [data]
   * @returns {void}
   */
  warn(context, message, data) {
    emit("warn", "[WARN]", colors.yellow, context, message, data);
  },

  /**
   * Logs error message.
   * @param {string} context
   * @param {string} message
   * @param {unknown} [error]
   * @returns {void}
   */
  error(context, message, error) {
    const payload = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    emit("error", "[ERROR]", colors.red, context, message, payload);
  },

  /**
   * Logs agent step activity.
   * @param {string} agentName
   * @param {string} step
   * @param {unknown} [data]
   * @returns {void}
   */
  agent(agentName, step, data) {
    emit("info", `[AGENT:${agentName}]`, colors.cyan, agentName, step, data);
  },

  /**
   * Logs API request summary.
   * @param {string} method
   * @param {string} path
   * @param {number} status
   * @param {number} ms
   * @returns {void}
   */
  api(method, path, status, ms) {
    emit("info", "[API]", colors.blue, "API", `${method} ${path} ${status} ${ms}ms`);
  }
};
