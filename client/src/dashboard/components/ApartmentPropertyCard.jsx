import React, { useState } from "react";
import {
  MapPin,
  Bed,
  Bath,
  Ruler,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Building,
  CalendarDays,
  FileCheck,
} from "lucide-react";

const ApartmentPropertyCard = ({ booking }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Format date for better display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return amount.toLocaleString("en-IN");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(0); // For now, we only have one image
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(0); // For now, we only have one image
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl flex flex-col h-full">
      <div className="relative">
        {booking.image ? (
          <div className="relative">
            <img
              src={getImageUrl(booking.image)}
              alt={booking.name}
              className="w-full h-40 sm:h-48 object-cover"
              onError={(e) => {
                console.error("Error loading apartment image");
                e.target.onerror = null;
                e.target.src = "";
                e.target.parentNode.innerHTML = `
                  <div class="w-full h-40 sm:h-48 bg-gray-200 flex items-center justify-center">
                    <Building size={48} className="text-gray-400" />
                  </div>
                `;
              }}
            />
          </div>
        ) : (
          <div className="w-full h-40 sm:h-48 bg-gray-200 flex items-center justify-center">
            <Building size={48} className="text-gray-400" />
          </div>
        )}
        <span
          className={`absolute top-2 left-2 ${getStatusColor(
            booking.booking_status
          )} text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full`}
        >
          {booking.booking_status.charAt(0).toUpperCase() +
            booking.booking_status.slice(1)}
        </span>
      </div>

      <div className="p-3 sm:p-4 flex-grow">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <Building size={16} className="mr-2 flex-shrink-0" /> 
          <span className="truncate">{booking.name}</span>
        </h2>
        <p className="text-gray-500 flex items-center gap-1 text-xs sm:text-sm mt-1">
          <MapPin size={14} className="flex-shrink-0" /> 
          <span className="truncate">{booking.location}</span>
        </p>
        <p className="text-blue-500 flex items-center gap-1 font-semibold mt-2 text-sm">
          Unit {booking.unit_number} • Floor {booking.floor_number}
        </p>
        <div className="flex justify-between mt-2 text-gray-600 text-xs sm:text-sm">
          <span className="flex items-center gap-1">
            <Bed size={14} className="flex-shrink-0" /> {booking.bedrooms} BR
          </span>
          <span className="flex items-center gap-1">
            <Bath size={14} className="flex-shrink-0" /> {booking.bathrooms} BA
          </span>
          <span className="flex items-center gap-1">
            <Ruler size={14} className="flex-shrink-0" /> {booking.area} ft²
          </span>
        </div>

        <div className="mt-3 sm:mt-4 pt-2 border-t border-gray-100">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Booking Date:</span>
            <span className="flex items-center">
              <CalendarDays size={14} className="mr-1 flex-shrink-0" />
              {formatDate(booking.booking_date)}
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm mt-1">
            <span className="text-gray-500">Amount Paid:</span>
            <span className="text-green-600 font-medium">
              ₹{formatCurrency(booking.amount)}
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm mt-1">
            <span className="text-gray-500">Invoice:</span>
            <span className="flex items-center truncate ml-2">
              <FileCheck size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{booking.invoice_number || "Not Available"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentPropertyCard;
