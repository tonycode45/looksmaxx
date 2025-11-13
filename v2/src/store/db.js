import Dexie from 'dexie';

export const db = new Dexie('mirrorme_v2');

db.version(1).stores({
  scans: 'id, createdAt',
  meta: 'key',
});

db.version(2)
  .stores({
    scans: 'id, createdAt, userId',
    meta: 'key',
    users: '++id, email',
  })
  .upgrade(async (tx) => {
    const scans = tx.table('scans');
    await scans.toCollection().modify((scan) => {
      if (typeof scan.userId === 'undefined') {
        scan.userId = null;
      }
    });
  });

// helpers
export async function exportAll() {
  const [scans, meta, users] = await Promise.all([
    db.scans.toArray(),
    db.meta.toArray(),
    db.users.toArray(),
  ]);
  return { scans, meta, users };
}

export async function importAll(json) {
  await db.transaction('rw', db.scans, db.meta, db.users, async () => {
    await db.scans.clear();
    await db.meta.clear();
    await db.users.clear();
    await db.scans.bulkAdd(json.scans || []);
    await db.meta.bulkAdd(json.meta || []);
    await db.users.bulkAdd(json.users || []);
  });
}

export async function nuke() {
  await db.delete();
  location.reload();
}

