/**
 * Middleware de rate limiting
 * Protección básica contra abuso de endpoints con configuración flexible
 * Soporta almacenamiento en memoria (desarrollo) o Redis (producción)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../utils/logger';

/**
 * Configuración de rate limit
 */
interface RateLimitConfig {
    /**
     * Número máximo de requests permitidos
     */
    maxRequests: number;

    /**
     * Ventana de tiempo en milisegundos
     */
    windowMs: number;

    /**
     * Mensaje personalizado cuando se excede el límite
     */
    message?: string;

    /**
     * Clave para identificar el límite (por defecto: endpoint)
     */
    keyPrefix?: string;
}

/**
 * Entrada en el registro de rate limiting
 */
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

/**
 * Store en memoria para rate limiting (desarrollo)
 */
class MemoryStore {
    private store = new Map<string, RateLimitEntry>();

    /**
     * Limpia entradas expiradas cada 5 minutos
     */
    constructor() {
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetAt < now) {
                this.store.delete(key);
            }
        }
    }

    async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || entry.resetAt < now) {
            const newEntry: RateLimitEntry = {
                count: 1,
                resetAt: now + windowMs
            };
            this.store.set(key, newEntry);
            return newEntry;
        }

        entry.count++;
        return entry;
    }

    async reset(key: string): Promise<void> {
        this.store.delete(key);
    }
}

/**
 * Store usando Redis para rate limiting (producción)
 * Requiere configuración de REDIS_URL en variables de entorno
 */
class RedisStore {
    private client: unknown | null = null;
    private connected = false;

    constructor() {
        this.connect();
    }

    private async connect() {
        // Solo intentar conectar si hay URL de Redis configurada
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn('REDIS_URL no configurada, rate limiting usará memoria (no persistente)');
            return;
        }

        try {
            // Aquí se importaría y conectaría el cliente de Redis
            // Por ahora dejamos la estructura preparada
            // const { createClient } = await import('redis');
            // this.client = createClient({ url: redisUrl });
            // await this.client.connect();
            // this.connected = true;
            // logger.info('Conectado a Redis para rate limiting');

            logger.info('Redis store preparado pero no implementado aún. Usando memoria.');
        } catch (error) {
            logger.error('Error conectando a Redis, usando memoria como fallback', error instanceof Error ? error : undefined);
            this.connected = false;
        }
    }

    async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
        if (!this.connected || !this.client) {
            // Fallback a memoria si Redis no está disponible
            return memoryStore.increment(key, windowMs);
        }

        // Implementación de Redis iría aquí
        // const count = await this.client.incr(key);
        // if (count === 1) {
        //   await this.client.pexpire(key, windowMs);
        // }
        // const ttl = await this.client.pttl(key);
        // return { count, resetAt: Date.now() + ttl };

        return memoryStore.increment(key, windowMs);
    }

    async reset(key: string): Promise<void> {
        if (!this.connected || !this.client) {
            return memoryStore.reset(key);
        }

        // await this.client.del(key);
        return memoryStore.reset(key);
    }
}

// Stores globales
const memoryStore = new MemoryStore();
const redisStore = new RedisStore();

/**
 * Obtiene store activo según configuración
 */
function getStore() {
    return process.env.REDIS_URL ? redisStore : memoryStore;
}

/**
 * Extrae identificador único de la request (IP o header personalizado)
 */
function getIdentifier(req: NextRequest): string {
    // Intentar obtener IP real (considerando proxies)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    // Fallback: usar combinación de headers para identificación
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `fallback-${userAgent.slice(0, 50)}`;
}

/**
 * Middleware de rate limiting
 */
export async function rateLimit(
    req: NextRequest,
    config: RateLimitConfig
): Promise<NextResponse | null> {
    const identifier = getIdentifier(req);
    const keyPrefix = config.keyPrefix || req.nextUrl.pathname;
    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
        const store = getStore();
        const entry = await store.increment(key, config.windowMs);

        const remaining = Math.max(0, config.maxRequests - entry.count);
        const resetAt = new Date(entry.resetAt);

        // Headers informativos de rate limit
        const headers = {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetAt.toISOString()
        };

        // Si se excede el límite
        if (entry.count > config.maxRequests) {
            logger.warn('Rate limit excedido', {
                identifier,
                endpoint: keyPrefix,
                count: entry.count,
                limit: config.maxRequests
            });

            const message = config.message || 'Demasiadas solicitudes. Por favor intenta más tarde.';

            return NextResponse.json(
                {
                    error: message,
                    retryAfter: resetAt.toISOString()
                },
                {
                    status: 429,
                    headers: {
                        ...headers,
                        'Retry-After': Math.ceil((entry.resetAt - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        // Request permitida, retornar null para continuar
        // Los headers se pueden agregar en el handler final si es necesario
        return null;

    } catch (error) {
        logger.error('Error en rate limiting, permitiendo request', error instanceof Error ? error : undefined);
        // En caso de error, permitir la request (fail-open)
        return null;
    }
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const rateLimitPresets = {
    /**
     * Para endpoints de login/autenticación: 5 intentos por minuto
     */
    login: {
        maxRequests: 5,
        windowMs: 60 * 1000,
        message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 1 minuto.'
    },

    /**
     * Para endpoints de escritura (POST/PUT/DELETE): 30 requests por minuto
     */
    write: {
        maxRequests: 30,
        windowMs: 60 * 1000,
        message: 'Demasiadas operaciones. Por favor espera un momento.'
    },

    /**
     * Para endpoints de lectura (GET): 100 requests por minuto
     */
    read: {
        maxRequests: 100,
        windowMs: 60 * 1000,
        message: 'Demasiadas consultas. Por favor espera un momento.'
    },

    /**
     * Para endpoints críticos (crear usuarios, etc): 10 requests por minuto
     */
    critical: {
        maxRequests: 10,
        windowMs: 60 * 1000,
        message: 'Límite de operaciones críticas alcanzado. Intenta de nuevo en 1 minuto.'
    }
};

/**
 * HOC que aplica rate limiting a un handler
 */
type Handler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

export function withRateLimit(config: RateLimitConfig, handler: Handler): Handler {
    return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
        const rateLimitResponse = await rateLimit(req, config);

        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        return handler(req, ...args);
    };
}
