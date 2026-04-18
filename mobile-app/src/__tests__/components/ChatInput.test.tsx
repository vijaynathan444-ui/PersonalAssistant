import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import ChatInput from '../../components/ChatInput';

describe('ChatInput', () => {
  const mockOnSend = jest.fn();
  const mockOnMicPress = jest.fn();

  const defaultProps = {
    onSend: mockOnSend,
    onMicPress: mockOnMicPress,
    isGenerating: false,
    isListening: false,
    voiceEnabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render input field', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);
    expect(getByLabelText('Message input')).toBeTruthy();
  });

  it('should render send button', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);
    expect(getByLabelText('Send message')).toBeTruthy();
  });

  it('should render mic button when voice enabled', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);
    expect(getByLabelText('Voice input')).toBeTruthy();
  });

  it('should not render mic button when voice disabled', () => {
    const {queryByLabelText} = render(
      <ChatInput {...defaultProps} voiceEnabled={false} />,
    );
    expect(queryByLabelText('Voice input')).toBeNull();
  });

  it('should call onSend with trimmed text', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);

    const input = getByLabelText('Message input');
    fireEvent.changeText(input, '  Hello world  ');
    fireEvent.press(getByLabelText('Send message'));

    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  it('should not send empty messages', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);

    fireEvent.press(getByLabelText('Send message'));
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should not send whitespace-only messages', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);

    const input = getByLabelText('Message input');
    fireEvent.changeText(input, '   ');
    fireEvent.press(getByLabelText('Send message'));

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should disable input while generating', () => {
    const {getByLabelText} = render(
      <ChatInput {...defaultProps} isGenerating={true} />,
    );

    const input = getByLabelText('Message input');
    expect(input.props.editable).toBe(false);
  });

  it('should clear input after sending', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);

    const input = getByLabelText('Message input');
    fireEvent.changeText(input, 'Hello');
    fireEvent.press(getByLabelText('Send message'));

    expect(input.props.value).toBe('');
  });

  it('should call onMicPress when mic button pressed', () => {
    const {getByLabelText} = render(<ChatInput {...defaultProps} />);

    fireEvent.press(getByLabelText('Voice input'));
    expect(mockOnMicPress).toHaveBeenCalled();
  });
});
