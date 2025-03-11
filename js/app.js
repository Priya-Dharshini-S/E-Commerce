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

let currentUser = null;
let currentOrder = null;

// Navigation
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (sectionId === 'products') loadProducts();
  if (sectionId === 'cart') loadCart();
  if (sectionId === 'order-history') loadOrderHistory();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      showSection(sectionId);
  });
});

// Hamburger Menu
document.querySelector('.hamburger').addEventListener('click', () => {
  document.querySelector('.navbar').classList.toggle('active');
});

// Sidebar Toggle
document.querySelector('.filter-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('active');
});

document.querySelector('.close-sidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('active');
});

// Login
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
          currentUser = cred.user;
          document.getElementById('loginMessage').innerText = "Login successful!";
          document.getElementById('logoutBtn').style.display = 'block';
          showSection('home');
      })
      .catch(err => document.getElementById('loginMessage').innerText = err.message);
});

// Guest Login
document.getElementById('guestBtn').addEventListener('click', () => {
  auth.signInAnonymously()
      .then(cred => {
          currentUser = cred.user;
          alert("Signed in as guest.");
          showSection('home');
      })
      .catch(err => alert(err.message));
});

// Register
// app.js - Inside the registerForm submit event listener
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const dob = document.getElementById('registerDOB').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (password !== confirmPassword) {
      document.getElementById('registerMessage').innerText = "Passwords do not match!";
      return;
  }

  auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
          currentUser = cred.user;
          db.collection('users').doc(currentUser.uid).set({
              name: name,
              dob: dob,
              email: email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              creditPoints: 0 // Initialize credit points to 0
          }).then(() => {
              document.getElementById('registerMessage').innerText = "Registration successful! Please log in.";
              showSection('login');
          });
      })
      .catch(err => document.getElementById('registerMessage').innerText = err.message);
});


// Load Products
function loadProducts() {
  console.log("loadProducts function called"); // Debug log
  const productsListDiv = document.getElementById('productsList');
  productsListDiv.innerHTML = "Loading products...";

  let query = db.collection('products').where('isActive', '==', true);

  const categoryFilter = document.getElementById('categoryFilter').value;
  const sortBy = document.getElementById('sortBy').value;

  console.log("Category Filter:", categoryFilter); // Debug log
  console.log("Sort By:", sortBy); // Debug log

  // Apply category filter
  if (categoryFilter !== 'all') {
    query = query.where('category', '==', categoryFilter);
    console.log("Filtering by category:", categoryFilter);
  }

  // Firestore sorting fix (ensure orderBy fields have an index)
  if (sortBy === 'price-asc') query = query.orderBy('price', 'asc');
  if (sortBy === 'price-desc') query = query.orderBy('price', 'desc');
  if (sortBy === 'name-asc') query = query.orderBy('name', 'asc');
  if (sortBy === 'name-desc') query = query.orderBy('name', 'desc');

  // Fetch data
  query.get()
    .then(snapshot => {
      console.log("Query snapshot received, size:", snapshot.size);
      productsListDiv.innerHTML = "";

      if (snapshot.empty) {
        productsListDiv.innerHTML = "No products available.";
        console.log("No products found for the query");
        return;
      }

      snapshot.forEach(doc => {
        const prod = doc.data();
        const productId = doc.id;
        const imageUrl = prod.imageURLs?.[0] || 'https://via.placeholder.com/150';
        const price = prod.discountPrice || prod.price || 'N/A';
        
        const prodDiv = document.createElement('div');
        prodDiv.classList.add('product');
        
        let specsHTML = '';
        if (['electronics', 'fashion', 'furniture', 'cosmetics', 'foodAndHealth'].includes(prod.category)) {
          specsHTML = `<br>Details: ${prod.specifications?.details || 'N/A'}`;
        }

        prodDiv.innerHTML = `
          <img src="${imageUrl}" alt="${prod.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300';">
          <br><strong>${prod.name}</strong> (ID: ${productId})
          <br><small>${prod.description}</small>
          ${specsHTML}
          <br>Availability: ${prod.availability}
          <br>Price: $<span id="price-${productId}">${price}</span>
          <br><button onclick="addToCart('${productId}', '${prod.name}')">Add to Cart</button>
        `;

        productsListDiv.appendChild(prodDiv);
      });
    })
    .catch(err => {
      
     
    });

}

// Ensure Apply Filters button works
document.addEventListener('DOMContentLoaded', () => {
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      console.log("Apply Filters button clicked");
      loadProducts(); // Ensure filters are applied correctly
    });
  } else {
    console.error("Apply Filters button not found");
  }
});


// Remove automatic update for #products section (keep it manual with button)
document.getElementById('categoryFilter')?.removeEventListener('change', loadProducts);
document.getElementById('sortBy')?.removeEventListener('change', loadProducts);

// Load Featured Products on Home
// Load Featured Products on Home
function loadFeaturedProducts() {
  const featuredProductsDiv = document.getElementById('featuredProducts');
  featuredProductsDiv.innerHTML = "Loading featured products...";
  
  // Fetch all active products without a limit
  db.collection('products')
    .where('isActive', '==', true)
    .get()
    .then(snapshot => {
      featuredProductsDiv.innerHTML = "";
      if (snapshot.empty) {
        featuredProductsDiv.innerHTML = "No featured products available.";
        return;
      }
      snapshot.forEach(doc => {
        const prod = doc.data();
        const productId = doc.id;
        const imageUrl = prod.imageURLs?.[0] || 'https://via.placeholder.com/200x300';
        const price = prod.discountPrice || prod.price || 'N/A';
        const prodDiv = document.createElement('div');
        prodDiv.classList.add('product');
        prodDiv.innerHTML = `
          <img src="${imageUrl}" alt="${prod.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300';">
          <br><strong>${prod.name}</strong>
          <br>Price: $<span id="price-${productId}">${price}</span>
          <br><button onclick="addToCart('${productId}', '${prod.name}')">Add to Cart</button>
        `;
        featuredProductsDiv.appendChild(prodDiv);
      });
    })
    .catch(err => {
      console.error("Error loading featured products:", err);
      featuredProductsDiv.innerHTML = "Error loading featured products.";
    });
}

// Add to Cart
function addToCart(productId, name) {
  // if (!currentUser) {
  //     alert("Please login or register first!");
  //     return;
  // }
  
  // db.collection('products').doc(productId).get()
  //     .then(doc => {
  //         if (!doc.exists) {
  //             alert("Product not found!");
  //             return;
  //         }
  //         const prod = doc.data();
  //         const price = prod.discountPrice || prod.price || 0;
  //         const imageUrl = prod.imageURLs?.[0] || 'https://via.placeholder.com/100';
  //         const cartRef = db.collection('users').doc(currentUser.uid).collection('cart');
  //         cartRef.where('productId', '==', productId).get()
  //             .then(snapshot => {
  //                 if (snapshot.empty) {
  //                     cartRef.add({
  //                         productId: productId,
  //                         name: name,
  //                         price: price,
  //                         quantity: 1,
  //                         imageUrl: imageUrl,
  //                         addedAt: firebase.firestore.FieldValue.serverTimestamp()
  //                     }).then(() => {
  //                         alert(`${name} added to cart.`);
  //                         updateCartBadge();
  //                         loadCart();
  //                     });
  //                 } else {
  //                     const doc = snapshot.docs[0];
  //                     cartRef.doc(doc.id).update({
  //                         quantity: doc.data().quantity + 1
  //                     }).then(() => {
  //                         alert(`${name} quantity updated in cart.`);
  //                         updateCartBadge();
  //                         loadCart();
  //                     });
  //                 }
  //             });
  //     });
  productDiv.querySelector('.add-to-cart').addEventListener('click', () => {
    if (!currentUser) {
        alert("Please login or register first!");
        return;
    }

    const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.imageURLs?.[0] || 'https://via.placeholder.com/120',
        category: product.category || 'Unknown' // Ensure category is included
    };

    // Rest of the add-to-cart logic (checking for duplicates, etc.) remains unchanged
    db.collection('users').doc(currentUser.uid).collection('cart')
        .where('productId', '==', product.id)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const currentQty = doc.data().quantity || 1;
                    doc.ref.update({ quantity: currentQty + 1 })
                        .then(() => {
                            alert("Product quantity updated in cart!");
                            updateCartBadge();
                            loadCart();
                        })
                        .catch(err => {
                            console.error("Error updating cart item:", err);
                            alert("Error updating product quantity in cart.");
                        });
                });
            } else {
                db.collection('users').doc(currentUser.uid).collection('cart')
                    .add(cartItem)
                    .then(() => {
                        alert("Product added to cart!");
                        updateCartBadge();
                        loadCart();
                    })
                    .catch(err => {
                        console.error("Error adding to cart:", err);
                        alert("Error adding product to cart.");
                    });
            }
        })
        .catch(err => {
            console.error("Error checking cart:", err);
            alert("Error adding product to cart.");
        });
});
}

// Load Cart
// Load Cart
function loadCart() {
  if (!currentUser) {
      alert("Please login or register first!");
      return;
  }
  const cartListDiv = document.getElementById('cartList');
  const cartTotalSpan = document.getElementById('cartTotal');
  cartListDiv.innerHTML = "";
  let total = 0;

  db.collection('users').doc(currentUser.uid).collection('cart').get()
      .then(snapshot => {
          if (snapshot.empty) {
              cartListDiv.innerHTML = "Your cart is empty.";
              cartTotalSpan.innerText = "0.00";
              return;
          }

          // Group items by productId and sum quantities
          const cartItemsMap = new Map();
          snapshot.forEach(doc => {
              const item = doc.data();
              const existingItem = cartItemsMap.get(item.productId) || { ...item, quantity: 0, totalPrice: 0 };
              existingItem.quantity += item.quantity || 1;
              existingItem.totalPrice += (item.price || 0) * (item.quantity || 1);
              cartItemsMap.set(item.productId, existingItem);
          });

          // Render unique items
          cartItemsMap.forEach((item, productId) => {
              const totalPrice = item.totalPrice;
              total += totalPrice;
              const itemDiv = document.createElement('div');
              itemDiv.classList.add('cart-item');
              itemDiv.innerHTML = `
                  <img src="${item.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100';">
                  <div class="item-details">
                      <br><strong>${item.name} x${item.quantity}</strong> (ID: ${productId})
                      <br>Total Price: $<span class="item-total">${totalPrice.toFixed(2)}</span>
                      <br><button onclick="updateCartQuantity('${productId}', ${item.quantity + 1})">+</button>
                      <button onclick="updateCartQuantity('${productId}', ${item.quantity - 1})">-</button>
                  </div>
              `;
              cartListDiv.appendChild(itemDiv);
          });

          cartTotalSpan.innerText = total.toFixed(2);
      })
      .catch(err => console.error(err));
}

// Update Cart Quantity
// Update Cart Quantity
function updateCartQuantity(productId, newQuantity) {
  if (!currentUser) return;

  const cartRef = db.collection('users').doc(currentUser.uid).collection('cart');
  if (newQuantity <= 0) {
      // Delete all documents for this productId
      cartRef.where('productId', '==', productId).get()
          .then(snapshot => {
              snapshot.forEach(doc => doc.ref.delete());
              updateCartBadge();
              loadCart();
          });
  } else {
      // Update quantity for all documents with this productId
      cartRef.where('productId', '==', productId).get()
          .then(snapshot => {
              const batch = db.batch();
              snapshot.forEach(doc => {
                  batch.update(doc.ref, { quantity: newQuantity });
              });
              batch.commit().then(() => {
                  updateCartBadge();
                  loadCart();
              });
          });
  }
}

// Update Cart Badge
function updateCartBadge() {
  if (!currentUser) return;
  db.collection('users').doc(currentUser.uid).collection('cart').get()
      .then(snapshot => {
          const count = snapshot.size;
          document.querySelector('.cart-badge .badge').innerText = count;
      });
}

// Place Order
// app.js - Modify the placeOrderBtn event listener
document.getElementById('placeOrderBtn').addEventListener('click', () => {
  if (!currentUser) {
      alert("Please login or register first!");
      return;
  }
  const userCartRef = db.collection('users').doc(currentUser.uid).collection('cart');
  userCartRef.get().then(snapshot => {
      if (snapshot.empty) {
          alert("Your cart is empty!");
          return;
      }
      let cartItems = [];
      snapshot.forEach(doc => cartItems.push({ id: doc.id, ...doc.data() }));
      // const variants = cartItems.map(item => ({
      //     productId: item.productId,
      //     quantity: item.quantity,
      //     price: item.price,
      //     name: item.name,
      //     imageUrl: item.imageUrl
      // })
      // Inside the placeOrderBtn event listener, when building the items array
const items = cartItems.map(item => ({
  productId: item.productId,
  name: item.name,
  price: item.price,
  quantity: item.quantity,
  totalPrice: item.totalPrice,
  category: item.category || 'Unknown' // Ensure category is included
})
    );
      const totalAmount = variants.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      // Check if this is at least the user's second order and if they have credit points
      Promise.all([
          db.collection('orders').where('userId', '==', currentUser.uid).get(), // Check order history
          db.collection('users').doc(currentUser.uid).get() // Get user's credit points
      ]).then(([ordersSnapshot, userDoc]) => {
          const orderCount = ordersSnapshot.size;
          const userData = userDoc.data();
          const availableCreditPoints = userData.creditPoints || 0;

          // Create the order
          db.collection('orders').add({
              userId: currentUser.uid,
              items: variants,
              totalAmount: totalAmount,
              status: 'pending',
              paymentStatus: 'pending',
              orderDate: firebase.firestore.FieldValue.serverTimestamp()
          }).then(orderRef => {
              currentOrder = { id: orderRef.id, totalAmount, cartItems: snapshot };

              // If this is at least the second order and user has credit points, show the credit points modal
              if (orderCount > 0 && availableCreditPoints > 0) {
                  document.getElementById('availableCreditPoints').innerText = availableCreditPoints;
                  document.getElementById('creditPointsTotalAmount').innerText = totalAmount.toFixed(2);
                  document.getElementById('creditPointsModal').style.display = 'flex';
              } else {
                  // Otherwise, proceed directly to payment
                  currentOrder.creditPointsUsed = 0; // No points used
                  document.getElementById('paymentAmount').innerText = totalAmount.toFixed(2);
                  document.getElementById('paymentModal').style.display = 'flex';
              }
          });
      });
  });
});

// Generate Invoice as PDF
function generateInvoice(orderId, cartItems, totalAmount, paymentMethod) {
  const { jsPDF } = window.jspdf; // Access jsPDF from the global scope
  const doc = new jsPDF();

  // Set up the invoice header
  doc.setFontSize(20);
  doc.text("InstGo Invoice", 20, 20);
  doc.setFontSize(12);
  doc.text(`Order ID: ${orderId}`, 20, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 40);

  // User Information
  doc.setFontSize(14);
  doc.text("Customer Information", 20, 60);
  doc.setFontSize(12);
  doc.text(`Name: ${currentUser.displayName || 'N/A'}`, 20, 70);
  doc.text(`Email: ${currentUser.email}`, 20, 80);

  // Order Details Header
  doc.setFontSize(14);
  doc.text("Order Details", 20, 100);
  doc.setFontSize(12);

  // Table Headers
  doc.text("Item", 20, 110);
  doc.text("Quantity", 80, 110);
  doc.text("Price", 120, 110);
  doc.text("Total", 160, 110);
  doc.line(20, 112, 190, 112); // Horizontal line under headers

  // Table Rows (Order Items)
  let yPosition = 120;
  cartItems.forEach((item, index) => {
      const totalPrice = (item.price || 0) * (item.quantity || 1);
      doc.text(item.name || 'Unknown Item', 20, yPosition);
      doc.text(`${item.quantity || 1}`, 80, yPosition);
      doc.text(`$${item.price.toFixed(2)}`, 120, yPosition);
      doc.text(`$${totalPrice.toFixed(2)}`, 160, yPosition);
      yPosition += 10;
  });

  // Total Amount
  doc.line(20, yPosition, 190, yPosition); // Horizontal line before total
  yPosition += 10;
  doc.setFontSize(14);
  doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, yPosition);
  doc.setFontSize(12);
  doc.text(`Payment Method: ${paymentMethod}`, 20, yPosition + 10);

  // Footer
  doc.setFontSize(10);
  doc.text("Thank you for shopping with InstGo!", 20, yPosition + 30);
  doc.text("Contact us at support@instgo.com for any queries.", 20, yPosition + 40);

  // Download the PDF
  doc.save(`InstGo_Invoice_${orderId}.pdf`);
}
// Process Payment
// app.js - Inside the processPaymentBtn event listener
// Process Payment
document.getElementById('processPaymentBtn').addEventListener('click', () => {
  if (!currentOrder || !currentUser) {
      alert("Please login or register first!");
      return;
  }

  const paymentMethod = document.getElementById('paymentMethod').value;
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const expiryDate = document.getElementById('expiryDate').value.trim();
  const cvv = document.getElementById('cvv').value.trim();

  // Basic validation
  if (!paymentMethod || !cardNumber || !expiryDate || !cvv) {
      alert("Please fill all payment details!");
      return;
  }

  if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      alert("Please enter a valid 16-digit card number!");
      return;
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      alert("Please enter a valid expiry date in MM/YY format!");
      return;
  }

  if (!/^\d{3}$/.test(cvv)) {
      alert("Please enter a valid 3-digit CVV!");
      return;
  }

  const transactionId = `TXN${Date.now()}`;
  const creditPointsUsed = currentOrder.creditPointsUsed || 0;

  // Prepare cart items for the invoice
  const cartItems = currentOrder.cartItems.docs.map(doc => {
      const item = doc.data();
      return {
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: (item.price || 0) * (item.quantity || 1)
      };
  });
  const totalAmount = currentOrder.totalAmount;

  setTimeout(() => {
      db.collection('payments').add({
          userId: currentUser.uid,
          orderId: currentOrder.id,
          amount: totalAmount,
          paymentMethod: paymentMethod,
          transactionId: transactionId,
          status: 'completed',
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          creditPointsUsed: creditPointsUsed
      }).then(() => {
          return db.collection('orders').doc(currentOrder.id).update({
              status: 'confirmed',
              paymentStatus: 'paid',
              creditPointsUsed: creditPointsUsed
          });
      }).then(() => {
          // Award credit points based on the final amount paid
          const finalAmount = totalAmount;
          const pointsEarned = Math.floor(finalAmount / 10);

          return db.collection('users').doc(currentUser.uid).update({
              creditPoints: firebase.firestore.FieldValue.increment(pointsEarned)
          }).then(() => {
              // Generate the invoice after payment success
              generateInvoice(currentOrder.id, cartItems, totalAmount, paymentMethod);

              // Clear the cart
              const batch = db.batch();
              currentOrder.cartItems.forEach(doc => batch.delete(doc.ref));
              return batch.commit().then(() => {
                  alert(`Payment successful! Order confirmed. You earned ${pointsEarned} credit points.`);
                  document.getElementById('paymentModal').style.display = 'none';
                  updateCartBadge();
                  loadCart();
                  loadOrderHistory();
                  currentOrder = null;
              });
          });
      }).catch(err => {
          console.error("Payment failed:", err);
          alert("Payment failed: " + err.message);
      });
  }, 1000);
});
// app.js - Add functions to handle credit points modal
function closeCreditPointsModal() {
  document.getElementById('creditPointsModal').style.display = 'none';
}

// Handle "Yes, Use Points" button
document.getElementById('useCreditPointsBtn').addEventListener('click', () => {
  const availableCreditPoints = parseInt(document.getElementById('availableCreditPoints').innerText);
  let totalAmount = currentOrder.totalAmount;

  // Deduct credit points (1 point = $1)
  const pointsToUse = Math.min(availableCreditPoints, totalAmount); // Use only up to the total amount
  totalAmount -= pointsToUse; // Deduct points from total
  currentOrder.totalAmount = totalAmount; // Update the order amount
  currentOrder.creditPointsUsed = pointsToUse; // Track points used

  // Update user's credit points in Firestore
  db.collection('users').doc(currentUser.uid).update({
      creditPoints: firebase.firestore.FieldValue.increment(-pointsToUse)
  }).then(() => {
      // Update the order with the new total amount
      db.collection('orders').doc(currentOrder.id).update({
          totalAmount: totalAmount
      }).then(() => {
          alert(`Used ${pointsToUse} credit points. New total: $${totalAmount.toFixed(2)}`);
          document.getElementById('creditPointsModal').style.display = 'none';
          document.getElementById('paymentAmount').innerText = totalAmount.toFixed(2);
          document.getElementById('paymentModal').style.display = 'flex';
      });
  });
});

// Handle "No, Skip" button
document.getElementById('skipCreditPointsBtn').addEventListener('click', () => {
  currentOrder.creditPointsUsed = 0; // No points used
  document.getElementById('creditPointsModal').style.display = 'none';
  document.getElementById('paymentAmount').innerText = currentOrder.totalAmount.toFixed(2);
  document.getElementById('paymentModal').style.display = 'flex';
});
// Cancel Payment
document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
  document.getElementById('paymentModal').style.display = 'none';
});

document.querySelector('.modal .close').addEventListener('click', () => {
  document.getElementById('paymentModal').style.display = 'none';
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut().then(() => {
      currentUser = null;
      alert("Logged out successfully.");
      document.getElementById('logoutBtn').style.display = 'none';
      showSection('home');
  });
});

// Load Order History
function loadOrderHistory() {
  if (!currentUser) {
      document.getElementById('orderHistoryList').innerHTML = "Please login or register to view your order history.";
      return;
  }
  const orderHistoryDiv = document.getElementById('orderHistoryList');
  orderHistoryDiv.innerHTML = "Loading order history...";

  db.collection('orders').where('userId', '==', currentUser.uid).get()
      .then(snapshot => {
          orderHistoryDiv.innerHTML = "";
          if (snapshot.empty) {
              orderHistoryDiv.innerHTML = "No orders found.";
              return;
          }
          snapshot.forEach(doc => {
              const order = doc.data();
              const orderDiv = document.createElement('div');
              orderDiv.classList.add('order-item');
              orderDiv.innerHTML = `
                  <h3>Order ID: ${doc.id}</h3>
                  <p>Date: ${order.orderDate?.toDate().toLocaleDateString() || 'N/A'}</p>
                  <p>Total Amount: $${order.totalAmount?.toFixed(2) || '0.00'}</p>
                  <p>Status: ${order.status}</p>
                  <p>Payment Status: ${order.paymentStatus}</p>
                  <button class="btn btn-outline" onclick="viewOrderDetails('${doc.id}')">View Details</button>
              `;
              orderHistoryDiv.appendChild(orderDiv);
          });
      })
      .catch(err => {
          console.error("Error loading order history:", err);
          orderHistoryDiv.innerHTML = "Error loading order history.";
      });
}

// View Order Details (Placeholder)
function viewOrderDetails(orderId) {
  alert(`Viewing details for Order ID: ${orderId}`);
}

// Auth State Listener
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
      document.getElementById('logoutBtn').style.display = 'block';
      updateCartBadge();
      loadOrderHistory();
  } else {
      document.getElementById('logoutBtn').style.display = 'none';
      document.querySelector('.cart-badge .badge').innerText = '0';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
  loadFeaturedProducts();
}); 
// Pay Now
function payNow() {
  if (!currentUser) {
      alert("Please login or register first!");
      return;
  }

  const paymentMethod = document.getElementById('paymentMethod').value;
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const expiryDate = document.getElementById('expiryDate').value.trim();
  const cvv = document.getElementById('cvv').value.trim();

  if (!paymentMethod || !cardNumber || !expiryDate || !cvv) {
      alert("Please fill all payment details!");
      return;
  }

  // Validate card number (simple check for demo purposes)
  if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      alert("Please enter a valid 16-digit card number!");
      return;
  }

  // Validate expiry date (MM/YY format)
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      alert("Please enter a valid expiry date in MM/YY format!");
      return;
  }

  // Validate CVV (3 digits)
  if (!/^\d{3}$/.test(cvv)) {
      alert("Please enter a valid 3-digit CVV!");
      return;
  }

  // Fetch cart items to include in the order
  db.collection('users').doc(currentUser.uid).collection('cart').get()
      .then(snapshot => {
          if (snapshot.empty) {
              alert("Your cart is empty!");
              return;
          }

          const cartItems = [];
          let totalAmount = 0;

          // Group items by productId to avoid duplicates (as implemented previously)
          const cartItemsMap = new Map();
          snapshot.forEach(doc => {
              const item = doc.data();
              const existingItem = cartItemsMap.get(item.productId) || { ...item, quantity: 0, totalPrice: 0 };
              existingItem.quantity += item.quantity || 1;
              existingItem.totalPrice += (item.price || 0) * (item.quantity || 1);
              cartItemsMap.set(item.productId, existingItem);
          });

          cartItemsMap.forEach(item => {
              cartItems.push({
                  productId: item.productId,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
              });
              totalAmount += item.totalPrice;
          });

          // Generate a unique order ID
          const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          // Save the order to Firestore
          const orderData = {
              userId: currentUser.uid,
              userEmail: currentUser.email,
              items: cartItems,
              totalAmount: totalAmount,
              paymentMethod: paymentMethod,
              status: 'Placed',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          db.collection('orders').doc(orderId).set(orderData)
              .then(() => {
                  // Generate and download the invoice
                  generateInvoice(orderId, cartItems, totalAmount, paymentMethod);

                  // Clear the cart after successful payment
                  const batch = db.batch();
                  snapshot.forEach(doc => {
                      batch.delete(doc.ref);
                  });
                  batch.commit().then(() => {
                      alert("Payment successful! Your order has been placed.");
                      updateCartBadge();
                      loadCart();
                      closeModal('paymentModal');
                  });
              })
              .catch(err => {
                  console.error("Error placing order:", err);
                  alert("Error placing order. Please try again.");
              });
      })
      .catch(err => {
          console.error("Error fetching cart:", err);
          alert("Error processing payment. Please try again.");
      });
}
// Generate Invoice as PDF
function generateInvoice(orderId, cartItems, totalAmount, paymentMethod) {
  try {
      console.log("Starting invoice generation...");
      console.log("Order ID:", orderId);
      console.log("Cart Items:", cartItems);
      console.log("Total Amount:", totalAmount);
      console.log("Payment Method:", paymentMethod);

      // Check if jsPDF is available
      if (!window.jspdf || !window.jspdf.jsPDF) {
          throw new Error("jsPDF library is not loaded.");
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      console.log("jsPDF instance created:", doc);

      // Set up the invoice header
      doc.setFontSize(20);
      doc.text("InstGo Invoice", 20, 20);
      doc.setFontSize(12);
      doc.text(`Order ID: ${orderId}`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 40);

      // User Information
      doc.setFontSize(14);
      doc.text("Customer Information", 20, 60);
      doc.setFontSize(12);
      doc.text(`Name: ${currentUser.displayName || 'N/A'}`, 20, 70);
      doc.text(`Email: ${currentUser.email}`, 20, 80);

      // Order Details Header
      doc.setFontSize(14);
      doc.text("Order Details", 20, 100);
      doc.setFontSize(12);

      // Table Headers
      doc.text("Item", 20, 110);
      doc.text("Quantity", 80, 110);
      doc.text("Price", 120, 110);
      doc.text("Total", 160, 110);
      doc.line(20, 112, 190, 112); // Horizontal line under headers

      // Table Rows (Order Items)
      let yPosition = 120;
      cartItems.forEach((item, index) => {
          console.log(`Processing item ${index + 1}:`, item);
          const totalPrice = (item.price || 0) * (item.quantity || 1);
          doc.text(item.name || 'Unknown Item', 20, yPosition);
          doc.text(`${item.quantity || 1}`, 80, yPosition);
          doc.text(`$${item.price.toFixed(2)}`, 120, yPosition);
          doc.text(`$${totalPrice.toFixed(2)}`, 160, yPosition);
          yPosition += 10;
      });

      // Total Amount
      doc.line(20, yPosition, 190, yPosition); // Horizontal line before total
      yPosition += 10;
      doc.setFontSize(14);
      doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, yPosition);
      doc.setFontSize(12);
      doc.text(`Payment Method: ${paymentMethod}`, 20, yPosition + 10);

      // Footer
      doc.setFontSize(10);
      doc.text("Thank you for shopping with InstaGo!", 20, yPosition + 30);
      doc.text("Contact us at support@instgo.com for any queries.", 20, yPosition + 40);

      // Download the PDF
      console.log("Attempting to save PDF...");
      doc.save(`InstGo_Invoice_${orderId}.pdf`);
      console.log("PDF saved successfully.");
  } catch (error) {
      console.error("Error generating invoice:", error);
      alert(`Failed to generate invoice: ${error.message}`);
  }
}