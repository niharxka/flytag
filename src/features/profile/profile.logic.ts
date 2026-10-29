import { CUSTOM_HOME, sameArea } from './profile.schemas';

export type HomeRow =
  | { kind: 'college'; id: string; label: string }
  | { kind: 'area'; label: string }
  | { kind: 'new'; label: string };

/**
 * The rows of the Home picker and which one is highlighted.
 *   colleges, then the rider's saved areas (oldest first), then "Somewhere else" last.
 * While the area field is open, "Somewhere else" is highlighted and every saved area stays put.
 * Otherwise a custom home highlights the saved area with the same name.
 */
export function homeRows(input: {
  colleges: { id: string; name: string }[];
  areas: string[];
  choice: string;
  label: string;
  editing: boolean;
}) {
  const showEditor = input.choice === CUSTOM_HOME && (input.editing || !input.label.trim());

  const rows: HomeRow[] = [
    ...input.colleges.map((c) => ({ kind: 'college' as const, id: c.id, label: c.name })),
    ...input.areas.map((a) => ({ kind: 'area' as const, label: a })),
    { kind: 'new', label: 'Somewhere else' },
  ];

  let active: number;
  if (showEditor) active = rows.length - 1;
  else if (input.choice === CUSTOM_HOME)
    active = rows.findIndex((r) => r.kind === 'area' && sameArea(r.label, input.label));
  else active = rows.findIndex((r) => r.kind === 'college' && r.id === input.choice);

  return { rows, active, showEditor };
}
