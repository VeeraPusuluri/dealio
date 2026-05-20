package com.dealio.builder.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record PriceRecommendationResponse(
        BigDecimal currentPriceSqft,
        BigDecimal recommendedPriceSqft,
        String reasoning,
        List<Comparable> comparables
) {
    public record Comparable(
            String name,
            String location,
            String distance,
            BigDecimal priceSqft
    ) {}
}
