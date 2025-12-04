#!/usr/bin/env node

/**
 * Translation Verification Script
 *
 * This script checks the synchronization between EN and FR translation files.
 * It identifies missing keys, extra keys, and structural differences.
 *
 * Usage: npm run check-translations
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
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

// Path to translation files
const localesPath = path.join(__dirname, '../src/locales');
const enPath = path.join(localesPath, 'en.json');
const frPath = path.join(localesPath, 'fr.json');

/**
 * Load and parse a JSON file
 */
function loadTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${filePath}:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Flatten nested translation object into dot-notation keys
 */
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

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Compare two sets of keys and find differences
 */
function compareKeys(enKeys, frKeys) {
  const enSet = new Set(enKeys);
  const frSet = new Set(frKeys);

  const missingInFr = enKeys.filter(key => !frSet.has(key));
  const missingInEn = frKeys.filter(key => !enSet.has(key));
  const common = enKeys.filter(key => frSet.has(key));

  return { missingInFr, missingInEn, common };
}

/**
 * Check for empty values
 */
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

/**
 * Check for duplicate values (potential copy-paste errors)
 */
function findDuplicateValues(translations, keys) {
  const valueMap = new Map();

  for (const key of keys) {
    const value = getNestedValue(translations, key);
    if (typeof value === 'string' && value.trim() !== '') {
      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value).push(key);
    }
  }

  // Return only values that appear more than once
  const duplicates = [];
  for (const [value, keys] of valueMap.entries()) {
    if (keys.length > 1) {
      duplicates.push({ value, keys });
    }
  }

  return duplicates;
}

/**
 * Check for untranslated strings (EN text in FR file)
 */
function findUntranslatedStrings(enTranslations, frTranslations, commonKeys) {
  const suspicious = [];

  for (const key of commonKeys) {
    const enValue = getNestedValue(enTranslations, key);
    const frValue = getNestedValue(frTranslations, key);

    if (typeof enValue === 'string' && typeof frValue === 'string') {
      // Skip keys that are expected to be the same (like interpolation variables)
      if (enValue === frValue && !key.includes('count') && enValue.length > 3) {
        suspicious.push({ key, value: enValue });
      }
    }
  }

  return suspicious;
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

/**
 * Print subsection
 */
function printSubsection(title, icon = '•') {
  console.log(`\n${colors.bright}${icon} ${title}${colors.reset}`);
  console.log(`${'-'.repeat(60)}`);
}

/**
 * Main verification function
 */
function verifyTranslations() {
  printHeader('Translation Verification Report');

  console.log(`${colors.blue}Loading translation files...${colors.reset}`);
  console.log(`  EN: ${enPath}`);
  console.log(`  FR: ${frPath}`);

  // Load translations
  const enTranslations = loadTranslations(enPath);
  const frTranslations = loadTranslations(frPath);

  // Flatten keys
  const enKeys = flattenKeys(enTranslations);
  const frKeys = flattenKeys(frTranslations);

  console.log(`\n${colors.green}✓ Translation files loaded successfully${colors.reset}`);
  console.log(`  EN keys: ${enKeys.length}`);
  console.log(`  FR keys: ${frKeys.length}`);

  // Compare keys
  const { missingInFr, missingInEn, common } = compareKeys(enKeys, frKeys);

  // Track overall status
  let hasErrors = false;
  let hasWarnings = false;

  // Check for missing keys in French
  if (missingInFr.length > 0) {
    hasErrors = true;
    printSubsection(`❌ Missing Keys in French (${missingInFr.length})`, '❌');
    console.log(`${colors.red}The following keys exist in EN but are missing in FR:${colors.reset}\n`);

    // Group by top-level key
    const grouped = {};
    for (const key of missingInFr) {
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

  // Check for extra keys in French (not in English)
  if (missingInEn.length > 0) {
    hasWarnings = true;
    printSubsection(`⚠️  Extra Keys in French (${missingInEn.length})`, '⚠️');
    console.log(`${colors.yellow}The following keys exist in FR but are missing in EN:${colors.reset}\n`);

    // Group by top-level key
    const grouped = {};
    for (const key of missingInEn) {
      const topLevel = key.split('.')[0];
      if (!grouped[topLevel]) grouped[topLevel] = [];
      grouped[topLevel].push(key);
    }

    for (const [section, keys] of Object.entries(grouped)) {
      console.log(`  ${colors.yellow}[${section}]${colors.reset}`);
      for (const key of keys) {
        const value = getNestedValue(frTranslations, key);
        console.log(`    ${colors.yellow}!${colors.reset} ${key}`);
        console.log(`      FR value: "${value}"`);
      }
      console.log();
    }
  }

  // Check for empty values
  const emptyInEn = findEmptyValues(enTranslations, enKeys);
  const emptyInFr = findEmptyValues(frTranslations, frKeys);

  if (emptyInEn.length > 0 || emptyInFr.length > 0) {
    hasWarnings = true;
    printSubsection(`⚠️  Empty Values Found`, '⚠️');

    if (emptyInEn.length > 0) {
      console.log(`${colors.yellow}Empty values in EN (${emptyInEn.length}):${colors.reset}`);
      emptyInEn.forEach(key => console.log(`  ${colors.yellow}!${colors.reset} ${key}`));
      console.log();
    }

    if (emptyInFr.length > 0) {
      console.log(`${colors.yellow}Empty values in FR (${emptyInFr.length}):${colors.reset}`);
      emptyInFr.forEach(key => console.log(`  ${colors.yellow}!${colors.reset} ${key}`));
      console.log();
    }
  }

  // Check for potential untranslated strings
  const untranslated = findUntranslatedStrings(enTranslations, frTranslations, common);

  if (untranslated.length > 0) {
    hasWarnings = true;
    printSubsection(`⚠️  Potentially Untranslated Strings (${untranslated.length})`, '⚠️');
    console.log(`${colors.yellow}The following keys have identical values in EN and FR:${colors.reset}\n`);

    for (const { key, value } of untranslated) {
      console.log(`  ${colors.yellow}!${colors.reset} ${key}`);
      console.log(`    Value: "${value}"`);
    }
    console.log();
  }

  // Summary
  printSubsection('📊 Summary', '📊');
  console.log(`Total EN keys:          ${colors.cyan}${enKeys.length}${colors.reset}`);
  console.log(`Total FR keys:          ${colors.cyan}${frKeys.length}${colors.reset}`);
  console.log(`Common keys:            ${colors.green}${common.length}${colors.reset}`);
  console.log(`Missing in FR:          ${missingInFr.length > 0 ? colors.red : colors.green}${missingInFr.length}${colors.reset}`);
  console.log(`Extra in FR:            ${missingInEn.length > 0 ? colors.yellow : colors.green}${missingInEn.length}${colors.reset}`);
  console.log(`Empty values (EN):      ${emptyInEn.length > 0 ? colors.yellow : colors.green}${emptyInEn.length}${colors.reset}`);
  console.log(`Empty values (FR):      ${emptyInFr.length > 0 ? colors.yellow : colors.green}${emptyInFr.length}${colors.reset}`);
  console.log(`Potentially untranslated: ${untranslated.length > 0 ? colors.yellow : colors.green}${untranslated.length}${colors.reset}`);

  // Final status
  console.log('\n' + '='.repeat(80));
  if (!hasErrors && !hasWarnings) {
    console.log(`${colors.green}${colors.bright}✓ All translations are synchronized! 🎉${colors.reset}`);
    process.exit(0);
  } else if (hasErrors) {
    console.log(`${colors.red}${colors.bright}✗ Translation synchronization issues found!${colors.reset}`);
    console.log(`${colors.red}Please fix the missing keys before deploying.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ Translation warnings found${colors.reset}`);
    console.log(`${colors.yellow}Review the warnings above to ensure quality translations.${colors.reset}`);
    process.exit(0);
  }
}

// Run verification
verifyTranslations();
