import {
  EnvelopeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  UserGroupIcon,
  ClockIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

export default function ContactPage() {
  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
          <EnvelopeIcon className="w-8 h-8 text-blue-500" />
          Contact Us
        </h1>
        <p className="text-slate-600 mt-2">
          Have questions or feedback? Send us a message or check the project details below.
        </p>
      </div>

      {/* Flex Row: Form + Project Info */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Contact Form */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
            Send a Message
          </h2>
          <form className="space-y-4">
            <div className="flex items-center gap-2 border border-slate-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500">
              <UserIcon className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Your Name"
                className="flex-1 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 border border-slate-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500">
              <EnvelopeIcon className="w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 outline-none"
              />
            </div>
            <div className="flex items-start gap-2 border border-slate-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-slate-400 mt-1" />
              <textarea
                rows="4"
                placeholder="Write your message..."
                className="flex-1 outline-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RocketLaunchIcon className="w-5 h-5" />
              Send Message
            </button>
          </form>
        </div>

        {/* Project Information Section */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <CodeBracketIcon className="w-6 h-6 text-green-500" />
            Project Information
          </h2>
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-center gap-2">
              <RocketLaunchIcon className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Current Version:</span> v2.3.1 
              <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">Stable</span>
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Last Updated:</span> January 2026
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Changelog:</span> Performance improvements, new chart components, bug fixes
            </li>
            <li className="flex items-center gap-2">
              <CodeBracketIcon className="w-5 h-5 text-indigo-500" />
              <span className="font-medium">Technologies:</span> React, Tailwind CSS, Chart.js, Node.js
            </li>
            <li className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-pink-500" />
              <span className="font-medium">Contributors:</span> 8 active developers
            </li>
            {/* New Info */}
            <li className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-teal-500" />
              <span className="font-medium">License:</span> MIT Open Source
            </li>
            <li className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Issue Tracker:</span> github.com/example/project/issues
            </li>
            <li className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-red-500" />
              <span className="font-medium">Next Release:</span> v2.4 scheduled for March 2026
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
