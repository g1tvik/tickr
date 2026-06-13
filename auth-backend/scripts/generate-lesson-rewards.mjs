/**
 * Generates auth-backend/data-static/lessonRewards.json from the frontend's
 * lessonStructure so the server owns an authoritative copy of every lesson /
 * unit-test / final-test reward (XP, coins) and the unit→lesson mapping.
 *
 * The server must never trust client-sent reward amounts (see the strip logic
 * in routes/auth.js POST /user-data) — /api/progress computes rewards from
 * THIS table instead. Re-run whenever lessons change:
 *
 *   npm run generate:rewards     (from auth-backend/)
 *
 * The generated JSON is checked in so production deploys don't need the
 * frontend source present.
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(here, '..', '..', 'stockbuddy', 'src', 'data', 'lessonStructure.js');
const outPath = path.resolve(here, '..', 'data-static', 'lessonRewards.json');

const { lessonStructure } = await import(pathToFileURL(srcPath).href);

const rewards = {
  generatedFrom: 'stockbuddy/src/data/lessonStructure.js',
  lessons: {},
  units: {},
  finalTest: {
    xp: lessonStructure.finalTest.xp,
    coins: lessonStructure.finalTest.coins,
    unlockCost: lessonStructure.finalTest.unlockCost,
  },
};

for (const unit of lessonStructure.units) {
  rewards.units[unit.id] = {
    title: unit.title,
    lessonIds: unit.lessons.map((l) => l.id),
    testXp: unit.unitTest.xp,
    testCoins: unit.unitTest.coins,
  };
  for (const lesson of unit.lessons) {
    rewards.lessons[lesson.id] = {
      title: lesson.title,
      xp: lesson.xp,
      coins: lesson.coins,
      unitId: unit.id,
    };
  }
}

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(rewards, null, 2) + '\n');
console.log(
  `Wrote ${Object.keys(rewards.lessons).length} lessons, ${Object.keys(rewards.units).length} units → ${outPath}`
);
