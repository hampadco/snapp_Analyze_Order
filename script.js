// Persian month names
const persianMonths = {
    'January': 'فروردین',
    'February': 'اردیبهشت',
    'March': 'خرداد',
    'April': 'تیر',
    'May': 'مرداد',
    'June': 'شهریور',
    'July': 'مهر',
    'August': 'آبان',
    'September': 'آذر',
    'October': 'دی',
    'November': 'بهمن',
    'December': 'اسفند'
};

// Service name translations
const serviceNames = {
    'food': 'سرویس غذا',
    'shop': 'فروشگاه',
    'cab': 'تاکسی',
    'market': 'هایپرمارکت'
};

// Function to convert Gregorian year to Persian/Shamsi year
function toShamsiYear(gregorianYear) {
    return Math.floor(gregorianYear - 621.5);
}

// Function to convert numbers to Persian digits
function toPersianDigits(n) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.toString().replace(/\d/g, function(d) {
        return persianDigits[parseInt(d)];
    });
}

// Function to convert English month names to Persian
function toPersianMonth(englishDate) {
    for (const [englishMonth, persianMonth] of Object.entries(persianMonths)) {
        if (englishDate.includes(englishMonth)) {
            return englishDate.replace(englishMonth, persianMonth);
        }
    }
    return englishDate;
}

// Function to format numbers with commas
function formatNumber(num) {
    return toPersianDigits(num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
}

// Function to convert Gregorian dates to Persian
function toPersianDate(date) {
    const parts = date.split(' ');
    if (parts.length >= 3) {
        const month = persianMonths[parts[0]] || parts[0];
        const day = toPersianDigits(parts[1].replace(',', ''));
        const gregorianYear = parseInt(parts[2]);
        const persianYear = toShamsiYear(gregorianYear);
        return `${day} ${month} ${toPersianDigits(persianYear)}`;
    }
    return date;
}

// Colors for charts
const chartColors = [
    '#00c170', '#ff5722', '#3a86ff', '#8338ec', '#fb8500', 
    '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4',
    '#90e0ef', '#ade8f4', '#caf0f8', '#03045e', '#023e8a',
    '#d8f3dc', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788'
];

// Token handling functions
let snappToken = localStorage.getItem('saved_snapp_token');
let isUsingLiveData = false;

// Function to save Snapp token
function saveToken() {
    // First, try to get token from localStorage
    let token = '';
    
    // Debug info about available tokens
    console.log('Trying to find tokens...');
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Cookies:', document.cookie);
    
    // Show debug info to user
    showToast('در حال جستجوی توکن...', 'info');
    
    // First, check if the token is in the URL fragment
    const urlToken = extractTokenFromUrl();
    if (urlToken) {
        token = urlToken;
        console.log('Found token in URL');
    }
    
    // Try different possible token storage locations
    const possibleTokens = [
        localStorage.getItem('snapp:token'),
        localStorage.getItem('snapp-token'),
        localStorage.getItem('token'),
        localStorage.getItem('accessToken'),
        localStorage.getItem('snapp_token'),
        localStorage.getItem('snapp_auth')
    ];
    
    // Log all token attempts
    console.log('Possible tokens from localStorage:', possibleTokens);
    
    // Take the first non-null token
    if (!token) {
        for (const t of possibleTokens) {
            if (t) {
                token = t;
                console.log('Found token in localStorage');
                break;
            }
        }
    }
    
    // If still no token, try cookies
    if (!token) {
        const cookies = document.cookie.split(';');
        console.log('All cookies:', cookies);
        
        for (let cookie of cookies) {
            cookie = cookie.trim();
            // Check for various possible cookie names
            const possibleCookieNames = ['snapp_auth=', 'token=', 'accessToken=', 'Authorization='];
            
            for (const cookieName of possibleCookieNames) {
                if (cookie.startsWith(cookieName)) {
                    token = cookie.substring(cookieName.length);
                    console.log('Found token in cookies with prefix:', cookieName);
                    break;
                }
            }
            
            if (token) break;
        }
    }
    
    // Try to get from sessionStorage as a last resort
    if (!token) {
        const sessionTokens = [
            sessionStorage.getItem('snapp:token'),
            sessionStorage.getItem('snapp-token'),
            sessionStorage.getItem('token'),
            sessionStorage.getItem('accessToken'),
            sessionStorage.getItem('snapp_token'),
            sessionStorage.getItem('snapp_auth')
        ];
        
        console.log('Possible tokens from sessionStorage:', sessionTokens);
        
        for (const t of sessionTokens) {
            if (t) {
                token = t;
                console.log('Found token in sessionStorage');
                break;
            }
        }
    }
    
    // If nothing worked, try manual token input
    if (!token) {
        token = promptForToken();
    }
    
    // If we have found a token
    if (token) {
        console.log('Token found:', token.substring(0, 10) + '...');
        
        // Save token
        localStorage.setItem('saved_snapp_token', token);
        snappToken = token;
        
        // Update UI
        const authStatus = document.querySelector('.auth-status');
        authStatus.textContent = 'وضعیت: با موفقیت وارد شدید!';
        authStatus.style.color = '#00c170';
        
        // Show toast notification
        showToast('توکن با موفقیت ذخیره شد!', 'success');
        
        // Reload data with the new token
        fetchDataWithToken();
    } else {
        // If no token was found
        showToast('توکن اسنپ پیدا نشد. لطفاً ابتدا در سایت اسنپ وارد شوید.', 'error');
        
        // Show debug dialog
        openDebugDialog();
    }
}

// Function to extract token from URL if present
function extractTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check various possible parameter names
    const possibleParams = ['token', 'access_token', 'auth', 'bearer'];
    
    // Check in regular URL params
    for (const param of possibleParams) {
        const value = urlParams.get(param);
        if (value) return value;
    }
    
    // Check in hash params
    for (const param of possibleParams) {
        const value = hashParams.get(param);
        if (value) return value;
    }
    
    return null;
}

// Function to prompt user for token
function promptForToken() {
    const userInput = prompt('توکن اسنپ به صورت خودکار پیدا نشد. لطفاً توکن خود را وارد کنید:', '');
    return userInput;
}

// Function to open debug dialog showing available storage
function openDebugDialog() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'debug-modal';
    
    let modalContent = `
        <div class="debug-modal-content">
            <h3>اطلاعات دیباگ</h3>
            <p>توکن پیدا نشد. اطلاعات زیر می‌تواند برای عیب‌یابی کمک کند:</p>
            
            <h4>LocalStorage:</h4>
            <pre>${JSON.stringify(Object.entries(localStorage), null, 2)}</pre>
            
            <h4>Cookies:</h4>
            <pre>${document.cookie || 'No cookies found'}</pre>
            
            <h4>SessionStorage:</h4>
            <pre>${JSON.stringify(Object.entries(sessionStorage), null, 2)}</pre>
            
            <div class="debug-buttons">
                <button class="debug-close-btn">بستن</button>
                <button class="debug-copy-btn">کپی اطلاعات</button>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.debug-close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.debug-copy-btn').addEventListener('click', () => {
        const debugInfo = `
LocalStorage: ${JSON.stringify(Object.entries(localStorage), null, 2)}
Cookies: ${document.cookie || 'No cookies found'}
SessionStorage: ${JSON.stringify(Object.entries(sessionStorage), null, 2)}
        `;
        
        navigator.clipboard.writeText(debugInfo).then(() => {
            showToast('اطلاعات دیباگ با موفقیت کپی شد', 'success');
        });
    });
}

// Function to fetch data from Snapp API with token
async function fetchDataWithToken() {
    if (!snappToken) {
        showToast('برای دریافت اطلاعات زنده، ابتدا وارد اسنپ شوید', 'info');
        loadLocalData();
        return;
    }
    
    try {
        showToast('در حال دریافت اطلاعات از اسنپ...', 'info');
        
        // Change the cursor to indicate loading
        document.body.style.cursor = 'wait';
        
        // First, we need to fetch the list of orders
        const ordersResponse = await fetch('https://app.snapp.taxi/api/api-passenger-trips/v2/passenger/trips?limit=50&offset=0&locale=fa', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${snappToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!ordersResponse.ok) {
            if (ordersResponse.status === 401) {
                throw new Error('توکن نامعتبر است یا منقضی شده است.');
            } else {
                throw new Error(`خطا در دریافت اطلاعات: ${ordersResponse.status}`);
            }
        }
        
        const ordersData = await ordersResponse.json();
        
        if (!ordersData.data || !Array.isArray(ordersData.data) || ordersData.data.length === 0) {
            throw new Error('داده‌ای از اسنپ دریافت نشد یا داده خالی است.');
        }
        
        // Log the response structure (for debugging)
        console.log('Snapp API Response:', ordersData);
        
        // Process the data from API
        const processedData = processSnappData(ordersData);
        
        // Update the UI with the new data
        updateDashboard(processedData);
        
        isUsingLiveData = true;
        showToast(`اطلاعات ${processedData.summary.totalOrders} سفر با موفقیت از اسنپ دریافت شد`, 'success');
        
        // Update the auth section to show we're using live data
        const dataSourceElem = document.querySelector('.data-source');
        if (dataSourceElem) {
            dataSourceElem.textContent = 'منبع داده: اطلاعات زنده از اسنپ';
            dataSourceElem.style.color = '#00c170';
        }
        
        // Reset cursor
        document.body.style.cursor = 'default';
        
    } catch (error) {
        console.error('Error fetching data from Snapp:', error);
        showToast(`خطا در دریافت اطلاعات از اسنپ: ${error.message}`, 'error');
        loadLocalData();
        
        // Reset cursor
        document.body.style.cursor = 'default';
    }
}

// Function to process data from Snapp API
function processSnappData(apiData) {
    // This is a simplified version. In a real app, you'd need to transform
    // the API data into the format expected by your dashboard
    
    // For now, we'll return a basic structure based on what's in the API response
    try {
        const trips = apiData.data || [];
        
        // Prepare data containers
        const categoryTotals = [];
        const ventureTotals = [];
        const monthlyAnalysis = [];
        const categoryMap = new Map();
        const ventureMap = new Map();
        const monthMap = new Map();
        
        let grandTotal = 0;
        
        // Process each trip
        trips.forEach(trip => {
            const price = trip.price || 0;
            grandTotal += price;
            
            // Get category info
            const category = trip.service_name || 'نامشخص';
            const venture = trip.service_type || 'other';
            
            // Update category totals
            if (categoryMap.has(category)) {
                categoryMap.set(category, categoryMap.get(category) + price);
            } else {
                categoryMap.set(category, price);
            }
            
            // Update venture totals
            if (ventureMap.has(venture)) {
                const ventureData = ventureMap.get(venture);
                ventureData.total += price;
                if (!ventureData.categories.includes(category)) {
                    ventureData.categories.push(category);
                }
            } else {
                ventureMap.set(venture, {
                    total: price,
                    categories: [category]
                });
            }
            
            // Process date for monthly analysis
            const tripDate = new Date(trip.created_at * 1000); // assuming timestamp
            const monthYear = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(tripDate)} ${tripDate.getFullYear()}`;
            
            if (monthMap.has(monthYear)) {
                const monthData = monthMap.get(monthYear);
                monthData.total += price;
                
                // Update category breakdown for this month
                let found = false;
                for (const cat of monthData.categories) {
                    if (cat.name === category) {
                        cat.total += price;
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    monthData.categories.push({
                        name: category,
                        total: price
                    });
                }
                
            } else {
                monthMap.set(monthYear, {
                    total: price,
                    categories: [{
                        name: category,
                        total: price
                    }]
                });
            }
        });
        
        // Convert Maps to arrays and format numbers
        for (const [category, total] of categoryMap.entries()) {
            categoryTotals.push({
                originalCategory: category,
                total: total,
                totalFormatted: formatNumber(total),
                percentage: ((total / grandTotal) * 100).toFixed(1)
            });
        }
        
        for (const [venture, data] of ventureMap.entries()) {
            ventureTotals.push({
                venture: venture,
                total: data.total,
                totalFormatted: formatNumber(data.total),
                percentage: ((data.total / grandTotal) * 100).toFixed(1),
                originalCategories: data.categories
            });
        }
        
        for (const [month, data] of monthMap.entries()) {
            // Calculate percentages for each category in this month
            const categoryBreakdown = data.categories.map(cat => {
                return {
                    originalCategory: cat.name,
                    total: cat.total,
                    totalFormatted: formatNumber(cat.total),
                    percentage: ((cat.total / data.total) * 100).toFixed(1)
                };
            });
            
            // Sort categories by total (descending)
            categoryBreakdown.sort((a, b) => b.total - a.total);
            
            monthlyAnalysis.push({
                month: month,
                total: data.total,
                totalFormatted: formatNumber(data.total),
                categoryBreakdown: categoryBreakdown
            });
        }
        
        // Sort arrays
        categoryTotals.sort((a, b) => b.total - a.total);
        ventureTotals.sort((a, b) => b.total - a.total);
        
        // Sort monthly analysis by date
        monthlyAnalysis.sort((a, b) => {
            const monthA = a.month.split(' ')[0];
            const monthB = b.month.split(' ')[0];
            const yearA = parseInt(a.month.split(' ')[1]);
            const yearB = parseInt(b.month.split(' ')[1]);
            
            if (yearA !== yearB) return yearA - yearB;
            
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
            return months.indexOf(monthA) - months.indexOf(monthB);
        });
        
        // First and last date range (if available)
        let dateRangeFrom = 'نامشخص';
        let dateRangeTo = 'نامشخص';
        
        if (trips.length > 0) {
            const sortedTrips = [...trips].sort((a, b) => a.created_at - b.created_at);
            const firstTrip = sortedTrips[0];
            const lastTrip = sortedTrips[sortedTrips.length - 1];
            
            if (firstTrip && firstTrip.created_at) {
                const firstDate = new Date(firstTrip.created_at * 1000);
                dateRangeFrom = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(firstDate)} ${firstDate.getDate()}, ${firstDate.getFullYear()}`;
            }
            
            if (lastTrip && lastTrip.created_at) {
                const lastDate = new Date(lastTrip.created_at * 1000);
                dateRangeTo = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(lastDate)} ${lastDate.getDate()}, ${lastDate.getFullYear()}`;
            }
        }
        
        // Create summary
        const summary = {
            totalOrders: trips.length,
            grandTotal: grandTotal,
            grandTotalFormatted: formatNumber(grandTotal),
            grandTotalTomans: formatNumber(Math.floor(grandTotal / 10)),
            categories: categoryTotals.length,
            dateRangeFrom: dateRangeFrom,
            dateRangeTo: dateRangeTo
        };
        
        return {
            summary: summary,
            categoryTotals: categoryTotals,
            ventureTotals: ventureTotals,
            monthlyAnalysis: monthlyAnalysis
        };
        
    } catch (error) {
        console.error('Error processing Snapp data:', error);
        throw new Error('خطا در پردازش اطلاعات اسنپ');
    }
}

// Function to load local JSON data
async function loadLocalData() {
    try {
        const response = await fetch('order-analysis.json');
        const data = await response.json();
        
        updateDashboard(data);
        
        isUsingLiveData = false;
        
        // Update the auth section to show we're using local data
        const dataSourceElem = document.querySelector('.data-source');
        if (dataSourceElem) {
            dataSourceElem.textContent = 'منبع داده: اطلاعات محلی (ذخیره شده)';
            dataSourceElem.style.color = '#ff5722';
        }
        
    } catch (error) {
        console.error('Error loading local data:', error);
        showToast('خطا در بارگذاری اطلاعات محلی', 'error');
    }
}

// Function to update the dashboard with data
function updateDashboard(data) {
    // Update summary cards
    document.querySelector('.total-spending').textContent = `${data.summary.grandTotalFormatted} ریال`;
    document.querySelector('.total-spending-tomans').textContent = `${data.summary.grandTotalTomans.replace(/\d/g, d => ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(d)])} تومان`;
    document.querySelector('.total-orders').textContent = toPersianDigits(data.summary.totalOrders);
    document.querySelector('.total-categories').textContent = toPersianDigits(data.summary.categories);
    
    // Convert dates to Persian format
    const fromDate = toPersianDate(data.summary.dateRangeFrom);
    const toDate = toPersianDate(data.summary.dateRangeTo);
    document.querySelector('.date-range').textContent = `از ${fromDate} تا ${toDate}`;

    // Prepare data for category chart - limit to top 10 categories for visibility
    const topCategories = data.categoryTotals.slice(0, 10);
    
    // Create category chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: topCategories.map(cat => cat.originalCategory),
            datasets: [{
                data: topCategories.map(cat => cat.total),
                backgroundColor: chartColors.slice(0, topCategories.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            family: 'IRANSans'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = (value / data.summary.grandTotal * 100).toFixed(1);
                            return `${label}: ${formatNumber(value)} ریال (${toPersianDigits(percentage)}%)`;
                        }
                    }
                }
            }
        }
    });

    // Create venture chart
    const ventureCtx = document.getElementById('ventureChart').getContext('2d');
    new Chart(ventureCtx, {
        type: 'pie',
        data: {
            labels: data.ventureTotals.map(venture => serviceNames[venture.venture] || venture.venture),
            datasets: [{
                data: data.ventureTotals.map(venture => venture.total),
                backgroundColor: chartColors.slice(0, data.ventureTotals.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            family: 'IRANSans'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = (value / data.summary.grandTotal * 100).toFixed(1);
                            return `${label}: ${formatNumber(value)} ریال (${toPersianDigits(percentage)}%)`;
                        }
                    }
                }
            }
        }
    });

    // Prepare data for monthly chart
    const months = data.monthlyAnalysis.map(m => toPersianMonth(m.month));
    const monthlyTotals = data.monthlyAnalysis.map(m => m.total);

    // Create monthly chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'هزینه ماهانه (ریال)',
                data: monthlyTotals,
                backgroundColor: '#00c170',
                borderColor: '#00a05c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'IRANSans'
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            return `${formatNumber(value)} ریال`;
                        }
                    }
                }
            }
        }
    });

    // Fill category table
    const categoryTableBody = document.querySelector('#categoryTable tbody');
    categoryTableBody.innerHTML = '';
    
    data.categoryTotals.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.originalCategory}</td>
            <td>${category.totalFormatted} ریال</td>
            <td class="percentage">${toPersianDigits(category.percentage)}%</td>
        `;
        categoryTableBody.appendChild(row);
    });

    // Fill venture table
    const ventureTableBody = document.querySelector('#ventureTable tbody');
    ventureTableBody.innerHTML = '';
    
    data.ventureTotals.forEach(venture => {
        const serviceName = serviceNames[venture.venture] || venture.venture;
        const serviceClass = `service-${venture.venture}`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="${serviceClass}">${serviceName}</td>
            <td>${venture.totalFormatted} ریال</td>
            <td class="percentage">${toPersianDigits(venture.percentage)}%</td>
            <td>${venture.originalCategories.join('، ')}</td>
        `;
        ventureTableBody.appendChild(row);
    });

    // Fill monthly table
    const monthlyTableBody = document.querySelector('#monthlyTable tbody');
    monthlyTableBody.innerHTML = '';
    
    data.monthlyAnalysis.forEach(month => {
        const row = document.createElement('tr');
        
        // Get top 3 categories for this month
        const topCategories = month.categoryBreakdown.slice(0, 3).map(cat => {
            return `${cat.originalCategory}: ${cat.totalFormatted} ریال (${toPersianDigits(cat.percentage)}%)`;
        }).join('<br>');
        
        row.innerHTML = `
            <td>${toPersianMonth(month.month)}</td>
            <td>${month.totalFormatted} ریال</td>
            <td>${topCategories}</td>
        `;
        monthlyTableBody.appendChild(row);
    });
}

// Function to show toast notifications
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show and then hide
    setTimeout(() => {
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }, 100);
}

// Check auth status on page load
document.addEventListener('DOMContentLoaded', async () => {
    const authStatus = document.querySelector('.auth-status');
    
    // Add refresh button to login section
    const authButtons = document.querySelector('.auth-buttons');
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-data-btn';
    refreshButton.textContent = 'به‌روزرسانی داده‌ها';
    refreshButton.onclick = fetchDataWithToken;
    authButtons.appendChild(refreshButton);
    
    if (snappToken) {
        authStatus.textContent = 'وضعیت: با موفقیت وارد شدید!';
        authStatus.style.color = '#00c170';
        
        // Try to fetch data with token
        fetchDataWithToken();
    } else {
        // If no token is available, load local data
        loadLocalData();
    }
});

// Function for manual token entry
function manualTokenEntry() {
    // Create a dialog for manual token entry
    const modal = document.createElement('div');
    modal.className = 'debug-modal';
    
    let modalContent = `
        <div class="debug-modal-content">
            <h3>ورود دستی توکن</h3>
            <p>برای پیدا کردن توکن اسنپ، مراحل زیر را انجام دهید:</p>
            
            <ol dir="rtl" style="text-align: right; margin-right: 20px;">
                <li>به سایت اسنپ بروید و وارد حساب کاربری خود شوید</li>
                <li>با کلیک راست روی صفحه، گزینه "Inspect" یا "بازرسی عنصر" را انتخاب کنید</li>
                <li>به تب Application یا Storage بروید</li>
                <li>در قسمت LocalStorage یا SessionStorage، دنبال کلیدی مرتبط با token بگردید</li>
                <li>یا می‌توانید در کنسول دستور زیر را اجرا کنید و نتیجه را کپی کنید:</li>
            </ol>
            
            <div class="code-snippet">
                <pre>console.log(JSON.stringify(Object.entries(localStorage)));</pre>
                <button class="copy-code-btn">کپی کد</button>
            </div>
            
            <p dir="rtl">توکن یافت شده را در کادر زیر وارد کنید:</p>
            <input type="text" id="manual-token-input" placeholder="توکن اسنپ را اینجا وارد کنید..." class="token-input">
            
            <div class="debug-buttons">
                <button class="debug-close-btn">انصراف</button>
                <button class="save-manual-token-btn">ذخیره توکن</button>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.debug-close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.copy-code-btn').addEventListener('click', () => {
        const code = `console.log(JSON.stringify(Object.entries(localStorage)));`;
        navigator.clipboard.writeText(code).then(() => {
            showToast('کد با موفقیت کپی شد', 'success');
        });
    });
    
    modal.querySelector('.save-manual-token-btn').addEventListener('click', () => {
        const tokenInput = document.getElementById('manual-token-input').value;
        
        if (tokenInput && tokenInput.trim().length > 0) {
            // Save token
            localStorage.setItem('saved_snapp_token', tokenInput.trim());
            snappToken = tokenInput.trim();
            
            // Update UI
            const authStatus = document.querySelector('.auth-status');
            authStatus.textContent = 'وضعیت: با موفقیت وارد شدید!';
            authStatus.style.color = '#00c170';
            
            // Show success message
            showToast('توکن با موفقیت ذخیره شد!', 'success');
            
            // Close modal
            document.body.removeChild(modal);
            
            // Reload data with the new token
            fetchDataWithToken();
        } else {
            showToast('لطفاً توکن معتبر وارد کنید', 'error');
        }
    });
}

// Function to extract token from Snapp page
function extractSnappToken() {
    showToast('در حال تلاش برای استخراج توکن از صفحه اسنپ...', 'info');
    
    // Try to create an invisible iframe to load Snapp
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://app.snapp.taxi/?superapp_service=orders';
    
    // When the iframe loads, try to extract the token
    iframe.onload = function() {
        try {
            // Try to access localStorage from the iframe
            const iframeLocalStorage = iframe.contentWindow.localStorage;
            console.log('Iframe localStorage:', iframeLocalStorage);
            
            let token = '';
            
            // Check various possible token keys
            const possibleKeys = ['snapp:token', 'snapp-token', 'token', 'accessToken'];
            
            for (const key of possibleKeys) {
                const value = iframeLocalStorage.getItem(key);
                if (value) {
                    token = value;
                    break;
                }
            }
            
            if (token) {
                showToast('توکن با موفقیت استخراج شد!', 'success');
                
                // Save the token
                localStorage.setItem('saved_snapp_token', token);
                snappToken = token;
                
                // Update UI
                const authStatus = document.querySelector('.auth-status');
                authStatus.textContent = 'وضعیت: با موفقیت وارد شدید!';
                authStatus.style.color = '#00c170';
                
                // Fetch data with the new token
                fetchDataWithToken();
            } else {
                showToast('توکن در iframe پیدا نشد. لطفاً از روش دستی استفاده کنید.', 'error');
            }
        } catch (error) {
            console.error('Error accessing iframe content:', error);
            showToast('دسترسی به iframe به دلیل محدودیت‌های امنیتی امکان‌پذیر نیست.', 'error');
        }
        
        // Remove the iframe
        document.body.removeChild(iframe);
    };
    
    // Add iframe to the body temporarily
    document.body.appendChild(iframe);
} 