function generateQuote() {
    const productId = document.getElementById('sale-product').value;
    const ipca = document.getElementById('sale-ipca').value;
    const margin = document.getElementById('sale-margin').value;
    fetchData(`/api/quote?product_id=${productId}&ipca=${ipca}&margin=${margin}`, data => {
        document.getElementById('quote-result').innerHTML = `Preço sugerido: R$${data.price}`;
    });
}

function submitSaleForm() {
    const form = document.getElementById('sale-form');
    const data = {
        product_id: form.querySelector('#sale-product').value,
        ipca: form.querySelector('#sale-ipca').value,
        margin: form.querySelector('#sale-margin').value,
        date: form.querySelector('#sale-date').value,
        price: form.querySelector('#sale-price').value,
        payment: form.querySelector('#sale-payment').value,
        customer: form.querySelector('#sale-customer').value
    };
    fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        form.reset();
        updateDashboard();
    });
}