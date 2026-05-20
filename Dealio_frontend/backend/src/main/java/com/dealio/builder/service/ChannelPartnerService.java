package com.dealio.builder.service;

import com.dealio.builder.dto.response.AnalyticsCpPerformanceResponse;
import com.dealio.builder.dto.response.ChannelPartnerResponse;
import com.dealio.builder.entity.ChannelPartner;
import com.dealio.builder.enums.CpTier;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.ChannelPartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelPartnerService {

    private final ChannelPartnerRepository channelPartnerRepository;

    @Transactional(readOnly = true)
    public List<ChannelPartnerResponse> getCPsByBuilder(Long builderId) {
        return channelPartnerRepository.findByBuilderId(builderId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChannelPartnerResponse getCPById(Long id) {
        ChannelPartner cp = channelPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChannelPartner", "id", id));
        return toResponse(cp);
    }

    @Transactional(readOnly = true)
    public List<ChannelPartnerResponse> getCPPerformance(Long builderId) {
        return channelPartnerRepository.findByBuilderIdOrderByTotalEarningsDesc(builderId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public double calculateCommissionRate(CpTier tier) {
        return switch (tier) {
            case PLATINUM -> 3.0;
            case GOLD -> 2.5;
            case SILVER -> 2.0;
            case BRONZE -> 1.5;
        };
    }

    public List<AnalyticsCpPerformanceResponse.CpPerformance> getCpAnalyticsPerformance(Long builderId) {
        return channelPartnerRepository.findByBuilderIdOrderByTotalEarningsDesc(builderId).stream()
                .map(cp -> new AnalyticsCpPerformanceResponse.CpPerformance(
                        cp.getName(),
                        cp.getTotalDeals() * 2,
                        cp.getTotalDeals(),
                        cp.getDealsThisMonth(),
                        cp.getTotalDeals() > 0
                                ? (double) cp.getDealsThisMonth() / cp.getTotalDeals() * 100 : 0.0,
                        cp.getTotalEarnings() != null ? cp.getTotalEarnings() : BigDecimal.ZERO
                ))
                .collect(Collectors.toList());
    }

    private ChannelPartnerResponse toResponse(ChannelPartner cp) {
        return new ChannelPartnerResponse(
                cp.getId(),
                cp.getBuilder().getId(),
                cp.getName(),
                cp.getEmail(),
                cp.getPhone(),
                cp.getTier(),
                cp.getCity(),
                cp.getTotalDeals(),
                cp.getDealsThisMonth(),
                cp.getTotalEarnings(),
                cp.getPendingCommission(),
                cp.getTier() != null ? calculateCommissionRate(cp.getTier()) : 0.0,
                cp.getCreatedAt()
        );
    }
}
