<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/3514/3514491.png" alt="Basketry Logo" width="80" />
  <h1>Basketry - E-Commerce Admin & Order Management System</h1>
  <p><strong>Course: Web Technology • Lead Developer & System Architect: Navaneeth S</strong></p>
  <p>A high-performance, enterprise-grade full-stack MERN retail and order fulfillment platform with INR-only pricing, real-time delivery tracking, third-party API synchronization, and automated business data visualization.</p>
</div>

---

## 👨‍💻 Project & Developer Details

- **Project Name:** Basketry
- **Developer / Author:** Navaneeth S
- **Subject / Domain:** Web Technology — E-Commerce Admin & Order Management System
- **Year / Market Standard:** 2026 Enterprise Retail Ready

---

## 🎯 Syllabus Objectives & Implementation Matrix

| Syllabus Objective | Basketry Enterprise Implementation |
| :--- | :--- |
| **1. Manage Products, Categories & Inventory** | Centralised product catalog with SKU codes, category filtering, brand classification, real-time stock deductions on checkout, low-stock alerts, and quick inline stock replenishment (+5 / -1) in Admin. |
| **2. Process Customer Orders & Payments** | Dual checkout workflows: **Razorpay Payment Gateway** (HMAC-SHA256 signature verification) and **Instant MNC Sandbox Gateway** (for instant automated testing/grading without ad-blocker popups). Atomic inventory reservations with rollback safety. |
| **3. Track Order Status & Delivery** | End-to-end journey from warehouse shelf to customer doorstep across 6 fulfillment stages: `Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered`. Interactive public tracker (`/track/:orderId`), carrier metadata, GPS dispatch hubs, and full operator audit history. |
| **4. Sales & Performance Reports** | Automated SVG sales trend charts, order pipeline status distribution, category revenue breakdown, top products leaderboard, and 1-click **Export Sales Report to CSV** for corporate MNC audits. |
| **5. Real-World E-Commerce Workflows** | INR-only pricing, tax invoices (`InvoiceModal`), operator audit trails with ISO timestamps, and supplier partner synchronization. |

---

## 🛠 Tech Stack Details

- **Frontend:** Pure React.js (`react-scripts`), Redux Toolkit (Cart state management), React Router DOM v6, AuthContext API (JWT user sessions), CurrencyContext (INR price formatting).
- **Backend:** Node.js, Express.js architecture mapped with modular MVC controllers and middleware.
- **Database:** MongoDB (via Mongoose schemas with indexed SKUs, relational user references, and order status timelines).
- **Third-Party APIs:** DummyJSON Supplier Catalog API, Razorpay Payment Gateway, Cloudinary Image Storage API.
- **Automated Reporting:** Native SVG responsive data visualizations and RFC 4180 compliant CSV transaction streaming.



### 3️⃣ Run Servers
Run this single command at the project root to start both Backend (Port 5000) and Frontend (Port 3000):
```bash
npm run dev
```

<div align="center">
  <p><strong>Basketry • Web Technology Course Project</strong></p>
  <p>Designed, Engineered & Documented by <strong>Navaneeth S</strong> © 2026</p>
</div>
