#!/usr/bin/env node
/**
 * Translation Sync Script
 *
 * This script synchronizes all translation files to have the same structure as ko.json.
 * - KO (Korean) is the source of truth
 * - EN, JA, ZH will be updated to have the same keys
 * - Existing translations are preserved
 * - Missing keys are filled with placeholders or auto-translated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRANSLATIONS_DIR = path.join(__dirname, '../lib/i18n/translations');

// Load all translation files
const ko = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, 'ko.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, 'en.json'), 'utf-8'));
const ja = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, 'ja.json'), 'utf-8'));
const zh = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, 'zh.json'), 'utf-8'));

// Function to get all keys recursively
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Function to get value by dot-notation key
function getValue(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
}

// Function to set value by dot-notation key
function setValue(obj, key, value) {
  const keys = key.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, k) => {
    if (o[k] === undefined) o[k] = {};
    return o[k];
  }, obj);
  target[lastKey] = value;
}

// Get all keys from KO (source of truth)
const koKeys = getAllKeys(ko);
console.log(`KO has ${koKeys.length} keys`);

// Check which keys are in other languages but not in KO (to be removed)
const enKeys = new Set(getAllKeys(en));
const jaKeys = new Set(getAllKeys(ja));
const zhKeys = new Set(getAllKeys(zh));

const koKeySet = new Set(koKeys);

const extraEnKeys = [...enKeys].filter(k => !koKeySet.has(k));
const extraJaKeys = [...jaKeys].filter(k => !koKeySet.has(k));
const extraZhKeys = [...zhKeys].filter(k => !koKeySet.has(k));

console.log(`\nExtra keys to remove:`);
console.log(`EN: ${extraEnKeys.length} extra keys`);
console.log(`JA: ${extraJaKeys.length} extra keys`);
console.log(`ZH: ${extraZhKeys.length} extra keys`);

if (extraZhKeys.length > 0) {
  console.log('\nZH extra keys:', extraZhKeys.slice(0, 20), extraZhKeys.length > 20 ? '...' : '');
}

// Build new translation objects with same structure as KO
function buildSyncedTranslation(source, target, lang) {
  const result = {};
  const missingKeys = [];

  for (const key of koKeys) {
    const koValue = getValue(source, key);
    const targetValue = getValue(target, key);

    if (targetValue !== undefined) {
      // Keep existing translation
      setValue(result, key, targetValue);
    } else {
      // Mark as missing - will need translation
      missingKeys.push(key);
      // For now, use KO value as placeholder (can be translated later)
      setValue(result, key, koValue);
    }
  }

  console.log(`\n${lang}: ${missingKeys.length} missing keys need translation`);
  if (missingKeys.length > 0 && missingKeys.length <= 20) {
    console.log('Missing keys:', missingKeys);
  } else if (missingKeys.length > 20) {
    console.log('Missing keys (first 20):', missingKeys.slice(0, 20));
  }

  return { result, missingKeys };
}

// Build synced translations
const { result: syncedEn, missingKeys: missingEn } = buildSyncedTranslation(ko, en, 'EN');
const { result: syncedJa, missingKeys: missingJa } = buildSyncedTranslation(ko, ja, 'JA');
const { result: syncedZh, missingKeys: missingZh } = buildSyncedTranslation(ko, zh, 'ZH');

// Verify key counts
console.log('\n=== Verification ===');
console.log(`KO keys: ${getAllKeys(ko).length}`);
console.log(`Synced EN keys: ${getAllKeys(syncedEn).length}`);
console.log(`Synced JA keys: ${getAllKeys(syncedJa).length}`);
console.log(`Synced ZH keys: ${getAllKeys(syncedZh).length}`);

// Write synced translations
fs.writeFileSync(
  path.join(TRANSLATIONS_DIR, 'en.json'),
  JSON.stringify(syncedEn, null, 2) + '\n',
  'utf-8'
);

fs.writeFileSync(
  path.join(TRANSLATIONS_DIR, 'ja.json'),
  JSON.stringify(syncedJa, null, 2) + '\n',
  'utf-8'
);

fs.writeFileSync(
  path.join(TRANSLATIONS_DIR, 'zh.json'),
  JSON.stringify(syncedZh, null, 2) + '\n',
  'utf-8'
);

console.log('\n✅ Translation files synchronized!');

// Output missing keys for translation
if (missingEn.length > 0 || missingJa.length > 0 || missingZh.length > 0) {
  const allMissing = {
    en: missingEn,
    ja: missingJa,
    zh: missingZh
  };

  fs.writeFileSync(
    path.join(TRANSLATIONS_DIR, 'missing-keys.json'),
    JSON.stringify(allMissing, null, 2) + '\n',
    'utf-8'
  );

  console.log('\n📝 Missing keys saved to missing-keys.json');
  console.log('These keys need proper translation (currently using KO values as placeholders)');
}
