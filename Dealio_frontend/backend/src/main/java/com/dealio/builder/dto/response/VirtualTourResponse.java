package com.dealio.builder.dto.response;

import java.time.LocalDateTime;

public record VirtualTourResponse(
        Long id,
        Long projectId,
        String label,
        String url,
        LocalDateTime createdAt
) {}
