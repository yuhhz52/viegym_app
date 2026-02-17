import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface WorkoutProgram {
  id: string;
  title: string;
  name?: string;
}

interface StartWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout: (data: { programId?: string; notes?: string }) => void;
}

export const StartWorkoutModal = ({ visible, onClose, onStartWorkout }: StartWorkoutModalProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchPrograms();
      // Reset form when modal opens
      setSelectedProgram('');
      setNotes('');
    }
  }, [visible]);

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const { workoutApi } = await import('@/services/api');
      const data = await workoutApi.getAllPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Không thể tải chương trình:', err);
      // Fallback to mock data if API fails
      setPrograms([
        { id: '1', title: 'Upper Body Strength' },
        { id: '2', title: 'Lower Body Power' },
        { id: '3', title: 'Full Body Workout' },
        { id: '4', title: 'Push Pull Legs' },
      ]);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const { workoutApi, generateWorkoutName } = await import('@/services/api');
      
      const sessionData = {
        programId: selectedProgram || undefined,
        sessionDate: new Date().toISOString(),
        durationMinutes: 0, // Will be updated when workout finishes
        notes: notes || generateWorkoutName(notes)
      };
      
      const newSession = await workoutApi.createSession(sessionData);
      
      onStartWorkout({
        programId: selectedProgram || undefined,
        notes: notes || undefined,
        sessionId: newSession.id
      });
      
      onClose();
    } catch (err) {
      console.error('Không thể tạo buổi tập:', err);
      // Fallback to offline mode
      onStartWorkout({
        programId: selectedProgram || undefined,
        notes: notes || undefined
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const quickStartOptions = ['Upper Body', 'Lower Body', 'Full Body', 'Cardio'];

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
          <Text style={[styles.iconText, { color: colors.tint }]}>💪</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>Bắt Đầu Tập</Text>
          <Text style={[styles.subtitle, { color: colors.text + '80' }]}>Tạo buổi tập mới</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Program Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Chương trình (tùy chọn)
          </Text>
          <View style={[styles.selectContainer, { borderColor: colors.text + '30' }]}>
            {loadingPrograms ? (
              <Text style={[styles.selectText, { color: colors.text + '60' }]}>
                Đang tải...
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.programOption,
                    selectedProgram === '' && styles.programOptionSelected,
                    selectedProgram === '' && { backgroundColor: colors.tint }
                  ]}
                  onPress={() => setSelectedProgram('')}
                >
                  <Text style={[
                    styles.programOptionText,
                    { color: selectedProgram === '' ? '#fff' : colors.text }
                  ]}>
                    Không chọn
                  </Text>
                </TouchableOpacity>
                {programs.map(program => (
                  <TouchableOpacity
                    key={program.id}
                    style={[
                      styles.programOption,
                      selectedProgram === program.id && styles.programOptionSelected,
                      selectedProgram === program.id && { backgroundColor: colors.tint }
                    ]}
                    onPress={() => setSelectedProgram(program.id)}
                  >
                    <Text style={[
                      styles.programOptionText,
                      { color: selectedProgram === program.id ? '#fff' : colors.text }
                    ]}>
                      {program.title || program.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Ghi chú (tùy chọn)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              { 
                borderColor: colors.text + '30',
                backgroundColor: colors.background,
                color: colors.text
              }
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ví dụ: Leg day, Upper body..."
            placeholderTextColor={colors.text + '60'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Quick Start Templates */}
        <Card style={[styles.quickStartCard, { backgroundColor: colors.tint + '10' }]}>
          <Text style={[styles.quickStartTitle, { color: colors.text }]}>
            ⚡ Bắt đầu nhanh:
          </Text>
          <View style={styles.quickStartOptions}>
            {quickStartOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.quickStartOption,
                  { 
                    backgroundColor: colors.background,
                    borderColor: colors.text + '20'
                  }
                ]}
                onPress={() => setNotes(option)}
              >
                <Text style={[styles.quickStartOptionText, { color: colors.text }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title={loading ? 'Đang tạo...' : 'Bắt Đầu Ngay'}
          onPress={handleStart}
          disabled={loading}
          loading={loading}
          variant="primary"
          size="large"
          style={styles.startButton}
        />
        <Button
          title="Hủy"
          onPress={onClose}
          variant="outline"
          size="large"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 50,
  },
  selectText: {
    fontSize: 16,
    textAlignVertical: 'center',
  },
  programOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  programOptionSelected: {
    borderColor: 'transparent',
  },
  programOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  quickStartCard: {
    padding: 16,
    marginBottom: 8,
  },
  quickStartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickStartOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickStartOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickStartOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  startButton: {
    flex: 1,
  },
});