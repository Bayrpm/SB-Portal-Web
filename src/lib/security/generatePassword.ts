// /lib/security/generatePassword.ts
// Util para generar contraseñas seguras y validar políticas

import { randomBytes as nodeRandomBytes } from "node:crypto";

// --- Random crypto-safe ---
function cryptoRandomBytes(n: number): Uint8Array {
    // Browser (Web Crypto) o Node
    if (typeof globalThis !== "undefined" && "crypto" in globalThis && "getRandomValues" in globalThis.crypto) {
        const a = new Uint8Array(n);
        globalThis.crypto.getRandomValues(a);
        return a;
    }
    // Node fallback
    return nodeRandomBytes(n);
}

function randomInt(maxExclusive: number): number {
    // Rejection sampling para evitar sesgo
    if (maxExclusive <= 0) return 0;
    const uint32Max = 0xffffffff;
    const limit = Math.floor(uint32Max / maxExclusive) * maxExclusive;
    while (true) {
        const buf = cryptoRandomBytes(4);
        const rnd = (buf[0] | (buf[1] << 8) | (buf[2] << 16) | (buf[3] << 24)) >>> 0;
        if (rnd < limit) return rnd % maxExclusive;
    }
}

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --- Sets de caracteres ---
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMS = "0123456789";
const SYMBOLS_SAFE = "!@#$%^&*()-_=+[]{};:,.?/"; // evita comillas y backtick por copy/paste
const AMBIGUOUS = new Set(["l", "I", "1", "O", "0"]);

export type PasswordPolicy = {
    lengthMin?: number;          // default 12
    lengthMax?: number;          // opcional
    requireLower?: boolean;      // default true
    requireUpper?: boolean;      // default true
    requireNumber?: boolean;     // default true
    requireSymbol?: boolean;     // default true
    avoidAmbiguous?: boolean;    // default true (evita 0/O/1/l/I)
    noSequential?: boolean;      // default true (evita secuencias obvias de 3)
    noRepeat?: boolean;          // default true (evita repeticiones de 3 iguales)
    customSymbols?: string;      // para override de símbolos permitidos
};

export type GenerateOptions = PasswordPolicy & {
    length?: number;             // preferente sobre lengthMin
};

const DEFAULT_POLICY: Required<PasswordPolicy> = {
    lengthMin: 12,
    lengthMax: 128,
    requireLower: true,
    requireUpper: true,
    requireNumber: true,
    requireSymbol: true,
    avoidAmbiguous: true,
    noSequential: true,
    noRepeat: true,
    customSymbols: SYMBOLS_SAFE,
};

function buildPool(policy: PasswordPolicy) {
    const p = { ...DEFAULT_POLICY, ...policy };
    const sets: { id: "lower" | "upper" | "number" | "symbol"; chars: string }[] = [];

    if (p.requireLower) sets.push({ id: "lower", chars: LOWER });
    if (p.requireUpper) sets.push({ id: "upper", chars: UPPER });
    if (p.requireNumber) sets.push({ id: "number", chars: NUMS });
    if (p.requireSymbol) sets.push({ id: "symbol", chars: p.customSymbols ?? SYMBOLS_SAFE });

    // Si el usuario desactiva todos los require*, al menos usar LOWER
    if (sets.length === 0) sets.push({ id: "lower", chars: LOWER });

    const applyAmbiguous = (s: string) =>
        p.avoidAmbiguous ? [...s].filter((c) => !AMBIGUOUS.has(c)).join("") : s;

    const normalizedSets = sets.map((s) => ({ ...s, chars: applyAmbiguous(s.chars) }));
    const union = normalizedSets.map((s) => s.chars).join("");

    if (!union) throw new Error("El conjunto de caracteres quedó vacío. Revisa la política.");

    return { sets: normalizedSets, union };
}

function pickChar(s: string): string {
    return s[randomInt(s.length)];
}

function hasSequentialTriplet(str: string): boolean {
    // Detecta abc, 123, cba, 321 ...
    for (let i = 0; i + 2 < str.length; i++) {
        const a = str.charCodeAt(i);
        const b = str.charCodeAt(i + 1);
        const c = str.charCodeAt(i + 2);
        const asc = b === a + 1 && c === b + 1;
        const desc = b === a - 1 && c === b - 1;
        if (asc || desc) return true;
    }
    return false;
}

function hasTripleRepeat(str: string): boolean {
    return /(.)\1\1/.test(str);
}

export function estimateEntropyBits(password: string, poolSize: number): number {
    // Entropía aproximada: log2(pool^len) = len * log2(pool)
    if (!password || poolSize <= 1) return 0;
    const log2 = Math.log2 ? Math.log2 : (n: number) => Math.log(n) / Math.LN2;
    return Math.round(password.length * log2(poolSize));
}

export function validatePasswordAgainstPolicy(
    password: string,
    policy?: PasswordPolicy
): { valid: boolean; errors: string[] } {
    const p = { ...DEFAULT_POLICY, ...policy };
    const errors: string[] = [];

    if (p.lengthMin && password.length < p.lengthMin) {
        errors.push(`Debe tener al menos ${p.lengthMin} caracteres.`);
    }
    if (p.lengthMax && password.length > p.lengthMax) {
        errors.push(`No debe exceder ${p.lengthMax} caracteres.`);
    }
    if (p.requireLower && !/[a-z]/.test(password)) errors.push("Debe incluir minúsculas.");
    if (p.requireUpper && !/[A-Z]/.test(password)) errors.push("Debe incluir mayúsculas.");
    if (p.requireNumber && !/[0-9]/.test(password)) errors.push("Debe incluir números.");
    if (p.requireSymbol && !/[^\w\s]/.test(password)) errors.push("Debe incluir símbolos.");
    if (p.noSequential && hasSequentialTriplet(password)) errors.push("No debe contener secuencias obvias (abc, 123).");
    if (p.noRepeat && hasTripleRepeat(password)) errors.push("No debe repetir el mismo carácter 3 veces.");

    return { valid: errors.length === 0, errors };
}

export function generatePassword(opts?: GenerateOptions) {
    const policy = { ...DEFAULT_POLICY, ...opts };
    const length =
        typeof opts?.length === "number"
            ? Math.max(policy.lengthMin, Math.min(opts.length, policy.lengthMax))
            : policy.lengthMin;

    const { sets, union } = buildPool(policy);

    // 1) Garantizar 1 char de cada set requerido
    const requiredChars = sets.map((s) => pickChar(s.chars));

    // 2) Completar hasta length con el pool unido
    const remainingCount = Math.max(0, length - requiredChars.length);
    const rest: string[] = [];
    for (let i = 0; i < remainingCount; i++) rest.push(pickChar(union));

    // 3) Mezclar
    let candidate = shuffle([...requiredChars, ...rest]).join("");

    // 4) Si viola reglas (secuencias/repetición), reintentar algunas veces
    for (let attempt = 0; attempt < 50; attempt++) {
        const okSeq = !policy.noSequential || !hasSequentialTriplet(candidate);
        const okRep = !policy.noRepeat || !hasTripleRepeat(candidate);
        if (okSeq && okRep) break;
        // Reemplazar posiciones aleatorias problemáticas
        const idx = randomInt(candidate.length);
        const arr = candidate.split("");
        arr[idx] = pickChar(union);
        candidate = arr.join("");
    }

    const entropy = estimateEntropyBits(candidate, union.length);
    return { password: candidate, entropyBits: entropy, poolSize: union.length };
}

// Generación por lote (útil para onboarding)
export function generatePasswordBatch(count: number, opts?: GenerateOptions) {
    const out: { password: string; entropyBits: number; poolSize: number }[] = [];
    for (let i = 0; i < count; i++) out.push(generatePassword(opts));
    return out;
}