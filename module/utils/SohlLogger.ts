/**
 * @file SohlLogger.ts
 * @project Song of Heroic Lands (SoHL)
 * @module utils
 * @author Tom Rodriguez aka "Toasty" <toasty@heroiclands.com>
 * @contact Email: toasty@heroiclands.com
 * @contact Join the SoHL Discord: https://discord.gg/f2Qjar3Rqv
 * @license GPL-3.0 (https://www.gnu.org/licenses/gpl-3.0.html)
 * @copyright (c) 2025 Tom Rodriguez
 *
 * Permission is granted to copy, modify, and distribute this work under the
 * terms of the GNU General Public License v3.0 (GPLv3). You must provide
 * appropriate credit, state any changes made, and distribute modified versions
 * under the same license. You may not impose additional restrictions on the
 * recipients' exercise of the rights granted under this license. This is only a
 * summary of the GNU GPLv3 License. For the full terms, see the LICENSE.md
 * file in the project root or visit: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * @description
 * Brief description of what this file does and its role in the system.
 *
 * @see GitHub Repository: https://github.com/toastygm/Song-of-Heroic-Lands-FoundryVTT
 * @see Foundry VTT System Page: https://foundryvtt.com/packages/sohl
 */

export enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    DEBUG = "debug",
}

interface LogCallerInfo {
    className: string;
    methodName: string;
    filePath: string;
    line: number;
    column: number;
    label: string;
    labelDetail: string;
}

interface LogOptions {
    level: LogLevel;
    notify?: boolean;
    error?: Error;
    location?: string;
    useHooks?: boolean;
    data?: PlainObject;
}

export class SohlLogger {
    private static _instance: SohlLogger;

    // Static method to get the singleton instance
    public static getInstance(): SohlLogger {
        if (!SohlLogger._instance) {
            SohlLogger._instance = new SohlLogger();
        }
        return SohlLogger._instance;
    }

    getCallerInfo(detailed: boolean = false): LogCallerInfo {
        const error = new Error();
        const stackLines = error.stack?.split("\n") || [];

        // Get the caller's line (3rd line in the stack for Node.js/Chrome)
        const callerLine = stackLines.at(2)?.trim() || "Unknown caller";

        // Regex to match class name, method name, file path, line, and column
        const match = callerLine.match(
            /at (?:(\w+)\.)?(\w+)\s?\(?(.*?)(?:\/|\\)(\w+\.(?:ts|js)):(\d+):(\d+)\)?/,
        );

        const result: LogCallerInfo = {
            className: "",
            methodName: "",
            filePath: "",
            line: 0,
            column: 0,
            label: "Unknown Caller",
            labelDetail: "Unknown",
        };
        if (match) {
            result.className = match[1] || "";
            result.methodName = match[2] || "";
            result.filePath = match[3] ? `${match[3]}/${match[4]}` : "";
            result.line = parseInt(match[5]) || 0;
            result.column = parseInt(match[6]) || 0;
            result.label =
                result.methodName ?
                    `${result.className}#${result.methodName}`
                :   "UnknownMethod";
            result.labelDetail =
                result.filePath ?
                    `(${result.filePath}:${result.line}:${result.column})`
                :   "Unknown Location";
        }

        return result;
    }

    /**
     * Logs a message with the specified log level and additional options.
     * @param message - The message to log.
     * @param options - An object containing additional log options.
     * @param options.level - The log level (INFO, WARN, ERROR, DEBUG).
     * @param options.notify - Whether to notify the user (e.g., via UI).
     * @param options.error - An optional error object to log.
     * @param options.location - The location where the log occurred.
     * @param options.data - Additional data to include in the log.
     */
    log(
        message: string = "",
        {
            level = LogLevel.INFO,
            notify = false,
            error = undefined,
            useHooks = false,
            data = {},
        }: LogOptions,
    ): void {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
        const timeLabel = `${hours}:${minutes}:${seconds}.${milliseconds}`;

        message = sohl.i18n.format(message, data);
        const callerInfo = this.getCallerInfo();
        const logMessage = `[${level.toUpperCase()} ${callerInfo.label}]: ${message}`;

        if (error) {
            const newError = Object.assign(new Error(error.message), {
                cause: error,
            });
            if (useHooks) {
                Hooks.onError(callerInfo.label, newError, {
                    message,
                    log: level,
                    notify: level,
                    ...data,
                });
            } else {
                console.error(logMessage, newError);
            }
        }

        // Log the message based on the level
        switch (level) {
            case LogLevel.INFO:
                console.info(`INFO|${timeLabel} ${logMessage}`);
                break;
            case LogLevel.WARN:
                console.warn(
                    `WARN|${timeLabel}|${callerInfo.label} ${logMessage}`,
                );
                break;
            case LogLevel.ERROR:
                console.error(
                    `ERROR|${timeLabel}|${callerInfo.label} ${logMessage} @ ${callerInfo.labelDetail}`,
                );
                break;
            case LogLevel.DEBUG:
                console.debug(
                    `DEBUG|${timeLabel}|${callerInfo.label} ${logMessage}`,
                );
                break;
        }

        if (notify)
            ui.notifications[notify]?.(
                sohl.utils.escapeHTML(message || error?.message),
            );
    }

    /**
     * Logs an informational message.
     * @param message - The message to log.
     */
    info(message: string, data: PlainObject = {}): void {
        this.log(message, { level: LogLevel.INFO, data });
    }

    /**
     * Logs a warning message.
     * @param message - The message to log.
     */
    warn(message: string, data: PlainObject = {}): void {
        this.log(message, { level: LogLevel.WARN, data });
    }

    /**
     * Logs an error message.
     * @param message - The message to log.
     */
    error(message: string, data: PlainObject = {}): void {
        this.log(message, { level: LogLevel.ERROR, data });
    }

    /**
     * Logs a debug message.
     * @param message - The message to log.
     */
    debug(message: string, data: PlainObject = {}): void {
        this.log(message, { level: LogLevel.DEBUG, data });
    }
}
