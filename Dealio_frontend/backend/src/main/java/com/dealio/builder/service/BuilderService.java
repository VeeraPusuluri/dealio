package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateBuilderRequest;
import com.dealio.builder.dto.response.BuilderResponse;
import com.dealio.builder.entity.Builder;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.BuilderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuilderService {

    private final BuilderRepository builderRepository;

    @Transactional(readOnly = true)
    public BuilderResponse getBuilderById(Long id) {
        Builder builder = builderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Builder", "id", id));
        return toResponse(builder);
    }

    @Transactional
    public BuilderResponse createBuilder(CreateBuilderRequest request) {
        Builder builder = Builder.builder()
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .companyName(request.companyName())
                .gstin(request.gstin())
                .reraLicenseNumber(request.reraLicenseNumber())
                .build();
        Builder saved = builderRepository.save(builder);
        log.info("Created builder with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public BuilderResponse updateBuilder(Long id, CreateBuilderRequest request) {
        Builder builder = builderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Builder", "id", id));
        builder.setName(request.name());
        builder.setPhone(request.phone());
        builder.setCompanyName(request.companyName());
        builder.setGstin(request.gstin());
        builder.setReraLicenseNumber(request.reraLicenseNumber());
        Builder saved = builderRepository.save(builder);
        return toResponse(saved);
    }

    public Builder getBuilderEntityById(Long id) {
        return builderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Builder", "id", id));
    }

    private BuilderResponse toResponse(Builder builder) {
        return new BuilderResponse(
                builder.getId(),
                builder.getName(),
                builder.getEmail(),
                builder.getPhone(),
                builder.getCompanyName(),
                builder.getGstin(),
                builder.getReraLicenseNumber(),
                builder.getCreatedAt(),
                builder.getUpdatedAt()
        );
    }
}
