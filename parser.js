function parsePage() {

    const getElementText = (selector, defaultValue = '', transform = null, parent = document) => {
        const element = parent.querySelector(selector);
        if (!element) return defaultValue;
        let text = element.textContent?.trim() || defaultValue;
        if (transform && text && text !== defaultValue) {
            try {
                text = transform(text);
            } catch (e) {
                console.error(`Error applying transform for selector "${selector}":`, e);
            }
        }
        return text;
    };
    

    const getCleanHTML = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return '';
        const clone = element.cloneNode(true);
        clone.querySelectorAll('*').forEach(el => {
            [...el.attributes].forEach(attr => {
                el.removeAttribute(attr.name);
            });
        });
        return clone.innerHTML.trim();
    };
    

    const currencyMap = {
        '$': 'USD',
        '€': 'EUR',
        '₽': 'RUB'
    };
    
    // ========== META ==========
    // описание
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const metaDescription = descriptionMeta?.getAttribute('content') || '';
    
    // ключевые слова
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    const keywords = keywordsMeta?.getAttribute('content')?.split(',').map(k => k.trim()) || [];
    
    // опенграф теги
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    
    const meta = {
        title: getElementText('head title', '', (text) => text.split('—').shift().trim()),
        description: metaDescription,
        keywords: keywords,
        language: document.querySelector('html')?.lang ?? 'en',
        opengraph: {
            title: ogTitle ? (ogTitle.getAttribute('content') || '').split('—').shift().trim() : '',
            image: ogImage?.getAttribute('content') || '',
            type: ogType?.getAttribute('content') || ''
        }
    };
    
    // ========== PRODUCT ==========
    // свойства
    const propertyItems = [...document.querySelectorAll('.about .properties li')];
    const properties = {};
    propertyItems.forEach(item => {
        const spans = [...item.children];
        if (spans.length >= 2) {
            const key = spans[0]?.textContent?.trim();
            const value = spans[1]?.textContent?.trim();
            if (key) {
                properties[key] = value;
            }
        }
    });
    
    // разбор по цветам
    const getTagsByColor = (color) => {
        return [...document.querySelectorAll(`.about .tags .${color}`)].map(tag => tag.textContent.trim());
    };
    
    // цена товара
    const priceContainer = document.querySelector('.product .price');
    let price = 0;
    let oldPrice = 0;
    let discountValue = 0;
    let discountPercent = '0%';
    let currencySymbol = '';
    
    if (priceContainer) {
        const textNodes = [...priceContainer.childNodes].filter(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        if (textNodes.length > 0) {
            const priceText = textNodes[0].textContent.trim();
            currencySymbol = priceText[0];
            price = parseFloat(priceText.slice(1)) || 0;
        }
        

        const oldPriceSpan = priceContainer.querySelector('span');
        if (oldPriceSpan) {
            const oldPriceText = oldPriceSpan.textContent.trim();
            oldPrice = parseFloat(oldPriceText.slice(1)) || 0;
            if (oldPrice > 0 && price > 0) {
                discountValue = oldPrice - price;
                discountPercent = ((100 - (price / oldPrice * 100)).toFixed(2)) + '%';
            }
        }
    }
    
    // картинки
    const images = [...document.querySelectorAll('.preview nav img')].map(img => ({
        preview: img.src || '',
        full: img.dataset.src || '',
        alt: img.alt || ''
    }));
    
    // парс продукта
    const product = {
        id: document.querySelector('.product')?.dataset?.id || '',
        name: getElementText('.product h1', ''),
        isLiked: document.querySelector('.product .preview .like')?.classList.contains('active') || false,
        tags: {
            category: getTagsByColor('green'),
            discount: getTagsByColor('red'),
            label: getTagsByColor('blue')
        },
        price: price,
        oldPrice: oldPrice,
        discount: discountValue,
        discountPercent: discountPercent,
        currency: currencyMap[currencySymbol] || currencySymbol,
        properties: properties,
        description: getCleanHTML('.about .description'),
        images: images
    };
    
    // ========== SUGGESTED ==========
    const suggested = [...document.querySelectorAll('.suggested .items article')].map(article => {
        const priceElement = article.querySelector('b');
        const priceText = priceElement?.textContent?.trim() || '';
        const currencySymbol = priceText[0];
        
        return {
            name: getElementText('h3', '', null, article),
            description: getElementText('p', '', null, article),
            image: article.querySelector('img')?.src ?? '',
            price: priceText.slice(1) || '',
            currency: currencyMap[currencySymbol] || currencySymbol
        };
    });
    
    // ========== REVIEWS ==========
    const reviews = [...document.querySelectorAll('.reviews .items article')].map(article => {
        const rating = article.querySelectorAll('.rating span.filled').length;
        const dateText = getElementText('.author i', '', null, article);
        
        return {
            rating: rating,
            author: {
                avatar: article.querySelector('.author img')?.src ?? '',
                name: getElementText('.author span', '', null, article)
            },
            title: getElementText('h3', '', null, article),
            description: getElementText('p', '', null, article),
            date: dateText.replaceAll('/', '.')
        };
    });
    
    // полный парс
    return {
        meta: meta,
        product: product,
        suggested: suggested,
        reviews: reviews
    };
}