package com.market.service;

import com.market.dto.PageDto;
import com.market.dto.PropertyListingDto;
import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class ListingsService {

    private final PropertyRepository propertyRepository;

    public ListingsService(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    public PropertyListingDto toDto(PropertyRecord record) {
        return new PropertyListingDto(
                record.getId(),
                record.getSquareFootage(),
                record.getBedrooms(),
                record.getBathrooms(),
                record.getYearBuilt(),
                record.getLotSize(),
                record.getDistanceToCityCenter(),
                record.getSchoolRating(),
                record.getPrice()
        );
    }

    public Mono<PageDto<PropertyListingDto>> getListings(FilterParams filters, int page, int size, String sort) {
        return Mono.fromCallable(() -> {
            Sort sortObj = Sort.by(Sort.Direction.ASC, "price");
            if (sort != null && !sort.isBlank()) {
                String[] parts = sort.split(",");
                String field = parts[0];
                Sort.Direction dir = (parts.length > 1 && "desc".equalsIgnoreCase(parts[1]))
                        ? Sort.Direction.DESC : Sort.Direction.ASC;
                sortObj = Sort.by(dir, field);
            }
            PageRequest pageable = PageRequest.of(page, size, sortObj);
            Page<PropertyRecord> result = propertyRepository.findFiltered(filters, pageable);

            return new PageDto<>(
                    result.getContent().stream().map(this::toDto).toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements()
            );
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
