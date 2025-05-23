const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navCenter = document.querySelector('.seller-nav-center');

if (mobileMenuBtn && navCenter) {
    mobileMenuBtn.addEventListener('click', () => {
        navCenter.classList.toggle('active');
        mobileMenuBtn.innerHTML = navCenter.classList.contains('active')
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    const searchBox = document.querySelector( '.search-box input' );
    const searchBtn = document.querySelector('.search-btn');
    await fetchAndRenderProducts();

    async function performSearch() {
        const searchTerm = searchBox.value.trim();
        await fetchAndRenderProducts( search = searchTerm, category='' );
    }

    searchBtn.addEventListener('click', performSearch);
    searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    const chips = document.querySelectorAll('.chip');

    // 1. Activate chip based on URL on page load
    const params = new URLSearchParams(window.location.search);
    const currentCategory = (params.get('category') || 'All').toLowerCase();

    chips.forEach(chip => {
        if (chip.textContent.trim().toLowerCase() === currentCategory) {
            chip.classList.add('active');
        } else if ( chip.textContent.trim().toLowerCase() === 'books' ) {
            if ( currentCategory === 'textbooks' ) {
                chip.classList.add('active');
            }
        }
        else {
            chip.classList.remove('active');
        }
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const selectedCategory = chip.textContent.trim();
            let newUrl;
            if ( selectedCategory === 'All' ) {
                newUrl = `buyer-home.php`;
            } else if ( selectedCategory === 'Books' ) {
                newUrl = `buyer-home.php?category=textbooks`;
            }
            else {
                newUrl = `buyer-home.php?category=${encodeURIComponent(selectedCategory)}`;
            }
            window.location.href = newUrl;
        });
    });


    const addCartBtns = document.querySelectorAll('.add-cart-btn');

    addCartBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const productId = btn.getAttribute('data-product-id');

        const formData = new FormData();
        formData.append( 'product_id', productId );

        const response = await fetch( '../core/cart.php', {
            method: 'POST',
            body: formData,
        } );
        if ( response.ok ) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Added';
            btn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
            }, 2000)
        }
        else {
            alert( 'Something Went Wrong. Please try agin later.' );
        }});
    });
} );


async function fetchAndRenderProducts ( search = '' ) {
    let slice = 5;
    try {
        let url = '../core/product.php';
        const params = new URLSearchParams( window.location.search );

        category = params.get('category');

        if ( category ) {
            slice = null;
        }

        if ( search ) params.append( 'search', search );

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const data = await response.json();

        if ( data.success ) {
            renderProductsByCategory( data.products, slice );
        } else {
            alert('Failed to fetch products:', data.error);
        }
    } catch (error) {
        alert('Error fetching products:', error);
    }
};

function renderProductsByCategory(products, slice) {
    const container = document.querySelector('.category-products');
    container.innerHTML = '';

    if ( products.length === 0 ) {
        const fallBack = document.createElement( 'div' );
        fallBack.className = 'fallback';
        fallBack.innerHTML = `<p>No products found!</p>`
        container.appendChild( fallBack );
        return;
    }
    const grouped = products.reduce((acc, product) => {
        const category = product.category.toLowerCase();
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {});

    const categoryIcons = {
        textbooks: 'fa-book',
        electronics: 'fa-laptop',
        clothing: 'fa-tshirt',
        furniture: 'fa-couch',
        other: 'fa-box'
    };

    Object.entries(grouped).forEach(([category, items]) => {
        if (!items.length) return;

        const displayName = capitalize(category);
        const icon = categoryIcons[category] || 'fa-box';

        let topProducts = items;
        if ( slice ) {
            topProducts = topProducts.slice(0, 5);
        }

        const section = document.createElement('div');
        section.className = 'category-section';

        section.innerHTML = `
            <div class="category-header">
                <h2><i class="fas ${icon}"></i> ${displayName}</h2>
                <a href="buyer-home.php?category=${category}" data-category-name="${category}" class="view-all-btn">View All</a>
            </div>
            <div class="products-grid">
                ${topProducts.map(p => renderProductCard(p)).join('')}
            </div>
        `;
        container.appendChild(section);
    });
}

function renderProductCard ( product ) {
    return `
        <div class="product-card">
            <div class="product-image">
                <img src="../${product.first_image}" alt="${product.title}">
            </div>
            <div class="product-details">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">ETB ${parseFloat(product.price).toLocaleString()}</div>
                <div class="product-seller">
                    <i class="fas fa-user"></i> ${product.seller_name}
                </div>
                <div class="product-actions">
                    <a href="product.php?product_id=${product.product_id}" class="detail-btn">See Details</a>
                    <button class="add-cart-btn" data-product-id="${product.product_id}">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
