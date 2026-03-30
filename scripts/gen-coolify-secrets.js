#!/usr/bin/env node
/**
 * Generează valori aleatoare pentru variabile opționale (ex. SMTP_PASS).
 * Rulezi local, apoi copiezi output-ul în Coolify → Environment Variables.
 * NU comita output-ul în git.
 */
const crypto = require('crypto');
const r = (bytes) => crypto.randomBytes(bytes).toString('hex');

console.log('# --- Copiază în Coolify (doar dacă ai nevoie de parolă SMTP nouă) ---\n');
console.log(`SMTP_PASS=${r(18)}`);
console.log('\n# Opțional: altă valoare hex (32 caractere)');
console.log(`# EXAMPLE_TOKEN=${r(16)}`);
