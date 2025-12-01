# Quotation Generator with P&L Analysis (v2.1)

**System Developed by Gian Samonte | © 2025 Applus Velosi**

A high-performance, full-stack capable commercial engine designed for estimating contract values, calculating profit margins, and generating financial proposals.

---

## 🧮 Mathematical Logic & Calculations

The system calculates the final Unit Rate based on a **Cost-Plus** model with specific allocations for overheads and financial instruments.

### 1. Base Logic
*   **Daily Rate**: Derived from the user-defined working days parameter (e.g., 26 or 30 days).
    $$ \text{Daily Rate} = \frac{\text{Base Monthly Salary}}{\text{Working Days}} $$

### 2. Billable Duration (Dynamic)
To ensure cost recovery for non-billable periods (Annual Leave), the system calculates the effective billable months.
$$ \text{Leave Months} = \frac{\text{Annual Leave Days}}{\text{Working Days}} $$
$$ \text{Billable Months} = \text{Contract Duration} - \left( \frac{\text{Contract Duration}}{12} \times \text{Leave Months} \right) $$

### 3. Direct Costs (Per Person/Month)
*   **Allowances**: Sum of HRA, Food, Transport, and Others.
*   **Benefits (Accruals)**: Annualized costs converted to monthly.
    $$ \text{Benefit Cost} = \text{Daily Rate} \times \frac{\text{Benefit Days}}{12} $$
    (Includes: Leave, Sick, Holiday, EOSB)

### 4. Indirect & Overhead Costs
*   **Coordination Cost**: A percentage applied to the personnel cost.
    $$ \text{Coordination} = (\text{Base} + \text{Allowances} + \text{Leave Pay}) \times \text{Coordination \%} $$
*   **Company Overheads**: Fixed monthly costs per person.
    (Sum of Accommodation, Transport, Fuel, Medical, Visa, PPE, Gate Pass, and 1/12th of Air Ticket).
*   **Global Sub-Contractor Allocation**:
    $$ \text{SubCon Alloc} = \frac{\text{Total Monthly SubCon Cost}}{\text{Total Headcount}} $$

### 5. Total Cost Stack
$$ \text{Total Monthly Cost} = \text{Base} + \text{Allowances} + \text{Benefits} + \text{Coordination} + \text{Overheads} + \text{SubCon Alloc} $$

### 6. Revenue & Pricing
*   **Target Revenue (Margin)**:
    $$ \text{Target Revenue} = \frac{\text{Total Cost}}{1 - \text{Margin \%}} $$
*   **Final Revenue (Bank Guarantee Gross-Up)**:
    $$ \text{Total Contract Value} = \frac{\text{Target Revenue}}{1 - \text{Bank Guarantee \%}} $$
*   **Unit Monthly Rate**:
    $$ \text{Unit Rate} = \frac{\text{Total Contract Value}}{\text{Billable Months}} $$

---

## 🚀 Features

-   **Dynamic Cost Matrix**: Real-time calculation of project costs based on manpower, duration, and overheads.
-   **Excel Integration**: 
    -   Import legacy costing sheets (Auto-detects "Qty" column).
    -   Export detailed vertical P&L statements.
-   **Visual Analytics**: Real-time KPI ratios (Personnel/Revenue, Overhead/Revenue).

---

## 📚 Excel Data Structure

To upload your own data, use the **"Blank Template"** feature or create an Excel file with the following sheets:

| Sheet Name | Columns Required |
| :--- | :--- |
| **Reference Salary (A)** | `Position Title`, `Basic Salary`, `Tools Cost`, `Qty` |
| **Clients** | `Client Name`, `Address`, `Attention` |
| **Parameters** | `Parameter`, `Value`, `Enabled` |

---

**© 2025 Applus Velosi**