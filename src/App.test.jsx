import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders biospecimen calculator heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/interactive biospecimen study lifetime cost calculator/i);
  expect(headingElement).toBeDefined();
});

test('locks values from calculator and opens what-if with baseline and scenario cards', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /lock cost in for scenario modeling/i }));

  expect(screen.getByRole('heading', { name: /what-if scenarios/i })).toBeDefined();
  expect(screen.getByText(/^locked baseline$/i)).toBeDefined();
  expect(screen.getByText(/^scenario output$/i)).toBeDefined();
  expect(screen.getByText(/no scenario applied/i)).toBeDefined();
});

test('what-if controls are read-only and provide lock hint tooltip', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /what-if scenarios/i }));

  const subjectsInput = screen.getByLabelText(/subjects/i);
  expect(subjectsInput.disabled).toBe(true);
  expect(subjectsInput.getAttribute('title')).toBe('To Change Sample Variables Use Calculator');
});

test('reset returns scenario view to locked baseline state', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /lock cost in for scenario modeling/i }));
  await user.click(screen.getByRole('button', { name: /direct to central lab analysis -> residual lts/i }));
  expect(screen.getByText(/scenario sets the values listed below/i)).toBeDefined();

  await user.click(screen.getByRole('button', { name: /^reset$/i }));
  expect(screen.getByText(/no scenario applied/i)).toBeDefined();
});
