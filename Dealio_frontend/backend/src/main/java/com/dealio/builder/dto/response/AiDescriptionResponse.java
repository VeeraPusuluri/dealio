package com.dealio.builder.dto.response;

import java.util.List;

public record AiDescriptionResponse(
        List<Description> descriptions
) {
    public record Description(
            String lang,
            String text
    ) {}
}
