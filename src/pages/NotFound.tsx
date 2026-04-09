import { Link } from "wouter";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#F7F6F2" }}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <span className="text-3xl" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          404
        </span>
      </div>
      <h1
        className="text-[28px] font-bold text-gray-900 mb-2"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        Page Not Found
      </h1>
      <p
        className="text-[14px] text-gray-500 mb-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        The persona you're looking for doesn't exist in the library.
      </p>
      <Link href="/">
        <button
          className="text-[13px] font-medium px-5 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Back to Library
        </button>
      </Link>
    </div>
  );
}
