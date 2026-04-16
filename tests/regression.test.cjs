const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

test('core project files exist', () => {
  [
    'AGENTS.md',
    'ROADMAP.md',
    'PROJECT_STATE.md',
    'CHANGELOG.md',
    'index.html',
    'app.js',
    'styles.css',
    'service-worker.js',
    'package.json'
  ].forEach(file => {
    assert.equal(
      fs.existsSync(path.join(ROOT, file)),
      true,
      `${file} should exist`
    );
  });
});
