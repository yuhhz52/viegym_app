import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-20 pt-25">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-400">Page not found</p>
      <Link to="/" className="text-orange-500 underline mt-4 inline-block">
        Go Home
      </Link>
    </div>
  );
}

