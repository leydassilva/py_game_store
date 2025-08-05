function handlePurchaseFields(product) {
    // Função para preencher/manipular campos de compra em formulários
    const form = document.getElementById('edit-product-form') || document.getElementById('product-form');
    if (form) {
        form.querySelector('[id$="product-cost"]').value = product.cost || '';
        form.querySelector('[id$="product-purchase-date"]').value = product.purchase_date || '';
    }
}