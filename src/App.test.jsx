import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders biospecimen calculator heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/interactive biospecimen study lifetime cost calculator/i);
  expect(headingElement).toBeDefined();
});
