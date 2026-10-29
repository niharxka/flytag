import { homeRows } from './profile.logic';
import { CUSTOM_HOME } from './profile.schemas';

const colleges = [
  { id: 'c1', name: 'Revelle' },
  { id: 'c2', name: 'Sixth' },
];
const base = { colleges, areas: [] as string[], choice: 'c1', label: '', editing: false };
const labels = (r: ReturnType<typeof homeRows>) => r.rows.map((x) => x.label);

describe('homeRows', () => {
  it('lists colleges, then saved areas, then "Somewhere else" last', () => {
    const r = homeRows({ ...base, areas: ['Pacific Beach', 'Del Mar'], choice: 'c2' });
    expect(labels(r)).toEqual(['Revelle', 'Sixth', 'Pacific Beach', 'Del Mar', 'Somewhere else']);
    expect(r.active).toBe(1);
    expect(r.showEditor).toBe(false);
  });

  // Regression: the field used to vanish on the first keystroke of a new area.
  it('keeps the field open while typing a new area', () => {
    const r = homeRows({ ...base, choice: CUSTOM_HOME, label: 'P', editing: true });
    expect(r.showEditor).toBe(true);
    expect(r.rows[r.active].kind).toBe('new');
  });

  // Regression: tapping "Somewhere else" again used to hide the area already added.
  it('keeps every saved area while typing another', () => {
    const r = homeRows({
      ...base,
      areas: ['Pacific Beach'],
      choice: CUSTOM_HOME,
      label: 'Del',
      editing: true,
    });
    expect(labels(r)).toEqual(['Revelle', 'Sixth', 'Pacific Beach', 'Somewhere else']);
    expect(r.rows[r.active].kind).toBe('new');
  });

  it('highlights the saved area that is the current home, ignoring case', () => {
    const r = homeRows({
      ...base,
      areas: ['Pacific Beach', 'Del Mar'],
      choice: CUSTOM_HOME,
      label: 'del mar',
    });
    expect(r.rows[r.active].label).toBe('Del Mar');
  });
});
