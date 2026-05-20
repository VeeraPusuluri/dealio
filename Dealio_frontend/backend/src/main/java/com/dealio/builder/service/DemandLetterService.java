package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateDemandLetterRequest;
import com.dealio.builder.dto.request.MarkDemandLetterPaidRequest;
import com.dealio.builder.dto.response.DemandLetterResponse;
import com.dealio.builder.entity.Deal;
import com.dealio.builder.entity.DemandLetter;
import com.dealio.builder.entity.Project;
import com.dealio.builder.enums.DemandLetterStatus;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.DealRepository;
import com.dealio.builder.repository.DemandLetterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DemandLetterService {

    private final DemandLetterRepository demandLetterRepository;
    private final ProjectService projectService;
    private final BuilderService builderService;
    private final DealRepository dealRepository;

    @Transactional
    public DemandLetterResponse createDemandLetter(CreateDemandLetterRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        var builder = builderService.getBuilderEntityById(request.builderId());
        Deal deal = request.dealId() != null
                ? dealRepository.findById(request.dealId())
                    .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", request.dealId()))
                : null;

        DemandLetter demandLetter = DemandLetter.builder()
                .deal(deal)
                .project(project)
                .builder(builder)
                .customerName(request.customerName())
                .amount(request.amount())
                .dueDate(request.dueDate())
                .description(request.description())
                .penaltyPerDay(request.penaltyPerDay())
                .status(DemandLetterStatus.PENDING)
                .build();

        DemandLetter saved = demandLetterRepository.save(demandLetter);
        log.info("Created demand letter with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DemandLetterResponse> getDemandLettersByBuilder(Long builderId, Long projectId, DemandLetterStatus status) {
        return demandLetterRepository.findByBuilderIdWithFilters(builderId, projectId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DemandLetterResponse> getDemandLettersByProject(Long projectId) {
        return demandLetterRepository.findByProjectId(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public DemandLetterResponse markPaid(Long id, MarkDemandLetterPaidRequest request) {
        DemandLetter demandLetter = demandLetterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DemandLetter", "id", id));
        demandLetter.setStatus(DemandLetterStatus.PAID);
        demandLetter.setPaymentDate(request.paymentDate());
        demandLetter.setPaymentRef(request.paymentRef());
        DemandLetter saved = demandLetterRepository.save(demandLetter);
        return toResponse(saved);
    }

    @Transactional
    public void checkAndUpdateOverdue() {
        LocalDate today = LocalDate.now();
        List<DemandLetter> overdue = demandLetterRepository.findOverduePending(today);
        overdue.forEach(dl -> dl.setStatus(DemandLetterStatus.OVERDUE));
        demandLetterRepository.saveAll(overdue);
        log.info("Updated {} demand letters to OVERDUE", overdue.size());
    }

    private DemandLetterResponse toResponse(DemandLetter dl) {
        boolean isOverdue = dl.getStatus() == DemandLetterStatus.PENDING
                && dl.getDueDate().isBefore(LocalDate.now());
        return new DemandLetterResponse(
                dl.getId(),
                dl.getDeal() != null ? dl.getDeal().getId() : null,
                dl.getProject().getId(),
                dl.getProject().getName(),
                dl.getBuilder().getId(),
                dl.getCustomerName(),
                dl.getAmount(),
                dl.getDueDate(),
                dl.getDescription(),
                dl.getPenaltyPerDay(),
                dl.getStatus(),
                dl.getPaymentDate(),
                dl.getPaymentRef(),
                isOverdue,
                dl.getCreatedAt(),
                dl.getUpdatedAt()
        );
    }
}
