//Início
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando sistema...');
    // Inicializa a página na seção "Início"
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.classList.add('active');
    } else {
        console.error('Seção #dashboard não encontrada');
    }
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    } else {
        console.error('Link para #dashboard não encontrado');
    }

    // Garante que os modais estejam escondidos
    const modals = ['edit-modal', 'add-product-modal', 'maintenance-modal', 'edit-maintenance-modal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error(`Modal #${id} não encontrado`);
        }
    });

    // Carrega dados iniciais
    loadDashboard();
    loadProducts();
    loadProductOptions();
    setupNav();

    // Configura eventos
    const productForm = document.getElementById('product-form');
    if (productForm) productForm.addEventListener('submit', addProduct);
    const saleForm = document.getElementById('sale-form');
    if (saleForm) saleForm.addEventListener('submit', addSale);
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) editProductForm.addEventListener('submit', updateProduct);
    const editMaintenanceForm = document.getElementById('edit-maintenance-form');
    if (editMaintenanceForm) editMaintenanceForm.addEventListener('submit', addMaintenanceFromModal);
    const maintenanceForm = document.getElementById('maintenance-form');
    if (maintenanceForm) maintenanceForm.addEventListener('submit', addMaintenance);
    const editMaintenanceRecordForm = document.getElementById('edit-maintenance-record-form');
    if (editMaintenanceRecordForm) editMaintenanceRecordForm.addEventListener('submit', updateMaintenance);

    // Configura botão de adicionar produto
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const modal = document.getElementById('add-product-modal');
            if (modal) {
                modal.style.display = 'block';
            } else {
                console.error('Modal #add-product-modal não encontrado');
            }
        });
    }

    // Configura botões de fechar modais
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Configura botão "Fechar" para modais com .close-btn
    document.querySelectorAll('.modal .close-btn').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Fecha modais com a tecla "Esc"
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal && modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });
});

function setupNav() {
    console.log('Configurando navegação...');
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            console.log(`Clicado no link: ${href}`);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const section = document.querySelector(href);
            if (section) {
                section.classList.add('active');
                if (href === '#search') {
                    clearSearch();
                } else if (href === '#maintenances') {
                    clearMaintenanceSearch();
                }
            } else {
                console.error(`Seção ${href} não encontrada`);
            }
        });
    });
}

function formatPrice(value) {
    return 'R$ ' + (parseFloat(value) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/reports/stock');
        if (!response.ok) throw new Error('Erro ao carregar estoque');
        const stock = await response.json();
        document.getElementById('stock-count').textContent = stock.length;

        const maintenanceResponse = await fetch('/api/reports/maintenance');
        if (!maintenanceResponse.ok) throw new Error('Erro ao carregar manutenções');
        const maintenance = await maintenanceResponse.json();
        document.getElementById('maintenance-count').textContent = maintenance.length;

        const soldResponse = await fetch('/api/reports/sold');
        if (!soldResponse.ok) throw new Error('Erro ao carregar vendas');
        const sold = await soldResponse.json();
        const now = new Date();
        const monthSales = sold.filter(s => new Date(s.sale_date).getMonth() === now.getMonth());
        document.getElementById('sales-count').textContent = monthSales.length;
    } catch (error) {
        console.error('Erro em loadDashboard:', error);
    }
}

async function loadProducts() {
    try {
        console.log('Carregando produtos...');
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
        const products = await response.json();
        console.log('Produtos recebidos:', products);
        const productList = document.getElementById('product-list');
        if (!productList) {
            console.error('Elemento #product-list não encontrado');
            return;
        }
        productList.innerHTML = products.map(p => {
            const name = p.name.replace(/'/g, "\\'");
            const model = (p.model || '').replace(/'/g, "\\'");
            const notes = (p.notes || '').replace(/'/g, "\\'");
            const imagePath = (p.image_path || '').replace(/'/g, "\\'");
            const supplierName = (p.supplier_name || '').replace(/'/g, "\\'");
            return `
                <div class="card" onclick="openEditModal(${p.id}, '${name}', '${p.type}', '${p.brand}', '${model}', '${notes}', '${p.status}', '${imagePath}', ${p.current_cost}, '${supplierName}')">
                    ${p.image_path ? `<img src="${p.image_path}" alt="${name}">` : '<p>Sem imagem</p>'}
                    <p><strong>Nome:</strong> ${name}</p>
                    <p><strong>Tipo:</strong> ${p.type === 'console' ? 'Console' : p.type === 'acessorio' ? 'Acessório' : 'Jogo'}</p>
                    <p><strong>Marca:</strong> ${p.brand}</p>
                    <p><strong>Modelo:</strong> ${model || 'N/A'}</p>
                    <p><strong>Fornecedor:</strong> ${p.supplier_name || 'N/A'}</p>
                    <p><strong>Status:</strong> ${p.status === 'em_estoque' ? 'Em Estoque' : p.status === 'em_manutencao' ? 'Em Manutenção' : 'Vendido'}</p>
                    <p><strong>Custo Atual:</strong> ${formatPrice(p.current_cost)}</p>
                    <div class="card-buttons">
                        <button onclick="openEditModal(${p.id}, '${name}', '${p.type}', '${p.brand}', '${model}', '${notes}', '${p.status}', '${imagePath}', ${p.current_cost}, '${supplierName}')">Editar</button>
                        <button class="delete" onclick="deleteProduct(${p.id}, event)">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro em loadProducts:', error);
    }
}

async function loadProductOptions() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Erro ao carregar opções de produtos');
        const products = await response.json();
        const productSelects = ['sale-product'];
        productSelects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Selecione o Produto</option>' +
                    products.map(p => `<option value="${p.id}">${p.name.replace(/'/g, "\\'")}</option>`).join('');
            } else {
                console.error(`Select #${id} não encontrado`);
            }
        });
    } catch (error) {
        console.error('Erro em loadProductOptions:', error);
    }
}

async function loadMaintenances(productId) {
    try {
        const response = await fetch(`/api/maintenances/${productId}`);
        if (!response.ok) throw new Error('Erro ao carregar manutenções');
        const maintenances = await response.json();
        const tableBody = document.getElementById('maintenance-table-body');
        if (!tableBody) {
            console.error('Elemento #maintenance-table-body não encontrado');
            return;
        }
        tableBody.innerHTML = maintenances.length > 0 ? maintenances.map(m => `
            <tr>
                <td>${m.service_type}</td>
                <td>${m.date}</td>
                <td>${formatPrice(m.cost)}</td>
                <td>${m.notes || 'N/A'}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">Nenhuma manutenção registrada</td></tr>';
    } catch (error) {
        console.error('Erro em loadMaintenances:', error);
    }
}

async function loadPriceHistory(productId) {
    try {
        const response = await fetch(`/api/price_history/${productId}`);
        if (!response.ok) throw new Error('Erro ao carregar histórico de preços');
        const priceHistory = await response.json();
        const tableBody = document.getElementById('price-history-table-body');
        if (!tableBody) {
            console.error('Elemento #price-history-table-body não encontrado');
            return;
        }
        tableBody.innerHTML = priceHistory.length > 0 ? priceHistory.map(p => `
            <tr>
                <td>${formatPrice(p.old_price)}</td>
                <td>${formatPrice(p.new_price)}</td>
                <td>${p.updated_at}</td>
                <td>${p.reason || 'N/A'}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">Nenhum histórico de preços registrado</td></tr>';
    } catch (error) {
        console.error('Erro em loadPriceHistory:', error);
    }
}

async function loadMaintenanceHistory(productId) {
    try {
        const response = await fetch(`/api/maintenances/${productId}`);
        if (!response.ok) throw new Error('Erro ao carregar histórico de manutenções');
        const maintenances = await response.json();
        const tableBody = document.getElementById('maintenance-history-table-body');
        if (!tableBody) {
            console.error('Elemento #maintenance-history-table-body não encontrado');
            return;
        }
        tableBody.innerHTML = maintenances.length > 0 ? maintenances.map(m => `
            <tr>
                <td>${m.service_type}</td>
                <td>${m.date}</td>
                <td>${formatPrice(m.cost)}</td>
                <td>${m.notes || 'N/A'}</td>
                <td>
                    <button onclick="openEditMaintenanceModal(${m.id}, '${m.service_type.replace(/'/g, "\\'")}', '${m.date}', ${m.cost}, '${(m.notes || '').replace(/'/g, "\\'")}', ${productId})">Editar</button>
                    <button class="delete" onclick="deleteMaintenance(${m.id}, ${productId}, event)">Excluir</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="5">Nenhuma manutenção registrada</td></tr>';
    } catch (error) {
        console.error('Erro em loadMaintenanceHistory:', error);
    }
}

async function addProduct(e) {
    e.preventDefault();
    try {
        const form = e.target;
        const data = {
            name: form.querySelector('#product-name').value,
            type: form.querySelector('#product-type').value,
            brand: form.querySelector('#product-brand').value,
            model: form.querySelector('#product-model').value,
            notes: form.querySelector('#product-notes').value,
            status: form.querySelector('#product-status').value,
            image_path: form.querySelector('#product-image').value,
            supplier_name: form.querySelector('#product-supplier').value,
            cost: form.querySelector('#product-cost').value,
            purchase_date: form.querySelector('#product-purchase-date').value
        };
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao cadastrar produto');
        form.reset();
        document.getElementById('add-product-modal').style.display = 'none';
        loadProducts();
        loadProductOptions();
    } catch (error) {
        console.error('Erro em addProduct:', error);
    }
}

async function updateProduct(e) {
    e.preventDefault();
    try {
        const form = e.target;
        const productId = form.querySelector('#edit-product-id').value;
        const data = {
            name: form.querySelector('#edit-product-name').value,
            type: form.querySelector('#edit-product-type').value,
            brand: form.querySelector('#edit-product-brand').value,
            model: form.querySelector('#edit-product-model').value,
            notes: form.querySelector('#edit-product-notes').value,
            status: form.querySelector('#edit-product-status').value,
            image_path: form.querySelector('#edit-product-image').value,
            supplier_name: form.querySelector('#edit-product-supplier').value,
            cost: form.querySelector('#edit-product-cost').value
        };
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar produto');
        document.getElementById('edit-modal').style.display = 'none';
        form.reset();
        loadProducts();
        loadProductOptions();
    } catch (error) {
        console.error('Erro em updateProduct:', error);
    }
}

async function deleteProduct(productId, event) {
    event.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Erro ao excluir produto');
            loadProducts();
            loadProductOptions();
        } catch (error) {
            console.error('Erro em deleteProduct:', error);
        }
    }
}

async function openEditModal(id, name, type, brand, model, notes, status, image_path, current_cost, supplier_name) {
    try {
        const modal = document.getElementById('edit-modal');
        if (!modal) {
            console.error('Modal #edit-modal não encontrado');
            return;
        }
        document.getElementById('edit-product-id').value = id;
        document.getElementById('edit-product-name').value = name;
        document.getElementById('edit-product-type').value = type;
        document.getElementById('edit-product-brand').value = brand;
        document.getElementById('edit-product-model').value = model;
        document.getElementById('edit-product-notes').value = notes;
        document.getElementById('edit-product-status').value = status;
        document.getElementById('edit-product-image').value = image_path;
        document.getElementById('edit-product-supplier').value = supplier_name;
        document.getElementById('edit-product-cost').value = current_cost;
        document.getElementById('edit-maintenance-product-id').value = id;
        const imagePreview = document.getElementById('edit-product-image-preview');
        const noImageText = document.getElementById('edit-product-no-image');
        if (image_path) {
            imagePreview.src = image_path;
            imagePreview.style.display = 'block';
            noImageText.style.display = 'none';
        } else {
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';
        }
        await loadMaintenances(id);
        await loadPriceHistory(id);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro em openEditModal:', error);
    }
}

async function openMaintenanceModal(id, name, image_path) {
    try {
        const modal = document.getElementById('maintenance-modal');
        if (!modal) {
            console.error('Modal #maintenance-modal não encontrado');
            return;
        }
        document.getElementById('maintenance-product-id').value = id;
        const imagePreview = document.getElementById('maintenance-product-image-preview');
        const noImageText = document.getElementById('maintenance-product-no-image');
        if (image_path) {
            imagePreview.src = image_path;
            imagePreview.style.display = 'block';
            noImageText.style.display = 'none';
        } else {
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';
        }
        await loadMaintenanceHistory(id);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro em openMaintenanceModal:', error);
    }
}

async function openEditMaintenanceModal(id, service_type, date, cost, notes, productId) {
    try {
        const modal = document.getElementById('edit-maintenance-modal');
        if (!modal) {
            console.error('Modal #edit-maintenance-modal não encontrado');
            return;
        }
        document.getElementById('edit-maintenance-record-id').value = id;
        document.getElementById('edit-maintenance-record-product-id').value = productId;
        document.getElementById('edit-maintenance-record-service').value = service_type;
        document.getElementById('edit-maintenance-record-date').value = date;
        document.getElementById('edit-maintenance-record-cost').value = cost;
        document.getElementById('edit-maintenance-record-notes').value = notes;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro em openEditMaintenanceModal:', error);
    }
}

async function addMaintenanceFromModal(e) {
    e.preventDefault();
    try {
        const form = e.target;
        const productId = form.querySelector('#edit-maintenance-product-id').value;
        const data = {
            product_id: productId,
            service_type: form.querySelector('#edit-maintenance-service').value,
            date: form.querySelector('#edit-maintenance-date').value,
            cost: form.querySelector('#edit-maintenance-cost').value,
            notes: form.querySelector('#edit-maintenance-notes').value
        };
        const response = await fetch('/api/maintenances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao registrar manutenção');
        form.reset();
        await loadMaintenances(productId);
        await loadPriceHistory(productId);
        loadDashboard();
        loadProducts();
    } catch (error) {
        console.error('Erro em addMaintenanceFromModal:', error);
    }
}

async function addMaintenance(e) {
    e.preventDefault();
    try {
        const form = e.target;
        const productId = form.querySelector('#maintenance-product-id').value;
        const data = {
            product_id: productId,
            service_type: form.querySelector('#maintenance-service').value,
            date: form.querySelector('#maintenance-date').value,
            cost: form.querySelector('#maintenance-cost').value,
            notes: form.querySelector('#maintenance-notes').value
        };
        const response = await fetch('/api/maintenances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao registrar manutenção');
        form.reset();
        await loadMaintenanceHistory(productId);
        loadDashboard();
        loadProducts();
    } catch (error) {
        console.error('Erro em addMaintenance:', error);
    }
}

async function updateMaintenance(e) {
    e.preventDefault();
    try {
        const form = e.target;
        const maintenanceId = form.querySelector('#edit-maintenance-record-id').value;
        const productId = form.querySelector('#edit-maintenance-record-product-id').value;
        const data = {
            service_type: form.querySelector('#edit-maintenance-record-service').value,
            date: form.querySelector('#edit-maintenance-record-date').value,
            cost: form.querySelector('#edit-maintenance-record-cost').value,
            notes: form.querySelector('#edit-maintenance-record-notes').value
        };
        const response = await fetch(`/api/maintenances/${maintenanceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar manutenção');
        document.getElementById('edit-maintenance-modal').style.display = 'none';
        form.reset();
        await loadMaintenanceHistory(productId);
        loadDashboard();
        loadProducts();
    } catch (error) {
        console.error('Erro em updateMaintenance:', error);
    }
}

async function deleteMaintenance(maintenanceId, productId, event) {
    event.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
        try {
            const response = await fetch(`/api/maintenances/${maintenanceId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Erro ao excluir manutenção');
            await loadMaintenanceHistory(productId);
            loadDashboard();
            loadProducts();
        } catch (error) {
            console.error('Erro em deleteMaintenance:', error);
        }
    }
}

async function generateQuote() {
    try {
        const productId = document.getElementById('sale-product').value;
        const margin = document.getElementById('sale-margin').value;
        const ipca = document.getElementById('sale-ipca').value;
        const response = await fetch(`/api/quote/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ margin, ipca })
        });
        if (!response.ok) throw new Error('Erro ao gerar orçamento');
        const result = await response.json();
        document.getElementById('quote-result').innerHTML = `
            Custo Ajustado: ${formatPrice(result.adjusted_cost)}<br>
            Preço de Venda Sugerido: ${formatPrice(result.sale_price)}
        `;
        document.getElementById('sale-price').value = result.sale_price;
    } catch (error) {
        console.error('Erro em generateQuote:', error);
    }
}

async function addSale(e) {
    e.preventDefault();
    try {
        const form = e.target;
        const data = {
            product_id: form.querySelector('#sale-product').value,
            sale_date: form.querySelector('#sale-date').value,
            sale_price: form.querySelector('#sale-price').value,
            payment_method: form.querySelector('#sale-payment').value,
            customer_name: form.querySelector('#sale-customer').value
        };
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao registrar venda');
        form.reset();
        document.getElementById('quote-result').innerHTML = '';
        loadProducts();
        loadProductOptions();
        loadDashboard();
    } catch (error) {
        console.error('Erro em addSale:', error);
    }
}

async function generateReport() {
    try {
        const reportType = document.getElementById('report-type').value;
        const response = await fetch(`/api/reports/${reportType}`);
        if (!response.ok) throw new Error('Erro ao gerar relatório');
        const data = await response.json();
        const resultDiv = document.getElementById('report-result');
        if (!resultDiv) {
            console.error('Elemento #report-result não encontrado');
            return;
        }
        if (reportType === 'profit') {
            resultDiv.innerHTML = `
                <table>
                    <tr><th>Nome</th><th>Preço de Venda</th><th>Custo de Compra</th><th>Custo de Manutenção</th><th>Lucro</th></tr>
                    ${data.map(d => `
                        <tr>
                            <td>${d.name}</td>
                            <td>${formatPrice(d.sale_price)}</td>
                            <td>${formatPrice(d.purchase_cost || 0)}</td>
                            <td>${formatPrice(d.maintenance_cost || 0)}</td>
                            <td>${formatPrice(d.sale_price - (d.purchase_cost || 0) - (d.maintenance_cost || 0))}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else {
            resultDiv.innerHTML = `
                <table>
                    <tr><th>ID</th><th>Nome</th><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Status</th><th>Custo Atual</th></tr>
                    ${data.map(d => `
                        <tr>
                            <td>${d.id}</td>
                            <td>${d.name}</td>
                            <td>${d.type === 'console' ? 'Console' : d.type === 'acessorio' ? 'Acessório' : 'Jogo'}</td>
                            <td>${d.brand}</td>
                            <td>${d.model || 'N/A'}</td>
                            <td>${d.status === 'em_estoque' ? 'Em Estoque' : d.status === 'em_manutencao' ? 'Em Manutenção' : 'Vendido'}</td>
                            <td>${formatPrice(d.current_cost)}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }
    } catch (error) {
        console.error('Erro em generateReport:', error);
    }
}

async function searchProducts() {
    try {
        const query = document.getElementById('search-query').value;
        const searchType = document.getElementById('search-type').value;
        const response = await fetch(`/api/search?query=${query}&type=${searchType}`);
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        const products = await response.json();
        const searchResult = document.getElementById('search-result');
        if (!searchResult) {
            console.error('Elemento #search-result não encontrado');
            return;
        }
        searchResult.innerHTML = products.map(p => {
            const name = p.name.replace(/'/g, "\\'");
            const model = (p.model || '').replace(/'/g, "\\'");
            const notes = (p.notes || '').replace(/'/g, "\\'");
            const imagePath = (p.image_path || '').replace(/'/g, "\\'");
            const supplierName = (p.supplier_name || '').replace(/'/g, "\\'");
            return `
                <div class="card" onclick="openEditModal(${p.id}, '${name}', '${p.type}', '${p.brand}', '${model}', '${notes}', '${p.status}', '${imagePath}', ${p.current_cost}, '${supplierName}')">
                    ${p.image_path ? `<img src="${p.image_path}" alt="${name}">` : '<p>Sem imagem</p>'}
                    <p><strong>Nome:</strong> ${name}</p>
                    <p><strong>Tipo:</strong> ${p.type === 'console' ? 'Console' : p.type === 'acessorio' ? 'Acessório' : 'Jogo'}</p>
                    <p><strong>Marca:</strong> ${p.brand}</p>
                    <p><strong>Modelo:</strong> ${model || 'N/A'}</p>
                    <p><strong>Fornecedor:</strong> ${p.supplier_name || 'N/A'}</p>
                    <p><strong>Status:</strong> ${p.status === 'em_estoque' ? 'Em Estoque' : p.status === 'em_manutencao' ? 'Em Manutenção' : 'Vendido'}</p>
                    <p><strong>Custo Atual:</strong> ${formatPrice(p.current_cost)}</p>
                    <div class="card-buttons">
                        <button onclick="openEditModal(${p.id}, '${name}', '${p.type}', '${p.brand}', '${model}', '${notes}', '${p.status}', '${imagePath}', ${p.current_cost}, '${supplierName}')">Editar</button>
                        <button class="delete" onclick="deleteProduct(${p.id}, event)">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro em searchProducts:', error);
    }
}

async function searchMaintenanceProducts() {
    try {
        const query = document.getElementById('maintenance-search-query').value;
        const searchType = document.getElementById('maintenance-search-type').value;
        const response = await fetch(`/api/search?query=${query}&type=${searchType}`);
        if (!response.ok) throw new Error('Erro ao buscar produtos para manutenção');
        const products = await response.json();
        const searchResult = document.getElementById('maintenance-search-result');
        if (!searchResult) {
            console.error('Elemento #maintenance-search-result não encontrado');
            return;
        }
        searchResult.innerHTML = products.map(p => {
            const name = p.name.replace(/'/g, "\\'");
            const model = (p.model || '').replace(/'/g, "\\'");
            const imagePath = (p.image_path || '').replace(/'/g, "\\'");
            const supplierName = (p.supplier_name || '').replace(/'/g, "\\'");
            return `
                <div class="card" onclick="openMaintenanceModal(${p.id}, '${name}', '${imagePath}')">
                    ${p.image_path ? `<img src="${p.image_path}" alt="${name}">` : '<p>Sem imagem</p>'}
                    <p><strong>Nome:</strong> ${name}</p>
                    <p><strong>Tipo:</strong> ${p.type === 'console' ? 'Console' : p.type === 'acessorio' ? 'Acessório' : 'Jogo'}</p>
                    <p><strong>Marca:</strong> ${p.brand}</p>
                    <p><strong>Modelo:</strong> ${model || 'N/A'}</p>
                    <p><strong>Fornecedor:</strong> ${p.supplier_name || 'N/A'}</p>
                    <p><strong>Status:</strong> ${p.status === 'em_estoque' ? 'Em Estoque' : p.status === 'em_manutencao' ? 'Em Manutenção' : 'Vendido'}</p>
                    <p><strong>Custo Atual:</strong> ${formatPrice(p.current_cost)}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro em searchMaintenanceProducts:', error);
    }
}

function clearSearch() {
    const searchQuery = document.getElementById('search-query');
    const searchType = document.getElementById('search-type');
    const searchResult = document.getElementById('search-result');
    if (searchQuery) searchQuery.value = '';
    if (searchType) searchType.value = 'name';
    if (searchResult) searchResult.innerHTML = '';
}

function clearMaintenanceSearch() {
    const searchQuery = document.getElementById('maintenance-search-query');
    const searchType = document.getElementById('maintenance-search-type');
    const searchResult = document.getElementById('maintenance-search-result');
    if (searchQuery) searchQuery.value = '';
    if (searchType) searchType.value = 'name';
    if (searchResult) searchResult.innerHTML = '';
}
//fim