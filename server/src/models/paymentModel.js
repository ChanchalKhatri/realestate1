class paymentModel {
  constructor(payment) {
    this.user_id = payment.user_id;
    this.property_id = payment.property_id;
    this.total_price = payment.total_price;
    this.amount_paid = payment.amount_paid;
    this.payment_method = payment.payment_method;
    this.payment_details = payment.payment_details;
    this.status = payment.status;
    this.payment_date = payment.payment_date || new Date();
    this.invoice_number = payment.invoice_number;
  }

  // Validate payment model
  validate() {
    if (
      !this.user_id ||
      !this.property_id ||
      !this.amount_paid ||
      !this.payment_method ||
      !this.payment_details ||
      !this.status
    ) {
      return {
        valid: false,
        message: "All payment fields are required",
      };
    }

    // Validate payment method
    const validMethods = ["credit_card", "upi"];
    if (!validMethods.includes(this.payment_method)) {
      return {
        valid: false,
        message: "Only credit card and UPI payments are accepted",
      };
    }

    // Validate payment details based on method
    if (this.payment_method === "credit_card") {
      const { card_holder, card_number, expiry_date, cvv } =
        this.payment_details;
      if (!card_holder || !card_number || !expiry_date || !cvv) {
        return {
          valid: false,
          message: "All credit card details are required",
        };
      }
    } else if (this.payment_method === "upi") {
      const { upi_id } = this.payment_details;
      if (!upi_id) {
        return {
          valid: false,
          message: "UPI ID is required for UPI payments",
        };
      }
    }

    return { valid: true };
  }
}

export default paymentModel;
