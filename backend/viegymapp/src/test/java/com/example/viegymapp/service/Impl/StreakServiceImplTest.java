package com.example.viegymapp.service.Impl;

import com.example.viegymapp.entity.User;
import com.example.viegymapp.repository.UserRepository;
import com.example.viegymapp.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StreakServiceImplTest {

    @Mock
    private WorkoutSessionRepository workoutSessionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StreakServiceImpl streakService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    void calculateAndUpdateStreak_whenAlreadyUpdatedToday_shouldSkipUpdate() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        User user = User.builder()
                .id(userId)
                .streakDays(5)
                .lastStreakUpdate(today)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        streakService.calculateAndUpdateStreak(userId);

        verify(workoutSessionRepository, never()).countByUserIdAndSessionDateBetween(eq(userId), any(Instant.class), any(Instant.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void calculateAndUpdateStreak_whenFirstWorkoutToday_shouldSetStreakToOne() {
        User user = User.builder()
                .id(userId)
                .streakDays(0)
                .lastStreakUpdate(null)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(workoutSessionRepository.countByUserIdAndSessionDateBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(1L)
                .thenReturn(0L);

        streakService.calculateAndUpdateStreak(userId);

        assertEquals(1, user.getStreakDays());
        verify(userRepository).save(user);
    }

    @Test
    void calculateAndUpdateStreak_whenHadWorkoutYesterdayAndToday_shouldIncreaseStreak() {
        LocalDate yesterday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(1);
        User user = User.builder()
                .id(userId)
                .streakDays(4)
                .lastStreakUpdate(yesterday)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(workoutSessionRepository.countByUserIdAndSessionDateBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(1L)
                .thenReturn(1L);

        streakService.calculateAndUpdateStreak(userId);

        assertEquals(5, user.getStreakDays());
        verify(userRepository).save(user);
    }

    @Test
    void calculateAndUpdateStreak_whenMissedMultipleDaysWithoutWorkout_shouldResetStreak() {
        LocalDate oldDate = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(3);
        User user = User.builder()
                .id(userId)
                .streakDays(7)
                .lastStreakUpdate(oldDate)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(workoutSessionRepository.countByUserIdAndSessionDateBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(0L)
                .thenReturn(0L);

        streakService.calculateAndUpdateStreak(userId);

        assertEquals(0, user.getStreakDays());
        assertNull(user.getLastStreakUpdate());
        verify(userRepository).save(user);
    }

    @Test
    void resetStreak_whenUserNotFound_shouldThrow() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> streakService.resetStreak(userId));
    }
}
