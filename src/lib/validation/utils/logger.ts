/**
 * Utilidades para logging estructurado
 * Sistema centralizado de logging con niveles y contexto
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: Error;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private formatEntry(entry: LogEntry): string {
        const parts = [
            `[${entry.timestamp}]`,
            `[${entry.level.toUpperCase()}]`,
            entry.message
        ];

        if (entry.context && Object.keys(entry.context).length > 0) {
            parts.push(`Context: ${JSON.stringify(entry.context)}`);
        }

        if (entry.error) {
            parts.push(`Error: ${entry.error.message}`);
            if (this.isDevelopment && entry.error.stack) {
                parts.push(`Stack: ${entry.error.stack}`);
            }
        }

        return parts.join(' ');
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error
        };

        const formatted = this.formatEntry(entry);

        // En desarrollo, usar console con colores
        if (this.isDevelopment) {
            switch (level) {
                case 'debug':
                    console.debug(formatted);
                    break;
                case 'info':
                    console.info(formatted);
                    break;
                case 'warn':
                    console.warn(formatted);
                    break;
                case 'error':
                    console.error(formatted);
                    break;
            }
        } else {
            // En producción, siempre usar console.log para compatibilidad con sistemas de logging
            
        }
    }

    debug(message: string, context?: LogContext) {
        if (this.isDevelopment) {
            this.log('debug', message, context);
        }
    }

    info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    error(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
        if (errorOrContext instanceof Error) {
            this.log('error', message, context, errorOrContext);
        } else {
            this.log('error', message, errorOrContext);
        }
    }
}

// Instancia singleton
export const logger = new Logger();
