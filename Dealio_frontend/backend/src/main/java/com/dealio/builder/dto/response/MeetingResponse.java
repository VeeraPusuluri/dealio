package com.dealio.builder.dto.response;

import com.dealio.builder.enums.MeetingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MeetingResponse(
        Long id,
        Long projectId,
        String projectName,
        Long builderId,
        Long channelPartnerId,
        String channelPartnerName,
        String customerName,
        String customerPhone,
        String cpName,
        LocalDate preferredDate,
        String preferredTime,
        LocalDate confirmedDate,
        String confirmedTime,
        MeetingStatus status,
        String notes,
        String builderNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
