import React from 'react';
import {render} from '@testing-library/react-native';
import ChatBubble from '../../components/ChatBubble';
import type {ChatMessage} from '../../types';

// Mock markdown display
jest.mock('react-native-markdown-display', () => {
  const {Text} = require('react-native');
  return {
    __esModule: true,
    default: ({children}: {children: string}) => <Text>{children}</Text>,
  };
});

describe('ChatBubble', () => {
  it('should render user message', () => {
    const message: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello AI!',
      timestamp: Date.now(),
    };

    const {getByText} = render(<ChatBubble message={message} />);
    expect(getByText('Hello AI!')).toBeTruthy();
  });

  it('should render assistant message', () => {
    const message: ChatMessage = {
      id: '2',
      role: 'assistant',
      content: 'Hello! How can I help you?',
      timestamp: Date.now(),
    };

    const {getByText} = render(<ChatBubble message={message} />);
    expect(getByText('Hello! How can I help you?')).toBeTruthy();
  });

  it('should display timestamp', () => {
    const timestamp = new Date(2024, 0, 15, 14, 30).getTime();
    const message: ChatMessage = {
      id: '3',
      role: 'user',
      content: 'Test',
      timestamp,
    };

    const {getByText} = render(<ChatBubble message={message} />);
    // Should show time in HH:MM format
    expect(getByText(/\d{1,2}:\d{2}/)).toBeTruthy();
  });
});
