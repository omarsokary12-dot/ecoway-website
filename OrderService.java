package com.ecoway.shop;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class OrderService {

    /** The whole store is priced in EGP, so the currency is a constant, not read from data. */
    public static final String CURRENCY = "EGP";

    private static final ZoneId STORE_ZONE = ZoneId.of("Africa/Cairo");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.ENGLISH);
    private static final String DIVIDER = "━━━━━━━━━━━━━━━━━━";
    /** Shipping fee added to every order, in EGP. */
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("70.00");

    private final ProductService productService;
    private final String whatsappNumber;
    private final String instapayAddress;

    public OrderService(ProductService productService,
                        @Value("${app.whatsapp.number}") String whatsappNumber,
                        @Value("${app.instapay.address}") String instapayAddress) {
        this.productService = productService;
        this.whatsappNumber = whatsappNumber;
        this.instapayAddress = instapayAddress;
    }

    public OrderResponse createOrder(OrderRequest request) {
        List<String> productBlocks = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        int pieces = 0;

        for (OrderRequest.Item item : request.items()) {
            // Prices come from the server's data; the client's prices are never trusted.
            Product product = productService.findById(item.productId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Unknown product id: " + item.productId()));

            BigDecimal lineTotal = product.price()
                    .multiply(BigDecimal.valueOf(item.quantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            total = total.add(lineTotal);
            pieces += item.quantity();

            productBlocks.add((productBlocks.size() + 1) + ". " + product.name()
                    + "\n   الكمية: " + item.quantity() + " × " + money(product.price())
                    + "\n   الإجمالي: " + money(lineTotal));
        }

        total = total.setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = total.add(SHIPPING_FEE);
        String orderId = "ECW-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        String message = buildMessage(orderId, request, productBlocks, pieces, total, grandTotal);
        return new OrderResponse(buildWhatsAppUrl(message), grandTotal, CURRENCY);
    }

    private String buildMessage(String orderId, OrderRequest request,
                                List<String> productBlocks, int pieces, BigDecimal total, BigDecimal grandTotal) {
        String now = LocalDateTime.now(STORE_ZONE).format(DATE_FORMAT);

        StringBuilder sb = new StringBuilder();
        sb.append("🛒 *طلب جديد - ECOWAY*\n");
        sb.append("🔖 رقم الطلب: ").append(orderId).append("\n");
        sb.append("📅 التاريخ: ").append(now).append("\n");
        sb.append(DIVIDER).append("\n");

        sb.append("👤 *بيانات العميل*\n");
        sb.append("الاسم: ").append(request.name()).append("\n");
        sb.append("الموبايل: ").append(request.phone()).append("\n");
        sb.append("الإيميل: ").append(request.email()).append("\n");
        sb.append("العنوان: ").append(request.address()).append("\n");
        sb.append(DIVIDER).append("\n");

        sb.append("📦 *تفاصيل الطلب (").append(productBlocks.size()).append(" منتج)*\n\n");
        sb.append(String.join("\n\n", productBlocks)).append("\n");
        sb.append(DIVIDER).append("\n");

        sb.append("🧾 *عدد القطع:* ").append(pieces).append("\n");
        sb.append("🧺 المجموع: ").append(money(total)).append("\n");
        sb.append("🚚 الشحن: ").append(money(SHIPPING_FEE)).append("\n");
        sb.append("💰 *الإجمالي النهائي: ").append(money(grandTotal)).append("*\n");
        sb.append(DIVIDER).append("\n");

        // Half is paid by InstaPay, the rest in cash on delivery
        BigDecimal instapay = grandTotal.multiply(BigDecimal.valueOf(0.5)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cod = grandTotal.subtract(instapay);
        sb.append("💳 *طريقة الدفع*\n");
        sb.append("• انستا باي (نص المبلغ): ").append(money(instapay)).append("\n");
        sb.append("  على: ").append(instapayAddress).append("\n");
        sb.append("• عند الاستلام (النص الباقي): ").append(money(cod));
        return sb.toString();
    }

    /** 1234.5 -> "1,234.50 EGP" */
    private static String money(BigDecimal amount) {
        return String.format(Locale.US, "%,.2f", amount.setScale(2, RoundingMode.HALF_UP)) + " " + CURRENCY;
    }

    private String buildWhatsAppUrl(String message) {
        String encoded = URLEncoder.encode(message, StandardCharsets.UTF_8).replace("+", "%20");
        return "https://wa.me/" + whatsappNumber + "?text=" + encoded;
    }
}
