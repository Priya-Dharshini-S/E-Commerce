const firebaseConfig = {
  apiKey: "AIzaSyAmRBTPEHXv2dGI1XKE0bZ51g8-1pBOpUQ",
  authDomain: "e-commerce-31fa0.firebaseapp.com",
  projectId: "e-commerce-31fa0",
  storageBucket: "e-commerce-31fa0.firebasestorage.app",
  messagingSenderId: "1090645672213",
  appId: "1:1090645672213:web:1118b049940add4beee91c",
  measurementId: "G-01T871F22Y"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentAdmin = null;

// Show Section Function
function showSection(sectionId) {
  console.log(`Attempting to show section: ${sectionId}`);

  // Hide all sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });

  // Show the selected section
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'block';
    section.classList.add('active');
    section.classList.add('animate__animated', 'animate__fadeIn');
    console.log(`Section ${sectionId} is now active`);
  } else {
    console.error(`Section with ID ${sectionId} not found`);
  }

  // Update active navigation link styling
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.classList.remove('active'));
  const navLink = document.querySelector(`.nav-link[onclick*="showCategory('${sectionId}')"]`) || 
                  document.querySelector(`.nav-link[onclick="logout()"]`) || 
                  document.querySelector(`.nav-link[data-section="${sectionId}"]`);
  if (navLink) {
    navLink.classList.add('active');
  }
}

// Toggle Sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('active');
  document.querySelector('.sidebar-open').classList.toggle('active');
}

// Admin Login
document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const loginMessage = document.getElementById('loginMessage');

  loginMessage.innerText = 'Logging in...';

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      currentAdmin = userCredential.user;
      loginMessage.innerText = 'Login successful!';
      loginMessage.style.color = 'green';
      showSection('adminPanel');
      console.log('Admin logged in:', currentAdmin.email);
    })
    .catch((error) => {
      loginMessage.innerText = `Login failed: ${error.message}`;
      loginMessage.style.color = 'red';
      console.error('Login error:', error);
    });
});

// Logout
function logout() {
  auth.signOut()
    .then(() => {
      currentAdmin = null;
      console.log('Admin logged out');
      showSection('loginSection');
      document.getElementById('loginMessage').innerText = 'Logged out successfully!';
    })
    .catch((error) => {
      console.error('Logout error:', error);
    });
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}
// Show Category Section
function showCategory(category) {
  console.log(`Showing category: ${category}`);
  const categorySections = document.querySelectorAll('.category-section');
  categorySections.forEach(sec => sec.style.display = 'none');
  const categorySection = document.getElementById(category);
  if (categorySection) {
      categorySection.style.display = 'block';
  } else {
      console.error(`Category section with ID ${category} not found`);
  }
  showSection('adminPanel');
}

// Handle Product Forms
const productForms = {
  electronics: document.getElementById('electronicsForm'),
  fashion: document.getElementById('fashionForm'),
  furniture: document.getElementById('furnitureForm'),
  cosmetics: document.getElementById('cosmeticsForm'),
  foodAndHealth: document.getElementById('foodAndHealthForm')
};

Object.keys(productForms).forEach(category => {
  const form = productForms[category];
  if (form) {
      form.addEventListener('submit', (e) => {
          e.preventDefault();
          console.log(`Submitting form for category: ${category}`);
          // Reuse existing form submission logic from your original code
          const productId = document.getElementById(`${category}ProductId`).value.trim();
          const name = document.getElementById(`${category}Name`).value.trim();
          const description = document.getElementById(`${category}Description`).value.trim();
          const brand = document.getElementById(`${category}Brand`).value.trim();
          const availability = document.getElementById(`${category}Availability`).value;

          if (!productId || !name || !description || !brand || !availability) {
              document.getElementById(`${category}Message`).innerText = 'Please fill all required fields.';
              document.getElementById(`${category}Message`).style.color = 'red';
              return;
          }

          let isActive;
          const isActiveElement = document.getElementById(`${category}IsActive`);
          if (isActiveElement.type === 'checkbox') {
              isActive = isActiveElement.checked;
          } else if (isActiveElement.tagName === 'SELECT') {
              isActive = isActiveElement.value === 'true';
          } else {
              isActive = false;
              console.warn(`Unknown input type for isActive in ${category}`);
          }

          const productData = {
              name,
              description,
              brand,
              imageURLs: document.getElementById(`${category}ImageURLs`).value.split(',').map(url => url.trim()).filter(url => url),
              availability: parseInt(availability) || 0,
              isActive,
              category,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          // Category-specific fields (reuse your existing logic)
          try {
              if (category === 'electronics') {
                  productData.specifications = {
                      display: document.getElementById('electronicsDisplay').value.trim(),
                      processor: document.getElementById('electronicsProcessor').value.trim(),
                      battery: document.getElementById('electronicsBattery').value.trim()
                  };
              } else if (category === 'fashion') {
                  productData.specifications = {
                      size: document.getElementById('fashionSize').value.trim(),
                      color: document.getElementById('fashionColor').value.trim(),
                      material: document.getElementById('fashionMaterial').value.trim()
                  };
                  productData.price = parseFloat(document.getElementById('fashionPrice').value) || 0;
                  productData.discountPrice = parseFloat(document.getElementById('fashionDiscountPrice').value) || 0;
                  productData.warehouseId = document.getElementById('fashionWarehouseId').value.trim();
                  productData.stock = parseInt(document.getElementById('fashionStock').value) || 0;
                  productData.soldBy = document.getElementById('fashionSoldBy').value.trim();
              } // Add other categories as needed

              console.log(`Saving product to Firestore: ${productId}`, productData);
              db.collection('products').doc(productId).set(productData, { merge: true })
                  .then(() => {
                      document.getElementById(`${category}Message`).innerText = 'Product added/updated successfully!';
                      document.getElementById(`${category}Message`).style.color = 'green';
                      form.reset();
                      closeModal(`${category}AddUpdate`);
                      console.log(`Product ${productId} saved successfully`);
                  })
                  .catch((error) => {
                      document.getElementById(`${category}Message`).innerText = `Error: ${error.message}`;
                      document.getElementById(`${category}Message`).style.color = 'red';
                      console.error(`Error saving product ${productId}:`, error);
                  });
          } catch (error) {
              document.getElementById(`${category}Message`).innerText = `Error processing form data: ${error.message}`;
              document.getElementById(`${category}Message`).style.color = 'red';
              console.error(`Error in form processing for ${category}:`, error);
          }
      });
  }
});

// Fetch and Delete forms (add similar modal-based event listeners)
document.querySelectorAll('[id$="FetchForm"], [id$="DeleteForm"]').forEach(form => {
  form.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = form.id.replace('FetchForm', '').replace('DeleteForm', '').toLowerCase();
      const productId = document.getElementById(`${category}FetchProductId` || `${category}DeleteProductId`).value.trim();

      if (!productId) {
          alert('Please enter a Product ID');
          return;
      }

      if (form.id.endsWith('FetchForm')) {
          db.collection('products').doc(productId).get()
              .then((doc) => {
                  if (doc.exists) {
                      alert(`Product found: ${JSON.stringify(doc.data(), null, 2)}`);
                      console.log('Fetched product:', doc.data());
                  } else {
                      alert('No such product!');
                      console.log(`No product found with ID: ${productId}`);
                  }
                  closeModal(`${category}Fetch`);
              })
              .catch((error) => {
                  console.error('Error fetching product:', error);
                  alert(`Error fetching product: ${error.message}`);
              });
      } else if (form.id.endsWith('DeleteForm')) {
          db.collection('products').doc(productId).delete()
              .then(() => {
                  alert('Product deleted successfully!');
                  console.log(`Product ${productId} deleted successfully`);
                  closeModal(`${category}Delete`);
              })
              .catch((error) => {
                  console.error('Error deleting product:', error);
                  alert(`Error deleting product: ${error.message}`);
              });
      }
  });
});
// Analytics
function getAnalytics() {
  // Show loading state for all cards
  const cards = ['cashReports', 'customerPurchases', 'paymentReports', 'topProducts', 'bottomProducts', 'inventoryReports'];
  cards.forEach(cardId => {
    document.getElementById(cardId).innerHTML = '<div class="loading">Loading...</div>';
  });

  // Prepare data objects
  let productSales = {};
  let categorySales = {};

  // Fetch all products to build sales data
  db.collection('products').get().then(productSnapshot => {
    productSnapshot.forEach(doc => {
      const prod = doc.data();
      productSales[doc.id] = prod.sales || 0;
      categorySales[prod.category] = (categorySales[prod.category] || 0) + (prod.sales || 0);
    });

    // Bar Chart: Product Sales
    const barCtx = document.getElementById('salesBarChart')?.getContext('2d');
    if (barCtx) {
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(productSales),
          datasets: [{
            label: 'Units Sold',
            data: Object.values(productSales),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Pie Chart: Category Distribution
    setTimeout(() => {
      const pieCtx = document.getElementById('categoryPieChart')?.getContext('2d');
      if (pieCtx) {
        new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: Object.keys(categorySales),
            datasets: [{
              data: Object.values(categorySales),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
          },
          options: { responsive: false }
        });
      }
    }, 1000);

    // Top 10 Products Table
    const topProducts = document.getElementById('topProducts');
    topProducts.innerHTML = "<h3>Top 10 Selling Products</h3>";
    const topTable = document.createElement('table');
    topTable.classList.add('analytics-table');
    topTable.innerHTML = `
      <thead>
        <tr>
          <th>S.No</th>
          <th>Product Name</th>
          <th>Category</th>
          <th>Units Sold</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const topTbody = topTable.querySelector('tbody');
    const sortedTopProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 10);
    Promise.all(sortedTopProducts.map(([prodId], index) =>
      db.collection('products').doc(prodId).get().then(doc => {
        if (doc.exists) {
          const prod = doc.data();
          return { name: prod.name, category: prod.category, qty: productSales[prodId], index: index + 1 };
        }
        return null;
      })
    )).then(products => {
      products.filter(p => p).sort((a, b) => a.category.localeCompare(b.category) || b.qty - a.qty).forEach(prod => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${prod.index}</td>
          <td>${prod.name}</td>
          <td>${prod.category}</td>
          <td>${prod.qty}</td>
        `;
        topTbody.appendChild(row);
      });
    }).catch(error => {
      console.error('Error fetching top products:', error);
      topProducts.innerHTML = '<div class="error">Error loading top products</div>';
    });
    topProducts.appendChild(topTable);

    // Bottom 10 Products Table
    const bottomProducts = document.getElementById('bottomProducts');
    bottomProducts.innerHTML = "<h3>Bottom 10 Selling Products</h3>";
    const bottomTable = document.createElement('table');
    bottomTable.classList.add('analytics-table');
    bottomTable.innerHTML = `
      <thead>
        <tr>
          <th>S.No</th>
          <th>Product Name</th>
          <th>Category</th>
          <th>Units Sold</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const bottomTbody = bottomTable.querySelector('tbody');
    const sortedBottomProducts = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 10);
    Promise.all(sortedBottomProducts.map(([prodId], index) =>
      db.collection('products').doc(prodId).get().then(doc => {
        if (doc.exists) {
          const prod = doc.data();
          return { name: prod.name, category: prod.category, qty: productSales[prodId], index: index + 1 };
        }
        return null;
      })
    )).then(products => {
      products.filter(p => p).sort((a, b) => a.category.localeCompare(b.category) || a.qty - b.qty).forEach(prod => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${prod.index}</td>
          <td>${prod.name}</td>
          <td>${prod.category}</td>
          <td>${prod.qty}</td>
        `;
        bottomTbody.appendChild(row);
      });
    }).catch(error => {
      console.error('Error fetching bottom products:', error);
      bottomProducts.innerHTML = '<div class="error">Error loading bottom products</div>';
    });
    bottomProducts.appendChild(bottomTable);

  }).catch(error => {
    console.error('Error fetching products:', error);
  });

  // Cash Purchase Reports
  db.collection('orders')
    .where('paymentMethod', '==', 'cash')
    .get()
    .then((snapshot) => {
      const cashReports = document.getElementById('cashReports');
      if (!snapshot.empty) {
        cashReports.innerHTML = `<h3>Cash Purchase Reports</h3><ul>${snapshot.docs
          .map(doc => `<li><span>User ${doc.data().userId || 'Unknown'}</span><span>$${doc.data().totalAmountUSD || doc.data().totalAmount || 0}</span></li>`)
          .join('')}</ul>`;
      } else {
        cashReports.innerHTML = '<h3>Cash Purchase Reports</h3><p>No data available</p>';
      }
    })
    .catch((error) => {
      console.error('Error fetching cash reports:', error);
      document.getElementById('cashReports').innerHTML = '<div class="error">Error loading cash reports</div>';
    });

  // Customer Purchase Reports
  db.collection('users').get().then(userSnapshot => {
    const customerPurchases = document.getElementById('customerPurchases');
    customerPurchases.innerHTML = "<h3>Customer Purchase Reports</h3>";
    const custTable = document.createElement('table');
    custTable.classList.add('analytics-table');
    custTable.innerHTML = `
      <thead>
        <tr>
          <th>S.No</th>
          <th>Name</th>
          <th>Email</th>
          <th>Total Orders</th>
          <th>Total Spent (USD)</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const custTbody = custTable.querySelector('tbody');
    Promise.all(userSnapshot.docs.map((userDoc, index) => {
      const user = userDoc.data();
      return db.collection('orders').where('userId', '==', userDoc.id).get().then(orderSnapshot => {
        const totalOrders = orderSnapshot.size;
        const totalSpentUSD = orderSnapshot.docs.reduce((sum, doc) => sum + (doc.data().totalAmountUSD || doc.data().totalAmount || 0), 0);
        return { index: index + 1, name: user.name, email: user.email, totalOrders, totalSpentUSD };
      });
    })).then(customers => {
      customers.forEach(cust => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${cust.index}</td>
          <td>${cust.name}</td>
          <td>${cust.email}</td>
          <td>${cust.totalOrders}</td>
          <td>$${cust.totalSpentUSD.toFixed(2)}</td>
        `;
        custTbody.appendChild(row);
      });
    });
    customerPurchases.appendChild(custTable);
  }).catch(error => {
    console.error('Error fetching customer purchases:', error);
    document.getElementById('customerPurchases').innerHTML = '<div class="error">Error loading customer purchases</div>';
  });

  // Payment Transactions (Line Chart comparison)
  const comparisonCtx = document.getElementById('comparisonChart')?.getContext('2d');
  if (comparisonCtx) {
    db.collection('orders').get().then(snapshot => {
      const monthlySales = { '2024': {}, '2025': {} };
      snapshot.forEach(doc => {
        const date = new Date(doc.data().timestamp || Date.now());
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' });
        if (year === 2024 || year === 2025) {
          monthlySales[year][month] = (monthlySales[year][month] || 0) + (doc.data().totalAmountUSD || doc.data().totalAmount || 0);
        }
      });

      new Chart(comparisonCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: '2024 Sales',
            data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => monthlySales['2024'][m] || 0),
            borderColor: '#FF6384',
            fill: false
          }, {
            label: '2025 Sales',
            data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => monthlySales['2025'][m] || 0),
            borderColor: '#36A2EB',
            fill: false
          }]
        },
        options: { responsive: false }
      });
    }).catch(error => {
      console.error('Error fetching payment comparison:', error);
      document.getElementById('paymentReports').innerHTML = '<div class="error">Error loading payment comparison</div>';
    });
  }

  // Inventory Reports
  const inventoryReports = document.getElementById('inventoryReports');
  inventoryReports.innerHTML = "<h3>Inventory Report</h3>";
  const invTable = document.createElement('table');
  invTable.classList.add('analytics-table');
  invTable.innerHTML = `
    <thead>
      <tr>
        <th>S.No</th>
        <th>Product Name</th>
        <th>Category</th>
        <th>Stock</th>
        <th>Price (USD)</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const invTbody = invTable.querySelector('tbody');
  db.collection('products').get().then(snapshot => {
    const products = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      ...doc.data(),
      index: index + 1
    })).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    products.forEach(prod => {
      const priceUSD = prod.currency === 'INR' ? prod.price / 83 : prod.price;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${prod.index}</td>
        <td>${prod.name}</td>
        <td>${prod.category}</td>
        <td>${prod.availability}</td>
        <td>$${priceUSD.toFixed(2)}</td>
      `;
      invTbody.appendChild(row);
    });
    inventoryReports.appendChild(invTable);
  }).catch(error => {
    console.error('Error fetching inventory reports:', error);
    inventoryReports.innerHTML = '<div class="error">Error loading inventory reports</div>';
  });
}

// Event Listeners remain unchanged
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  showSection('loginSection');

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section') || link.getAttribute('onclick').match(/showCategory\('(.+)'\)/)?.[1] || 'loginSection';
      console.log(`Navigation link clicked: ${sectionId}`);
      if (sectionId === 'logout') {
        logout();
      } else {
        showSection(sectionId);
      }
    });
  });
});

// Function to render the Sales by Category Pie Chart
function renderSalesByCategoryPieChart() {
  const ctx = document.getElementById('salesByCategoryPieChart').getContext('2d');

  // Fetch order data to calculate sales by category
  db.collection('orders').get()
      .then(snapshot => {
          const categorySalesMap = new Map(); // Map to aggregate sales by category

          snapshot.forEach(doc => {
              const order = doc.data();
              const items = order.items || [];
              items.forEach(item => {
                  const category = item.category || 'Unknown'; // Ensure each item has a category
                  const quantity = item.quantity || 1;
                  const currentTotal = categorySalesMap.get(category) || 0;
                  categorySalesMap.set(category, currentTotal + quantity);
              });
          });

          // Prepare data for the pie chart
          const categories = Array.from(categorySalesMap.keys());
          const salesData = Array.from(categorySalesMap.values());

          // Create the pie chart
          new Chart(ctx, {
              type: 'pie',
              data: {
                  labels: categories,
                  datasets: [{
                      data: salesData,
                      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'], // Colors for each category
                      borderWidth: 1,
                      borderColor: '#fff'
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          position: 'top'
                      },
                      title: {
                          display: true,
                          text: 'Sales by Category'
                      }
                  }
              }
          });
      })
      .catch(err => {
          console.error("Error loading sales by category for pie chart:", err);
          document.getElementById('salesByCategoryPieChart').parentElement.innerHTML = '<p>Error loading pie chart</p>';
      });
}

// Call the function when the admin panel loads (e.g., in your existing admin initialization)
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminPanel')) {
      renderSalesByCategoryPieChart(); // Ensure this runs after the admin panel is loaded
  }
});
  // Ensure admin is logged in before accessing admin panel
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentAdmin = user;
      showSection('adminPanel');
    }
  });
 
