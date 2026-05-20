package com.dealio.builder.dto.response;

import com.dealio.builder.enums.BroadcastAudience;

import java.time.LocalDateTime;

public record BroadcastResponse(
        Long id,
        Long builderId,
        Long projectId,
        String projectName,
        BroadcastAudience audience,
        String audienceDetail,
        String message,
        int delivered,
        int opened,
        LocalDateTime sentAt
) {}
