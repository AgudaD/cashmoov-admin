<script>
      // Global token for API requests
      const token = new URLSearchParams(window.location.search).get("token");
      let currentTransactionsPage = 0;
      let currentDetailedRemittancePage = 0;
      let currentConfigurationPage = 0;
      const transactionsPageSize = 10;
      let currentTransactionTab = "standard";
      let currentUsersPage = 0;
      const usersPageSize = 5;

      // Utility Functions
      function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = "block";
      }

      function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = "none";
      }

      function positionDropdown(button, dropdown) {
        const btnRect = button.getBoundingClientRect();
        const dropdownWidth = dropdown.offsetWidth;
        const dropdownHeight = dropdown.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Position below the button by default
        let top = btnRect.bottom + window.scrollY; // Account for vertical scroll
        let left = btnRect.left + window.scrollX; // Account for horizontal scroll

        // Adjust if dropdown would overflow right edge
        if (left + dropdownWidth > viewportWidth) {
          left = btnRect.right + window.scrollX - dropdownWidth;
        }

        // Adjust if dropdown would overflow bottom edge
        if (top + dropdownHeight > viewportHeight + window.scrollY) {
          top = btnRect.top + window.scrollY - dropdownHeight; // Position above button
        }

        // Ensure it doesn’t go off-screen on the left or top
        left = Math.max(0, left);
        top = Math.max(0, top);

        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
      }

      function showSuccess(msg) {
        document.getElementById("successMessage").textContent = msg;
        showModal("successModal");
      }

      function showError(msg) {
        document.getElementById("errorMessage").textContent = msg;
        showModal("errorModal");
      }

      // Initialize page
      document.addEventListener("DOMContentLoaded", () => {
        if (!token) {
          window.location.href = `../signin.html?redirect=/BackOffice/management.html`;
          return;
        }
        window.history.replaceState({}, document.title, "management.html");

        setupTabs();
        setupBillsPayment();
        setupClientManagement();
        setupProductManagement();
        setupUserManagement();
        setupForms();
        setupModalEventListeners();

        fetchBillsPaymentData();

        // Ensure Start Date and End Date are not the same
        document
          .getElementById("startDate")
          .addEventListener("change", function () {
            const startDate = this.value;
            const endDateInput = document.getElementById("endDate");

            // Set min attribute for endDate to be at least one day after startDate
            if (startDate) {
              const nextDay = new Date(startDate);
              nextDay.setDate(nextDay.getDate() + 1);
              const minEndDate = nextDay.toISOString().split("T")[0];
              endDateInput.setAttribute("min", minEndDate);

              // Clear endDate if it's less than or equal to startDate
              if (endDateInput.value && endDateInput.value <= startDate) {
                endDateInput.value = "";
              }
            }
          });

        document
          .getElementById("endDate")
          .addEventListener("change", function () {
            const endDate = this.value;
            const startDateInput = document.getElementById("startDate");

            // Ensure endDate is after startDate
            if (startDateInput.value && endDate <= startDateInput.value) {
              this.value = "";
              alert("End Date must be after Start Date.");
            }
          });
      });

      // Tab Switching
      function setupTabs() {
        const tabs = [
          "billsPayment",
          "clientManagement",
          "productManagement",
          "userManagement",
        ];
        tabs.forEach((tab) => {
          const tabElement = document.getElementById(`${tab}Tab`);
          if (tabElement) {
            tabElement.addEventListener("click", () => {
              tabs.forEach((t) => {
                document.getElementById(`${t}Content`).classList.add("hidden");
                document
                  .getElementById(`${t}Tab`)
                  .classList.remove("border-b-2", "border-blue-500");
              });
              document
                .getElementById(`${tab}Content`)
                .classList.remove("hidden");
              document
                .getElementById(`${tab}Tab`)
                .classList.add("border-b-2", "border-blue-500");
              if (tab === "billsPayment") fetchBillsPaymentData();
              if (tab === "clientManagement") fetchClientManagementData();
              if (tab === "productManagement") fetchProductManagementData();
              if (tab === "userManagement") fetchUserManagementData();
            });
          }
        });
      }

      async function populateConfigurationDropdowns() {
  const providerSelect = document.querySelector("#addConfigurationModal #providerId");
  const categorySelect = document.querySelector("#addConfigurationModal #configCategoryId");

  alert("Starting to populate configuration dropdowns...");
  console.log("Populating configuration dropdowns...");
  console.log("providerSelect:", providerSelect ? providerSelect.outerHTML : "Not found");
  console.log("categorySelect:", categorySelect ? categorySelect.outerHTML : "Not found");

  if (!providerSelect || !categorySelect) {
    const errorMsg = "Error: Configuration dropdowns not found in addConfigurationModal.";
    alert(errorMsg);
    console.error(errorMsg, { providerSelect, categorySelect });
    showError(errorMsg);
    return;
  }

  if (!(providerSelect instanceof HTMLSelectElement)) {
    const errorMsg = "Error: providerId is not a select element.";
    alert(errorMsg);
    console.error(errorMsg, providerSelect);
    showError(errorMsg);
    return;
  }

  if (!(categorySelect instanceof HTMLSelectElement)) {
    const errorMsg = "Error: configCategoryId is not a select element.";
    alert(errorMsg);
    console.error(errorMsg, categorySelect);
    showError(errorMsg);
    return;
  }

  try {
    // Fetch providers
    alert("Fetching providers...");
    console.log("Fetching providers...");
    const providerResponse = await fetch("http://45.91.171.213:9080/api/manage/bills-payment/providers", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!providerResponse.ok) {
      const errorText = await providerResponse.text();
      const errorMsg = `Failed to fetch providers: ${errorText || providerResponse.status}`;
      alert(errorMsg);
      throw new Error(errorMsg);
    }
    const providerData = await providerResponse.json();
    console.log("Raw providers response:", JSON.stringify(providerData, null, 2));
    providerSelect.innerHTML = '<option value="" disabled selected>Select a provider</option>';
    if (providerData.data?.length) {
      // Filter providers likely to be valid Bills Payment Providers
      const validProviders = providerData.data.filter(provider => 
        provider && 
        provider.id && 
        !isNaN(parseInt(provider.id)) && 
        ["MULTI CHOICE NIGERIA", "Eko Electric", "GOTV"].includes(provider.providerName)
      );
      console.log("Valid providers:", JSON.stringify(validProviders, null, 2));
      if (validProviders.length) {
        alert(`Found ${validProviders.length} valid providers.`);
        validProviders.forEach(provider => {
          const option = document.createElement("option");
          option.value = parseInt(provider.id);
          option.textContent = provider.providerName || `Provider ${provider.id}`;
          console.log("Adding provider option:", {
            value: option.value,
            text: option.textContent,
            provider: provider
          });
          providerSelect.appendChild(option);
        });
      } else {
        alert("No valid Bills Payment Providers found. Please add providers like MULTI CHOICE NIGERIA or Eko Electric in the Billers section.");
        console.warn("No valid providers available");
        providerSelect.innerHTML += '<option value="" disabled>No valid providers available</option>';
      }
    } else {
      alert("No providers found. Please add Bills Payment Providers in the Billers section.");
      console.warn("No providers available");
      providerSelect.innerHTML += '<option value="" disabled>No providers available</option>';
    }

    // Fetch categories
    alert("Fetching categories...");
    console.log("Fetching categories...");
    const categoryResponse = await fetch("http://45.91.171.213:9080/api/manage/bills-payment/categories", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!categoryResponse.ok) {
      const errorText = await categoryResponse.text();
      const errorMsg = `Failed to fetch categories: ${errorText || categoryResponse.status}`;
      alert(errorMsg);
      throw new Error(errorMsg);
    }
    const categoryData = await categoryResponse.json();
    console.log("Categories response:", JSON.stringify(categoryData, null, 2));
    categorySelect.innerHTML = '<option value="" disabled selected>Select a category</option>';
    if (categoryData.data?.length) {
      alert(`Found ${categoryData.data.length} categories.`);
      categoryData.data.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name || "Unnamed Category";
        console.log("Adding category option:", {
          value: option.value,
          text: option.textContent
        });
        categorySelect.appendChild(option);
      });
      console.log("Category dropdown HTML after population:", categorySelect.innerHTML);
      alert(`Categories added to dropdown. Options count: ${categorySelect.options.length}`);
    } else {
      alert("No categories found. Please add categories first.");
      console.warn("No categories available");
      categorySelect.innerHTML += '<option value="" disabled>No categories available</option>';
    }
  } catch (error) {
    const errorMsg = `Error loading dropdowns: ${error.message}`;
    alert(errorMsg);
    console.error(errorMsg, error);
    showError(errorMsg);
  }
}


function setupAddConfigurationForm() {
  const form = document.getElementById("addConfigurationForm");
  const cancelBtn = document.getElementById("cancelAddConfigurationBtn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feeName = document.getElementById("feeName").value;
      const feeDescription = document.getElementById("feeDescription").value;
      const feeAmount = parseFloat(document.getElementById("feeAmount").value);
      const feeCurrency = document.getElementById("feeCurrency").value;
      const providerSelect = document.querySelector("#addConfigurationModal #providerId");
      const providerId = providerSelect ? parseInt(providerSelect.value) : null;
      const categorySelect = document.querySelector("#addConfigurationModal #configCategoryId");
      const categoryId = categorySelect ? parseInt(categorySelect.value) : null;

      // Log provider dropdown options
      const providerOptions = providerSelect ? Array.from(providerSelect.options).map(opt => ({
        value: opt.value,
        text: opt.textContent
      })) : [];
      console.log("Provider dropdown options:", providerOptions);

      console.log("Submitting configuration form:", {
        feeName,
        feeDescription,
        feeAmount,
        feeCurrency,
        providerId,
        categoryId
      });
      alert(`Submitting form with providerId: ${providerId || "none"}, categoryId: ${categoryId || "none"}`);

      if (!providerSelect || !providerId || isNaN(providerId)) {
        const errorMsg = "Please select a valid provider.";
        alert(errorMsg);
        console.error(errorMsg, { providerSelect, providerId });
        showError(errorMsg);
        return;
      }

      if (!categorySelect || !categoryId || isNaN(categoryId)) {
        const errorMsg = "Please select a valid category.";
        alert(errorMsg);
        console.error(errorMsg, { categorySelect, categoryId });
        showError(errorMsg);
        return;
      }

      try {
        alert("Sending fee data to server...");
        console.log("Sending fee data:", JSON.stringify({
          feeName,
          feeDescription,
          feeAmount,
          feeCurrency,
          providerId,
          categoryId,
          taxRate: document.getElementById("taxRate").value ? parseFloat(document.getElementById("taxRate").value) : null
        }, null, 2));
        const response = await fetch("http://45.91.171.213:9080/api/manage/bills-payment/fees/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            feeName,
            feeDescription,
            feeAmount,
            feeCurrency,
            providerId,
            categoryId,
            taxRate: document.getElementById("taxRate").value ? parseFloat(document.getElementById("taxRate").value) : null
          })
        });

        const responseText = await response.text();
        console.log("Add fee response:", responseText);
        if (!response.ok) {
          const errorMsg = `Failed to add fee: ${responseText || response.status}`;
          alert(errorMsg);
          throw new Error(errorMsg);
        }
        alert("Fee added successfully!");
        console.log("Fee added successfully");
        showSuccess("Fee added successfully!");
        hideModal("addConfigurationModal");
        form.reset();
        fetchBillsPaymentData();
      } catch (error) {
        const errorMsg = `Error adding fee: ${error.message}`;
        alert(errorMsg);
        console.error(errorMsg, error);
        showError(errorMsg);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      hideModal("addConfigurationModal");
      form.reset();
    });
  }
}

      // Bills Payment Section
      function setupBillsPayment() {
        const dropdown = document.getElementById("billsPaymentDropdown");
        const addBtn = document.getElementById("addBillsPaymentBtn");
        const filterForm = document.getElementById("billsPaymentFilterForm");
        const resetBtn = document.getElementById("resetFilters");
        const toggleFilterBtn = document.getElementById("toggleFilterBtn");
        const transactionsControls = document.getElementById(
          "transactionsControls"
        );
        const transactionsTabs = document.getElementById("transactionsTabs");
        const filterContainer = document.getElementById(
          "transactionsFilterContainer"
        );

        function toggleControls() {
          const type = dropdown.value;
          addBtn.classList.toggle(
            "hidden",
            !(
              type === "billers" ||
              type === "categories" ||
              type === "configuration"
            )
          );
          transactionsControls.classList.toggle(
            "hidden",
            type !== "transactions"
          );
          transactionsTabs.classList.toggle("hidden", type !== "transactions");
          if (type !== "transactions") {
            filterContainer.classList.add("hidden");
          }
        }

        toggleControls();

        if (dropdown) {
          dropdown.addEventListener("change", () => {
            currentTransactionsPage = 1;
            currentDetailedRemittancePage = 1;
            currentConfigurationPage = 1;
            toggleControls();
            fetchBillsPaymentData();
          });
        }

        if (addBtn) {
          addBtn.addEventListener("click", () => {
            const type = dropdown.value;
            if (type === "categories") showModal("addCategoryModal");
            else if (type === "billers") {
              populateBillerDropdowns();
              showModal("addBillerModal");
            } else if (type === "configuration") {
              console.log("Opening add configuration modal...");
              populateConfigurationDropdowns();
              showModal("addConfigurationModal");
            }
          });
        }

        if (toggleFilterBtn) {
          toggleFilterBtn.addEventListener("click", () => {
            filterContainer.classList.toggle("hidden");
          });
        }

        if (filterForm) {
          filterForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            currentTransactionsPage = 1;
            currentDetailedRemittancePage = 1;
            currentConfigurationPage = 1;
            await fetchBillsPaymentData();
          });
        }

        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            filterForm.reset();
            currentTransactionsPage = 1;
            currentDetailedRemittancePage = 1;
            currentConfigurationPage = 1;
            fetchBillsPaymentData();
          });
        }

        if (document.getElementById("retryFetchTransactions")) {
          document
            .getElementById("retryFetchTransactions")
            .addEventListener("click", () => {
              currentTransactionsPage = 1;
              currentDetailedRemittancePage = 1;
              currentConfigurationPage = 1;
              fetchBillsPaymentData();
            });
        }

        document
          .getElementById("prevTransactions")
          ?.addEventListener("click", () => {
            if (
              currentTransactionTab === "standard" &&
              currentTransactionsPage > 1
            ) {
              currentTransactionsPage--;
            } else if (
              currentTransactionTab === "detailedRemittance" &&
              currentDetailedRemittancePage > 1
            ) {
              currentDetailedRemittancePage--;
            } else if (
              type === "configuration" &&
              currentConfigurationPage > 1
            ) {
              currentConfigurationPage--;
            }
            fetchBillsPaymentData();
          });

        document
          .getElementById("nextTransactions")
          ?.addEventListener("click", () => {
            if (currentTransactionTab === "standard") {
              currentTransactionsPage++;
            } else if (currentTransactionTab === "detailedRemittance") {
              currentDetailedRemittancePage++;
            } else if (type === "configuration") {
              currentConfigurationPage++;
            }
            fetchBillsPaymentData();
          });

        const standardTab = document.getElementById("standardTab");
        const detailedRemittanceTab = document.getElementById(
          "detailedRemittanceTab"
        );

        if (standardTab) {
          standardTab.addEventListener("click", () => {
            currentTransactionTab = "standard";
            currentTransactionsPage = 1;
            standardTab.classList.add("border-b-2", "border-blue-500");
            detailedRemittanceTab.classList.remove(
              "border-b-2",
              "border-blue-500"
            );
            fetchBillsPaymentData();
          });
        }

        if (detailedRemittanceTab) {
          detailedRemittanceTab.addEventListener("click", () => {
            currentTransactionTab = "detailedRemittance";
            currentDetailedRemittancePage = 1;
            detailedRemittanceTab.classList.add(
              "border-b-2",
              "border-blue-500"
            );
            standardTab.classList.remove("border-b-2", "border-blue-500");
            fetchBillsPaymentData();
          });
        }

        setupAddConfigurationForm();
      }

      // Replace the existing fetchBillsPaymentData function
      async function fetchBillsPaymentData() {
        const dropdown = document.getElementById("billsPaymentDropdown");
        const list = document.getElementById("billsPaymentList");
        const transactionsControls = document.getElementById(
          "transactionsControls"
        );
        const paginationContainer = document.getElementById(
          "transactionsPagination"
        );
        list.innerHTML = "<p>Loading...</p>";

        const endpoints = {
          transactions: {
            standard:
              "http://45.91.171.213:9080/api/manage/bills-payment/transactions",
            detailedRemittance:
              "http://45.91.171.213:9080/api/manage/remittance/transactions",
          },
          providers:
            "http://45.91.171.213:9080/api/manage/bills-payment/providers",
          categories:
            "http://45.91.171.213:9080/api/manage/bills-payment/categories",
          billers: "http://45.91.171.213:9080/api/manage/bills-payment/billers",
          configuration:
            "http://45.91.171.213:9080/api/manage/bills-payment/fees",
        };

        const type = dropdown.value;

        try {
          if (type === "transactions") {
            transactionsControls.classList.remove("hidden");
            paginationContainer.classList.remove("hidden");

            const filters = {
              categoryName: document.getElementById("categoryId")?.value || "",
              providerName:
                document.getElementById("providerName")?.value || "",
              agentMobileNumber:
                document.getElementById("agentMobileNumber")?.value || "",
              countryId: document.getElementById("countryId")?.value || "",
              status: document.getElementById("workflowStatus")?.value || "",
              customerReference:
                document.getElementById("customerReference")?.value || "",
              requestDate: document.getElementById("requestDate")?.value || "",
              startDate: document.getElementById("startDate")?.value || "",
              endDate: document.getElementById("endDate")?.value || "",
              page:
                currentTransactionTab === "detailedRemittance"
                  ? currentDetailedRemittancePage
                  : currentTransactionsPage,
              size: transactionsPageSize,
              sortColumn:
                document.getElementById("sortColumn")?.value || "createdAt",
              sortDirection:
                document.getElementById("sortDirection")?.value || "desc",
            };

            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== "") queryParams.append(key, value);
            });

            if (filters.requestDate) {
              queryParams.delete("startDate");
              queryParams.delete("endDate");
              queryParams.set("startDate", filters.requestDate);
              const nextDay = new Date(filters.requestDate);
              nextDay.setDate(nextDay.getDate() + 1);
              queryParams.set("endDate", nextDay.toISOString().split("T")[0]);
            }

            const endpoint =
              currentTransactionTab === "detailedRemittance"
                ? endpoints.transactions.detailedRemittance
                : endpoints.transactions.standard;
            const response = await fetch(
              `${endpoint}?${queryParams.toString()}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (!data.data || !data.data.records || !data.data.records.length) {
              list.innerHTML = `<p>No ${currentTransactionTab} transactions found.</p>`;
            } else {
              updateTransactionsPagination(data.data);
              list.innerHTML = renderBillsPaymentList(type, data.data.records);
            }
          } else {
            transactionsControls.classList.add("hidden");
            paginationContainer.classList.add("hidden");

            const queryParams = new URLSearchParams();
            if (type === "configuration") {
              queryParams.append("page", currentConfigurationPage);
              queryParams.append("size", transactionsPageSize);
            }

            const endpoint = `${endpoints[type]}${
              queryParams.toString() ? "?" + queryParams.toString() : ""
            }`;
            const response = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (type === "configuration") {
              list.innerHTML = renderBillsPaymentList(
                type,
                data.data.records || []
              );
              updateTransactionsPagination(data.data);
            } else {
              list.innerHTML = renderBillsPaymentList(type, data.data || []);
            }
          }

          attachBillsPaymentEventListeners();
        } catch (error) {
          showError(error.message);
          list.innerHTML = renderBillsPaymentList(type, []);
        }
      }

      // Reset Filter Form (unchanged)
      document
        .getElementById("resetFilters")
        ?.addEventListener("click", function () {
          const form = document.getElementById("billsPaymentFilterForm");
          form.reset();
          currentTransactionsPage = 0; // Reset to first page
          fetchBillsPaymentData(); // Fetch with no filters
        });

      function getTransactionFilters() {
        const filters = {
          categoryName: document.getElementById("categoryId")?.value || "",
          providerName: document.getElementById("providerName")?.value || "",
          agentMobileNumber:
            document.getElementById("agentMobileNumber")?.value || "",
          countryId: document.getElementById("countryId")?.value || "",
          status: document.getElementById("workflowStatus")?.value || "",
          customerReference:
            document.getElementById("customerReference")?.value || "",
          requestDate: document.getElementById("requestDate")?.value || "", // Added
          startDate: document.getElementById("startDate")?.value || "",
          endDate: document.getElementById("endDate")?.value || "",
        };
        return filters;
      }

      function updateTransactionsPagination(paginationData) {
        const { page, pageSize, totalPages, totalCount } = paginationData;
        const prevBtn = document.getElementById("prevTransactions");
        const nextBtn = document.getElementById("nextTransactions");
        const pageInfo = document.getElementById("transactionsPageInfo");

        console.log("Pagination data:", {
          page,
          pageSize,
          totalPages,
          totalCount,
        });

        prevBtn.disabled = page === 1; // 1-based
        nextBtn.disabled = page >= totalPages; // No -1 needed
        pageInfo.textContent = `Page ${page} of ${totalPages} (Total: ${totalCount} transactions)`; // No +1 needed
      }

      function renderBillsPaymentList(type, items) {
        if (!items || !items.length) {
          return `<p class='text-gray-500 text-center py-4'>No ${type} found.</p>`;
        }

        if (type === "transactions") {
          if (currentTransactionTab === "detailedRemittance") {
            return `
        <table class="min-w-full bg-white rounded-md shadow-md">
          <thead>
            <tr class="bg-gray-200 text-gray-700">
              <th class="px-6 py-3 text-left">Receiving Country</th>
              <th class="px-6 py-3 text-left">Sending Country</th>
              <th class="px-6 py-3 text-left">Beneficiary Currency</th>
              <th class="px-6 py-3 text-left">Transaction Amount</th>
              <th class="px-6 py-3 text-left">Conversion Rate</th>
              <th class="px-6 py-3 text-left">Amount Charged</th>
              <th class="px-6 py-3 text-left">Amount Paid</th>
              <th class="px-6 py-3 text-left">Comment</th>
              <th class="px-6 py-3 text-left">Sending Currency</th>
              <th class="px-6 py-3 text-left">Beneficiary Country</th>
              <th class="px-6 py-3 text-left">Remit Type</th>
              <th class="px-6 py-3 text-left">Agent Mobile</th>
              <th class="px-6 py-3 text-left">Provider Name</th>
              <th class="px-6 py-3 text-left">Transfer Reference</th>
              <th class="px-6 py-3 text-left">Created At</th>
              <th class="px-6 py-3 text-left">Status</th>
              <th class="px-6 py-3 text-left">Assigned To</th>
              <th class="px-6 py-3 text-left">Source Country Code</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (tx) => `
                  <tr class="border-b">
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.receivingCountry || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.sendingCountry || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.beneficiaryCurrency || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.transactionAmount
                        ? tx.transactionAmount.toFixed(2)
                        : "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.conversionRate ? tx.conversionRate.toFixed(4) : "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.amountToBeCharged
                        ? tx.amountToBeCharged.toFixed(2)
                        : "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.amountToBePaid ? tx.amountToBePaid.toFixed(2) : "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.comment || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.sendingCurrency || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.beneficiaryCountry || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.remitType || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.agentMobileNumber || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.providerName || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.transferReference || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString()
                        : "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.workflowStatus || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.assignedTo || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.sourceCountryCode || "N/A"
                    }</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `;
          } else {
            return `
        <table class="min-w-full bg-white rounded-md shadow-md">
          <thead>
            <tr class="bg-gray-200 text-gray-700">
              <th class="px-6 py-3 text-left">Request Reference</th>
              <th class="px-6 py-3 text-left">Customer Reference</th>
              <th class="px-6 py-3 text-left">Amount</th>
              <th class="px-6 py-3 text-left">Country</th>
              <th class="px-6 py-3 text-left">Agent Mobile</th>
              <th class="px-6 py-3 text-left">Provider</th>
              <th class="px-6 py-3 text-left">Created At</th>
              <th class="px-6 py-3 text-left">Status</th>
              <th class="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (tx) => `
                  <tr class="border-b">
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.requestReference || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.customerReference || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.amount || "N/A"
                    } ${tx.currency || ""}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.countryName || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.agentMobileNumber || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.providerName || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap">${
                      tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString()
                        : "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap text-green-500">${
                      tx.status || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap relative">
                      <button class="actionBtn" data-transaction='${JSON.stringify(
                        tx
                      )}'>
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      <div class="dropdown-menu" id="dropdown-${
                        tx.requestReference || tx.id
                      }">
                        <button class="completeTransactionBtn" data-transaction='${JSON.stringify(
                          tx
                        )}'>Complete Transaction</button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `;
          }
        } else if (type === "providers") {
          return items
            .map(
              (provider) => `
          <div class="bg-white p-4 rounded-md shadow-md flex justify-between items-center">
            <div class="text-gray-700">
              <p class="font-medium">Name: ${provider.providerName}</p>
              <img src="${provider.imageUrl}" alt="${provider.providerName}" class="w-16 h-16 object-cover mt-2 rounded">
            </div>
          </div>
        `
            )
            .join("");
        } else if (type === "categories") {
          return `
      <table class="min-w-full bg-white rounded-md shadow-md">
        <thead>
          <tr class="bg-gray-200 text-gray-700">
            <th class="px-6 py-3 text-left">Name</th>
            <th class="px-6 py-3 text-left">Description</th>
            <th class="px-6 py-3 text-left">Validation Required</th>
            <th class="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (category) => `
                <tr class="border-b">
                  <td class="px-6 py-4 whitespace-nowrap">${
                    category.name || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    category.description || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    category.customerValidationRequired ? "Yes" : "No"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap relative">
                    <button class="actionBtn" data-id="${category.id}">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div class="dropdown-menu" id="dropdown-${category.id}">
                      <button class="updateCategoryBtn" 
                        data-id="${category.id}" 
                        data-name="${category.name || ""}" 
                        data-description="${category.description || ""}" 
                        data-validation="${
                          category.customerValidationRequired || false
                        }">Update</button>
                      <button class="deleteBtn" 
                        data-type="category" 
                        data-id="${category.id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
        } else if (type === "billers") {
          return `
      <table class="min-w-full bg-white rounded-md shadow-md">
        <thead>
          <tr class="bg-gray-200 text-gray-700">
            <th class="px-6 py-3 text-left">Name</th>
            <th class="px-6 py-3 text-left">Service ID</th>
            <th class="px-6 py-3 text-left">Category ID</th>
            <th class="px-6 py-3 text-left">Description</th>
            <th class="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (biller) => `
                <tr class="border-b">
                  <td class="px-6 py-4 whitespace-nowrap">${
                    biller.name || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    biller.serviceId || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    biller.categoryId || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    biller.description || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap relative">
                    <button class="actionBtn" data-id="${biller.id}">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div class="dropdown-menu" id="dropdown-${biller.id}">
                      <button class="updateBillerBtn" 
                        data-id="${biller.id}" 
                        data-service-id="${biller.serviceId || ""}" 
                        data-provider-id="${biller.providerId || ""}" 
                        data-operator-id="${biller.operatorId || ""}" 
                        data-name="${biller.name || ""}" 
                        data-category-id="${biller.categoryId || ""}" 
                        data-item-type="${biller.itemType || ""}" 
                        data-description="${biller.description || ""}" 
                        data-country-id="${biller.countryId || ""}" 
                        data-min-amount="${biller.minAmount || ""}" 
                        data-max-amount="${
                          biller.maxAmount || ""
                        }">Update</button>
                      <button class="deleteBtn" 
                        data-type="biller" 
                        data-id="${biller.id}" 
                        data-service-id="${
                          biller.serviceId || ""
                        }">Delete</button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
        } else if (type === "configuration") {
          return `
      <table class="min-w-full bg-white rounded-md shadow-md">
        <thead>
          <tr class="bg-gray-200 text-gray-700">
            <th class="px-6 py-3 text-left">ID</th>
            <th class="px-6 py-3 text-left">Fee Name</th>
            <th class="px-6 py-3 text-left">Description</th>
            <th class="px-6 py-3 text-left">Fee Amount</th>
            <th class="px-6 py-3 text-left">Provider</th>
            <th class="px-6 py-3 text-left">Category</th>
            <th class="px-6 py-3 text-left">Tax Rate (%)</th>
            <th class="px-6 py-3 text-left">Created By</th>
            <th class="px-6 py-3 text-left">Created At</th>
            <th class="px-6 py-3 text-left">Updated By</th>
            <th class="px-6 py-3 text-left">Updated At</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (fee) => `
                <tr class="border-b">
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.id || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.feeName || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.feeDescription || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.feeAmount ? fee.feeAmount.toFixed(2) : "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.providerName || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.categoryName || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.taxRate ? fee.taxRate.toFixed(2) : "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.createdBy || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.createAt
                      ? new Date(fee.createAt).toLocaleString()
                      : "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.updatedBy || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    fee.updateAt
                      ? new Date(fee.updateAt).toLocaleString()
                      : "N/A"
                  }</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
        }
      }

      function attachBillsPaymentEventListeners() {
        // Action Button Handlers for all tables
        document.querySelectorAll(".actionBtn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const dropdown = btn.nextElementSibling;
            const isVisible = dropdown.style.display === "block";

            // Close all other dropdowns
            document.querySelectorAll(".dropdown-menu").forEach((d) => {
              if (d !== dropdown) {
                d.style.display = "none";
              }
            });

            // Toggle current dropdown
            if (!isVisible) {
              dropdown.style.display = "block";
              positionDropdown(btn, dropdown); // Position the dropdown correctly
            } else {
              dropdown.style.display = "none";
            }
          });
        });

        // Complete Transaction Button
        document.querySelectorAll(".completeTransactionBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("completeTransactionId").value =
              btn.dataset.id;
            showModal("completeTransactionModal");
          });
        });

        // Update Provider Button
        document.querySelectorAll(".updateProviderBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("updateProviderId").value = btn.dataset.id;
            document.getElementById("updateProviderName").value =
              btn.dataset.name;
            document.getElementById("updateProviderDescription").value =
              btn.dataset.description;
            showModal("updateProviderModal");
          });
        });

        // Delete Provider Button
        document.querySelectorAll(".deleteProviderBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("deleteProviderId").value = btn.dataset.id;
            showModal("deleteProviderModal");
          });
        });

        // Update Category Button
        document.querySelectorAll(".updateCategoryBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("updateCategoryId").value = btn.dataset.id;
            document.getElementById("updateCategoryName").value =
              btn.dataset.name;
            document.getElementById("updateCategoryDescription").value =
              btn.dataset.description;
            showModal("updateCategoryModal");
          });
        });

        // Delete Category Button
        document.querySelectorAll(".deleteCategoryBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("deleteCategoryId").value = btn.dataset.id;
            showModal("deleteCategoryModal");
          });
        });

        // Update Biller Button
        document.querySelectorAll(".updateBillerBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("updateBillerId").value = btn.dataset.id;
            document.getElementById("updateBillerName").value =
              btn.dataset.name;
            document.getElementById("updateBillerDescription").value =
              btn.dataset.description;
            showModal("updateBillerModal");
          });
        });

        // Delete Biller Button
        document.querySelectorAll(".deleteBillerBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("deleteBillerId").value = btn.dataset.id;
            showModal("deleteBillerModal");
          });
        });

        // Form Submission Listeners
        document
          .getElementById("completeTransactionForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("completeTransactionId").value;
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/bills/complete/${id}`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
              hideModal("completeTransactionModal");
              fetchBillsPaymentData(); // Refresh data
            } catch (error) {
              showError(error.message);
            }
          });

        document
          .getElementById("updateProviderForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("updateProviderId").value;
            const name = document.getElementById("updateProviderName").value;
            const description = document.getElementById(
              "updateProviderDescription"
            ).value;
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/bills/providers/${id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ name, description }),
                }
              );
              if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
              hideModal("updateProviderModal");
              fetchBillsPaymentData();
            } catch (error) {
              showError(error.message);
            }
          });

        document
          .getElementById("confirmDeleteProviderBtn")
          ?.addEventListener("click", async () => {
            const id = document.getElementById("deleteProviderId").value;
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/bills/providers/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
              hideModal("deleteProviderModal");
              fetchBillsPaymentData();
            } catch (error) {
              showError(error.message);
            }
          });

        // Add similar form listeners for Categories and Billers if needed
      }

      // Client Management Section
      function setupClientManagement() {
        const dropdown = document.getElementById("clientManagementDropdown");
        const addBtn = document.getElementById("addClientBtn");

        if (dropdown)
          dropdown.addEventListener("change", fetchClientManagementData);
        if (addBtn)
          addBtn.addEventListener("click", () => showModal("addClientModal"));

        document
          .getElementById("updateClientForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.querySelector(
              `.updateClientBtn[data-id="${
                document.getElementById("updateClientId").value
              }"]`
            );
            const payload = {
              id: parseInt(document.getElementById("updateClientId").value),
              name: document.getElementById("updateClientName").value,
              description: document.getElementById("updateClientDescription")
                .value,
              country:
                document.getElementById("updateClientCountry").value || null,
              status: document.getElementById("updateClientStatus").value,
              serviceType: btn.dataset.serviceType || "BillPayment", // Default if missing
              createAt: btn.dataset.createAt || "",
              createdBy: btn.dataset.createdBy
                ? parseInt(btn.dataset.createdBy)
                : 0,
              channelTypeCode: btn.dataset.channelTypeCode || "",
              serviceCode: btn.dataset.serviceCode || "",
              serviceCategoryCode: btn.dataset.serviceCategoryCode || "",
              serviceProviderCode: btn.dataset.serviceProviderCode || "",
              updatedAt: btn.dataset.updatedAt || new Date().toISOString(), // Update timestamp
              updatedBy: btn.dataset.updatedBy
                ? parseInt(btn.dataset.updatedBy)
                : 0,
            };
            console.log("Update client payload:", payload);
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/manage/entities/${payload.id}/update/service`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                }
              );
              const responseText = await response.text();
              console.log("Update client response status:", response.status);
              console.log("Update client response body:", responseText);
              if (!response.ok)
                throw new Error(responseText || "Failed to update client");
              hideModal("updateClientModal");
              showSuccess("Client updated successfully!");
              fetchClientManagementData();
            } catch (error) {
              console.error("Update error:", error);
              showError(error.message);
            }
          });

        document
          .getElementById("confirmDeleteClientBtn")
          ?.addEventListener("click", async () => {
            const id = document.getElementById("deleteClientId").value;
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/manage/entities/${id}/service?serviceId=${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const responseText = await response.text();
              console.log("Delete client response:", responseText);
              if (!response.ok)
                throw new Error(responseText || "Failed to delete client");
              hideModal("deleteClientModal");
              showSuccess("Client deleted successfully!");
              fetchClientManagementData();
            } catch (error) {
              showError(error.message);
            }
          });
      }

      async function fetchClientManagementData() {
        const list = document.getElementById("clientManagementList");
        list.innerHTML = "<p>Loading...</p>";

        try {
          const response = await fetch(
            "http://45.91.171.213:9080/api/manage/entities/all",
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const responseText = await response.text();
          console.log("Clients API raw response:", responseText);
          if (!response.ok)
            throw new Error(
              `HTTP error! status: ${response.status} - ${responseText}`
            );
          const data = JSON.parse(responseText);
          console.log("Clients API parsed data:", data);

          if (!data.data || data.data.length === 0) {
            list.innerHTML = "<p>No clients found.</p>";
          } else {
            list.innerHTML = `
        <table class="min-w-full bg-white rounded-md shadow-md">
          <thead>
            <tr class="bg-gray-200 text-gray-700">
              <th class="px-6 py-3 text-left">Name</th>
              <th class="px-6 py-3 text-left">Description</th>
              <th class="px-6 py-3 text-left">Country</th>
              <th class="px-6 py-3 text-left">Status</th>
              <th class="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.data
              .map(
                (client) => `
                <tr class="border-b">
                  <td class="px-6 py-4 whitespace-nowrap">${
                    client.name || "N/A"
                  }</td>
                  <td class="px-6 py-4">${client.description || "N/A"}</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    client.country || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap">${
                    client.status || "N/A"
                  }</td>
                  <td class="px-6 py-4 whitespace-nowrap relative">
                    <button class="actionBtn">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div class="dropdown-menu" id="dropdown-${client.id}">
                      <button class="updateClientBtn" 
                        data-id="${client.id}" 
                        data-name="${client.name || ""}" 
                        data-description="${client.description || ""}"
                        data-country="${client.country || ""}" 
                        data-status="${client.status || ""}"
                        data-service-type="${client.serviceType || ""}"
                        data-create-at="${client.createAt || ""}"
                        data-created-by="${client.createdBy || ""}"
                        data-channel-type-code="${client.channelTypeCode || ""}"
                        data-service-code="${client.serviceCode || ""}"
                        data-service-category-code="${
                          client.serviceCategoryCode || ""
                        }"
                        data-service-provider-code="${
                          client.serviceProviderCode || ""
                        }"
                        data-updated-at="${client.updatedAt || ""}"
                        data-updated-by="${
                          client.updatedBy || ""
                        }">Update</button>
                      <button class="deleteClientBtn" data-id="${
                        client.id
                      }">Delete</button>
                    </div>
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      `;

            // Attach event listeners for action buttons
            attachClientManagementEventListeners();
          }
        } catch (error) {
          console.error("Fetch error details:", error);
          showError(error.message);
          list.innerHTML =
            "<p>Failed to load clients. Check console for details.</p>";
        }
      }

      function attachClientManagementEventListeners() {
        document.querySelectorAll(".actionBtn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const dropdown = btn.nextElementSibling;
            const isVisible = dropdown.style.display === "block";

            // Close all other dropdowns
            document.querySelectorAll(".dropdown-menu").forEach((d) => {
              d.style.display = "none";
            });

            // Toggle current dropdown
            if (!isVisible) {
              dropdown.style.display = "block";
              positionDropdown(btn, dropdown); // Use new positioning function
            }
          });
        });

        // Update Client Button
        document.querySelectorAll(".updateClientBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("updateClientId").value = btn.dataset.id;
            document.getElementById("updateClientName").value =
              btn.dataset.name;
            document.getElementById("updateClientDescription").value =
              btn.dataset.description;
            document.getElementById("updateClientCountry").value =
              btn.dataset.country;
            document.getElementById("updateClientStatus").value =
              btn.dataset.status;
            showModal("updateClientModal");
          });
        });

        // Delete Client Button
        document.querySelectorAll(".deleteClientBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            document.getElementById("deleteClientId").value = btn.dataset.id;
            showModal("deleteClientModal");
          });
        });

        // Close dropdowns on outside click
        document.addEventListener("click", (e) => {
          if (!e.target.closest(".actionBtn")) {
            document.querySelectorAll(".dropdown-menu").forEach((dropdown) => {
              dropdown.style.display = "none";
            });
          }
        });
      }

      // Product Management Section
      function setupProductManagement() {
        const dropdown = document.getElementById("productManagementDropdown");
        const addBtn = document.getElementById("addServiceBtn");

        if (dropdown) {
          dropdown.addEventListener("change", fetchProductManagementData);
        }
        if (addBtn) {
          addBtn.addEventListener("click", () => {
            showModal("addServiceModal");
          });
        }
      }

      async function fetchProductManagementData() {
        const list = document.getElementById("productManagementList");
        list.innerHTML = "<p>Loading...</p>";

        try {
          const response = await fetch(
            "http://45.91.171.213:9080/api/manage/services/all",
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `HTTP error! status: ${response.status} - ${errorText}`
            );
          }
          const data = await response.json();
          console.log("Product Management API response:", data);

          if (!data.data || data.data.length === 0) {
            list.innerHTML = "<p>No services found.</p>";
          } else {
            list.innerHTML = `
        <div class="table-container">
          <table class="min-w-full bg-white rounded-md shadow-md">
            <thead>
              <tr class="bg-gray-200 text-gray-700">
                <th class="px-6 py-3 text-left">Service Name</th>
                <th class="px-6 py-3 text-left">Description</th>
                <th class="px-6 py-3 text-left">Service Type</th>
                <th class="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.data
                .map(
                  (service) => `
                    <tr class="border-b">
                      <td class="px-6 py-4 whitespace-nowrap">${
                        service.name || "N/A"
                      }</td>
                      <td class="px-6 py-4 whitespace-nowrap">${
                        service.description || "N/A"
                      }</td>
                      <td class="px-6 py-4 whitespace-nowrap">${
                        service.serviceType || "N/A"
                      }</td>
                      <td class="px-6 py-4 whitespace-nowrap relative">
                        <button class="actionBtn text-gray-600 hover:text-gray-800" data-service='${JSON.stringify(
                          service
                        )}'>
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        <div class="dropdown-menu" id="dropdown-${service.id}">
                          <button class="updateServiceBtn" data-service='${JSON.stringify(
                            service
                          )}'>Update</button>
                          <button class="deleteServiceBtn" data-id="${
                            service.id
                          }">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

            // Attach event listeners for action buttons
            document.querySelectorAll(".actionBtn").forEach((btn) => {
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                const isVisible = dropdown.style.display === "block";

                // Close all other dropdowns
                document.querySelectorAll(".dropdown-menu").forEach((menu) => {
                  if (menu !== dropdown) {
                    menu.style.display = "none";
                  }
                });

                // Toggle current dropdown
                if (!isVisible) {
                  dropdown.style.display = "block";
                  positionDropdown(btn, dropdown); // Position the dropdown correctly
                } else {
                  dropdown.style.display = "none";
                }
              });
            });

            // Update Service Button
            document.querySelectorAll(".updateServiceBtn").forEach((btn) => {
              btn.addEventListener("click", () => {
                const service = JSON.parse(btn.dataset.service);
                document.getElementById("updateServiceId").value = service.id;
                document.getElementById("updateServiceName").value =
                  service.name || "";
                document.getElementById("updateServiceDescription").value =
                  service.description || "";
                document.getElementById("updateServiceType").value =
                  service.serviceType || "";
                showModal("updateServiceModal");
              });
            });

            // Delete Service Button
            document.querySelectorAll(".deleteServiceBtn").forEach((btn) => {
              btn.addEventListener("click", () => {
                document.getElementById("deleteServiceId").value =
                  btn.dataset.id;
                showModal("deleteServiceModal");
              });
            });
          }
        } catch (error) {
          console.error("Fetch error details:", error);
          showError(error.message);
          list.innerHTML =
            "<p>Failed to load services. Check console for details.</p>";
        }
      }

      // User Management Section
      function setupUserManagement() {
        const dropdown = document.getElementById("userManagementDropdown");
        const addBtn = document.getElementById("addUserBtn");

        if (dropdown)
          dropdown.addEventListener("change", fetchUserManagementData);
        if (addBtn)
          addBtn.addEventListener("click", () => showModal("addUserModal"));
      }

      async function fetchUserManagementData() {
        const list = document.getElementById("userManagementList");
        list.innerHTML = "<p>Loading...</p>";

        try {
          const url = "http://45.91.171.213:9080/api/manage/users/application"; // Confirmed GET endpoint
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const responseText = await response.text();
          if (!response.ok) {
            console.error("Fetch users error:", response.status, responseText);
            throw new Error(
              `HTTP error! status: ${response.status} - ${
                responseText || "Unknown error"
              }`
            );
          }

          const data = JSON.parse(responseText);
          console.log("Users API raw response:", responseText);
          console.log("Users API parsed data:", data);

          list.innerHTML =
            data.data
              ?.map(
                (user) => `
      <div class="bg-white p-4 rounded-md shadow-md flex justify-between items-center">
        <div>
          <p>ID: ${user.id || "N/A"}</p>
          <p>Email: ${user.emailAddress || "N/A"}</p>
          <p>Name: ${user.userName || "N/A"}</p>
          <p>Type: ${user.descriminator || "N/A"}</p>
          <p>Status: ${user.accountStatus || "N/A"} ${
                  user.isLockedOut ? "(Locked)" : ""
                }</p>
          <p>Phone: ${user.phoneNumber || "N/A"}</p>
        </div>
        <div class="space-x-2">
          <button class="updateUserBtn bg-yellow-500 px-2 py-1 rounded-md text-white" 
            data-id="${user.id}" 
            data-email="${user.emailAddress || ""}" 
            data-username="${user.userName || ""}" 
            data-type="${user.descriminator || ""}"
            data-status="${user.accountStatus || ""}">Update</button>
        </div>
      </div>
    `
              )
              .join("") || "<p>No users found.</p>";

          document.querySelectorAll(".updateUserBtn").forEach((btn) => {
            btn.addEventListener("click", () => {
              document.getElementById("updateUserId").value = btn.dataset.id;
              document.getElementById("updateUserEmailAddress").value =
                btn.dataset.email;
              document.getElementById("updateUserFullName").value =
                btn.dataset.username;
              document.getElementById("updateUserRole").value =
                btn.dataset.type;
              document.getElementById("updateUserAction").value =
                btn.dataset.status === "Active" ? "ACTIVATE" : "DEACTIVATE";
              showModal("updateUserModal");
            });
          });
        } catch (error) {
          showError(error.message);
          list.innerHTML =
            "<p>Unable to load users. Check permissions or try again later.</p>";
          console.error("Fetch error details:", error);
        }
      }

      // Form Submissions
      function setupForms() {
        // Add Provider
        document
          .getElementById("addProviderForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();

            const providerNameInput =
              document.getElementById("addProviderName");
            const imageUrlInput = document.getElementById("providerImage");

            // Debug: Check if elements exist
            console.log("addProviderName element:", providerNameInput);
            console.log("providerImage element:", imageUrlInput);

            if (!providerNameInput || !imageUrlInput) {
              showError("Form error: Input fields not found");
              return;
            }

            const providerName = providerNameInput.value.trim();
            const imageUrl = imageUrlInput.value.trim();

            if (!providerName) {
              showError("Provider Name is required");
              return;
            }

            const payload = {
              providerName: providerName,
              imageUrl: imageUrl || null, // Send null if empty
            };

            console.log(
              "Submitting provider payload:",
              JSON.stringify(payload, null, 2)
            );

            try {
              const response = await fetch(
                "http://45.91.171.213:9080/api/manage/bills-payment/providers/add",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                }
              );

              const responseText = await response.text();
              console.log("Response status:", response.status);
              console.log("Response body:", responseText);

              if (!response.ok) {
                throw new Error(
                  `HTTP error! status: ${response.status} - ${responseText}`
                );
              }

              hideModal("addProviderModal");
              showSuccess("Provider added successfully!");
              fetchBillsPaymentData();
            } catch (error) {
              console.error("Submission error:", error);
              showError(error.message);
            }
          });

        // Add Category
        document
          .getElementById("addCategoryForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              name: document.getElementById("categoryName").value,
              description: document.getElementById("categoryDescription").value,
              customerValidationRequired: document.getElementById(
                "customerValidationRequired"
              ).checked,
            };
            await submitForm(
              "http://45.91.171.213:9080/api/manage/bills-payment/add/category",
              payload,
              "addCategoryModal",
              fetchBillsPaymentData,
              "Category"
            );
          });

        // Update Category
        document
          .getElementById("updateCategoryForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              id: document.getElementById("updateCategoryId").value,
              name: document.getElementById("updateCategoryName").value,
              description: document.getElementById("updateCategoryDescription")
                .value,
              customerValidationRequired: document.getElementById(
                "updateCustomerValidationRequired"
              ).checked,
            };
            await submitForm(
              "http://45.91.171.213:9080/api/manage/bills-payment/category/update",
              payload,
              "updateCategoryModal",
              fetchBillsPaymentData,
              "Category",
              "updated"
            );
          });

        // Add Biller
        document
          .getElementById("addBillerForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              serviceId: document.getElementById("billerServiceId").value,
              providerId: parseInt(
                document.getElementById("billerProviderId").value
              ),
              operatorId: document.getElementById("billerOperatorId").value,
              name: document.getElementById("billerName").value,
              categoryId: parseInt(
                document.getElementById("billerCategoryId").value
              ),
              itemType: document.getElementById("billerItemType").value,
              description: document.getElementById("billerDescription").value,
              countryId: parseInt(
                document.getElementById("billerCountryId").value
              ),
              minAmount: document.getElementById("billerMinAmount").value,
              maxAmount: document.getElementById("billerMaxAmount").value,
            };
            console.log(
              "Payload being sent to /add/biller:",
              JSON.stringify(payload, null, 2)
            );
            await submitForm(
              "http://45.91.171.213:9080/api/manage/bills-payment/add/biller",
              payload,
              "addBillerModal",
              fetchBillsPaymentData,
              "Biller"
            );
          });

        // Update Biller
        document
          .getElementById("updateBillerForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              id: document.getElementById("updateBillerId").value,
              serviceId: document.getElementById("updateBillerServiceId").value,
              providerId: parseInt(
                document.getElementById("updateBillerProviderId").value
              ),
              operatorId: document.getElementById("updateBillerOperatorId")
                .value,
              name: document.getElementById("updateBillerName").value,
              categoryId: parseInt(
                document.getElementById("updateBillerCategoryId").value
              ),
              itemType: document.getElementById("updateBillerItemType").value,
              description: document.getElementById("updateBillerDescription")
                .value,
              countryId: parseInt(
                document.getElementById("updateBillerCountryId").value
              ),
              minAmount: document.getElementById("updateBillerMinAmount").value,
              maxAmount: document.getElementById("updateBillerMaxAmount").value,
            };
            await submitForm(
              "http://45.91.171.213:9080/api/manage/bills-payment/biller/update",
              payload,
              "updateBillerModal",
              fetchBillsPaymentData,
              "Biller",
              "updated"
            );
          });

        // Add Client
        document
          .getElementById("addClientForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const entityId = document.getElementById("clientEntityId").value;
            const payload = {
              applicationId: parseInt(
                document.getElementById("clientApplicationId").value
              ),
              status: document.getElementById("clientStatus").value,
            };
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/manage/entities/${entityId}/service/add`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                }
              );
              const responseText = await response.text();
              if (!response.ok) {
                console.error(
                  "Add client service error:",
                  response.status,
                  responseText
                );
                throw new Error(responseText || "Failed to add client service");
              }
              console.log("Add client service success:", responseText);
              hideModal("addClientModal");
              showSuccess("Client service added successfully!");
              fetchClientManagementData();
            } catch (error) {
              showError(error.message);
            }
          });

        document
          .getElementById("updateClientForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              id: parseInt(document.getElementById("updateClientId").value),
              name: document.getElementById("updateClientName").value,
              description: document.getElementById("updateClientDescription")
                .value,
              country:
                document.getElementById("updateClientCountry").value || null,
              status: document.getElementById("updateClientStatus").value,
            };
            console.log("Update client payload:", payload);
            try {
              const response = await fetch(
                `http://45.91.171.213:9080/api/manage/entities/${payload.id}/update/service`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                }
              );
              const responseText = await response.text();
              console.log("Update client response status:", response.status);
              console.log("Update client response headers:", [
                ...response.headers,
              ]);
              console.log("Update client response body:", responseText);
              if (!response.ok)
                throw new Error(responseText || "Failed to update client");
              hideModal("updateClientModal");
              showSuccess("Client updated successfully!");
              fetchClientManagementData(); // Refresh the list
            } catch (error) {
              console.error("Update error:", error);
              showError(error.message);
            }
          });

        // Add Service
        document
          .getElementById("addServiceForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              name: document.getElementById("serviceName").value,
              description: document.getElementById("serviceDescription").value,
              serviceType: document.getElementById("serviceType").value,
              channelTypeCode: document.getElementById("channelTypeCode").value,
              serviceCode: document.getElementById("serviceCode").value,
              serviceCategoryCode: document.getElementById(
                "serviceCategoryCode"
              ).value,
              serviceProviderCode: document.getElementById(
                "serviceProviderCode"
              ).value,
              countryCode: document.getElementById("countryCode").value,
            };
            await submitForm(
              "http://45.91.171.213:9080/api/manage/services/create",
              payload,
              "addServiceModal",
              fetchProductManagementData,
              "Service"
            );
          });

        document
          .getElementById("updateServiceForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
              id: parseInt(document.getElementById("updateServiceId").value),
              name: document.getElementById("updateServiceName").value,
              description: document.getElementById("updateServiceDescription")
                .value,
              serviceType: document.getElementById("updateServiceType").value,
              channelTypeCode: document.getElementById("updateChannelTypeCode")
                .value,
              serviceCode: document.getElementById("updateServiceCode").value,
              serviceCategoryCode: document.getElementById(
                "updateServiceCategoryCode"
              ).value,
              serviceProviderCode: document.getElementById(
                "updateServiceProviderCode"
              ).value,
              countryCode: document.getElementById("updateCountryCode").value,
            };
            await submitForm(
              "http://45.91.171.213:9080/api/manage/services/update",
              payload,
              "updateServiceModal",
              fetchProductManagementData,
              "Service",
              "updated",
              "PUT"
            );
          });

        // Add User
        document
          .getElementById("addUserForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const roleValue = document.getElementById("userRole").value;
            const payload = {
              emailAddress: document.getElementById("userEmailAddress").value,
              phoneNumber: document.getElementById("userPhoneNumber").value,
              firstName: document.getElementById("userFirstName").value,
              lastName: document.getElementById("userLastName").value,
              address: document.getElementById("userAddress").value,
              city: document.getElementById("userCity").value || undefined,
              state: document.getElementById("userState").value || undefined,
              country:
                document.getElementById("userCountry").value || undefined,
              role: roleValue
                ? {
                    roleName: roleValue,
                    roleDescription:
                      roleValue === "ROLE_ADMIN" ? "Admin role" : "User role",
                    permissions: ["READ"], // Adjust based on backend requirements
                  }
                : undefined,
            };
            try {
              const response = await fetch(
                "http://45.91.171.213:9080/api/manage/users/create",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                }
              );
              const responseText = await response.text();
              if (!response.ok) {
                console.error(
                  "Create user error:",
                  response.status,
                  responseText
                );
                throw new Error(responseText || "Failed to add user");
              }
              console.log("Create user success:", responseText);
              hideModal("addUserModal");
              showSuccess("User added successfully!");
              fetchUserManagementData();
            } catch (error) {
              showError(error.message);
            }
          });

        // Update User
        document
          .getElementById("updateUserForm")
          ?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const roleName = document.getElementById("updateUserRole").value;
            const payload = {
              action: document.getElementById("updateUserAction").value,
              userId: parseInt(document.getElementById("updateUserId").value),
              role: {
                roleName: roleName,
                roleDescription:
                  roleName === "ROLE_ADMIN" ? "Admin role" : "User role",
                permissions: ["READ"], // Static, adjust if needed
              },
            };
            await submitForm(
              "http://45.91.171.213:9080/api/manage/users/update-status",
              payload,
              "updateUserModal",
              fetchUserManagementData,
              "User",
              "updated",
              "PUT"
            );
          });
      }

      async function submitForm(
        url,
        payload,
        modalId,
        refreshFn,
        entityName,
        action = "added",
        method = "POST"
      ) {
        try {
          const response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok)
            throw new Error(
              (await response.text()) ||
                `Failed to ${action} ${entityName.toLowerCase()}`
            );
          hideModal(modalId);
          showSuccess(`${entityName} ${action} successfully!`);
          refreshFn();
        } catch (error) {
          showError(error.message);
        }
      }

      // Delete Operations
      async function deleteItem(type, id, serviceId = null) {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        const url =
          type === "category"
            ? `http://45.91.171.213:9080/api/manage/bills-payment/category/${id}`
            : `http://45.91.171.213:9080/api/manage/bills-payment/biller/${id}/${serviceId}`;
        try {
          const response = await fetch(url, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok)
            throw new Error(
              (await response.text()) || `Failed to delete ${type}`
            );
          showSuccess(
            `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } deleted successfully!`
          );
          fetchBillsPaymentData();
        } catch (error) {
          showError(error.message);
        }
      }

      async function deleteClient(id, serviceId) {
        if (!confirm("Are you sure you want to delete this client?")) return;
        try {
          if (!serviceId)
            throw new Error("Service ID is required for deletion");
          const url = `http://45.91.171.213:9080/api/manage/entities/${id}/service/${serviceId}`;
          const response = await fetch(url, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok)
            throw new Error(
              (await response.text()) || "Failed to delete client"
            );
          showSuccess("Client deleted successfully!");
          fetchClientManagementData();
        } catch (error) {
          showError(error.message);
        }
      }

      async function deleteService(id) {
        if (!confirm("Are you sure you want to delete this service?")) return;
        try {
          const response = await fetch(
            `http://45.91.171.213:9080/api/manage/services/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok)
            throw new Error(
              (await response.text()) || "Failed to delete service"
            );
          showSuccess("Service deleted successfully!");
          fetchProductManagementData();
        } catch (error) {
          showError(error.message);
        }
      }

      // Populate Biller Dropdowns
      async function populateBillerDropdowns() {
        // Provider ID
        try {
          const response = await fetch(
            "http://45.91.171.213:9080/api/manage/bills-payment/providers",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch providers");
          const data = await response.json();
          ["billerProviderId", "updateBillerProviderId"].forEach((id) => {
            const select = document.getElementById(id);
            select.innerHTML =
              '<option value="" disabled selected>Select a provider</option>';
            data.data?.forEach((provider) => {
              const option = document.createElement("option");
              option.value = provider.id;
              option.textContent = provider.providerName;
              select.appendChild(option);
            });
          });
        } catch (error) {
          console.error("Error fetching providers:", error);
          showError("Failed to load providers");
        }

        // Category ID
        try {
          const response = await fetch(
            "http://45.91.171.213:9080/api/manage/bills-payment/categories",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch categories");
          const data = await response.json();
          ["billerCategoryId", "updateBillerCategoryId"].forEach((id) => {
            const select = document.getElementById(id);
            select.innerHTML =
              '<option value="" disabled selected>Select a category</option>';
            data.data?.forEach((category) => {
              const option = document.createElement("option");
              option.value = category.id;
              option.textContent = category.name;
              select.appendChild(option);
            });
          });
        } catch (error) {
          console.error("Error fetching categories:", error);
          showError("Failed to load categories");
        }

        // Item Type (Static)
        const itemTypes = ["ProviderBaseBouquet", "Regular"]; // Updated to match schema
        ["billerItemType", "updateBillerItemType"].forEach((id) => {
          const select = document.getElementById(id);
          select.innerHTML =
            '<option value="" disabled selected>Select an item type</option>';
          itemTypes.forEach((type) => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
          });
        });

        // Country ID (Static until endpoint provided)
        const countries = [
          { id: 1, name: "Nigeria" },
          { id: 2, name: "Ghana" },
        ];
        ["billerCountryId", "updateBillerCountryId"].forEach((id) => {
          const select = document.getElementById(id);
          select.innerHTML =
            '<option value="" disabled selected>Select a country</option>';
          countries.forEach((country) => {
            const option = document.createElement("option");
            option.value = country.id;
            option.textContent = country.name;
            select.appendChild(option);
          });
        });

        // Operator ID (Static)
        ["billerOperatorId", "updateBillerOperatorId"].forEach((id) => {
          const select = document.getElementById(id);
          select.innerHTML = `
      <option value="" disabled selected>Select an operator</option>
      <option value="OP1">Operator 1</option>
      <option value="OP2">Operator 2</option>
    `;
        });
      }

      // Transaction Completion Functions
      function showCompleteTransactionModal(transaction) {
        const detailsDiv = document.getElementById("transactionDetails");
        detailsDiv.innerHTML = `
    <p><strong>Request Reference:</strong> ${
      transaction.requestReference || "N/A"
    }</p>
    <p><strong>Customer Reference:</strong> ${
      transaction.customerReference || "N/A"
    }</p>
    <p><strong>Amount:</strong> ${transaction.amount || "N/A"} ${
          transaction.currency || ""
        }</p>
    <p><strong>Provider:</strong> ${transaction.providerName || "N/A"}</p>
    <p><strong>Created At:</strong> ${
      transaction.createdAt
        ? new Date(transaction.createdAt).toLocaleString()
        : "N/A"
    }</p>
    <p><strong>Status:</strong> ${transaction.status || "N/A"}</p>
  `;
        showModal("completeTransactionModal");

        const approveBtn = document.getElementById("approveTransactionBtn");
        const rejectBtn = document.getElementById("rejectTransactionBtn");
        approveBtn.onclick = () =>
          completeTransaction(transaction, "Completed"); // Mapping to new enum
        rejectBtn.onclick = () => completeTransaction(transaction, "Rejected"); // Mapping to new enum
      }

      async function completeTransaction(transaction, status) {
        try {
          console.log(
            "Transaction object:",
            JSON.stringify(transaction, null, 2)
          );

          const requestId = transaction.id || transaction.requestReference; // Fallback to id if available
          if (!requestId) {
            throw new Error("No valid request ID found in transaction data.");
          }

          const parsedRequestId = parseInt(requestId);
          console.log("Using requestId:", parsedRequestId || requestId);

          const payload = {
            requestId: parsedRequestId || requestId, // Use parsed if numeric, raw if string
            status: status,
            remark: `${status} by admin on ${new Date().toLocaleString()}`,
            userData: transaction.customerReference || null,
            userDataPropertyIdentifier: transaction.token || null,
            additionInstruction:
              status === "Completed"
                ? "Transaction approved successfully."
                : "Transaction rejected. Please contact support if needed.",
            sendEmail: true,
            sendSms: false,
            serviceType: "BillsPayment",
          };

          console.log("Payload:", JSON.stringify(payload, null, 2));

          const response = await fetch(
            "http://45.91.171.213:9080/api/manage/request/completion/update",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            }
          );

          const responseText = await response.text();
          console.log("Response:", responseText);

          if (!response.ok) {
            throw new Error(
              responseText || `Failed to ${status.toLowerCase()} transaction`
            );
          }

          hideModal("completeTransactionModal");
          showSuccess(`Transaction ${status.toLowerCase()} successfully!`);
          fetchBillsPaymentData();
        } catch (error) {
          console.error("Error:", error);
          showError(error.message);
        }
      }

      // Modal Event Listeners
      function setupModalEventListeners() {
        document
          .getElementById("closeSuccessBtn")
          ?.addEventListener("click", () => hideModal("successModal"));
        document
          .getElementById("closeErrorBtn")
          ?.addEventListener("click", () => hideModal("errorModal"));
        document
          .getElementById("cancelAddProviderBtn")
          ?.addEventListener("click", () => hideModal("addProviderModal"));
        document
          .getElementById("cancelAddCategoryBtn")
          ?.addEventListener("click", () => hideModal("addCategoryModal"));
        document
          .getElementById("cancelUpdateCategoryBtn")
          ?.addEventListener("click", () => hideModal("updateCategoryModal"));
        document
          .getElementById("cancelAddBillerBtn")
          ?.addEventListener("click", () => hideModal("addBillerModal"));
        document
          .getElementById("cancelUpdateBillerBtn")
          ?.addEventListener("click", () => hideModal("updateBillerModal"));
        document
          .getElementById("cancelAddClientBtn")
          ?.addEventListener("click", () => hideModal("addClientModal"));
        document
          .getElementById("cancelUpdateClientBtn")
          ?.addEventListener("click", () => hideModal("updateClientModal"));
        document
          .getElementById("cancelAddServiceBtn")
          ?.addEventListener("click", () => hideModal("addServiceModal"));
        document
          .getElementById("cancelUpdateServiceBtn")
          ?.addEventListener("click", () => hideModal("updateServiceModal"));
        document
          .getElementById("cancelCompleteTransactionBtn")
          ?.addEventListener("click", () =>
            hideModal("completeTransactionModal")
          );
        document
          .getElementById("cancelAddUserBtn")
          ?.addEventListener("click", () => hideModal("addUserModal"));
        document
          .getElementById("cancelUpdateUserBtn")
          ?.addEventListener("click", () => hideModal("updateUserModal"));
      }
    </script>