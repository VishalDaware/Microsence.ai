import {
  EnvelopeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

export default function ContactPage({ onMailSent }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' or 'error'
  const [statusMessage, setStatusMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // Validate form
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        setStatus("error");
        setStatusMessage("All fields are required");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setStatus("error");
        setStatusMessage("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Send email
      const response = await fetch(`${API_BASE_URL}/contact/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...formData,
        }),
      });

      // Check if response is valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setStatus("error");
        setStatusMessage("Server error: Invalid response. Please check that the backend is running.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setStatusMessage(data.message || "Message sent successfully! We'll get back to you soon.");
        
        // Add to sent mails in topbar
        if (onMailSent) {
          onMailSent(formData.name, formData.email, formData.message);
        }
        
        setFormData({ name: "", email: "", message: "" });

        // Clear message after 5 seconds
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus("error");
        setStatusMessage(data.error || "Failed to send message");
      }
    } catch (err) {
      console.error('Error:', err);
      setStatus("error");
      setStatusMessage(`An error occurred: ${err.message || 'Please ensure the backend is running on http://localhost:5000'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-6 py-10">

      {/* Page Header */}
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-semibold text-[#3E5F44] flex items-center justify-center gap-2">
          <EnvelopeIcon className="w-8 h-8 text-[#5E936C]" />
          Contact Us
        </h1>
        <p className="text-[#5E936C] mt-3 text-sm md:text-base">
          Have questions, suggestions, or need support? Send us a message and our team will respond soon.
        </p>
      </div>

      {/* Contact Form Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#93DA97]/40 p-8">

        <h2 className="text-lg font-semibold text-[#3E5F44] mb-6 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#5E936C]" />
          Send a Message
        </h2>

        {/* Status Messages */}
        {status === "success" && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-800 text-sm font-medium">{statusMessage}</p>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm font-medium">{statusMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Your Name
            </label>
            <div className="flex items-center gap-3 border border-[#93DA97] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#5E936C] transition">
              <UserIcon className="w-5 h-5 text-[#5E936C]" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="flex-1 outline-none text-[#3E5F44] placeholder:text-[#5E936C]/60 disabled:bg-gray-50"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Your Email
            </label>
            <div className="flex items-center gap-3 border border-[#93DA97] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#5E936C] transition">
              <EnvelopeIcon className="w-5 h-5 text-[#5E936C]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="flex-1 outline-none text-[#3E5F44] placeholder:text-[#5E936C]/60 disabled:bg-gray-50"
                disabled={loading}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Message
            </label>
            <div className="flex items-start gap-3 border border-[#93DA97] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#5E936C] transition">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#5E936C] mt-1" />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                placeholder="Write your message here..."
                className="flex-1 outline-none text-[#3E5F44] placeholder:text-[#5E936C]/60 resize-none disabled:bg-gray-50"
                disabled={loading}
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3E5F44] hover:bg-[#2f4734] disabled:bg-gray-400 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

    </div>
  );
}
