const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));

test('all inline JavaScript and structured metadata parse', () => {
  for (const name of pages) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/src=/.test(attributes)) continue;
      if (/application\/(ld\+json|json)/i.test(attributes)) JSON.parse(body);
      else if (!/type="module"/.test(attributes)) new vm.Script(body, {filename: name});
    }
  }
});

test('public pages and admin pages have no broken local href/src paths', () => {
  for (const name of pages) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/\$\{|\{\{|^#|^[a-z]+:|^\/\//i.test(href)) continue;
      const url = new URL(href, 'https://www.senmoonbounce.com/' + name);
      const localPath = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
      assert.ok(fs.existsSync(path.join(root, localPath)), name + ': ' + href);
    }
  }
});

test('shared admin helpers load before page code uses them', () => {
  for (const name of pages.filter(name => name.startsWith('admin'))) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    assert.ok(html.indexOf('assets/admin-common.js') < html.indexOf('window.SenAdmin.'), name);
  }
});
