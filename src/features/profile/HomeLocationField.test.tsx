import { fireEvent, render, screen } from '@testing-library/react-native';
import { useController, useForm } from 'react-hook-form';
import { Text } from 'react-native';

import { HomeLocationField } from './HomeLocationField';

// Taps through the Home picker the way a rider does, wired to a form the same way Edit profile
// and onboarding wire it. Two bugs reached the phone before this existed: the field
// closed on the first letter, and tapping "Somewhere else" again hid the area already added.

jest.mock('./profile.hooks', () => ({
  useColleges: () => ({
    isPending: false,
    isError: false,
    data: [
      { id: 'c1', name: 'Revelle' },
      { id: 'c2', name: 'Sixth' },
    ],
  }),
}));

function Harness({ choice = 'c1', label = '', areas = [] as string[] }) {
  const { control } = useForm({
    defaultValues: { homeChoice: choice, homeLabel: label, savedAreas: areas },
  });
  const { field: c } = useController({ control, name: 'homeChoice' });
  const { field: l } = useController({ control, name: 'homeLabel' });
  const { field: a } = useController({ control, name: 'savedAreas' });
  return (
    <>
      <HomeLocationField
        choice={c.value}
        onChoiceChange={c.onChange}
        label={l.value}
        onLabelChange={l.onChange}
        areas={a.value}
        onAreasChange={a.onChange}
      />
      <Text>{`form: ${c.value} / ${l.value} / ${a.value.join(', ')}`}</Text>
    </>
  );
}

const rows = () => screen.getAllByRole('menuitem').map((m) => m.props.accessibilityLabel);
const selected = () =>
  screen.getAllByRole('menuitem').find((m) => m.props.accessibilityState?.selected)?.props.accessibilityLabel;
const field = () => screen.queryByPlaceholderText(/Pacific Beach/);

it('each Add makes a new numbered row; earlier areas stay', async () => {
  await render(<Harness />);

  await fireEvent.press(screen.getByLabelText('Somewhere else'));
  await fireEvent.changeText(field()!, 'P');
  expect(field()).toBeTruthy(); // still open after the first letter
  await fireEvent.changeText(field()!, 'Pacific Beach');
  await fireEvent.press(screen.getByText('Add'));
  expect(rows()).toEqual(['Revelle', 'Sixth', 'Pacific Beach', 'Somewhere else']);
  expect(selected()).toBe('Pacific Beach');
  expect(field()).toBeNull();

  await fireEvent.press(screen.getByLabelText('Somewhere else'));
  expect(rows()).toContain('Pacific Beach'); // doesn't vanish while typing another
  expect(field()!.props.value).toBe('');
  await fireEvent.changeText(field()!, 'Del Mar');
  await fireEvent(field()!, 'submitEditing');
  expect(rows()).toEqual(['Revelle', 'Sixth', 'Pacific Beach', 'Del Mar', 'Somewhere else']);
  expect(selected()).toBe('Del Mar');
  expect(screen.getByText('form: custom / Del Mar / Pacific Beach, Del Mar')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Pacific Beach'));
  expect(selected()).toBe('Pacific Beach');
});

it('adding an area you already have picks it instead of duplicating', async () => {
  await render(<Harness areas={['Pacific Beach']} />);
  await fireEvent.press(screen.getByLabelText('Somewhere else'));
  await fireEvent.changeText(field()!, 'pacific beach');
  await fireEvent.press(screen.getByText('Add'));
  expect(rows()).toEqual(['Revelle', 'Sixth', 'Pacific Beach', 'Somewhere else']);
  expect(selected()).toBe('Pacific Beach');
});

it('× removes an area; removing the chosen one leaves no home picked', async () => {
  await render(<Harness choice="custom" label="Del Mar" areas={['Pacific Beach', 'Del Mar']} />);
  await fireEvent.press(screen.getByLabelText('Remove Pacific Beach'));
  expect(rows()).toEqual(['Revelle', 'Sixth', 'Del Mar', 'Somewhere else']);
  expect(selected()).toBe('Del Mar');
  await fireEvent.press(screen.getByLabelText('Remove Del Mar'));
  expect(rows()).toEqual(['Revelle', 'Sixth', 'Somewhere else']);
  expect(selected()).toBeUndefined();
});
