package com.dealio.builder.dto.response;

import java.util.List;

public record AnalyticsVelocityResponse(
        List<WeeklyVelocity> velocities
) {
    public record WeeklyVelocity(
            String week,
            long units
    ) {}
}
