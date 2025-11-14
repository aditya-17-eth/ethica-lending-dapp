import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Breadcrumb = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  // Map breadcrumb items to routes
  const getRouteForItem = (item, index) => {
    const itemLower = item.toLowerCase();
    
    // First item is always Home
    if (index === 0 || itemLower === 'home') {
      return '/';
    }
    
    // Map dashboard names to routes
    if (itemLower.includes('lender')) {
      return '/lender';
    }
    if (itemLower.includes('borrower')) {
      return '/borrower';
    }
    if (itemLower.includes('liquidation')) {
      return '/liquidation';
    }
    
    // Default: no link for unknown items
    return null;
  };

  return (
    <nav className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm max-w-7xl mx-auto overflow-x-auto">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const route = getRouteForItem(item, index);

          return (
            <li key={index} className="flex items-center flex-shrink-0">
              {index > 0 && (
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-1 sm:mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none" aria-current="page">
                  {item}
                </span>
              ) : route ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={route}
                    className="text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap"
                  >
                    {item}
                  </Link>
                </motion.div>
              ) : (
                <span className="text-gray-600 whitespace-nowrap">{item}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
