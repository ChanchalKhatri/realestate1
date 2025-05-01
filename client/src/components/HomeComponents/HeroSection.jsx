import React from "react";
import { Search } from "react-feather";
import { motion } from "framer-motion";

const { div: MotionDiv, section: MotionSection } = motion;

const Hero = () => {
  return (
    <MotionSection
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="h-[calc(100vh-65px)] bg-gradient-to-r from-blue-100 to-amber-100 flex items-center justify-center px-4"
    >
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="max-w-screen-xl mx-auto w-full text-center space-y-10"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 leading-tight">
          Your <span className="text-amber-500">Dream Home</span> Awaits
        </h1>
        <p className="text-lg md:text-xl text-blue-800 font-medium">
          Browse the best properties tailored to your lifestyle and budget.
        </p>

        {/* <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white p-8 rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
        >
          <input
            type="text"
            placeholder="🔍 Location (e.g., New York)"
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-blue-900 placeholder:text-blue-400"
          />
          <select className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-blue-900">
            <option>🏢 Property Type</option>
            <option>Apartments</option>
            <option>Villas</option>
            <option>Commercial Spaces</option>
            <option>Lands/Plots</option>
          </select>
          <select className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-blue-900">
            <option>💰 Price Range</option>
            <option>$500 - $1,000</option>
            <option>$1,000 - $5,000</option>
            <option>$5,000 - $10,000</option>
            <option>$10,000+</option>
          </select>
          <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-6 rounded-xl font-semibold hover:scale-105 transition-transform cursor-pointer">
            <Search size={18} /> Find Your Home
          </button>
        </MotionDiv> */}
      </MotionDiv>
    </MotionSection>
  );
};

export default Hero;
