import type { HermesURL, ImportInstanceInput } from '../types';

export function exportInstancesAsJson(instances: HermesURL[]): string {
  return JSON.stringify(
    instances.map((instance) => ({
      name: instance.name,
      url: instance.url,
      ...(instance.notes ? { notes: instance.notes } : {}),
    })),
    null,
    2
  );
}

export function parseImportPayload(json: string): ImportInstanceInput[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Imported data must be an array of instances.');
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Instance #${index + 1} is not an object.`);
    }

    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    if (!name || !url) {
      throw new Error(`Instance #${index + 1} must include a name and url.`);
    }

    const notes =
      typeof item.notes === 'string' && item.notes.trim() ? item.notes.trim().slice(0, 500) : null;
    const password =
      typeof item.password === 'string' && item.password.length > 0 ? item.password : undefined;

    return {
      name,
      url,
      ...(notes ? { notes } : {}),
      ...(password ? { password } : {}),
    };
  });
}
