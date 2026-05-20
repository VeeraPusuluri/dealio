package com.dealio.builder.dto.response;

import com.dealio.builder.enums.BhkType;
import com.dealio.builder.enums.LeadSource;
import com.dealio.builder.enums.LeadStage;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LeadResponse(
        Long id,
        Long projectId,
        String projectName,
        Long builderId,
        Long channelPartnerId,
        String channelPartnerName,
        String customerName,
        String customerPhone,
        String customerEmail,
        BigDecimal budget,
        LeadStage stage,
        LeadSource source,
        BhkType unitType,
        int score,
        String heat,
        int daysInStage,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
