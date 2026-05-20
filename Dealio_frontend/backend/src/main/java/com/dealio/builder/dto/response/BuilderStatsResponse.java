package com.dealio.builder.dto.response;

import java.math.BigDecimal;

public record BuilderStatsResponse(
        long totalProjects,
        long totalUnits,
        long soldUnits,
        long availableUnits,
        BigDecimal totalRevenue,
        long totalLeads,
        long activeDeals,
        long pendingMeetings
) {}
