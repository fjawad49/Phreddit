import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import PostPage from './components/PostPage';

beforeEach(() => {
  localStorage.clear();
});

test('Disabled Button for Guest', () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /create post/i });
  expect(button).toBeDisabled();
});

test('Enabled Button for User', () => {
  localStorage.setItem('user', JSON.stringify({ displayName: 'wonderz' }));
  render(<App />);
  const button = screen.getByRole('button', { name: /create post/i });
  expect(button).toBeEnabled();
});

