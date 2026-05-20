package com.dealio.builder.dto.response;

import com.dealio.builder.enums.ActorRole;
import com.dealio.builder.enums.CommissionStatus;
import com.dealio.builder.enums.CommissionType;
import com.dealio.builder.enums.DealStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DealResponse(
        Long id,
        Long projectId,
        String projectName,
        Long unitId,
        Long builderId,
        Long channelPartnerId,
        String channelPartnerName,
        String customerName,
        String customerPhone,
        String customerEmail,
        BigDecimal dealValue,
        DealStatus status,
        boolean isNri,
        CommissionType commissionType,
        BigDecimal commissionValue,
        CommissionStatus commissionStatus,
        BigDecimal loanAmount,
        BigDecimal propertyValue,
        String employmentType,
        List<ActivityResponse> activities,
        List<MessageResponse> messages,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record ActivityResponse(
            Long id,
            Long actorId,
            String actorName,
            ActorRole actorRole,
            String action,
            LocalDateTime createdAt
    ) {}

    public record MessageResponse(
            Long id,
            Long senderId,
            String senderName,
            ActorRole senderRole,
            String message,
            LocalDateTime createdAt
    ) {}
}
