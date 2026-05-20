package com.dealio.builder.dto.response;

import java.time.LocalDateTime;

public record BuilderResponse(
        Long id,
        String name,
        String email,
        String phone,
        String companyName,
        String gstin,
        String reraLicenseNumber,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
