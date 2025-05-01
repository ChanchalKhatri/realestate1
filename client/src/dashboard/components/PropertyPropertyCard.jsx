import React, { useEffect, useState } from "react";
import {
  MapPin,
  IndianRupee,
  Bed,
  Bath,
  Ruler,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FaWallet } from "react-icons/fa";
import { SiPhonepe, SiMobx } from "react-icons/si";

const TextInput = ({ type = "text", placeholder, value, onChange }) => (
  <input
    type={type}
    placeholder={placeholder}
    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={value}
    onChange={onChange}
    required
  />
);

const MyPropertyCard = ({ property }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [method, setMethod] = useState("card");
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [propertyImages, setPropertyImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const user_id = localStorage.getItem("userId");
  const property_id = property.id;

  const paymentAmount = Math.round(property.price * 0.1);

  useEffect(() => {
    const fetchPaymentProp = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/payment/check?user_id=${user_id}&property_id=${property_id}`
        );
        const result = await response.json();
        setIsPaid(result.success);
      } catch (error) {
        console.error("Error fetching payment info:", error);
      }
    };

    if (user_id && property_id) {
      fetchPaymentProp();
    }

    // Fetch property images
    if (property.id) {
      fetchPropertyImages(property.id);
    }
  }, [user_id, property_id, property.id]);

  const fetchPropertyImages = async (propertyId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/properties/${propertyId}/images`
      );
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setPropertyImages(result.data);
      }
    } catch (error) {
      console.error("Error fetching property images:", error);
    }
  };

  const formatCurrency = (amount) => amount.toLocaleString("en-IN");

  const handlePayment = () => {
    setShowPayment(true);
    setMethod("card");
    setForm({});
    setError("");
    setSuccess("");
  };

  // Handle image path - add server base URL if it's a server path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // Check if the image path is a full URL
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // Otherwise, prepend the server base URL
    return `http://localhost:3000/${imagePath}`;
  };

  // Create array of all available property images
  const getAllImages = () => {
    let images = [];

    // First add the primary image if it exists
    const primaryImage = property.image
      ? { image_path: property.image, is_primary: true }
      : null;

    // Then add all property images
    if (propertyImages.length > 0) {
      images = [...propertyImages];
    } else if (primaryImage) {
      images = [primaryImage];
    }

    // Limit to 5 images
    return images.slice(0, 5);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (getAllImages().length > 0) {
      setCurrentImageIndex((prev) =>
        prev === getAllImages().length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (getAllImages().length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? getAllImages().length - 1 : prev - 1
      );
    }
  };

  // Determine which image to display
  const getCurrentImage = () => {
    const images = getAllImages();
    // If property images are loaded and there are some
    if (images.length > 0) {
      return getImageUrl(images[currentImageIndex].image_path);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate based on payment method
    if (method === "card") {
      if (!form.cardNumber || !form.expiry || !form.cvv) {
        return setError("Please fill all card details.");
      }
    } else if (method === "upi") {
      if (!form.upiId || !form.upiId.includes("@")) {
        return setError("Please enter a valid UPI ID.");
      }
    }

    // Prepare payment details based on selected method
    // Initialize all possible fields with null to avoid undefined values
    const paymentDetails = {
      card_number: null,
      expiry_date: null,
      cvv: null,
      card_holder: null,
      upi_id: null,
    };

    if (method === "card") {
      paymentDetails.card_number = form.cardNumber;
      paymentDetails.expiry_date = form.expiry;
      paymentDetails.cvv = form.cvv;
      paymentDetails.card_holder = form.cardHolder || "Card Holder";
    } else if (method === "upi") {
      paymentDetails.upi_id = form.upiId;
    }

    const paymentData = {
      user_id,
      property_id,
      amount_paid: paymentAmount,
      payment_method: method,
      payment_details: paymentDetails,
      status: "paid",
    };

    try {
      const response = await fetch("http://localhost:3000/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Payment successful 🎉");
        setIsPaid(true);
        setShowPayment(false);
      } else {
        setError(data.message || "Payment failed");
      }
    } catch (err) {
      setError("Network error during payment");
      console.error("Payment error:", err);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl flex flex-col">
        <div className="relative">
          {property.image || propertyImages.length > 0 ? (
            <div className="relative">
              <img
                src={getCurrentImage()}
                alt={property.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  console.error("Error loading property image");
                  e.target.onerror = null;
                  e.target.src = "";
                  e.target.parentNode.innerHTML = `
                    <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-400" />
                    </div>
                  `;
                }}
              />

              {/* Navigation arrows - only show if multiple images */}
              {getAllImages().length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                    {currentImageIndex + 1} / {getAllImages().length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <ImageIcon size={48} className="text-gray-400" />
            </div>
          )}
          {property.tag && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {property.tag}
            </span>
          )}
        </div>

        <div className="p-4 flex-grow">
          <h2 className="text-lg font-semibold text-gray-900">
            {property.name}
          </h2>
          <p className="text-gray-500 flex items-center gap-1 text-sm">
            <MapPin size={14} /> {property.location}
          </p>
          <p className="text-blue-500 flex items-center gap-1 font-semibold mt-2">
            <IndianRupee size={16} /> ₹{formatCurrency(property.price)}
          </p>
          <div className="flex justify-between mt-3 text-gray-600 text-sm border-t pt-4">
            <span className="flex items-center gap-1">
              <Bed size={14} /> {property.bedrooms} Beds
            </span>
            <span className="flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms} Baths
            </span>
            <span className="flex items-center gap-1">
              <Ruler size={14} /> {property.area} sq.ft
            </span>
          </div>
        </div>

        <div className="p-4 pt-0 flex justify-end">
          {!isPaid && (
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg shadow-md transition-all"
            >
              Pay 10% Now
            </button>
          )}
          {isPaid && (
            <p className="text-green-600 font-semibold text-sm">
              Payment Completed ✅
            </p>
          )}
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
              onClick={() => setShowPayment(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Make Payment</h2>

            <div className="flex gap-2 mb-4 flex-wrap">
              {["card", "upi"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMethod(m);
                    setForm({});
                    setError("");
                    setSuccess("");
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium border transition-all ${
                    method === m
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {
                    {
                      card: "Credit Card",
                      upi: "UPI",
                    }[m]
                  }
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {method === "card" && (
                <>
                  <TextInput
                    placeholder="Card Holder Name"
                    value={form.cardHolder || ""}
                    onChange={(e) =>
                      setForm({ ...form, cardHolder: e.target.value })
                    }
                  />
                  <TextInput
                    placeholder="Card Number"
                    value={form.cardNumber || ""}
                    onChange={(e) =>
                      setForm({ ...form, cardNumber: e.target.value })
                    }
                  />
                  <TextInput
                    placeholder="Expiry (MM/YY)"
                    value={form.expiry || ""}
                    onChange={(e) =>
                      setForm({ ...form, expiry: e.target.value })
                    }
                  />
                  <TextInput
                    placeholder="CVV"
                    value={form.cvv || ""}
                    onChange={(e) => setForm({ ...form, cvv: e.target.value })}
                  />
                </>
              )}

              {method === "upi" && (
                <>
                  <TextInput
                    placeholder="Enter UPI ID (e.g. yourname@upi)"
                    value={form.upiId || ""}
                    onChange={(e) =>
                      setForm({ ...form, upiId: e.target.value })
                    }
                  />
                  <div className="flex items-center justify-center p-3 bg-blue-50 rounded-md text-blue-700 text-sm">
                    <SiPhonepe className="mr-2" size={20} />
                    <span>Complete payment using your UPI app</span>
                  </div>
                </>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
              >
                Pay ₹{formatCurrency(paymentAmount)}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MyPropertyCard;
