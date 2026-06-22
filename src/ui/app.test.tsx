import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from '../App';
import { useGame } from './store/gameStore';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  useGame.setState({ appScreen: 'title', run: null, overlay: null, pendingMode: 'standard' });
});

afterEach(() => cleanup());

describe('App smoke', () => {
  it('renders the title screen without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Reasonable Doubt' })).toBeInTheDocument();
  });

  it('navigates title → character select → into a run map', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByText('New Case'));
    expect(screen.getByText('Choose Your Counsel')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Begin Trial/));
    expect(screen.getByRole('heading', { name: 'Small Claims Court' })).toBeInTheDocument();
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('opens the deck overlay during a run', () => {
    render(<App />);
    fireEvent.click(screen.getByText('New Case'));
    fireEvent.click(screen.getByText(/Begin Trial/));
    fireEvent.click(screen.getByText(/^Deck \(/));
    expect(screen.getByRole('heading', { name: /Your Deck/ })).toBeInTheDocument();
  });
});
