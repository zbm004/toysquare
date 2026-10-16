# Toysquare

Build a web-based Point of Sale (POS) and Inventory Management System tailored for a retail toy kiosk. The application should have a clean, modern, mobile dark-mode interface with simple tab navigation.

Key Features & Specifications:

1. POS / Checkout Screen:
- Product Grid: Display items with image/icon, item name, price, category (Squishies, Walking Animals, Anime Figures, RC Cars, Keychains, Other), and current stock badge.
- Search & Filter: Quick search bar and category filter tabs to easily locate items during a transaction.
- Interactive Shopping Cart: Add/remove items, adjust quantities, select payment method (Cash, Card), apply custom discounts, calculate tax,  card machine tax and complete checkout.

2. Custom Inventory Management:
- Product List: Table/card view showing item name, category, cost price (expenses per unit), selling price, current stock level, low stock alert status, and unit profit margin.
- Add/Edit/Delete Items: Ability to manually add new toy inventory items, edit existing product details (pricing, stock levels), or delete discontinued products.
- Low-Stock Alerts: Highlight items when stock drops below 5 units.

3. Monthly Sales, Profit & Expenses Tracker:
- Financial Metrics Cards: Real-time summary cards displaying Total Revenue, Total Cost of Goods Sold (Expenses), Net Profit, and overall Profit Margin %.
- Monthly Breakdown Sheet / Data Table: Detailed sheet listing sales logs grouped by month and date, including transaction IDs, items sold, unit costs, selling prices, and net earnings.
- Date Filtering: Allow filtering financial reports and sales history by Today, This Week, This Month, and All Time.

4. Visual Analytics & Bar Graphs:
- Interactive Bar Graph: Display a monthly revenue vs. expenses vs. net profit comparison bar chart.
- Category Breakdown: A visual bar chart or pie chart showing total items sold by product category (e.g., Squishies vs. Anime Figures vs. RC Cars).

5. Data Storage:
- Use local browser storage (localStorage) or database persistence so inventory updates, transactions, and sales data persist after refreshing. Include a "Reset Demo Data" option for testing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/199d132f-afd0-46e9-921e-514dabde20d2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
