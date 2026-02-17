import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <div className="flex items-center justify-center h-[80px] border-b border-gray-100 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-blue-500 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                VieGym
              </div>
            </div>
          </Link>
        </div>
  )
}