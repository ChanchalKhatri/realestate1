import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CreditCard,
  Check,
  DollarSign,
  AlertCircle,
  Wallet,
} from "lucide-react";

const PaymentForm = ({
  propertyId,
  userId,
  propertyPrice,
  propertyName,
  isApartment = false,
  unitId = null,
  onSuccess = () => {},
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);

  const [formData, setFormData] = useState({
    amount_paid: "",
    payment_method: "credit_card",
    payment_details: {
      card_holder: "",
      card_number: "",
      expiry_date: "",
      cvv: "",
      upi_id: "",
    },
  });

  // Automatically set the payment amount to the property price
  useEffect(() => {
    if (propertyPrice) {
      setFormData((prev) => ({
        ...prev,
        amount_paid: propertyPrice.toString(),
      }));
    }
  }, [propertyPrice]);

  // Fetch existing payment summary if any
  useEffect(() => {
    if (propertyId && userId) {
      const fetchPaymentSummary = async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/payment/check?user_id=${userId}&property_id=${propertyId}`
          );

          if (response.data.success && response.data.data) {
            setPaymentSummary(response.data.data.payment_summary);
          }
        } catch (error) {
          console.error("Error fetching payment summary:", error);
        }
      };

      fetchPaymentSummary();
    }
  }, [propertyId, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      payment_details: {
        ...formData.payment_details,
        [name]: value,
      },
    });
  };

  // Validate payment form based on payment method
  const validateForm = () => {
    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      setError("Please enter a valid payment amount");
      return false;
    }

    // Validate based on payment method
    if (formData.payment_method === "credit_card") {
      if (!formData.payment_details.card_holder.trim()) {
        setError("Card holder name is required");
        return false;
      }
      if (
        !formData.payment_details.card_number.trim() ||
        formData.payment_details.card_number.length < 16
      ) {
        setError("Please enter a valid card number");
        return false;
      }
      if (
        !formData.payment_details.expiry_date.trim() ||
        !formData.payment_details.expiry_date.includes("/")
      ) {
        setError("Please enter a valid expiry date (MM/YY)");
        return false;
      }
      if (
        !formData.payment_details.cvv.trim() ||
        formData.payment_details.cvv.length < 3
      ) {
        setError("Please enter a valid CVV");
        return false;
      }
    } else if (formData.payment_method === "upi") {
      if (
        !formData.payment_details.upi_id.trim() ||
        !formData.payment_details.upi_id.includes("@")
      ) {
        setError("Please enter a valid UPI ID");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare payment details based on selected payment method
      // Initialize all possible fields with null to avoid undefined values
      const paymentDetailsToSend = {
        card_holder: null,
        card_number: null,
        expiry_date: null,
        cvv: null,
        upi_id: null,
      };

      if (formData.payment_method === "credit_card") {
        paymentDetailsToSend.card_holder = formData.payment_details.card_holder;
        paymentDetailsToSend.card_number = formData.payment_details.card_number;
        paymentDetailsToSend.expiry_date = formData.payment_details.expiry_date;
        paymentDetailsToSend.cvv = formData.payment_details.cvv;
      } else if (formData.payment_method === "upi") {
        paymentDetailsToSend.upi_id = formData.payment_details.upi_id;
      }

      const paymentData = {
        user_id: userId,
        property_id: propertyId,
        total_price: propertyPrice,
        amount_paid: parseFloat(formData.amount_paid),
        payment_method: formData.payment_method,
        payment_details: paymentDetailsToSend,
        status: "completed",
        is_apartment: isApartment,
        unit_id: unitId,
        property_name: propertyName,
      };

      console.log("Submitting payment data:", paymentData);

      const endpoint = isApartment
        ? "http://localhost:3000/api/apartments/bookings"
        : "http://localhost:3000/api/payment";

      const response = await axios.post(endpoint, paymentData);

      if (response.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          amount_paid: "",
          payment_method: "credit_card",
          payment_details: {
            card_holder: "",
            card_number: "",
            expiry_date: "",
            cvv: "",
            upi_id: "",
          },
        });

        // Call onSuccess callback
        onSuccess();

        // Redirect to my apartments page if this is an apartment booking
        if (isApartment) {
          setTimeout(() => {
            window.location.href =
              "http://localhost:5173/dashboard/my-apartments";
          }, 1500); // Short delay to show success message before redirecting
        }

        // Refresh payment summary if not an apartment booking
        if (!isApartment && userId) {
          const summaryResponse = await axios.get(
            `http://localhost:3000/api/payment/check?user_id=${userId}&property_id=${propertyId}`
          );
          if (summaryResponse.data.success && summaryResponse.data.data) {
            setPaymentSummary(summaryResponse.data.data.payment_summary);
          }
        }
      } else {
        setError(response.data.message || "Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(
        err.response?.data?.message ||
          "Payment processing failed. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      {paymentSummary && (
        <div className="mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">
            Payment Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Property Price:</div>
            <div className="text-right font-medium">
              {formatCurrency(paymentSummary.full_property_price)}
            </div>

            <div className="text-gray-600">Required Deposit (10%):</div>
            <div className="text-right font-medium">
              {formatCurrency(paymentSummary.deposit_amount)}
            </div>

            <div className="text-gray-600">Amount Paid:</div>
            <div className="text-right font-medium text-green-600">
              {formatCurrency(paymentSummary.total_paid)}
            </div>

            <div className="text-gray-600">Pending Amount:</div>
            <div className="text-right font-medium text-amber-600">
              {formatCurrency(paymentSummary.pending_amount)}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Payment Progress</span>
              <span className="text-xs font-medium">
                {paymentSummary.percentage_paid}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${paymentSummary.percentage_paid}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Make a Payment
      </h2>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>Payment successful! Invoice has been generated.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="amount_paid"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="amount_paid"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <input
                type="radio"
                id="credit_card"
                name="payment_method"
                value="credit_card"
                checked={formData.payment_method === "credit_card"}
                onChange={handleChange}
                className="sr-only"
              />
              <label
                htmlFor="credit_card"
                className={`block p-2 sm:p-3 border rounded-md text-center cursor-pointer ${
                  formData.payment_method === "credit_card"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1" />
                <span className="text-xs sm:text-sm">Credit Card</span>
              </label>
            </div>
            <div>
              <input
                type="radio"
                id="upi"
                name="payment_method"
                value="upi"
                checked={formData.payment_method === "upi"}
                onChange={handleChange}
                className="sr-only"
              />
              <label
                htmlFor="upi"
                className={`block p-2 sm:p-3 border rounded-md text-center cursor-pointer ${
                  formData.payment_method === "upi"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Wallet className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1" />
                <span className="text-xs sm:text-sm">UPI</span>
              </label>
            </div>
          </div>
        </div>

        {formData.payment_method === "credit_card" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="card_holder"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Card Holder Name
              </label>
              <input
                type="text"
                id="card_holder"
                name="card_holder"
                value={formData.payment_details.card_holder}
                onChange={handleDetailsChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label
                htmlFor="card_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Card Number
              </label>
              <input
                type="text"
                id="card_number"
                name="card_number"
                value={formData.payment_details.card_number}
                onChange={handleDetailsChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="XXXX XXXX XXXX XXXX"
                maxLength="19"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expiry_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiry_date"
                  name="expiry_date"
                  value={formData.payment_details.expiry_date}
                  onChange={handleDetailsChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="cvv"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={formData.payment_details.cvv}
                  onChange={handleDetailsChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123"
                  maxLength="4"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {formData.payment_method === "upi" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="upi_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                UPI ID
              </label>
              <input
                type="text"
                id="upi_id"
                name="upi_id"
                value={formData.payment_details.upi_id}
                onChange={handleDetailsChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="yourname@upi"
                required
              />
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 rounded-md text-blue-700 text-xs sm:text-sm">
              Please complete your UPI payment through your UPI app using the ID
              above. Your payment will be confirmed once processed.
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mt-4"
          disabled={loading}
        >
          {loading ? "Processing..." : "Complete Payment"}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
