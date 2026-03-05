#!/usr/bin/env node

/**
 * Translation Verification Script
 *
 * This script checks the synchronization between EN, FR, and ES translation files.
 * It identifies missing keys, extra keys, and structural differences.
 *
 * Usage: npm run check-translations
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const localesPath = path.join(__dirname, '../src/locales');
const enPath = path.join(localesPath, 'en.json');
const frPath = path.join(localesPath, 'fr.json');
const esPath = path.join(localesPath, 'es.json');

function loadTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${filePath}:${colors.reset}`, error.message);
    process.exit(1);
  }
}

function flattenKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function compareKeys(baseKeys, targetKeys) {
  const baseSet = new Set(baseKeys);
  const targetSet = new Set(targetKeys);

  const missingInTarget = baseKeys.filter(key => !targetSet.has(key));
  const extraInTarget = targetKeys.filter(key => !baseSet.has(key));
  const common = baseKeys.filter(key => targetSet.has(key));

  return { missingInTarget, extraInTarget, common };
}

function findEmptyValues(translations, keys) {
  const emptyKeys = [];

  for (const key of keys) {
    const value = getNestedValue(translations, key);
    if (value === '' || value === null || value === undefined) {
      emptyKeys.push(key);
    }
  }

  return emptyKeys;
}

function findUntranslatedStrings(enTranslations, targetTranslations, commonKeys) {
  const suspicious = [];

  for (const key of commonKeys) {
    const enValue = getNestedValue(enTranslations, key);
    const targetValue = getNestedValue(targetTranslations, key);

    if (typeof enValue === 'string' && typeof targetValue === 'string') {
      if (enValue === targetValue && !key.includes('count') && enValue.length > 3) {
        suspicious.push({ key, value: enValue });
      }
    }
  }

  return suspicious;
}

function printHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function printSubsection(title, icon = '•') {
  console.log(`\n${colors.bright}${icon} ${title}${colors.reset}`);
  console.log(`${'-'.repeat(60)}`);
}

function checkLanguagePair(langName, langCode, enTranslations, enKeys, targetTranslations) {
  const targetKeys = flattenKeys(targetTranslations);
  const { missingInTarget, extraInTarget, common } = compareKeys(enKeys, targetKeys);

  let hasErrors = false;
  let hasWarnings = false;

  if (missingInTarget.length > 0) {
    hasErrors = true;
    printSubsection(`Missing Keys in ${langName} (${missingInTarget.length})`, '❌');
    console.log(`${colors.red}The following keys exist in EN but are missing in ${langCode.toUpperCase()}:${colors.reset}\n`);

    const grouped = {};
    for (const key of missingInTarget) {
      const topLevel = key.split('.')[0];
      if (!grouped[topLevel]) grouped[topLevel] = [];
      grouped[topLevel].push(key);
    }

    for (const [section, keys] of Object.entries(grouped)) {
      console.log(`  ${colors.yellow}[${section}]${colors.reset}`);
      for (const key of keys) {
        const value = getNestedValue(enTranslations, key);
        console.log(`    ${colors.red}✗${colors.reset} ${key}`);
        console.log(`      EN value: "${value}"`);
      }
      console.log();
    }
  }

  if (extraInTarget.length > 0) {
    hasWarnings = true;
    printSubsection(`Extra Keys in ${langName} (${extraInTarget.length})`, '⚠️');
    console.log(`${colors.yellow}The following keys exist in ${langCode.toUpperCase()} but are missing in EN:${colors.reset}\n`);

    const grouped = {};
    for (const key of extraInTarget) {
      const topLevel = key.split('.')[0];
      if (!grouped[topLevel]) grouped[topLevel] = [];
      grouped[topLevel].push(key);
    }

    for (const [section, keys] of Object.entries(grouped)) {
      console.log(`  ${colors.yellow}[${section}]${colors.reset}`);
      for (const key of keys) {
        const value = getNestedValue(targetTranslations, key);
        console.log(`    ${colors.yellow}!${colors.reset} ${key}`);
        console.log(`      ${langCode.toUpperCase()} value: "${value}"`);
      }
      console.log();
    }
  }

  const emptyInTarget = findEmptyValues(targetTranslations, targetKeys);
  if (emptyInTarget.length > 0) {
    hasWarnings = true;
    printSubsection(`Empty Values in ${langName} (${emptyInTarget.length})`, '⚠️');
    emptyInTarget.forEach(key => console.log(`  ${colors.yellow}!${colors.reset} ${key}`));
    console.log();
  }

  const untranslated = findUntranslatedStrings(enTranslations, targetTranslations, common);
  if (untranslated.length > 0) {
    hasWarnings = true;
    printSubsection(`Potentially Untranslated in ${langName} (${untranslated.length})`, '⚠️');
    console.log(`${colors.yellow}Keys with identical values in EN and ${langCode.toUpperCase()}:${colors.reset}\n`);

    for (const { key, value } of untranslated) {
      console.log(`  ${colors.yellow}!${colors.reset} ${key}`);
      console.log(`    Value: "${value}"`);
    }
    console.log();
  }

  return { targetKeys, missingInTarget, extraInTarget, common, emptyInTarget, untranslated, hasErrors, hasWarnings };
}

function verifyTranslations() {
  printHeader('Translation Verification Report');

  console.log(`${colors.blue}Loading translation files...${colors.reset}`);
  console.log(`  EN: ${enPath}`);
  console.log(`  FR: ${frPath}`);
  console.log(`  ES: ${esPath}`);

  const enTranslations = loadTranslations(enPath);
  const frTranslations = loadTranslations(frPath);
  const esTranslations = loadTranslations(esPath);

  const enKeys = flattenKeys(enTranslations);
  const frKeys = flattenKeys(frTranslations);
  const esKeys = flattenKeys(esTranslations);

  console.log(`\n${colors.green}✓ Translation files loaded successfully${colors.reset}`);
  console.log(`  EN keys: ${enKeys.length}`);
  console.log(`  FR keys: ${frKeys.length}`);
  console.log(`  ES keys: ${esKeys.length}`);

  let globalErrors = false;
  let globalWarnings = false;

  printHeader('French (FR) Verification');
  const frResult = checkLanguagePair('French', 'fr', enTranslations, enKeys, frTranslations);
  if (frResult.hasErrors) globalErrors = true;
  if (frResult.hasWarnings) globalWarnings = true;

  printHeader('Spanish (ES) Verification');
  const esResult = checkLanguagePair('Spanish', 'es', enTranslations, enKeys, esTranslations);
  if (esResult.hasErrors) globalErrors = true;
  if (esResult.hasWarnings) globalWarnings = true;

  const emptyInEn = findEmptyValues(enTranslations, enKeys);

  printSubsection('Summary', '📊');
  console.log(`Total EN keys:            ${colors.cyan}${enKeys.length}${colors.reset}`);
  console.log(`Total FR keys:            ${colors.cyan}${frKeys.length}${colors.reset}`);
  console.log(`Total ES keys:            ${colors.cyan}${esKeys.length}${colors.reset}`);
  console.log(`Empty values (EN):        ${emptyInEn.length > 0 ? colors.yellow : colors.green}${emptyInEn.length}${colors.reset}`);
  console.log(`Missing in FR:            ${frResult.missingInTarget.length > 0 ? colors.red : colors.green}${frResult.missingInTarget.length}${colors.reset}`);
  console.log(`Extra in FR:              ${frResult.extraInTarget.length > 0 ? colors.yellow : colors.green}${frResult.extraInTarget.length}${colors.reset}`);
  console.log(`Empty in FR:              ${frResult.emptyInTarget.length > 0 ? colors.yellow : colors.green}${frResult.emptyInTarget.length}${colors.reset}`);
  console.log(`Untranslated in FR:       ${frResult.untranslated.length > 0 ? colors.yellow : colors.green}${frResult.untranslated.length}${colors.reset}`);
  console.log(`Missing in ES:            ${esResult.missingInTarget.length > 0 ? colors.red : colors.green}${esResult.missingInTarget.length}${colors.reset}`);
  console.log(`Extra in ES:              ${esResult.extraInTarget.length > 0 ? colors.yellow : colors.green}${esResult.extraInTarget.length}${colors.reset}`);
  console.log(`Empty in ES:              ${esResult.emptyInTarget.length > 0 ? colors.yellow : colors.green}${esResult.emptyInTarget.length}${colors.reset}`);
  console.log(`Untranslated in ES:       ${esResult.untranslated.length > 0 ? colors.yellow : colors.green}${esResult.untranslated.length}${colors.reset}`);

  console.log('\n' + '='.repeat(80));
  if (!globalErrors && !globalWarnings) {
    console.log(`${colors.green}${colors.bright}✓ All translations are synchronized! 🎉${colors.reset}`);
    process.exit(0);
  } else if (globalErrors) {
    console.log(`${colors.red}${colors.bright}✗ Translation synchronization issues found!${colors.reset}`);
    console.log(`${colors.red}Please fix the missing keys before deploying.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ Translation warnings found${colors.reset}`);
    console.log(`${colors.yellow}Review the warnings above to ensure quality translations.${colors.reset}`);
    process.exit(0);
  }
}

verifyTranslations();
