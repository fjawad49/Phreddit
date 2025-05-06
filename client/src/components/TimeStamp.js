export default function TimeStamp (timestamp) {
    const date = new Date(timestamp); //convert input to Date object
    const now = new Date();

    const diffInSeconds = Math.floor((now - date) / 1000);
  
    if (diffInSeconds < 60) {
        return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
    }
  
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    }
  
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    }
  
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }
  
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const timestampYear = date.getFullYear();
    const timestampMonth = date.getMonth();
  
    const diffInYears = nowYear - timestampYear;
    const diffInMonths = nowMonth - timestampMonth + diffInYears * 12;
  
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
    }
  
    return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
  };