/**
 * ErrorBoundary - NeuBridge Error Boundary Component
 *
 * Class component that catches render errors in child trees and
 * displays a friendly recovery screen. Required to be a class
 * component per React's error boundary API.
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message
        ? this.state.error.message.slice(0, 200)
        : this.props.fallbackMessage ?? '';

      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.emoji} accessibilityElementsHidden>
            {'\u26A0\uFE0F'}
          </Text>

          <Text style={styles.heading} accessibilityRole="header">
            Something went wrong
          </Text>

          {errorMessage ? (
            <Text style={styles.message}>{errorMessage}</Text>
          ) : null}

          <Pressable
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Resets the error and reloads this section"
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Text style={styles.buttonText}>Tap here to try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ErrorBoundary;
