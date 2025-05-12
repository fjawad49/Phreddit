// client/src/react.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
//component that contains the "Create Post" button
import Banner from './components/Banner';
//to provide routing context for Banner, which uses react-router hooks
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('Create Post Button in Banner', () => {
  beforeEach(() => {
    localStorage.clear(); //guest user
  });

  //button should be disabled when the user is not logged in (guest)
  test('is disabled when user is a guest', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Banner />
      </MemoryRouter>
    );
    const createPostButton = screen.getByText(/Create Post/i); //locate the button
    expect(createPostButton).toBeDisabled(); 
  });

  //button should be enabled when a user is logged in (via localStorage)
  test('is enabled when user is logged in', () => {
    //logged-in user by populating localStorage
    localStorage.setItem('user', JSON.stringify({ _id: '123', displayName: 'Sharanya' }));

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Banner />
      </MemoryRouter>
    );
    const createPostButton = screen.getByText(/Create Post/i); //locate the button
    expect(createPostButton).toBeEnabled();
  });
});

