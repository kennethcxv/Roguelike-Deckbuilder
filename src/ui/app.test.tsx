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

  it('renders the trial screen and tutorial without console errors', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = useGame.getState();
    store.startRun('litigator', 'custom', 'qa-trial-seed', 0);
    const startId = useGame.getState().run!.reachableNodeIds[0]!;
    useGame.getState().enterNode(startId);
    render(<App />);
    expect(useGame.getState().run!.screen).toBe('trial');
    expect(screen.getByText('Rest Your Case')).toBeInTheDocument();
    // first-run tutorial coachmark is present
    expect(screen.getByText(/Welcome, Counselor/)).toBeInTheDocument();
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
