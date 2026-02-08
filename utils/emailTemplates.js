
const generateInvoiceEmail = (order) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const productsHtml = order.products.map((item, index) => {
        // Calculate tax for display if needed, similar to frontend logic
        // Frontend logic: tax = (final - total + discount).
        // Here we can just use the item price as is or calculate if we want strict parity.
        // For simplicity and robustness, let's list the item price and total.
        return `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">
                <strong>${item.title}</strong>
                <div style="font-size: 12px; color: #666;">SKU: ${item.sku || 'N/A'}</div>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
        `;
    }).join('');

    // Tax Calculation Logic (Replicated from Frontend)
    const subtotal = order.totalAmount || 0;
    const discount = order.discountAmount || 0;
    const final = order.finalAmount || 0;
    const taxAmount = Math.max(0, final - subtotal + discount);

    // Address Section
    const shipping = order.shippingAddress;
    const addressHtml = shipping ? `
        <p><strong>${shipping.fullName}</strong><br>
        ${shipping.address}<br>
        ${shipping.city}, ${shipping.state} - ${shipping.postalCode}<br>
        ${shipping.country}<br>
        Phone: ${shipping.phone}</p>
    ` : 'N/A';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - Brahmakosh</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D69E2E; padding-bottom: 20px;">
        <h1 style="color: #D69E2E; margin: 0; font-size: 28px; text-transform: uppercase;">Brahmakosh</h1>
        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Management Suite</p>
    </div>

    <!-- Thank You Message -->
    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #D69E2E; margin-bottom: 30px;">
        <h2 style="margin-top: 0; color: #2D241E;">Thank You for Your Order!</h2>
        <p style="margin-bottom: 0;">We have received your order and are getting it ready. Below is your invoice.</p>
    </div>

    <!-- Order Details -->
    <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
        <tr>
            <td style="vertical-align: top; width: 50%;">
                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">Billed To:</h3>
                ${addressHtml}
            </td>
            <td style="vertical-align: top; width: 50%; text-align: right;">
                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">Invoice Details</h3>
                <p><strong>Order ID:</strong> ${order._id}<br>
                <strong>Date:</strong> ${orderDate}<br>
                <strong>Status:</strong> ${order.paymentStatus}</p>
            </td>
        </tr>
    </table>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
            <tr style="background-color: #2D241E; color: #E6DCC3;">
                <th style="padding: 10px; border: 1px solid #2D241E; width: 5%;">#</th>
                <th style="padding: 10px; border: 1px solid #2D241E; text-align: left;">Item</th>
                <th style="padding: 10px; border: 1px solid #2D241E;">Qty</th>
                <th style="padding: 10px; border: 1px solid #2D241E; text-align: right;">Price</th>
                <th style="padding: 10px; border: 1px solid #2D241E; text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${productsHtml}
        </tbody>
    </table>

    <!-- Totals -->
    <div style="float: right; width: 300px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Subtotal:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>GST (18%):</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${taxAmount > 0 ? '₹' + taxAmount.toLocaleString('en-IN') : '₹0'}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Shipping:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Free</td>
            </tr>
             <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Discount:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">-₹${discount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #2D241E; color: #E6DCC3;">
                <td style="padding: 10px; font-size: 16px;"><strong>Grand Total:</strong></td>
                <td style="padding: 10px; font-size: 16px; text-align: right;"><strong>₹${final.toLocaleString('en-IN')}</strong></td>
            </tr>
        </table>
    </div>
    <div style="clear: both;"></div>

    <!-- Footer -->
    <div style="margin-top: 50px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
        <p>If you have any questions, please contact us at support@brahmakosh.com</p>
        <p>&copy; ${new Date().getFullYear()} Brahmakosh. All rights reserved.</p>
    </div>
</body>
</html>
    `;
};

export { generateInvoiceEmail };
