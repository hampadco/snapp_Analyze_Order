import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { formatNumber, rialToToman, formatDate } from './utils.js';

// Load environment variables
dotenv.config();

// API configuration
const API_URL = process.env.API_URL;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

// Create a configured axios instance
const api = axios.create({
  headers: {
    'Authorization': `Bearer ${BEARER_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'fa-IR',
    'X-App-Name': 'passenger-pwa',
    'X-App-Version': 'v18.18.2',
    'App-Version': 'pwa',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  }
});

// Main function to fetch all orders and calculate totals
async function analyzeOrders() {
  try {
    console.log('🔍 Starting to fetch and analyze Snapp orders...');
    
    let allOrders = [];
    let page = 1;
    let hasMoreData = true;
    let totalPages = 0;
    
    // Loop through all pages
    while (hasMoreData) {
      console.log(`📄 Fetching page ${page}...`);
      
      // Include card_types in the request body
      const response = await api.post(`${API_URL}?category=all&page=${page}`, {
        card_types: [1, 2] // Based on the original data, there are two card types
      });
      
      const { orders } = response.data;
      
      if (orders && orders.length > 0) {
        console.log(`✅ Page ${page}: Received ${orders.length} orders`);
        allOrders = [...allOrders, ...orders];
        page++;
        totalPages++;
      } else {
        hasMoreData = false;
      }
    }
    
    console.log(`\n📊 Final Analysis:`);
    console.log(`🔢 Total pages: ${totalPages}`);
    console.log(`🛒 Total orders: ${allOrders.length}`);
    
    // Process orders by category
    const categoryTotals = {};
    const ventureCategories = {};
    const monthlyTotals = {};
    let grandTotal = 0;
    
    allOrders.forEach(order => {
      const { venture_title, price, date } = order;
      
      // Add to category total
      if (!categoryTotals[venture_title]) {
        categoryTotals[venture_title] = 0;
      }
      categoryTotals[venture_title] += price;
      
      // Add to venture category map
      const ventureSlug = order.slug;
      if (!ventureCategories[ventureSlug]) {
        ventureCategories[ventureSlug] = new Set();
      }
      ventureCategories[ventureSlug].add(venture_title);
      
      // Add to monthly totals
      const monthDate = new Date(date * 1000);
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
      
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = {
          total: 0,
          categories: {}
        };
      }
      
      monthlyTotals[monthKey].total += price;
      
      if (!monthlyTotals[monthKey].categories[venture_title]) {
        monthlyTotals[monthKey].categories[venture_title] = 0;
      }
      monthlyTotals[monthKey].categories[venture_title] += price;
      
      // Add to grand total
      grandTotal += price;
    });
    
    // Get English month names
    const getEnglishMonth = (date) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[date.getMonth()];
    };

    // Category name mappings
    const categoryNameMap = {
      'مد و پوشاک': 'Fashion & Clothing',
      'رستوران': 'Restaurant',
      'میوه': 'Fruit',
      'خانه و آشپزخانه': 'Home & Kitchen',
      'دیجیتال': 'Digital',
      'آبمیوه بستنی': 'Juice & Ice Cream',
      'اسنپ': 'Snapp',
      'هایپرمارکت': 'Hypermarket',
      'زیبایی و سلامت': 'Beauty & Health',
      'نانوایی': 'Bakery',
      'ابزار و خودرو، ابزار و تجهیزات صنعتی': 'Tools & Auto, Industrial Equipment',
      'پروتئین': 'Protein',
      'شیرینی': 'Sweets',
      'لبنیات': 'Dairy',
      'کافه': 'Cafe',
      'اسنپ‌اکوپلاس': 'Snapp Eco Plus'
    };

    // Translate category names to English
    const translateCategory = (category) => {
      return categoryNameMap[category] || category;
    };
    
    // Prepare results object
    const results = {
      summary: {
        totalPages,
        totalOrders: allOrders.length,
        grandTotal,
        grandTotalFormatted: formatNumber(grandTotal),
        grandTotalTomans: formatNumber(rialToToman(grandTotal)),
        categories: Object.keys(categoryTotals).length,
        dateRangeFrom: allOrders[allOrders.length - 1]?.date ? new Date(allOrders[allOrders.length - 1]?.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
        dateRangeTo: allOrders[0]?.date ? new Date(allOrders[0]?.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      },
      categoryTotals: Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, total]) => ({
          originalCategory: category,
          category: translateCategory(category),
          total,
          totalFormatted: formatNumber(total),
          percentage: (total / grandTotal * 100).toFixed(1)
        })),
      ventureTotals: Object.entries(ventureCategories).map(([venture, categories]) => {
        const ventureTotal = allOrders
          .filter(order => order.slug === venture)
          .reduce((total, order) => total + order.price, 0);
        
        return {
          venture,
          categories: Array.from(categories).map(translateCategory),
          originalCategories: Array.from(categories),
          total: ventureTotal,
          totalFormatted: formatNumber(ventureTotal),
          percentage: (ventureTotal / grandTotal * 100).toFixed(1)
        };
      }),
      monthlyAnalysis: Object.entries(monthlyTotals)
        .sort()
        .map(([month, data]) => {
          const [year, monthNum] = month.split('-');
          const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
          const monthName = getEnglishMonth(monthDate);
          
          return {
            month: `${monthName} ${year}`,
            total: data.total,
            totalFormatted: formatNumber(data.total),
            categoryBreakdown: Object.entries(data.categories)
              .sort((a, b) => b[1] - a[1])
              .map(([category, total]) => ({
                originalCategory: category,
                category: translateCategory(category),
                total,
                totalFormatted: formatNumber(total),
                percentage: (total / data.total * 100).toFixed(1)
              }))
          };
        })
    };
    
    // Save results to file
    await fs.writeFile('order-analysis.json', JSON.stringify(results, null, 2));
    console.log('💾 Analysis saved to order-analysis.json');
    
    // Create a text file with properly encoded text
    let textReport = `=============================================\n`;
    textReport += `           SNAPP ORDERS ANALYSIS REPORT           \n`;
    textReport += `=============================================\n\n`;
    
    textReport += `Total Pages: ${totalPages}\n`;
    textReport += `Total Orders: ${allOrders.length}\n`;
    textReport += `Date Range: ${results.summary.dateRangeFrom} to ${results.summary.dateRangeTo}\n\n`;
    
    textReport += `💰 Total Spending: ${results.summary.grandTotalFormatted} Rials\n`;
    textReport += `💰 Total Spending: ${results.summary.grandTotalTomans} Tomans\n\n`;
    
    textReport += `=============================================\n`;
    textReport += `           SPENDING BY CATEGORY           \n`;
    textReport += `=============================================\n\n`;
    
    results.categoryTotals.forEach(item => {
      textReport += `${item.category}: ${item.totalFormatted} Rials (${item.percentage}%)\n`;
    });
    
    textReport += `\n=============================================\n`;
    textReport += `           SPENDING BY SERVICE TYPE           \n`;
    textReport += `=============================================\n\n`;
    
    results.ventureTotals.forEach(item => {
      textReport += `${item.venture}: ${item.totalFormatted} Rials (${item.percentage}%)\n`;
      textReport += `  Categories: ${item.categories.join(', ')}\n\n`;
    });
    
    textReport += `=============================================\n`;
    textReport += `           MONTHLY ANALYSIS           \n`;
    textReport += `=============================================\n\n`;
    
    results.monthlyAnalysis.forEach(month => {
      textReport += `${month.month}: ${month.totalFormatted} Rials\n`;
      month.categoryBreakdown.slice(0, 3).forEach(category => {
        textReport += `  - ${category.category}: ${category.totalFormatted} Rials (${category.percentage}%)\n`;
      });
      textReport += `\n`;
    });
    
    await fs.writeFile('report.txt', textReport, 'utf8');
    console.log('📝 Text report saved to report.txt');
    
    // Display results with ASCII art for console
    console.log('\n===== SPENDING BY CATEGORY =====');
    results.categoryTotals.forEach(item => {
      console.log(`${item.category}: ${item.totalFormatted} Rials (${item.percentage}%)`);
    });
    
    console.log('\n===== SUMMARY BY SERVICE TYPE =====');
    results.ventureTotals.forEach(item => {
      console.log(`${item.venture}: ${item.totalFormatted} Rials (${item.percentage}%)`);
      console.log(`  Categories: ${item.categories.join(', ')}`);
    });
    
    console.log('\n===== MONTHLY ANALYSIS =====');
    results.monthlyAnalysis.forEach(month => {
      console.log(`${month.month}: ${month.totalFormatted} Rials`);
      month.categoryBreakdown.slice(0, 3).forEach(category => {
        console.log(`  - ${category.category}: ${category.totalFormatted} Rials (${category.percentage}%)`);
      });
    });
    
    console.log('\n===== GRAND TOTAL =====');
    console.log(`💰 Total Spending: ${results.summary.grandTotalFormatted} Rials`);
    console.log(`💰 Total Spending: ${results.summary.grandTotalTomans} Tomans`);
    console.log(`🛒 Total Orders: ${results.summary.totalOrders}`);
    console.log(`📅 Date Range: ${results.summary.dateRangeFrom} to ${results.summary.dateRangeTo}`);
    
  } catch (error) {
    console.error('❌ Error fetching or processing orders:');
    if (error.response) {
      console.error('Server response:', error.response.data);
      console.error('Response status:', error.response.status);
    } else {
      console.error(error.message);
    }
  }
}

// Run the analysis
analyzeOrders(); 