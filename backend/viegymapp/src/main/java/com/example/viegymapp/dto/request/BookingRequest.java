package com.example.viegymapp.dto.request;

import com.example.viegymapp.entity.BookingSession;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequest {
    UUID timeSlotId;
    UUID coachId;
    String clientNotes;
    BookingSession.BookingStatus status; // Optional status override
}
