package com.dealio.builder.dto.response;

import com.dealio.builder.enums.CpTier;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ChannelPartnerResponse(
        Long id,
        Long builderId,
        String name,
        String email,
        String phone,
        CpTier tier,
        String city,
        int totalDeals,
        int dealsThisMonth,
        BigDecimal totalEarnings,
        BigDecimal pendingCommission,
        double commissionRate,
        LocalDateTime createdAt
) {}
