package com.dealio.builder.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AnalyticsCpPerformanceResponse(
        List<CpPerformance> cpPerformances
) {
    public record CpPerformance(
            String name,
            int leads,
            int visits,
            int bookings,
            double conversion,
            BigDecimal commission
    ) {}
}
