package com.dealio.builder.dto.response;

import com.dealio.builder.enums.DemandLetterStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DemandLetterResponse(
        Long id,
        Long dealId,
        Long projectId,
        String projectName,
        Long builderId,
        String customerName,
        BigDecimal amount,
        LocalDate dueDate,
        String description,
        BigDecimal penaltyPerDay,
        DemandLetterStatus status,
        LocalDate paymentDate,
        String paymentRef,
        boolean isOverdue,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
