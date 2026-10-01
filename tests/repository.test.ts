import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('repository safety boundaries', () => {
  it('ignores local credentials, databases, build output, and dependency trees', () => {
    for (const path of [
      '.env',
      '.env.production',
      '.dev.vars',
      '.dev.vars.preview',
      'key.pem',
      'private.key',
      'node_modules/example.js',
      'dist/_worker.js',
      '.wrangler/state/db.sqlite',
      'database.sqlite',
    ]) {
      expect(
        execFileSync('git', ['check-ignore', path], {
          encoding: 'utf8',
        }).trim(),
      ).toBe(path);
    }
    expect(read('.gitignore')).toContain('!.dev.vars.example');
    expect(read('.dev.vars.example')).toContain('APP_ENV=local');
  });

  it('production and preview cannot share a database binding by default', () => {
    const config = JSON.parse(read('wrangler.jsonc'));
    expect(config.vars.APP_ENV).toBe('production');
    expect(config.d1_databases).toHaveLength(1);
    expect(config.d1_databases[0].binding).toBe('DB');
    expect(config.env.preview.vars.APP_ENV).toBe('staging');
    expect(config.env.preview.d1_databases).toEqual([]);
    expect(config).not.toHaveProperty('compatibility_flags');
  });

  it('seed command is local-only and remote migration requires an explicit command', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['db:seed:local']).toContain('--local');
    expect(pkg.scripts['db:migrate:production']).toContain('--remote');
    expect(
      Object.keys(pkg.scripts).filter((key) => key.includes('seed')),
    ).toEqual(['db:seed:local']);
    expect(read('tests/fixtures/local-catalog.sql')).toContain(
      'TEST DATA ONLY',
    );
    expect(read('ecosystem.config.cjs')).toContain('--binding APP_ENV=local');
  });

  it('edge application contains no Node filesystem/process imports or hard-coded provider integration', () => {
    for (const name of readdirSync('src')) {
      const source = read(`src/${name}`);
      expect(source).not.toMatch(
        /(?:from\s+|import\s*)['"](?:node:|fs['"]|child_process['"]|@hono\/node-server)/,
      );
      expect(source).not.toMatch(/CLOUDFLARE_API_TOKEN|process\.env/);
      if (
        !name.startsWith('duitku-') &&
        name !== 'types.ts' &&
        name !== 'index.ts'
      )
        expect(source).not.toMatch(/DUITKU_/);
    }
  });

  it('future commerce routes are absent and public offer DTO omits private delivery reference', () => {
    const index = read('src/index.ts');
    expect(index).not.toMatch(/app\.(post|put|patch|delete)\(/);
    expect(index).not.toMatch(/\/api\/(checkout|payments|fulfillment)/);
    expect(index).not.toContain('transaction-lifecycle');
    expect(read('dist/_worker.js')).not.toContain('SIMULATION_FORBIDDEN');
    expect(read('dist/_worker.js')).not.toContain('createSimulationCore');
    const types = read('src/types.ts').split('export interface PublicOffer')[1];
    expect(types).not.toContain('delivery_reference');
  });
});
