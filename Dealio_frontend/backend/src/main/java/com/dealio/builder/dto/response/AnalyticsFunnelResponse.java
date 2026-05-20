package com.dealio.builder.dto.response;

import java.util.List;

public record AnalyticsFunnelResponse(
        List<FunnelStage> stages
) {
    public record FunnelStage(
            String name,
            long value,
            double percentage
    ) {}
}
