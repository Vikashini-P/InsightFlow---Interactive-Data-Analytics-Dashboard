/* =========================================================
   INSIGHTFLOW DASHBOARD
   FINAL DATA + CHART + FILTER + SEARCH SCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    /* =====================================================
       VARIABLES
    ===================================================== */

    let allData = [];
    let filteredData = [];
    let customersData = [];

    let salesTrendChart = null;
    let categoryChart = null;
    let regionChart = null;
    let profitChart = null;


    /* =====================================================
       SHORT DOM HELPER
    ===================================================== */

    const $ = (id) => document.getElementById(id);


    /* =====================================================
       FORMATTERS
    ===================================================== */

    function formatCurrency(value) {

        return "$" + Number(value || 0).toLocaleString("en-US", {
            maximumFractionDigits: 0
        });

    }


    function formatNumber(value) {

        return Number(value || 0).toLocaleString("en-US");

    }


    function parseNumeric(value) {

        if (value === null || value === undefined) {
            return 0;
        }

        const cleaned = String(value)
            .replace(/[$,%\s]/g, "")
            .replace(/,/g, "")
            .trim();

        const result = Number(cleaned);

        return Number.isFinite(result) ? result : 0;
    }


    /* =====================================================
       LOAD CHART.JS IF NOT AVAILABLE
    ===================================================== */

    async function ensureChartJS() {

        if (typeof Chart !== "undefined") {
            return true;
        }

        return new Promise((resolve) => {

            const script = document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";

            script.onload = function () {
                console.log("Chart.js loaded successfully.");
                resolve(true);
            };

            script.onerror = function () {
                console.error("Chart.js could not be loaded.");
                resolve(false);
            };

            document.head.appendChild(script);

        });
    }


    /* =====================================================
       CSV PARSER
       Supports quoted commas
    ===================================================== */

    function parseCSV(text) {

        const rows = [];

        let row = [];
        let value = "";
        let quoted = false;

        for (let i = 0; i < text.length; i++) {

            const char = text[i];
            const next = text[i + 1];

            if (char === '"' && quoted && next === '"') {

                value += '"';
                i++;

            } else if (char === '"') {

                quoted = !quoted;

            } else if (char === "," && !quoted) {

                row.push(value.trim());
                value = "";

            } else if (
                (char === "\n" || char === "\r") &&
                !quoted
            ) {

                if (char === "\r" && next === "\n") {
                    i++;
                }

                row.push(value.trim());

                if (row.some(cell => cell !== "")) {
                    rows.push(row);
                }

                row = [];
                value = "";

            } else {

                value += char;
            }
        }


        if (value !== "" || row.length > 0) {

            row.push(value.trim());

            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }
        }


        if (!rows.length) {
            return [];
        }


        const headers = rows[0].map(header =>
            header
                .replace(/^\uFEFF/, "")
                .trim()
        );


        return rows.slice(1).map(row => {

            const object = {};

            headers.forEach((header, index) => {
                object[header] =
                    row[index] !== undefined
                        ? row[index].trim()
                        : "";
            });

            return object;
        });
    }


    /* =====================================================
       NORMALIZE CSV DATA
    ===================================================== */

    function normalizeData(rows) {

        return rows.map(row => {

            const date = new Date(
                String(row.Order_Date || "").trim()
            );


            return {

                Order_ID:
                    String(row.Order_ID || "").trim(),

                Order_Date:
                    date,

                Customer_Name:
                    String(row.Customer_Name || "").trim(),

                Customer_Segment:
                    String(row.Customer_Segment || "").trim(),

                Country:
                    String(row.Country || "").trim(),

                Region:
                    String(row.Region || "").trim(),

                Product_Category:
                    String(row.Product_Category || "").trim(),

                Product_Name:
                    String(row.Product_Name || "").trim(),

                Quantity:
                    parseNumeric(row.Quantity),

                Unit_Price:
                    parseNumeric(row.Unit_Price),

                Discount_Percent:
                    parseNumeric(row.Discount_Percent),

                Total_Sales:
                    parseNumeric(row.Total_Sales),

                Shipping_Cost:
                    parseNumeric(row.Shipping_Cost),

                Profit:
                    parseNumeric(row.Profit),

                Payment_Method:
                    String(row.Payment_Method || "").trim()
            };

        }).filter(row =>
            row.Order_ID ||
            row.Customer_Name ||
            row.Product_Name
        );
    }


    /* =====================================================
       TRY MULTIPLE CSV PATHS
    ===================================================== */

    async function fetchCSV() {

        const paths = [

            "data/global_ecommerce_sales.csv",

            "./data/global_ecommerce_sales.csv",

            "../data/global_ecommerce_sales.csv",

            "global_ecommerce_sales.csv",

            "./global_ecommerce_sales.csv"

        ];


        let lastError = null;


        for (const path of paths) {

            try {

                console.log(
                    "Trying dataset:",
                    path
                );


                const response =
                    await fetch(
                        path + "?v=" + Date.now(),
                        {
                            cache: "no-store"
                        }
                    );


                if (!response.ok) {
                    continue;
                }


                const text =
                    await response.text();


                if (
                    text &&
                    text.length > 50
                ) {

                    console.log(
                        "Dataset loaded from:",
                        path
                    );

                    return text;
                }

            } catch (error) {

                lastError = error;
            }
        }


        throw lastError ||
            new Error(
                "global_ecommerce_sales.csv not found."
            );
    }


    /* =====================================================
       LOAD DATASET
    ===================================================== */

    async function loadDataset() {

        const status =
            $("datasetStatus");


        try {

            if (status) {

                status.innerHTML =
                    "<span></span> Connecting to dataset...";
            }


            const csvText =
                await fetchCSV();


            const parsed =
                parseCSV(csvText);


            allData =
                normalizeData(parsed);


            filteredData =
                [...allData];


            if (!allData.length) {

                throw new Error(
                    "CSV contains no usable records."
                );
            }


            console.log(
                "InsightFlow records:",
                allData.length
            );


            if (status) {

                status.innerHTML =
                    `<span></span> ${formatNumber(allData.length)} records connected`;
            }


            populateFilters();

            updateDashboard();

        } catch (error) {

            console.error(
                "Dataset loading failed:",
                error
            );


            if (status) {

                status.innerHTML =
                    "<span></span> Dataset connection failed";
            }


            updateDashboard();
        }
    }


    /* =====================================================
       FILTER VALUES
    ===================================================== */

    function uniqueValues(field) {

        return [
            ...new Set(
                allData
                    .map(row => row[field])
                    .filter(Boolean)
            )
        ].sort();
    }


    function fillSelect(
        elementId,
        values,
        defaultText
    ) {

        const select =
            $(elementId);


        if (!select) {
            return;
        }


        select.innerHTML = "";


        const first =
            document.createElement("option");

        first.value = "all";
        first.textContent = defaultText;

        select.appendChild(first);


        values.forEach(value => {

            const option =
                document.createElement("option");

            option.value = value;
            option.textContent = value;

            select.appendChild(option);
        });
    }


    function populateFilters() {

        fillSelect(
            "regionFilter",
            uniqueValues("Region"),
            "All Regions"
        );


        fillSelect(
            "categoryFilter",
            uniqueValues("Product_Category"),
            "All Categories"
        );


        fillSelect(
            "segmentFilter",
            uniqueValues("Customer_Segment"),
            "All Segments"
        );
    }


    /* =====================================================
       APPLY FILTERS
    ===================================================== */

    function applyFilters() {

        const region =
            $("regionFilter")
                ? $("regionFilter").value
                : "all";


        const category =
            $("categoryFilter")
                ? $("categoryFilter").value
                : "all";


        const segment =
            $("segmentFilter")
                ? $("segmentFilter").value
                : "all";


        filteredData =
            allData.filter(row => {

                const regionMatch =
                    region === "all" ||
                    row.Region === region;


                const categoryMatch =
                    category === "all" ||
                    row.Product_Category === category;


                const segmentMatch =
                    segment === "all" ||
                    row.Customer_Segment === segment;


                return (
                    regionMatch &&
                    categoryMatch &&
                    segmentMatch
                );
            });


        updateDashboard();
    }


    /* =====================================================
       RESET FILTERS
    ===================================================== */

    function resetFilters() {

        if ($("regionFilter")) {
            $("regionFilter").value = "all";
        }


        if ($("categoryFilter")) {
            $("categoryFilter").value = "all";
        }


        if ($("segmentFilter")) {
            $("segmentFilter").value = "all";
        }


        filteredData =
            [...allData];


        updateDashboard();
    }


    /* =====================================================
       KPI CALCULATIONS
    ===================================================== */

    function calculateMetrics(data) {

        const sales =
            data.reduce(
                (total, row) =>
                    total + row.Total_Sales,
                0
            );


        const profit =
            data.reduce(
                (total, row) =>
                    total + row.Profit,
                0
            );


        const orders =
            new Set(
                data
                    .map(row => row.Order_ID)
                    .filter(Boolean)
            ).size;


        const customers =
            new Set(
                data
                    .map(row => row.Customer_Name)
                    .filter(Boolean)
            ).size;


        return {
            sales,
            profit,
            orders,
            customers
        };
    }


    /* =====================================================
       UPDATE KPIs
    ===================================================== */

    function updateKPIs() {

        const metrics =
            calculateMetrics(filteredData);


        if ($("totalSales")) {

            $("totalSales").textContent =
                formatCurrency(metrics.sales);
        }


        if ($("totalProfit")) {

            $("totalProfit").textContent =
                formatCurrency(metrics.profit);
        }


        if ($("totalOrders")) {

            $("totalOrders").textContent =
                formatNumber(metrics.orders);
        }


        if ($("totalCustomers")) {

            $("totalCustomers").textContent =
                formatNumber(metrics.customers);
        }


        /* Hero */

        if ($("heroSales")) {

            $("heroSales").textContent =
                formatCurrency(metrics.sales);
        }


        if ($("heroProfit")) {

            $("heroProfit").textContent =
                formatCurrency(metrics.profit);
        }


        /* Other possible hero IDs */

        if ($("previewSales")) {

            $("previewSales").textContent =
                formatCurrency(metrics.sales);
        }


        if ($("previewProfit")) {

            $("previewProfit").textContent =
                formatCurrency(metrics.profit);
        }
    }


    /* =====================================================
       MONTHLY DATA
    ===================================================== */

    function monthlySales(data) {

        const labels = [
            "Jan", "Feb", "Mar",
            "Apr", "May", "Jun",
            "Jul", "Aug", "Sep",
            "Oct", "Nov", "Dec"
        ];


        const values =
            new Array(12).fill(0);


        data.forEach(row => {

            if (
                row.Order_Date instanceof Date &&
                !isNaN(row.Order_Date)
            ) {

                values[
                    row.Order_Date.getMonth()
                ] += row.Total_Sales;
            }
        });


        return {
            labels,
            values
        };
    }


    function monthlyProfit(data) {

        const values =
            new Array(12).fill(0);


        data.forEach(row => {

            if (
                row.Order_Date instanceof Date &&
                !isNaN(row.Order_Date)
            ) {

                values[
                    row.Order_Date.getMonth()
                ] += row.Profit;
            }
        });


        return values;
    }


    /* =====================================================
       CATEGORY DATA
    ===================================================== */

    function categorySales(data) {

        const result = {};


        data.forEach(row => {

            const category =
                row.Product_Category ||
                "Other";


            result[category] =
                (result[category] || 0) +
                row.Total_Sales;
        });


        const entries =
            Object.entries(result)
                .sort(
                    (a, b) => b[1] - a[1]
                );


        return {

            labels:
                entries.map(item => item[0]),

            values:
                entries.map(item => item[1])
        };
    }


    /* =====================================================
       REGION DATA
    ===================================================== */

    function regionSales(data) {

        const result = {};


        data.forEach(row => {

            const region =
                row.Region ||
                "Other";


            result[region] =
                (result[region] || 0) +
                row.Total_Sales;
        });


        const entries =
            Object.entries(result)
                .sort(
                    (a, b) => b[1] - a[1]
                );


        return {

            labels:
                entries.map(item => item[0]),

            values:
                entries.map(item => item[1])
        };
    }


    /* =====================================================
       CHART COLORS
    ===================================================== */

    const BLUE = "#5C75ED";
    const PURPLE = "#7668E8";
    const GREEN = "#20B989";
    const ORANGE = "#F2A13B";


    /* =====================================================
       CHART OPTIONS
    ===================================================== */

    function chartOptions() {

        const dark =
            document.body.classList.contains(
                "dark-mode"
            );


        const textColor =
            dark
                ? "#DCE4F2"
                : "#69758A";


        const gridColor =
            dark
                ? "rgba(255,255,255,.08)"
                : "rgba(35,50,80,.08)";


        return {

            responsive: true,

            maintainAspectRatio: false,

            animation: {
                duration: 700
            },

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {

                    labels: {

                        color: textColor,

                        font: {
                            size: 11
                        },

                        usePointStyle: true,

                        boxWidth: 9,

                        padding: 14
                    }
                },

                tooltip: {

                    backgroundColor:
                        dark
                            ? "#172139"
                            : "#171C28",

                    titleColor: "#FFFFFF",

                    bodyColor: "#FFFFFF",

                    padding: 12,

                    cornerRadius: 8
                }
            },

            scales: {

                x: {

                    ticks: {

                        color: textColor,

                        font: {
                            size: 10
                        }
                    },

                    grid: {
                        display: false
                    }
                },

                y: {

                    ticks: {

                        color: textColor,

                        font: {
                            size: 10
                        }
                    },

                    grid: {
                        color: gridColor
                    }
                }
            }
        };
    }


    /* =====================================================
       SALES TREND CHART
    ===================================================== */

    function renderSalesTrendChart() {

        const canvas =
            $("salesTrendChart");


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        if (salesTrendChart) {
            salesTrendChart.destroy();
        }


        const data =
            monthlySales(filteredData);


        const options =
            chartOptions();


        options.plugins.legend.display =
            false;


        salesTrendChart =
            new Chart(canvas, {

                type: "line",

                data: {

                    labels:
                        data.labels,

                    datasets: [

                        {

                            label: "Sales",

                            data:
                                data.values,

                            borderColor:
                                BLUE,

                            backgroundColor:
                                "rgba(92,117,237,.14)",

                            fill: true,

                            tension: .38,

                            borderWidth: 2.5,

                            pointRadius: 2,

                            pointHoverRadius: 5,

                            pointBackgroundColor:
                                BLUE,

                            pointBorderWidth: 0
                        }
                    ]
                },

                options
            });
    }


    /* =====================================================
       CATEGORY CHART
    ===================================================== */

    function renderCategoryChart() {

        const canvas =
            $("categoryChart");


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        if (categoryChart) {
            categoryChart.destroy();
        }


        const data =
            categorySales(filteredData);


        const colors = [

            BLUE,
            PURPLE,
            GREEN,
            ORANGE,
            "#8C9AF3",
            "#49C9A0",
            "#A28BEF"

        ];


        categoryChart =
            new Chart(canvas, {

                type: "doughnut",

                data: {

                    labels:
                        data.labels,

                    datasets: [

                        {

                            data:
                                data.values,

                            backgroundColor:
                                data.labels.map(
                                    (_, index) =>
                                        colors[
                                            index %
                                            colors.length
                                        ]
                                ),

                            borderWidth: 0,

                            hoverOffset: 6
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "68%",

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                color:
                                    document.body
                                        .classList
                                        .contains(
                                            "dark-mode"
                                        )
                                        ? "#DCE4F2"
                                        : "#69758A",

                                font: {
                                    size: 10
                                },

                                usePointStyle: true,

                                boxWidth: 9,

                                padding: 12
                            }
                        },

                        tooltip: {

                            backgroundColor:
                                "#171C28",

                            titleColor:
                                "#FFFFFF",

                            bodyColor:
                                "#FFFFFF",

                            padding: 11,

                            cornerRadius: 8
                        }
                    }
                }
            });
    }


    /* =====================================================
       REGION CHART
    ===================================================== */

    function renderRegionChart() {

        const canvas =
            $("regionChart");


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        if (regionChart) {
            regionChart.destroy();
        }


        const data =
            regionSales(filteredData);


        const options =
            chartOptions();


        options.indexAxis = "y";


        options.plugins.legend.display =
            false;


        options.scales.x.ticks.callback =
            function (value) {

                return "$" +
                    Number(value).toLocaleString(
                        "en-US",
                        {
                            notation: "compact",
                            maximumFractionDigits: 1
                        }
                    );
            };


        regionChart =
            new Chart(canvas, {

                type: "bar",

                data: {

                    labels:
                        data.labels,

                    datasets: [

                        {

                            label: "Sales",

                            data:
                                data.values,

                            backgroundColor:
                                BLUE,

                            borderRadius: 6,

                            borderSkipped: false
                        }
                    ]
                },

                options
            });
    }


    /* =====================================================
       SALES VS PROFIT CHART
    ===================================================== */

    function renderProfitChart() {

        const canvas =
            $("profitChart");


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        if (profitChart) {
            profitChart.destroy();
        }


        const sales =
            monthlySales(filteredData);


        const profit =
            monthlyProfit(filteredData);


        profitChart =
            new Chart(canvas, {

                type: "bar",

                data: {

                    labels:
                        sales.labels,

                    datasets: [

                        {

                            label: "Sales",

                            data:
                                sales.values,

                            backgroundColor:
                                BLUE,

                            borderRadius: 4,

                            borderSkipped: false
                        },

                        {

                            label: "Profit",

                            data:
                                profit,

                            backgroundColor:
                                GREEN,

                            borderRadius: 4,

                            borderSkipped: false
                        }
                    ]
                },

                options:
                    chartOptions()
            });
    }


    /* =====================================================
       QUICK INSIGHTS
    ===================================================== */

    function updateQuickInsights() {

        if (!filteredData.length) {

            if ($("topCategory")) {
                $("topCategory").textContent = "—";
            }

            if ($("topRegion")) {
                $("topRegion").textContent = "—";
            }

            if ($("averageOrder")) {
                $("averageOrder").textContent = "$0";
            }

            return;
        }


        const categories =
            categorySales(filteredData);


        const regions =
            regionSales(filteredData);


        const metrics =
            calculateMetrics(filteredData);


        const average =
            metrics.orders > 0
                ? metrics.sales / metrics.orders
                : 0;


        if ($("topCategory")) {

            $("topCategory").textContent =
                categories.labels[0] || "—";
        }


        if ($("topRegion")) {

            $("topRegion").textContent =
                regions.labels[0] || "—";
        }


        if ($("averageOrder")) {

            $("averageOrder").textContent =
                formatCurrency(average);
        }
    }


    /* =====================================================
       UPDATE EVERYTHING
    ===================================================== */

    function updateDashboard() {

        updateKPIs();

        updateQuickInsights();


        if (
            typeof Chart !== "undefined" &&
            filteredData.length
        ) {

            renderSalesTrendChart();

            renderCategoryChart();

            renderRegionChart();

            renderProfitChart();
        }
    }


    /* =====================================================
       CUSTOMER DATA
    ===================================================== */

    async function loadCustomers() {

        const paths = [

            "data/customers.json",

            "./data/customers.json",

            "../data/customers.json",

            "customers.json",

            "./customers.json"

        ];


        for (const path of paths) {

            try {

                const response =
                    await fetch(
                        path + "?v=" + Date.now(),
                        {
                            cache: "no-store"
                        }
                    );


                if (!response.ok) {
                    continue;
                }


                const json =
                    await response.json();


                if (Array.isArray(json)) {

                    customersData = json;

                    console.log(
                        "Customer JSON loaded:",
                        path
                    );

                    return;
                }


                if (
                    json &&
                    Array.isArray(json.customers)
                ) {

                    customersData =
                        json.customers;

                    return;
                }

            } catch (error) {

                console.warn(
                    "Customer path failed:",
                    path
                );
            }
        }


        customersData =
            buildCustomersFromCSV();
    }


    /* =====================================================
       CUSTOMER FALLBACK FROM CSV
    ===================================================== */

    function buildCustomersFromCSV() {

        const map =
            new Map();


        allData.forEach(row => {

            const name =
                row.Customer_Name;


            if (!name) {
                return;
            }


            if (!map.has(name)) {

                map.set(name, {

                    customerId:
                        "CUST-" +
                        String(
                            map.size + 1
                        ).padStart(4, "0"),

                    customerName:
                        name,

                    region:
                        row.Region,

                    totalSales:
                        0,

                    totalProfit:
                        0,

                    orders:
                        new Set()
                });
            }


            const customer =
                map.get(name);


            customer.totalSales +=
                row.Total_Sales;


            customer.totalProfit +=
                row.Profit;


            if (row.Order_ID) {

                customer.orders.add(
                    row.Order_ID
                );
            }

        });


        return [...map.values()]
            .map(customer => ({

                customerId:
                    customer.customerId,

                customerName:
                    customer.customerName,

                region:
                    customer.region,

                totalSales:
                    customer.totalSales,

                totalProfit:
                    customer.totalProfit,

                totalOrders:
                    customer.orders.size

            }));
    }


    /* =====================================================
       NORMALIZE CUSTOMER
    ===================================================== */

    function normalizeCustomer(customer) {

        return {

            customerId:
                customer.customerId ??
                customer.customer_id ??
                customer.id ??
                "—",

            customerName:
                customer.customerName ??
                customer.customer_name ??
                customer.name ??
                "Unknown Customer",

            region:
                customer.region ??
                customer.Region ??
                "—",

            totalSales:
                parseNumeric(
                    customer.totalSales ??
                    customer.total_sales ??
                    customer.sales
                ),

            totalProfit:
                parseNumeric(
                    customer.totalProfit ??
                    customer.total_profit ??
                    customer.profit
                ),

            totalOrders:
                parseNumeric(
                    customer.totalOrders ??
                    customer.total_orders ??
                    customer.orders
                )
        };
    }


    /* =====================================================
       CUSTOMER SEARCH
    ===================================================== */

    function searchCustomers(query) {

        const text =
            String(query || "")
                .trim()
                .toLowerCase();


        if (!text) {
            return [];
        }


        return customersData
            .map(normalizeCustomer)
            .filter(customer =>
                customer.customerName
                    .toLowerCase()
                    .includes(text)
            )
            .slice(0, 6);
    }


    function displaySuggestions(results) {

        const box =
            $("customerSuggestions");


        if (!box) {
            return;
        }


        if (!results.length) {

            box.innerHTML = "";

            box.style.display = "none";

            return;
        }


        box.innerHTML =
            results.map(customer => {

                return `
                    <div
                        class="customer-suggestion"
                        data-name="${escapeHTML(
                            customer.customerName
                        )}">
                        ${escapeHTML(
                            customer.customerName
                        )}
                    </div>
                `;

            }).join("");


        box.style.display =
            "block";


        box.querySelectorAll(
            ".customer-suggestion"
        ).forEach(item => {

            item.addEventListener(
                "click",
                function () {

                    const name =
                        item.dataset.name;


                    const customer =
                        customersData
                            .map(
                                normalizeCustomer
                            )
                            .find(
                                c =>
                                    c.customerName ===
                                    name
                            );


                    if (customer) {

                        if ($("customerSearch")) {

                            $("customerSearch")
                                .value =
                                customer.customerName;
                        }


                        showCustomer(customer);
                    }


                    box.style.display =
                        "none";
                }
            );
        });
    }


    function performCustomerSearch() {

        const input =
            $("customerSearch");


        if (!input) {
            return;
        }


        const results =
            searchCustomers(
                input.value
            );


        if (!results.length) {

            hideCustomerResult();

            if ($("customerMessage")) {

                $("customerMessage").textContent =
                    "No matching customer found.";
            }

            return;
        }


        showCustomer(results[0]);


        if ($("customerMessage")) {

            $("customerMessage").textContent =
                "";
        }
    }


    function showCustomer(customer) {

        const result =
            $("customerResult");


        if (!result) {
            return;
        }


        if ($("resultName")) {

            $("resultName").textContent =
                customer.customerName;
        }


        if ($("resultId")) {

            $("resultId").textContent =
                customer.customerId;
        }


        if ($("resultSales")) {

            $("resultSales").textContent =
                formatCurrency(
                    customer.totalSales
                );
        }


        if ($("resultProfit")) {

            $("resultProfit").textContent =
                formatCurrency(
                    customer.totalProfit
                );
        }


        if ($("resultOrders")) {

            $("resultOrders").textContent =
                formatNumber(
                    customer.totalOrders
                );
        }


        if ($("resultRegion")) {

            $("resultRegion").textContent =
                customer.region;
        }


        result.classList.remove(
            "hidden"
        );


        result.style.display =
            "grid";
    }


    function hideCustomerResult() {

        const result =
            $("customerResult");


        if (!result) {
            return;
        }


        result.classList.add(
            "hidden"
        );


        result.style.display =
            "none";
    }


    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       THEME
    ===================================================== */

    function setupTheme() {

        const saved =
            localStorage.getItem(
                "insightflow-theme"
            );


        if (saved === "dark") {

            document.body.classList.add(
                "dark-mode"
            );
        }


        updateThemeIcon();


        const toggle =
            $("themeToggle");


        if (!toggle) {
            return;
        }


        toggle.addEventListener(
            "click",
            function () {

                document.body.classList.toggle(
                    "dark-mode"
                );


                const dark =
                    document.body.classList.contains(
                        "dark-mode"
                    );


                localStorage.setItem(
                    "insightflow-theme",
                    dark
                        ? "dark"
                        : "light"
                );


                updateThemeIcon();


                if (filteredData.length) {

                    renderSalesTrendChart();

                    renderCategoryChart();

                    renderRegionChart();

                    renderProfitChart();
                }
            }
        );
    }


    function updateThemeIcon() {

        const icon =
            $("themeIcon");


        if (!icon) {
            return;
        }


        icon.textContent =
            document.body.classList.contains(
                "dark-mode"
            )
                ? "☀"
                : "☾";
    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    function setupFilters() {

        [
            "regionFilter",
            "categoryFilter",
            "segmentFilter"

        ].forEach(id => {

            const element =
                $(id);


            if (element) {

                element.addEventListener(
                    "change",
                    applyFilters
                );
            }
        });


        const reset =
            $("resetFilters");


        if (reset) {

            reset.addEventListener(
                "click",
                resetFilters
            );
        }
    }


    /* =====================================================
       CUSTOMER SEARCH EVENTS
    ===================================================== */

    function setupCustomerSearch() {

        const input =
            $("customerSearch");


        const button =
            $("customerSearchButton");


        if (button) {

            button.addEventListener(
                "click",
                performCustomerSearch
            );
        }


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            function () {

                const results =
                    searchCustomers(
                        input.value
                    );


                displaySuggestions(
                    results
                );
            }
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performCustomerSearch();

                    const box =
                        $("customerSuggestions");

                    if (box) {
                        box.style.display =
                            "none";
                    }
                }


                if (event.key === "Escape") {

                    const box =
                        $("customerSuggestions");

                    if (box) {
                        box.style.display =
                            "none";
                    }
                }
            }
        );


        document.addEventListener(
            "click",
            function (event) {

                const box =
                    $("customerSuggestions");


                if (
                    box &&
                    !event.target.closest(
                        "#customerSearch"
                    ) &&
                    !event.target.closest(
                        "#customerSuggestions"
                    )
                ) {

                    box.style.display =
                        "none";
                }
            }
        );
    }


    /* =====================================================
       START
    ===================================================== */

    async function startDashboard() {

        setupTheme();

        setupFilters();

        setupCustomerSearch();


        const chartReady =
            await ensureChartJS();


        if (!chartReady) {

            console.error(
                "Charts unavailable because Chart.js failed."
            );
        }


        await loadDataset();

        await loadCustomers();


        /* Render again after Chart.js + data are ready */

        if (
            chartReady &&
            filteredData.length
        ) {

            updateDashboard();
        }
    }


    startDashboard();

});