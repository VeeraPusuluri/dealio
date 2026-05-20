package com.dealio.builder.service;

import com.dealio.builder.dto.request.BulkCreateUnitsRequest;
import com.dealio.builder.dto.request.CreateUnitRequest;
import com.dealio.builder.dto.request.UpdateUnitStatusRequest;
import com.dealio.builder.dto.response.UnitResponse;
import com.dealio.builder.entity.Project;
import com.dealio.builder.entity.Unit;
import com.dealio.builder.entity.UnitConfig;
import com.dealio.builder.enums.UnitStatus;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.UnitConfigRepository;
import com.dealio.builder.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;
    private final UnitConfigRepository unitConfigRepository;
    private final ProjectService projectService;

    @Transactional
    public UnitResponse createUnit(CreateUnitRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        Unit unit = Unit.builder()
                .project(project)
                .tower(request.tower())
                .floor(request.floor())
                .unitNumber(request.unitNumber())
                .bhkType(request.bhkType())
                .areaSqft(request.areaSqft())
                .superBuiltUp(request.superBuiltUp())
                .price(request.price())
                .status(request.status() != null ? request.status() : UnitStatus.AVAILABLE)
                .facing(request.facing())
                .parkingSlots(request.parkingSlots())
                .holdCpName(request.holdCpName())
                .holdClientName(request.holdClientName())
                .holdExpiry(request.holdExpiry())
                .build();
        Unit saved = unitRepository.save(unit);
        log.info("Created unit with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public List<UnitResponse> bulkCreateUnits(BulkCreateUnitsRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        List<UnitResponse> responses = new ArrayList<>();

        for (BulkCreateUnitsRequest.UnitConfigEntry config : request.configs()) {
            UnitConfig unitConfig = UnitConfig.builder()
                    .project(project)
                    .bhkType(config.bhkType())
                    .carpetArea(config.carpetArea())
                    .superBuiltUp(config.superBuiltUp())
                    .floors(config.floors())
                    .count(config.count())
                    .basePrice(config.basePrice())
                    .status(config.status())
                    .build();
            unitConfigRepository.save(unitConfig);

            for (int i = 1; i <= config.count(); i++) {
                Unit unit = Unit.builder()
                        .project(project)
                        .bhkType(config.bhkType())
                        .areaSqft(config.carpetArea())
                        .superBuiltUp(config.superBuiltUp())
                        .price(config.basePrice())
                        .status(UnitStatus.AVAILABLE)
                        .unitNumber(i)
                        .build();
                Unit saved = unitRepository.save(unit);
                responses.add(toResponse(saved));
            }
        }
        log.info("Bulk created {} units for project {}", responses.size(), request.projectId());
        return responses;
    }

    @Transactional(readOnly = true)
    public List<UnitResponse> getUnitsByProject(Long projectId, UnitStatus status, String tower) {
        List<Unit> units = unitRepository.findByProjectIdWithFilters(projectId, status, tower);
        return units.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UnitResponse getUnitById(Long id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", "id", id));
        return toResponse(unit);
    }

    @Transactional
    public UnitResponse updateUnitStatus(Long id, UpdateUnitStatusRequest request) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", "id", id));
        unit.setStatus(request.status());
        if (request.holdCpName() != null) unit.setHoldCpName(request.holdCpName());
        if (request.holdClientName() != null) unit.setHoldClientName(request.holdClientName());
        if (request.holdExpiry() != null) unit.setHoldExpiry(request.holdExpiry());
        Unit saved = unitRepository.save(unit);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UnitResponse> getUnitsByTower(Long projectId, String tower) {
        return unitRepository.findByProjectIdAndTower(projectId, tower).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countByStatus(Long projectId, UnitStatus status) {
        return unitRepository.countByProjectIdAndStatus(projectId, status);
    }

    private UnitResponse toResponse(Unit unit) {
        return new UnitResponse(
                unit.getId(),
                unit.getProject().getId(),
                unit.getProject().getName(),
                unit.getTower(),
                unit.getFloor(),
                unit.getUnitNumber(),
                unit.getBhkType(),
                unit.getAreaSqft(),
                unit.getSuperBuiltUp(),
                unit.getPrice(),
                unit.getStatus(),
                unit.getFacing(),
                unit.getParkingSlots(),
                unit.getHoldCpName(),
                unit.getHoldClientName(),
                unit.getHoldExpiry(),
                unit.getCreatedAt(),
                unit.getUpdatedAt()
        );
    }
}
