import {
  EnvelopeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

export default function ContactPage() {
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

        <form className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Your Name
            </label>
            <div className="flex items-center gap-3 border border-[#93DA97] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#5E936C] transition">
              <UserIcon className="w-5 h-5 text-[#5E936C]" />
              <input
                type="text"
                placeholder="Enter your name"
                className="flex-1 outline-none text-[#3E5F44] placeholder:text-[#5E936C]/60"
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
                placeholder="Enter your email"
                className="flex-1 outline-none text-[#3E5F44] placeholder:text-[#5E936C]/60"
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
                rows="5"
                placeholder="Write your message here..."
                className="flex-1 outline-none text-[#3E5F44] placeholder:text-[#5E936C]/60 resize-none"
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#3E5F44] hover:bg-[#2f4734] text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            Send Message
          </button>
        </form>
      </div>

    </div>
  );
}
