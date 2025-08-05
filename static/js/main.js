function initializeApp() {
    updateDashboard();
    setupNavigation();
    setupModalEvents();
    fetchProducts(); // Chamada mantida para inicializar a lista de produtos
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            const sectionId = link.getAttribute('href').substring(1);
            document.getElementById(sectionId).classList.add('active');
            link.classList.add('active');
        });
    });
}

function setupModalEvents() {
    document.querySelectorAll('.modal .close, .modal .close-btn').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });
    document.getElementById('add-product-btn').addEventListener('click', openAddProductModal);
}

function fetchData(endpoint, callback) {
    fetch(endpoint)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error:', error));
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function updateDashboard() {
    fetchData('/api/stats', data => {
        document.getElementById('stock-count').textContent = data.stock;
        document.getElementById('maintenance-count').textContent = data.maintenance;
        document.getElementById('sales-count').textContent = data.sales;
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);