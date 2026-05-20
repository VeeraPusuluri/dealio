package com.dealio.builder.service;

import com.dealio.builder.dto.request.*;
import com.dealio.builder.dto.response.DealResponse;
import com.dealio.builder.entity.*;
import com.dealio.builder.enums.CommissionStatus;
import com.dealio.builder.enums.DealStatus;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final DealActivityRepository dealActivityRepository;
    private final DealMessageRepository dealMessageRepository;
    private final ProjectService projectService;
    private final BuilderService builderService;
    private final ChannelPartnerRepository channelPartnerRepository;
    private final UnitRepository unitRepository;

    @Transactional
    public DealResponse createDeal(CreateDealRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        Builder builder = builderService.getBuilderEntityById(request.builderId());
        Unit unit = request.unitId() != null
                ? unitRepository.findById(request.unitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unit", "id", request.unitId()))
                : null;
        ChannelPartner cp = request.channelPartnerId() != null
                ? channelPartnerRepository.findById(request.channelPartnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("ChannelPartner", "id", request.channelPartnerId()))
                : null;

        Deal deal = Deal.builder()
                .project(project)
                .unit(unit)
                .builder(builder)
                .channelPartner(cp)
                .customerName(request.customerName())
                .customerPhone(request.customerPhone())
                .customerEmail(request.customerEmail())
                .dealValue(request.dealValue())
                .status(DealStatus.MEETING_COMPLETED)
                .isNri(request.isNri())
                .commissionStatus(CommissionStatus.PENDING)
                .build();

        Deal saved = dealRepository.save(deal);
        DealActivity activity = DealActivity.builder()
                .deal(saved)
                .actorName("System")
                .action("Deal created")
                .build();
        dealActivityRepository.save(activity);
        log.info("Created deal with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DealResponse> getDealsByBuilder(Long builderId, DealStatus status, Long projectId) {
        return dealRepository.findByBuilderIdWithFilters(builderId, status, projectId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DealResponse getDealById(Long id) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));
        return toResponse(deal);
    }

    @Transactional
    public DealResponse updateDealStatus(Long id, UpdateDealStatusRequest request) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));
        deal.setStatus(request.status());
        Deal saved = dealRepository.save(deal);
        return toResponse(saved);
    }

    @Transactional
    public DealResponse updateCommission(Long id, UpdateDealCommissionRequest request) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));
        if (request.commissionType() != null) deal.setCommissionType(request.commissionType());
        if (request.commissionValue() != null) deal.setCommissionValue(request.commissionValue());
        if (request.commissionStatus() != null) deal.setCommissionStatus(request.commissionStatus());
        Deal saved = dealRepository.save(deal);
        return toResponse(saved);
    }

    @Transactional
    public DealResponse addMessage(Long dealId, AddDealMessageRequest request) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", dealId));
        DealMessage message = DealMessage.builder()
                .deal(deal)
                .senderId(request.senderId())
                .senderName(request.senderName())
                .senderRole(request.senderRole())
                .message(request.message())
                .build();
        dealMessageRepository.save(message);
        return toResponse(deal);
    }

    @Transactional
    public DealResponse createLoanCase(Long dealId, CreateLoanCaseRequest request) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", dealId));
        deal.setLoanAmount(request.loanAmount());
        deal.setPropertyValue(request.propertyValue());
        deal.setEmploymentType(request.employmentType());
        deal.setNri(request.isNri());
        deal.setStatus(DealStatus.INTERESTED_LOAN_REQUIRED);
        Deal saved = dealRepository.save(deal);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DealResponse> getDealsByProject(Long projectId) {
        return dealRepository.findByProjectId(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private DealResponse toResponse(Deal deal) {
        List<DealResponse.ActivityResponse> activities = dealActivityRepository
                .findByDealIdOrderByCreatedAtDesc(deal.getId()).stream()
                .map(a -> new DealResponse.ActivityResponse(
                        a.getId(), a.getActorId(), a.getActorName(), a.getActorRole(), a.getAction(), a.getCreatedAt()))
                .collect(Collectors.toList());

        List<DealResponse.MessageResponse> messages = dealMessageRepository
                .findByDealIdOrderByCreatedAtAsc(deal.getId()).stream()
                .map(m -> new DealResponse.MessageResponse(
                        m.getId(), m.getSenderId(), m.getSenderName(), m.getSenderRole(), m.getMessage(), m.getCreatedAt()))
                .collect(Collectors.toList());

        return new DealResponse(
                deal.getId(),
                deal.getProject().getId(),
                deal.getProject().getName(),
                deal.getUnit() != null ? deal.getUnit().getId() : null,
                deal.getBuilder().getId(),
                deal.getChannelPartner() != null ? deal.getChannelPartner().getId() : null,
                deal.getChannelPartner() != null ? deal.getChannelPartner().getName() : null,
                deal.getCustomerName(),
                deal.getCustomerPhone(),
                deal.getCustomerEmail(),
                deal.getDealValue(),
                deal.getStatus(),
                deal.isNri(),
                deal.getCommissionType(),
                deal.getCommissionValue(),
                deal.getCommissionStatus(),
                deal.getLoanAmount(),
                deal.getPropertyValue(),
                deal.getEmploymentType(),
                activities,
                messages,
                deal.getCreatedAt(),
                deal.getUpdatedAt()
        );
    }
}
