import React from 'react';
import { Modal as RNModal, View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal = ({ visible, onClose, children, showCloseButton = true }: ModalProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.container}>
          <View style={[
            styles.modal,
            { backgroundColor: colors.background }
          ]}>
            {showCloseButton && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <View style={styles.closeButtonInner}>
                  <View style={[styles.closeLine, { backgroundColor: colors.text }]} />
                  <View style={[styles.closeLine, styles.closeLineRotated, { backgroundColor: colors.text }]} />
                </View>
              </TouchableOpacity>
            )}
            {children}
          </View>
        </SafeAreaView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonInner: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  closeLineRotated: {
    transform: [{ rotate: '90deg' }],
  },
});