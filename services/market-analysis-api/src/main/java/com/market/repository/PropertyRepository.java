package com.market.repository;

import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PropertyRepository {

    void loadDataset(String csvPath);

    List<PropertyRecord> findAll();

    PropertyRecord findById(long id);

    Page<PropertyRecord> findFiltered(FilterParams filters, Pageable pageable);

    List<PropertyRecord> findFiltered(FilterParams filters);

    boolean isLoaded();
}
