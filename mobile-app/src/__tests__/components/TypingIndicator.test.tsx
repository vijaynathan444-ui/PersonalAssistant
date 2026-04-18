import React from 'react';
import {render} from '@testing-library/react-native';
import TypingIndicator from '../../components/TypingIndicator';

describe('TypingIndicator', () => {
  it('should render thinking text', () => {
    const {getByText} = render(<TypingIndicator />);
    expect(getByText('Thinking...')).toBeTruthy();
  });
});
