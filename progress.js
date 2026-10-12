// Anonymous v1 progress. Stable IDs survive minor releases; removed IDs are pruned.
export function createProgress(course, storage, basePath) {
  const key = 'little-english-progress' + (basePath === '/' ? '' : ':' + basePath);
  const valid = new Set(course.lessons.map(lesson => lesson.id));
  const empty = ok => ({complete: [], active: '', ok});
  function load() {
    try {
      const data = JSON.parse(storage().getItem(key) || '{}');
      if (data.schemaVersion !== undefined && data.schemaVersion !== 1) return empty(true);
      if (data.courseVersion && data.courseVersion.split('.')[0] !== course.version.split('.')[0]) return empty(true);
      return {complete: [...new Set(Array.isArray(data.complete) ? data.complete.filter(id => valid.has(id)) : [])],
        active: typeof data.active === 'string' ? data.active : '', ok: true};
    } catch { return empty(false); }
  }
  function save(complete, active) {
    try { storage().setItem(key, JSON.stringify({schemaVersion: 1, complete: complete.filter(id => valid.has(id)), active, courseVersion: course.version})); return true; }
    catch { return false; }
  }
  function clear() { try { storage().removeItem(key); return true; } catch { return false; } }
  return {key, load, save, clear};
}
