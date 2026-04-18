import React from 'react';
import {render} from '@testing-library/react-native';
import ModelStatusBar from '../../components/ModelStatusBar';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));

describe('ModelStatusBar', () => {
  it('should show loaded state', () => {
    const {getByText} = render(
      <ModelStatusBar isLoaded={true} isLoading={false} contextSize={2048} />,
    );
    expect(getByText('Model ready • 2048 ctx')).toBeTruthy();
  });

  it('should show not loaded state', () => {
    const {getByText} = render(
      <ModelStatusBar isLoaded={false} isLoading={false} contextSize={0} />,
    );
    expect(getByText(/Model not loaded/)).toBeTruthy();
  });

  it('should show loading state', () => {
    const {getByText} = render(
      <ModelStatusBar isLoaded={false} isLoading={true} contextSize={0} />,
    );
    expect(getByText('Loading model...')).toBeTruthy();
  });
});
