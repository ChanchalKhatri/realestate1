import Apartment from "../models/Apartment.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/apartments");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });

// Get all apartments
export const getAllApartments = async (req, res) => {
  try {
    const apartments = await Apartment.findAll();
    res.status(200).json({ success: true, data: apartments });
  } catch (error) {
    console.error("Error fetching apartments:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch apartments" });
  }
};

// Get a single apartment by ID
export const getApartmentById = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      return res
        .status(404)
        .json({ success: false, message: "Apartment not found" });
    }

    res.status(200).json({ success: true, data: apartment });
  } catch (error) {
    console.error("Error fetching apartment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch apartment" });
  }
};

// Get apartment units by apartment ID
export const getApartmentUnits = async (req, res) => {
  try {
    const apartmentId = req.query.apartment_id;

    if (!apartmentId) {
      return res.status(400).json({
        success: false,
        message: "apartment_id query parameter is required",
      });
    }

    const units = await Apartment.getApartmentUnits(apartmentId);

    res.status(200).json({ success: true, data: units });
  } catch (error) {
    console.error("Error fetching apartment units:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch apartment units",
    });
  }
};

// Create a new apartment
export const createApartment = async (req, res) => {
  try {
    const apartmentData = req.body;

    // Handle multi-unit properties
    const isMultiUnit = req.body.isMultiUnit === "true";
    let floorProperties = [];

    if (isMultiUnit && req.body.floorProperties) {
      floorProperties = JSON.parse(req.body.floorProperties);
    }

    // Set owner_id and owner_type from authenticated user
    if (req.user) {
      apartmentData.owner_id = req.user.id;
      // Set owner_type based on user role
      apartmentData.owner_type =
        req.user.role === "seller" ? "seller" : "admin";
    } else {
      // Default values if not authenticated
      apartmentData.owner_id = null;
      apartmentData.owner_type = "admin";
    }

    // Create apartment in database
    const apartmentId = await Apartment.create(
      apartmentData,
      isMultiUnit,
      floorProperties
    );

    // Handle image uploads
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const relativePath = `uploads/apartments/${path.basename(file.path)}`;
        imagePaths.push(relativePath);
      }

      await Apartment.addImages(apartmentId, imagePaths);
    }

    res.status(201).json({
      success: true,
      message: "Apartment created successfully",
      data: { id: apartmentId },
    });
  } catch (error) {
    console.error("Error creating apartment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create apartment" });
  }
};

// Update an existing apartment
export const updateApartment = async (req, res) => {
  try {
    const apartmentId = req.params.id;
    const apartmentData = req.body;

    // Check if apartment exists
    const existingApartment = await Apartment.findById(apartmentId);
    if (!existingApartment) {
      return res
        .status(404)
        .json({ success: false, message: "Apartment not found" });
    }

    // Check if the user is authorized to modify this apartment
    if (req.user && req.user.role !== "admin") {
      // Only owner or admin can modify
      if (existingApartment.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to modify this apartment",
        });
      }
    }

    // Preserve the existing owner_id and owner_type
    apartmentData.owner_id = existingApartment.owner_id;
    apartmentData.owner_type = existingApartment.owner_type;

    // Handle multi-unit properties
    const isMultiUnit = req.body.isMultiUnit === "true";
    let floorProperties = [];

    if (isMultiUnit && req.body.floorProperties) {
      floorProperties = JSON.parse(req.body.floorProperties);
    }

    // Update apartment in database
    await Apartment.update(
      apartmentId,
      apartmentData,
      isMultiUnit,
      floorProperties
    );

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imagePaths = [];
      for (const file of req.files) {
        const relativePath = `uploads/apartments/${path.basename(file.path)}`;
        imagePaths.push(relativePath);
      }

      await Apartment.addImages(apartmentId, imagePaths);
    }

    res.status(200).json({
      success: true,
      message: "Apartment updated successfully",
    });
  } catch (error) {
    console.error("Error updating apartment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update apartment" });
  }
};

// Delete an apartment
export const deleteApartment = async (req, res) => {
  try {
    const apartmentId = req.params.id;

    // Check if apartment exists
    const existingApartment = await Apartment.findById(apartmentId);
    if (!existingApartment) {
      return res
        .status(404)
        .json({ success: false, message: "Apartment not found" });
    }

    // Delete images from filesystem
    if (existingApartment.images && existingApartment.images.length > 0) {
      for (const image of existingApartment.images) {
        const imagePath = path.join(__dirname, "../..", image.image_path);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // Delete apartment from database
    await Apartment.delete(apartmentId);

    res
      .status(200)
      .json({ success: true, message: "Apartment deleted successfully" });
  } catch (error) {
    console.error("Error deleting apartment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete apartment" });
  }
};

// Book an apartment unit
export const bookApartment = async (req, res) => {
  try {
    console.log("Apartment booking request received:", req.body);

    const {
      user_id,
      property_id,
      unit_id,
      total_price,
      amount_paid,
      payment_method,
      payment_details,
      status,
      property_name,
    } = req.body;

    // Check all required fields
    if (
      !user_id ||
      !property_id ||
      !unit_id ||
      !amount_paid ||
      !payment_method ||
      !payment_details
    ) {
      console.log("Missing required fields", {
        user_id,
        property_id,
        unit_id,
        amount_paid,
        payment_method,
        payment_details,
      });
      return res.status(400).json({
        success: false,
        message: "All booking fields are required",
      });
    }

    // Validate payment method
    const validMethods = ["credit_card", "card", "upi"];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: "Only credit card and UPI payments are accepted",
      });
    }

    // Validate payment details based on method
    if (payment_method === "credit_card" || payment_method === "card") {
      if (
        !payment_details.card_holder ||
        !payment_details.card_number ||
        !payment_details.expiry_date ||
        !payment_details.cvv
      ) {
        return res.status(400).json({
          success: false,
          message: "All credit card details are required",
        });
      }
    } else if (payment_method === "upi") {
      if (!payment_details.upi_id) {
        return res.status(400).json({
          success: false,
          message: "UPI ID is required for UPI payments",
        });
      }
    }

    // Create a transaction to ensure both booking and payment are created together
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // First, insert the payment record
      const [paymentResult] = await connection.query(
        `INSERT INTO payments (
          user_id, 
          property_id, 
          total_price, 
          amount_paid, 
          payment_method, 
          payment_details, 
          status, 
          payment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          user_id,
          property_id,
          total_price || amount_paid,
          amount_paid,
          payment_method === "card" ? "credit_card" : payment_method,
          JSON.stringify(payment_details),
          "completed",
        ]
      );

      const paymentId = paymentResult.insertId;

      // Check if unit_id starts with "fallback-" which indicates it's a demo unit
      const isFallbackUnit = unit_id.toString().startsWith("fallback-");

      if (isFallbackUnit) {
        // For fallback units (demo data), don't try to update the database unit status
        // Just create the booking record with a note

        const [bookingResult] = await connection.query(
          `INSERT INTO apartment_bookings (
            user_id,
            apartment_id,
            unit_id,
            payment_id,
            booking_date,
            amount,
            status,
            notes
          ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`,
          [
            user_id,
            property_id,
            unit_id.replace("fallback-", ""), // Store without the fallback prefix
            paymentId,
            amount_paid,
            "confirmed",
            "Demo booking - Unit is a fallback demo unit",
          ]
        );
      } else {
        // For real units, first check if the unit exists and is available
        const [unitResult] = await connection.query(
          `SELECT * FROM apartment_units WHERE id = ? AND status = 'available'`,
          [unit_id]
        );

        if (unitResult.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Unit is not available for booking",
          });
        }

        // Next, create the apartment booking
        const [bookingResult] = await connection.query(
          `INSERT INTO apartment_bookings (
            user_id,
            apartment_id,
            unit_id,
            payment_id,
            booking_date,
            amount,
            status
          ) VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
          [user_id, property_id, unit_id, paymentId, amount_paid, "confirmed"]
        );

        // Update the unit status to booked
        await connection.query(
          `UPDATE apartment_units SET status = 'booked' WHERE id = ?`,
          [unit_id]
        );
      }

      // Generate a simple invoice reference
      const invoiceNumber = `APT-${property_id}-${Math.floor(
        Date.now() / 1000
      )}`;

      // Update payment record with invoice number
      await connection.query(
        `UPDATE payments SET invoice_number = ? WHERE id = ?`,
        [invoiceNumber, paymentId]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Apartment booked successfully",
        data: {
          payment_id: paymentId,
          invoice_number: invoiceNumber,
        },
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error in transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process booking",
        error: error.message,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Apartment booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing apartment booking",
      error: error.message,
    });
  }
};

// Get all booked apartments for a user
export const getUserBookedApartments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get all bookings for the user with apartment and unit details
    const connection = await pool.getConnection();

    try {
      // Query to join apartment_bookings with apartments and apartment_units tables
      const [bookings] = await connection.query(
        `
        SELECT 
          ab.id as booking_id,
          ab.apartment_id,
          ab.unit_id,
          ab.payment_id,
          ab.booking_date,
          ab.amount,
          ab.status as booking_status,
          ab.notes,
          
          a.name,
          a.location,
          a.description,
          a.amenities,
          
          au.unit_number,
          au.floor_number,
          au.price,
          au.bedrooms,
          au.bathrooms,
          au.area,
          
          p.invoice_number,
          p.payment_method,
          p.status as payment_status,
          
          (SELECT image_path FROM apartment_images 
           WHERE apartment_id = a.id 
           ORDER BY is_primary DESC, id ASC 
           LIMIT 1) as image
           
        FROM apartment_bookings ab
        LEFT JOIN apartments a ON ab.apartment_id = a.id
        LEFT JOIN apartment_units au ON ab.unit_id = au.id
        LEFT JOIN payments p ON ab.payment_id = p.id
        WHERE ab.user_id = ?
        ORDER BY ab.booking_date DESC
      `,
        [userId]
      );

      // If no bookings found, return empty array
      if (bookings.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No booked apartments found for this user",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching user's booked apartments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching booked apartments",
      error: error.message,
    });
  }
};
