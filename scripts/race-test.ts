/**
 * The last-seat race (§9.6 AC, §13 Phase 4 exit). Run with `npm run db:race` (local stack up).
 *
 * pgTAP runs on one connection, so it can't show two people joining at once. This opens 10
 * separate database connections that all call join_ride on a ride with ONE seat left, timed to
 * fire at the same instant, then checks exactly one got in and nine got RIDE_FULL.
 * Without the `for update` lock in join_ride, several would read "1 seat left" and all get in.
 * It creates throwaway users and a ride, and deletes them afterwards (your data isn't touched).
 */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const CONTAINER = 'supabase_db_flytag';
const RACERS = 10;

function psql(sql: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const p = spawn('docker', ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq']);
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('close', (code) => resolve({ ok: code === 0, out: out.trim() }));
    p.stdin.end(sql);
  });
}

const host = randomUUID();
const racers = Array.from({ length: RACERS }, () => randomUUID());
const ride = randomUUID();
const everyone = [host, ...racers];

// 1. Setup: onboarded users, and a 2-seat ride whose host already holds one seat.
const setup = await psql(`
  insert into auth.users (id, email) select id, 'race-' || id || '@ucsd.edu' from unnest(array[${everyone.map((u) => `'${u}'::uuid`).join(',')}]) as id;
  update public.profiles set college_id = (select id from public.colleges order by sort limit 1), onboarded_at = now()
    where id in (${everyone.map((u) => `'${u}'`).join(',')});
  insert into public.rides (id, created_by, direction, depart_at, seats_max) values ('${ride}', '${host}', 'to_airport', now() + interval '1 day', 2);
  insert into public.ride_members (ride_id, user_id, role) values ('${ride}', '${host}', 'host');
`);
if (!setup.ok) throw new Error(`setup failed: ${setup.out}`);

// 2. Race: every connection sleeps until the same moment, then joins as its own user.
const startAt = new Date(Date.now() + 1500).toISOString();
const results = await Promise.all(
  racers.map((u) =>
    psql(`
      begin;
      select set_config('request.jwt.claims', '{"sub":"${u}","role":"authenticated"}', true);
      set local role authenticated;
      select pg_sleep_until('${startAt}');
      select public.join_ride('${ride}');
      commit;
    `),
  ),
);

// 3. Check what the database ended up with, then clean up.
const seats = await psql(`select count(*) from public.ride_members where ride_id = '${ride}' and left_at is null;`);
await psql(`delete from auth.users where id in (${everyone.map((u) => `'${u}'`).join(',')});`);

const joined = results.filter((r) => r.ok).length;
const full = results.filter((r) => r.out.includes('RIDE_FULL')).length;
console.log(`${RACERS} people tapped Join on the last seat at once:`);
console.log(`  got in:      ${joined}`);
console.log(`  RIDE_FULL:   ${full}`);
console.log(`  seats taken: ${seats.out} of 2`);

const pass = joined === 1 && full === RACERS - 1 && seats.out === '2';
console.log(pass ? 'PASS: exactly one person got the last seat.' : 'FAIL: the seat limit was broken.');
process.exit(pass ? 0 : 1);
