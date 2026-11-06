// Sobe um Postgres descartável (só local, porta 54399) para testar as migrations. Retorna null se não houver binários do Postgres.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
const BIN = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/lib/postgresql/17/bin'].find((d) => existsSync(join(d, 'initdb')));
export const PORT = 54399;
export async function subir() {
  if (!BIN) return null;
  const dir = mkdtempSync('/var/tmp/bt-pg-'); chmodSync(dir, 0o755);
  const root = process.getuid && process.getuid() === 0;
  const as = (cmd, args, opt = {}) => (root ? execFileSync('runuser', ['-u', 'postgres', '--', cmd, ...args], { stdio: 'pipe', ...opt }) : execFileSync(cmd, args, { stdio: 'pipe', ...opt }));
  if (root) execFileSync('chown', ['postgres', dir]);
  as(join(BIN, 'initdb'), ['-D', join(dir, 'd'), '-A', 'trust', '-U', 'postgres']);
  const args = ['-D', join(dir, 'd'), '-p', String(PORT), '-k', dir, '-c', 'listen_addresses=', '-c', 'fsync=off'];
  const proc = root ? spawn('runuser', ['-u', 'postgres', '--', join(BIN, 'postgres'), ...args], { stdio: 'ignore' }) : spawn(join(BIN, 'postgres'), args, { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { execFileSync(join(BIN, 'pg_isready'), ['-h', dir, '-p', String(PORT)], { stdio: 'pipe' }); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
  const psql = (sql, { db = 'postgres', role = null, email = '', file = false } = {}) => {
    const pre = `${role ? `set role ${role};` : ''}${email ? `set test.email='${email}';` : ''}`;
    const a = ['-h', dir, '-p', String(PORT), '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-qAt', ...(file ? ['-f', sql] : ['-c', pre + sql])];
    return execFileSync(join(BIN, 'psql'), a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  };
  const parar = () => { try { proc.kill('SIGINT'); } catch { /* ok */ } setTimeout(() => rmSync(dir, { recursive: true, force: true }), 800); };
  return { psql, parar, dir };
}
