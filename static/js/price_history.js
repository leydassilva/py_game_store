function updatePriceHistoryTable(productId) {
    fetchData(`/api/price_history/${productId}`, data => {
        const tableBody = document.getElementById('price-history-table-body');
        tableBody.innerHTML = '';
        data.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.previous_price}</td>
                <td>${entry.current_price}</td>
                <td>${entry.date}</td>
                <td>${entry.reason}</td>`;
            tableBody.appendChild(row);
        });
    });
}