function searchMaintenanceProducts() {
    const query = document.getElementById('maintenance-search-query').value;
    const type = document.getElementById('maintenance-search-type').value;
    fetchData(`/api/maintenances?query=${query}&type=${type}`, data => {
        const result = document.getElementById('maintenance-search-result');
        result.innerHTML = '';
        data.forEach(product => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${product.image || ''}" alt="${product.name}" style="${product.image ? '' : 'display: none;'}">
                <p>${product.name}</p>
                <p>${product.brand}</p>
                <div class="card-buttons">
                    <button onclick="openMaintenanceModal(${product.id})">Gerenciar</button>
                </div>`;
            result.appendChild(card);
        });
    });
}

function clearMaintenanceSearch() {
    document.getElementById('maintenance-search-query').value = '';
    document.getElementById('maintenance-search-type').value = 'name';
    document.getElementById('maintenance-search-result').innerHTML = '';
}

function openMaintenanceModal(productId) {
    showModal('maintenance-modal');
    document.getElementById('maintenance-product-id').value = productId;
}

function submitMaintenanceForm() {
    const form = document.getElementById('maintenance-form');
    const data = {
        product_id: form.querySelector('#maintenance-product-id').value,
        service: form.querySelector('#maintenance-service').value,
        date: form.querySelector('#maintenance-date').value,
        cost: form.querySelector('#maintenance-cost').value,
        notes: form.querySelector('#maintenance-notes').value
    };
    fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        hideModal('maintenance-modal');
        updateDashboard();
    });
}

function editMaintenance(maintenanceId) {
    showModal('edit-maintenance-modal');
    fetchData(`/api/maintenances/${maintenanceId}`, data => {
        const form = document.getElementById('edit-maintenance-record-form');
        form.querySelector('#edit-maintenance-record-id').value = data.id;
        form.querySelector('#edit-maintenance-record-product-id').value = data.product_id;
        form.querySelector('#edit-maintenance-record-service').value = data.service;
        form.querySelector('#edit-maintenance-record-date').value = data.date;
        form.querySelector('#edit-maintenance-record-cost').value = data.cost;
        form.querySelector('#edit-maintenance-record-notes').value = data.notes;
    });
}

function submitEditMaintenanceForm() {
    const form = document.getElementById('edit-maintenance-record-form');
    const data = {
        id: form.querySelector('#edit-maintenance-record-id').value,
        product_id: form.querySelector('#edit-maintenance-record-product-id').value,
        service: form.querySelector('#edit-maintenance-record-service').value,
        date: form.querySelector('#edit-maintenance-record-date').value,
        cost: form.querySelector('#edit-maintenance-record-cost').value,
        notes: form.querySelector('#edit-maintenance-record-notes').value
    };
    fetch(`/api/maintenances/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        hideModal('edit-maintenance-modal');
        updateDashboard();
    });
}