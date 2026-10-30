const assert = require('node:assert/strict');
const { test } = require('node:test');
require('tsx/cjs/api').register();
const { renderPrometheusMetrics } = require('../src/utils/prometheus-metrics.ts');

test('Ceyteq metrics retain matching legacy names, values, and escaped labels', () => {
  const output = renderPrometheusMetrics({
    version: '2.3.7',
    clientName: 'client"name',
    serverUrl: 'https://example.invalid/line\nnext',
    instances: [
      { name: 'one\\two', integration: 'WHATSAPP', state: 'open' },
      { name: 'other', state: 'close' },
    ],
  });
  for (const prefix of ['ceyteq', 'evolution']) {
    assert.match(output, new RegExp(`# TYPE ${prefix}_environment_info gauge`));
    assert.ok(output.includes(`${prefix}_environment_info{version="2.3.7",clientName="client\\"name",serverUrl="https://example.invalid/line\\nnext"} 1`));
    assert.ok(output.includes(`${prefix}_instances_total 2`));
    assert.ok(output.includes(`${prefix}_instance_up{instance="one\\\\two",integration="WHATSAPP"} 1`));
    assert.ok(output.includes(`${prefix}_instance_state{instance="other",integration="",state="close"} 1`));
    assert.ok(output.includes(`${prefix}_instance_up{instance="other",integration=""} 0`));
  }
  assert.ok(output.endsWith('\n'));
});

test('an empty snapshot still exposes totals for both metric namespaces', () => {
  const output = renderPrometheusMetrics({ version: '1', clientName: 'ceyteq', serverUrl: '', instances: [] });
  assert.match(output, /ceyteq_instances_total 0/);
  assert.match(output, /evolution_instances_total 0/);
  assert.doesNotMatch(output, /_instance_up\{/);
});
