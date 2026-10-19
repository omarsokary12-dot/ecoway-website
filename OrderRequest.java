package com.ecoway.shop;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OrderRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Pattern(regexp = "^\\+?[0-9 ]{8,20}$") String phone,
        @NotBlank @Size(max = 300) String address,
        @NotEmpty @Size(max = 50) List<@NotNull @Valid Item> items
) {
    public record Item(
            @NotNull Integer productId,
            @Min(1) @Max(50) int quantity
    ) {}
}
