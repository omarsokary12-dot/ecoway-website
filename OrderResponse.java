package com.ecoway.shop;

import java.math.BigDecimal;

/** Returned to the frontend: the WhatsApp link that opens the prefilled order message. */
public record OrderResponse(String whatsappUrl, BigDecimal total, String currency) {}
