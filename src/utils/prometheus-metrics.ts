export type InstanceMetric = {
  name: string;
  state?: string;
  integration?: string;
};

export type MetricsSnapshot = {
  version: string;
  clientName: string;
  serverUrl: string;
  instances: InstanceMetric[];
};

function escapeLabel(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"');
}

/** Render Ceyteq metrics and identical legacy aliases for existing dashboards. */
export function renderPrometheusMetrics(snapshot: MetricsSnapshot): string {
  const lines: string[] = [];
  for (const prefix of ['ceyteq', 'evolution']) {
    lines.push(`# HELP ${prefix}_environment_info Environment information`);
    lines.push(`# TYPE ${prefix}_environment_info gauge`);
    lines.push(
      `${prefix}_environment_info{version="${escapeLabel(snapshot.version)}",clientName="${escapeLabel(
        snapshot.clientName,
      )}",serverUrl="${escapeLabel(snapshot.serverUrl)}"} 1`,
    );

    lines.push(`# HELP ${prefix}_instances_total Total number of instances`);
    lines.push(`# TYPE ${prefix}_instances_total gauge`);
    lines.push(`${prefix}_instances_total ${snapshot.instances.length}`);

    lines.push(`# HELP ${prefix}_instance_up 1 if instance state is open, else 0`);
    lines.push(`# TYPE ${prefix}_instance_up gauge`);
    lines.push(`# HELP ${prefix}_instance_state Instance state as a labelled metric`);
    lines.push(`# TYPE ${prefix}_instance_state gauge`);
    for (const instance of snapshot.instances) {
      const state = instance.state || 'unknown';
      const integration = instance.integration || '';
      const up = state === 'open' ? 1 : 0;
      const labels = `instance="${escapeLabel(instance.name)}",integration="${escapeLabel(integration)}"`;
      lines.push(`${prefix}_instance_up{${labels}} ${up}`);
      lines.push(`${prefix}_instance_state{${labels},state="${escapeLabel(state)}"} 1`);
    }
  }
  return lines.join('\n') + '\n';
}
