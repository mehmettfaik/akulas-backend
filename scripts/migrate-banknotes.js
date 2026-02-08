/**
 * Migration Script: Banknotes Structure Update
 *
 * This script migrates banknotes from old flat structure to new categorized structure
 * Old: { b200: 10, b100: 20, ... }
 * New: { dolum: { b200: 10, ... }, kart: { b200: 5, ... }, vize: { b200: 3, ... } }
 *
 * Also adds bankSentCash field with default values
 */

const { db, admin } = require('../src/config/firebase');

const DESK_COLLECTION = 'desk_records';
const BAYI_DOLUM_COLLECTION = 'bayi_dolum_records';

/**
 * Check if banknotes is in old format (flat structure)
 */
const isOldFormat = (banknotes) => {
  if (!banknotes) return false;

  // Check if it has top-level banknote properties
  return (
    banknotes.hasOwnProperty('b200') ||
    banknotes.hasOwnProperty('b100') ||
    banknotes.hasOwnProperty('b50')
  );
};

/**
 * Migrate Desk Records
 */
const migrateDeskRecords = async () => {
  console.log('Starting Desk Records migration...');

  const snapshot = await db.collection(DESK_COLLECTION).get();

  if (snapshot.empty) {
    console.log('No desk records found.');
    return { migrated: 0, skipped: 0 };
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // Check if banknotes needs migration
    if (isOldFormat(data.banknotes)) {
      const oldBanknotes = data.banknotes;

      // Migrate old structure to new categorized structure
      // All old banknotes go to 'dolum' category by default
      updates.banknotes = {
        dolum: {
          b200: oldBanknotes.b200 || 0,
          b100: oldBanknotes.b100 || 0,
          b50: oldBanknotes.b50 || 0,
          b20: oldBanknotes.b20 || 0,
          b10: oldBanknotes.b10 || 0,
          b5: oldBanknotes.b5 || 0,
          c1: oldBanknotes.c1 || 0,
          c050: oldBanknotes.c050 || 0
        },
        kart: {
          b200: 0, b100: 0, b50: 0, b20: 0,
          b10: 0, b5: 0, c1: 0, c050: 0
        },
        vize: {
          b200: 0, b100: 0, b50: 0, b20: 0,
          b10: 0, b5: 0, c1: 0, c050: 0
        }
      };

      needsUpdate = true;
      console.log(`Record ${doc.id}: Migrating banknotes from old format`);
    }

    // Check if bankSentCash is missing
    if (!data.bankSentCash) {
      updates.bankSentCash = {
        dolum: 0,
        kart: 0,
        vize: 0,
        totalSent: 0
      };

      needsUpdate = true;
      console.log(`Record ${doc.id}: Adding bankSentCash field`);
    }

    // Update the document if needed
    if (needsUpdate) {
      await doc.ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      migratedCount++;
      console.log(`✓ Record ${doc.id} migrated successfully`);
    } else {
      skippedCount++;
      console.log(`- Record ${doc.id} already in new format, skipped`);
    }
  }

  console.log(`Desk Records migration completed: ${migratedCount} migrated, ${skippedCount} skipped\n`);
  return { migrated: migratedCount, skipped: skippedCount };
};

/**
 * Migrate Bayi Dolum Records
 */
const migrateBayiDolumRecords = async () => {
  console.log('Starting Bayi Dolum Records migration...');

  const snapshot = await db.collection(BAYI_DOLUM_COLLECTION).get();

  if (snapshot.empty) {
    console.log('No bayi dolum records found.');
    return { migrated: 0, skipped: 0 };
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // Check if banknotes needs migration
    if (isOldFormat(data.banknotes)) {
      const oldBanknotes = data.banknotes;

      // Migrate old structure to new categorized structure
      // All old banknotes go to 'dolum' category by default
      // Note: Bayi Dolum doesn't have 'vize' category
      updates.banknotes = {
        dolum: {
          b200: oldBanknotes.b200 || 0,
          b100: oldBanknotes.b100 || 0,
          b50: oldBanknotes.b50 || 0,
          b20: oldBanknotes.b20 || 0,
          b10: oldBanknotes.b10 || 0,
          b5: oldBanknotes.b5 || 0,
          c1: oldBanknotes.c1 || 0,
          c050: oldBanknotes.c050 || 0
        },
        kart: {
          b200: 0, b100: 0, b50: 0, b20: 0,
          b10: 0, b5: 0, c1: 0, c050: 0
        }
      };

      needsUpdate = true;
      console.log(`Record ${doc.id}: Migrating banknotes from old format`);
    }

    // Check if bankSentCash is missing
    if (!data.bankSentCash) {
      updates.bankSentCash = {
        dolum: 0,
        kart: 0,
        totalSent: 0
      };

      needsUpdate = true;
      console.log(`Record ${doc.id}: Adding bankSentCash field`);
    }

    // Update the document if needed
    if (needsUpdate) {
      await doc.ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      migratedCount++;
      console.log(`✓ Record ${doc.id} migrated successfully`);
    } else {
      skippedCount++;
      console.log(`- Record ${doc.id} already in new format, skipped`);
    }
  }

  console.log(`Bayi Dolum Records migration completed: ${migratedCount} migrated, ${skippedCount} skipped\n`);
  return { migrated: migratedCount, skipped: skippedCount };
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log('=====================================================');
  console.log('  Banknotes Structure Migration');
  console.log('=====================================================\n');

  try {
    // Migrate Desk Records
    const deskResults = await migrateDeskRecords();

    // Migrate Bayi Dolum Records
    const bayiDolumResults = await migrateBayiDolumRecords();

    // Summary
    console.log('=====================================================');
    console.log('  Migration Summary');
    console.log('=====================================================');
    console.log(`Desk Records: ${deskResults.migrated} migrated, ${deskResults.skipped} skipped`);
    console.log(`Bayi Dolum Records: ${bayiDolumResults.migrated} migrated, ${bayiDolumResults.skipped} skipped`);
    console.log(`Total: ${deskResults.migrated + bayiDolumResults.migrated} migrated, ${deskResults.skipped + bayiDolumResults.skipped} skipped`);
    console.log('=====================================================\n');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateDeskRecords, migrateBayiDolumRecords };
